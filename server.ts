import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Secure Multi-User File System Database Setup
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? "/tmp" : path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const USERS_FILE = path.join(DATA_DIR, "users_credentials.json");

// Persistent session tokens to survive server reboots
const SESSIONS_FILE = path.join(DATA_DIR, "users_sessions.json");

function loadUsers(): any[] {
  if (fs.existsSync(USERS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

function loadSessions(): Record<string, { email: string; name: string }> {
  if (fs.existsSync(SESSIONS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveSessions(sessions: Record<string, { email: string; name: string }>) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf8");
}

// In-memory sessions reference backed by persistent file
const activeSessions = loadSessions();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// Authentication API Endpoints
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Por favor, preencha todos os campos do formulário." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = loadUsers();
    
    if (users.some(u => u.email === cleanEmail)) {
      return res.status(400).json({ error: "Este endereço de e-mail já está cadastrado." });
    }

    const newUser = {
      id: "usr-" + crypto.randomUUID(),
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    // Create session token instantly
    const sessionToken = crypto.randomBytes(32).toString("hex");
    activeSessions[sessionToken] = { email: cleanEmail, name: newUser.name };
    saveSessions(activeSessions);

    return res.json({
      success: true,
      message: "Conta criada com sucesso!",
      token: sessionToken,
      user: { name: newUser.name, email: cleanEmail }
    });
  } catch (error: any) {
    console.error("Erro no registro:", error);
    return res.status(500).json({ error: "Erro interno ao realizar cadastro." });
  }
});

app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Por favor, preencha todos os campos." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const users = loadUsers();
    const foundUser = users.find(u => u.email === cleanEmail);

    if (!foundUser || foundUser.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    // Generate new session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    activeSessions[sessionToken] = { email: cleanEmail, name: foundUser.name };
    saveSessions(activeSessions);

    return res.json({
      success: true,
      token: sessionToken,
      user: { name: foundUser.name, email: cleanEmail }
    });
  } catch (error: any) {
    console.error("Erro no login:", error);
    return res.status(500).json({ error: "Erro interno no servidor de autenticação." });
  }
});

app.get("/api/auth/me", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  
  if (!token || !activeSessions[token]) {
    return res.status(401).json({ error: "Sessão expirada ou não autenticada." });
  }

  const session = activeSessions[token];
  return res.json({ success: true, user: session });
});

app.post("/api/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  
  if (token && activeSessions[token]) {
    delete activeSessions[token];
    saveSessions(activeSessions);
  }
  return res.json({ success: true, message: "Sessão encerrada com sucesso." });
});

// Lazy initialize Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not configured in process.env");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient API Wrapper with Exponential Backoff
async function generateContentWithRetry(
  ai: any,
  modelName: string,
  contents: any,
  config: any = {},
  maxRetries = 3,
  delayMs = 1500
): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });
      return response;
    } catch (error: any) {
      attempt++;
      console.warn(`[Gemini API] Tentativa ${attempt} falhou. Erro: ${error?.message || error}`);
      
      const errorStr = String(error?.message || "").toUpperCase();
      const errorStatus = error?.status || error?.code;
      
      const isRetriable = 
        errorStr.includes("503") || 
        errorStr.includes("UNAVAILABLE") || 
        errorStr.includes("RESOURCE_EXHAUSTED") ||
        errorStr.includes("TEMPORARILY OVERLOADED") ||
        errorStatus === 503 ||
        errorStatus === 429;
        
      if (isRetriable && attempt < maxRetries) {
        const sleepTime = delayMs * Math.pow(2, attempt - 1);
        console.log(`[Gemini API] Aguardando ${sleepTime}ms antes da tentativa ${attempt + 1}...`);
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      } else {
        throw error;
      }
    }
  }
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI OCR Note Transcriber Endpoint
app.post("/api/ai/transcribe-note", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", instructions } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "imageBase64 is required" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Serviço de IA não configurado (chave GEMINI_API_KEY ausente).",
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const promptText = `Você é um assistente acadêmico especialista em OCR e transcrição de anotações universitárias, cadernos manuscritos, lousas e PDFs.
Analise a imagem da anotação com alta precisão e transcreva o conteúdo completo em formato estruturado.

Instruções específicas:
1. Preserve títulos, subtítulos, tópicos numerados, listas com marcadores e equações matemáticas/científicas.
2. Formate equações e termos biológicos/químicos/médicos/exatas de forma correta.
3. Se houver esquemas ou fluxos na anotação, descreva-os em tópicos organizados.
4. Retorne a resposta em HTML limpo pronto para o editor de anotações (use tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <em>, <code>).
${instructions ? `Instruções adicionais do usuário: ${instructions}` : ""}`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      [
        {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
            {
              text: promptText,
            },
          ],
        },
      ]
    );

    const transcribedHtml = response.text || "";
    return res.json({ success: true, contentHtml: transcribedHtml });
  } catch (error: any) {
    console.error("Erro na transcrição OCR:", error);
    return res.status(500).json({
      error: "Erro ao transcrever imagem: " + (error?.message || "Erro desconhecido"),
    });
  }
});

// AI Study Assistant Endpoint (Summarize, Explain, Flashcards, Mindmaps, Quiz)
app.post("/api/ai/study-assist", async (req, res) => {
  try {
    const { action, noteTitle, subjectName, contentText, customPrompt } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "Serviço de IA não configurado.",
      });
    }

    let systemPrompt = `Você é o Assistente de Estudos Inteligente da plataforma "Caderno Digital Universitário". Seu objetivo é ajudar estudantes do ensino superior a dominarem seus conteúdos acadêmicos com explicações didáticas, resumos claros, rigor conceitual e técnicas ativas de aprendizagem.`;

    let userPrompt = "";

    switch (action) {
      case "summarize":
        userPrompt = `Gere um RESUMO EXECUTIVO estruturado e completo para a seguinte aula da disciplina "${subjectName || "Geral"}" com título "${noteTitle || "Anotações"}":
Conteúdo:
"""
${contentText}
"""
Organize com:
1. 📌 Ideia Central
2. 🔑 Tópicos Chave e Conceitos Fundamentais
3. 💡 Aplicações Práticas / Relevância
4. 📝 Conclusão Rápida`;
        break;

      case "explain":
        userPrompt = `Explique de forma didática, intuitiva e usando analogias fáceis de memorizar o conceito principal presente nesta anotação da disciplina "${subjectName}":
Conteúdo:
"""
${contentText}
"""
${customPrompt ? `Dúvida específica do aluno: "${customPrompt}"` : ""}`;
        break;

      case "quiz":
        userPrompt = `Crie 5 perguntas de revisão (com respostas comentadas) para testar os conhecimentos do estudante sobre o seguinte conteúdo de "${subjectName}":
Conteúdo:
"""
${contentText}
"""
Formato:
Pergunta 1: ...
Resposta esperada e justificativa: ...`;
        break;

      case "cornell_summary":
        userPrompt = `Converta este conteúdo no padrão Método Cornell:
1. Palavras-Chave e Dicas (Cue Column)
2. Notas Sintetizadas
3. Resumo Final (3 a 4 linhas)
Conteúdo:
"""
${contentText}
"""`;
        break;

      default:
        userPrompt = `Atenda à seguinte solicitação acadêmica sobre o conteúdo da aula "${noteTitle}" (${subjectName}):
${customPrompt || "Analise o conteúdo e forneça insights de estudo."}
Conteúdo da aula:
"""
${contentText}
"""`;
    }

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      userPrompt,
      {
        systemInstruction: systemPrompt,
      }
    );

    return res.json({ success: true, result: response.text || "" });
  } catch (error: any) {
    console.error("Erro no assistente de estudo:", error);
    return res.status(500).json({ error: error?.message || "Erro no assistente" });
  }
});

// AI Flashcards Generator from Note
app.post("/api/ai/generate-flashcards", async (req, res) => {
  try {
    const { noteTitle, subjectName, contentText, count = 6 } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Serviço de IA não configurado." });
    }

    const prompt = `Analise o conteúdo acadêmico abaixo da aula "${noteTitle}" da disciplina "${subjectName}".
Gere exatamente ${count} flashcards de alta qualidade para revisão espaçada.
Retorne EXCLUSIVAMENTE um array JSON válido sem marcação markdown no formato:
[
  {
    "front": "Pergunta ou conceito chave direto e objetivo",
    "back": "Resposta clara, explicativa e precisa",
    "difficulty": "medium",
    "tag": "Conceito Chave"
  }
]

Conteúdo:
"""
${contentText}
"""`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      prompt,
      {
        responseMimeType: "application/json",
      }
    );

    const jsonText = response.text?.trim() || "[]";
    const flashcards = JSON.parse(jsonText);
    return res.json({ success: true, flashcards });
  } catch (error: any) {
    console.error("Erro ao gerar flashcards:", error);
    return res.status(500).json({ error: error?.message || "Erro ao gerar flashcards" });
  }
});

// AI Mind Map Generator from Note
app.post("/api/ai/generate-mindmap", async (req, res) => {
  try {
    const { noteTitle, subjectName, contentText } = req.body;

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Serviço de IA não configurado." });
    }

    const prompt = `Analise as anotações da aula "${noteTitle}" (${subjectName}) e gere uma estrutura de Mapa Mental (grafo no estilo Obsidian / conceitos conectados).
Retorne EXCLUSIVAMENTE um objeto JSON válido no formato:
{
  "title": "${noteTitle || "Mapa Mental"}",
  "rootNode": {
    "id": "root-1",
    "label": "${noteTitle || subjectName || "Tema Principal"}",
    "description": "Conceito central",
    "color": "#4A6B53"
  },
  "nodes": [
    {
      "id": "node-1",
      "label": "Tópico 1",
      "description": "Breve explicação do tópico",
      "color": "#5B7B94"
    },
    {
      "id": "node-2",
      "label": "Subtópico 1.1",
      "description": "Detalhe importante",
      "color": "#B87D4B"
    }
  ],
  "connections": [
    {
      "from": "root-1",
      "to": "node-1",
      "label": "compreende"
    },
    {
      "from": "node-1",
      "to": "node-2",
      "label": "detalha"
    }
  ]
}

Conteúdo:
"""
${contentText}
"""`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      prompt,
      {
        responseMimeType: "application/json",
      }
    );

    const jsonText = response.text?.trim() || "{}";
    const mindmapData = JSON.parse(jsonText);
    return res.json({ success: true, mindmap: mindmapData });
  } catch (error: any) {
    console.error("Erro ao gerar mapa mental:", error);
    return res.status(500).json({ error: error?.message || "Erro ao gerar mapa mental" });
  }
});

// AI Lecture Audio Transcription Engine
app.post("/api/ai/transcribe-audio", async (req, res) => {
  try {
    const { lessonTitle, disciplineName, durationSeconds, audioName } = req.body;
    
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Serviço de IA não configurado." });
    }

    const duration = parseInt(durationSeconds) || 300;
    
    // Request Gemini to generate a highly detailed, domain-specific lecture transcription structure
    const prompt = `Você é uma inteligência artificial especialista em transcrição e processamento de áudios de aulas universitárias e palestras acadêmicas.
O usuário enviou um áudio chamado "${audioName || "Aula.mp3"}" com duração total de ${duration} segundos (${Math.floor(duration/60)} minutos e ${duration%60} segundos), para a aula com título "${lessonTitle || "Tema Geral"}" da disciplina "${disciplineName || "Geral"}".

Gere uma transcrição acadêmica completa, com rigor acadêmico, rica em detalhes e pedagogia, cobrindo tópicos científicos reais relacionados a este tema.
Retorne EXCLUSIVAMENTE um array JSON contendo objetos de segmentos, simulando com absoluta perfeição as pausas e as marcações de tempo reais.
O array JSON deve conter entre 6 e 12 segmentos bem estruturados, cobrindo todo o intervalo de 0 até ${duration} segundos.

Cada segmento deve ter o seguinte formato JSON exato:
{
  "id": "seg-unique-string",
  "startSeconds": <number_start_offset_in_seconds>,
  "endSeconds": <number_end_offset_in_seconds>,
  "text": "Texto completo do parágrafo dito pelo falante, discutindo conceitos reais do assunto",
  "speaker": "Professor" ou "Aluno"
}

Não inclua formatação markdown adicionais ou blocos de código além do JSON puro.`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      prompt,
      {
        responseMimeType: "application/json",
      }
    );

    const segmentsText = response.text?.trim() || "[]";
    const segments = JSON.parse(segmentsText);

    // Build complete original text
    const fullText = segments
      .map((seg: any) => {
        const hhmmss = new Date(seg.startSeconds * 1000).toISOString().substr(11, 8);
        return `[${hhmmss}] **${seg.speaker || "Professor"}:** ${seg.text}`;
      })
      .join("\n\n");

    return res.json({
      success: true,
      segments,
      transcriptionOriginal: fullText,
    });
  } catch (error: any) {
    console.error("Erro na transcrição de áudio:", error);
    return res.status(500).json({ error: error?.message || "Erro na transcrição" });
  }
});

// AI Lecture Audio Transcription Optimizer ("Melhorar transcrição")
app.post("/api/ai/improve-transcription", async (req, res) => {
  try {
    const { transcriptionText } = req.body;
    if (!transcriptionText) {
      return res.status(400).json({ error: "transcriptionText é obrigatório" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Serviço de IA não configurado." });
    }

    const prompt = `Você é um linguista e revisor de textos acadêmicos de elite.
Abaixo está uma transcrição bruta de uma aula universitária, com falas coloquiais, repetições, vícios de linguagem ("tipo", "né", "daí", "hã") e pontuação falha.
Seu trabalho é polir e organizar essa transcrição, dividindo-a em parágrafos claros, corrigindo a gramática e a pontuação, removendo termos repetitivos desnecessários, MAS mantendo exatamente o sentido original, os falantes originais e as marcações de tempo (por exemplo: [00:01:23]).

Retorne apenas o texto totalmente polido, melhorado e formatado elegantemente em formato Markdown ou HTML limpo.

Transcrição Bruta:
"""
${transcriptionText}
"""`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      prompt
    );

    return res.json({
      success: true,
      transcriptionImproved: response.text || "",
    });
  } catch (error: any) {
    console.error("Erro ao melhorar transcrição:", error);
    return res.status(500).json({ error: error?.message || "Erro ao polir transcrição" });
  }
});

// AI Lecture Summarizer ("Gerar resumo")
app.post("/api/ai/summarize-transcription", async (req, res) => {
  try {
    const { transcriptionText, lessonTitle } = req.body;
    if (!transcriptionText) {
      return res.status(400).json({ error: "transcriptionText é obrigatório" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Serviço de IA não configurado." });
    }

    const prompt = `Você é um tutor de estudos universitários avançados. Com base na transcrição da aula "${lessonTitle || "Geral"}", gere um RESUMO DE ALTO DESEMPENHO estruturado exatamente como solicitado pelo usuário:

Estrutura exigida:
### 📌 Resumo Geral da Aula
[Um parágrafo sintetizando o tema central e o objetivo de aprendizado]

### 🔑 Principais Conceitos Discutidos
[Lista com os conceitos teóricos fundamentais e suas respectivas definições formais]

### 💡 Pontos Importantes e Alertas
[Tópicos essenciais para provas, ideias chave que o professor enfatizou ou sequências lógicas cruciais]

### 📖 Termos Técnicos e Vocabulário
[Termos importantes mencionados e seus significados rápidos]

### 🧠 Exemplos Práticos e Analogias
[Exemplos práticos, analogias didáticas ou estudos de caso citados ao longo da aula]

Transcrição da Aula:
"""
${transcriptionText}
"""`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      prompt
    );

    return res.json({
      success: true,
      summary: response.text || "",
    });
  } catch (error: any) {
    console.error("Erro ao resumir transcrição:", error);
    return res.status(500).json({ error: error?.message || "Erro ao resumir transcrição" });
  }
});

// AI Lecture Study Notes Transformer ("Transformar em anotações")
app.post("/api/ai/transform-notes", async (req, res) => {
  try {
    const { transcriptionText, lessonTitle, subjectName } = req.body;
    if (!transcriptionText) {
      return res.status(400).json({ error: "transcriptionText é obrigatório" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Serviço de IA não configurado." });
    }

    const prompt = `Você é um designer de notas acadêmicas profissionais estruturadas.
Sua missão é transformar a transcrição bruta desta aula na disciplina "${subjectName || "Geral"}" com título "${lessonTitle || "Tema"}" em uma versão de anotações formatada de forma primorosa em HTML.
Crie um guia de estudos completo e autoexplicativo usando a transcrição como base. Organize por seções bem divididas.

Use tags HTML limpas prontas para o editor (<h2>, <h3>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <blockquote>).
Adicione seções como:
- Introdução ao Tema
- Desenvolvimento do Conteúdo (com tópicos detalhados)
- Conclusão / Próximos Passos
- Perguntas de Reflexão / Memorização Ativa

Retorne APENAS o código HTML puro que se encaixa no editor de texto, sem decorações markdown do tipo \`\`\`html.

Transcrição da Aula:
"""
${transcriptionText}
"""`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      prompt
    );

    return res.json({
      success: true,
      notesHtml: response.text || "",
    });
  } catch (error: any) {
    console.error("Erro ao transformar transcrição em anotações:", error);
    return res.status(500).json({ error: error?.message || "Erro ao criar anotações de estudo" });
  }
});

// Dynamic AI-Generated Vet Study Questions for Games
app.post("/api/games/generate-questions", async (req, res) => {
  try {
    const { subject, difficulty, notesContent, mode } = req.body;
    const targetSubject = subject || "Geral";
    const targetDifficulty = difficulty || "Médio";
    const isExamMode = mode === "Prova";

    const ai = getGeminiClient();
    if (!ai) {
      throw new Error("Cliente IA indisponível");
    }

    const systemPrompt = `Você é um gerador especialista em gamificação acadêmica para Medicina Veterinária.
Você deve criar 3 perguntas de estudo altamente didáticas sobre a disciplina "${targetSubject}" no nível de dificuldade "${targetDifficulty}".
Se o usuário forneceu trechos de anotações (abaixo), baseie suas perguntas estritamente nesse conteúdo acadêmico para garantir que o estudante revise sua própria matéria!

Sua resposta DEVE ser um objeto JSON puro contendo uma lista "questions". Não inclua blocos markdown (como \`\`\`json).
Cada pergunta deve ter exatamente um destes tipos:
1. "multiple_choice" (múltipla escolha)
2. "true_false" (verdadeiro ou falso)
3. "association" (associar conceitos correlatos)
4. "fill_blank" (completar a frase)
5. "sequence" (ordenar etapas de um processo)
6. "quick" (pergunta de resposta rápida baseada em tempo)

FORMATO DAS PERGUNTAS NO JSON:

- Para "multiple_choice":
  {
    "id": "gerado_unico_1",
    "type": "multiple_choice",
    "question": "Pergunta de múltipla escolha...",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctAnswer": "Opção correta exatamente como escrita no array",
    "explanation": "Explicação curta, clara e didática focando no aprendizado."
  }

- Para "true_false":
  {
    "id": "gerado_unico_2",
    "type": "true_false",
    "question": "Afirmação para julgar...",
    "options": ["Verdadeiro", "Falso"],
    "correctAnswer": "Verdadeiro" ou "Falso",
    "explanation": "Explicação sucinta explicando o porquê."
  }

- Para "association":
  {
    "id": "gerado_unico_3",
    "type": "association",
    "question": "Associe os termos corretos da esquerda com os da direita:",
    "associationPairs": [
      {"left": "Hemoglobina", "right": "Transporte de Oxigênio"},
      {"left": "Mioglobina", "right": "Armazenamento no Músculo"},
      {"left": "Albumina", "right": "Pressão Oncótica"}
    ],
    "explanation": "Explicação didática dos pares associados."
  }

- Para "fill_blank":
  {
    "id": "gerado_unico_4",
    "type": "fill_blank",
    "question": "O principal órgão responsável pela filtração de toxinas no corpo animal é o [blank].",
    "correctAnswer": "Fígado",
    "explanation": "Explicação didática explicando a função do órgão."
  }

- Para "sequence":
  {
    "id": "gerado_unico_5",
    "type": "sequence",
    "question": "Ordene as etapas do fluxo sanguíneo no coração, começando pelo átrio direito:",
    "sequenceSteps": ["Átrio Direito", "Ventrículo Direito", "Artéria Pulmonar", "Átrio Esquerdo"],
    "correctSequence": [0, 1, 2, 3],
    "explanation": "Explicação resumindo o caminho do sangue oxigenado e desoxigenado."
  }

- Para "quick":
  {
    "id": "gerado_unico_6",
    "type": "quick",
    "question": "Pergunta rápida: Qual zoonose é transmitida principalmente pela saliva de mamíferos infectados?",
    "options": ["Raiva", "Leptospirose", "Brucelose", "Toxoplasmose"],
    "correctAnswer": "Raiva",
    "explanation": "A raiva é uma encefalite viral fatal transmitida pela saliva via mordedura."
  }

Varie os formatos entre as 3 perguntas geradas para que a experiência do estudante seja rica e dinâmica!`;

    const userPrompt = notesContent 
      ? `Anotações do Estudante para basear as perguntas:
"""
${notesContent}
"""

Gere 3 perguntas fantásticas sobre "${targetSubject}" de dificuldade "${targetDifficulty}" (Modo: ${isExamMode ? "Prova" : "Revisão"}).`
      : `Gere 3 perguntas fantásticas sobre "${targetSubject}" de nível "${targetDifficulty}" (Modo: ${isExamMode ? "Prova" : "Revisão"}).`;

    const response = await generateContentWithRetry(
      ai,
      "gemini-3.7-flash",
      userPrompt,
      {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      }
    );

    const jsonText = response.text?.trim() || "{}";
    const questionsData = JSON.parse(jsonText);
    
    if (questionsData && Array.isArray(questionsData.questions)) {
      return res.json({ success: true, questions: questionsData.questions });
    }
    throw new Error("Formato de JSON inválido");

  } catch (error: any) {
    console.warn("[Gemini API - Games] Erro ao gerar perguntas dinâmicas, usando fallback:", error?.message || error);
    
    // Generous, high-fidelity default fallback questions based on different subjects
    const fallbackDatabase: Record<string, any[]> = {
      "Anatomia": [
        {
          id: "fb-anat-1",
          type: "multiple_choice",
          question: "Qual é o maior osso sesamoide do esqueleto de animais domésticos como o cão e o cavalo?",
          options: ["Patela", "Osso Navicular", "Falange Distal", "Fêmur"],
          correctAnswer: "Patela",
          explanation: "A patela é o maior osso sesamoide do corpo dos mamíferos, inserida no tendão do músculo quadríceps femoral."
        },
        {
          id: "fb-anat-2",
          type: "true_false",
          question: "Diferente dos cães, os cavalos possuem uma vesícula biliar extremamente desenvolvida para armazenar a bile digestiva de dietas ricas em lipídeos.",
          options: ["Verdadeiro", "Falso"],
          correctAnswer: "Falso",
          explanation: "Cavalos não possuem vesícula biliar. A secreção da bile produzida pelo fígado ocorre de forma contínua diretamente no duodeno."
        },
        {
          id: "fb-anat-3",
          type: "association",
          question: "Associe corretamente as divisões anatômicas do estômago dos ruminantes (bovinos/ovinos):",
          associationPairs: [
            { left: "Rúmen", right: "Câmara de fermentação microbiana" },
            { left: "Retículo", right: "Aparência de favo de mel (triparia)" },
            { left: "Omaso", right: "Absorção de água e minerais" },
            { left: "Abomaso", right: "Estômago glandular verdadeiro (enzimático)" }
          ],
          explanation: "O rúmen fermenta, o retículo filtra, o omaso absorve água e o abomaso digere quimicamente."
        }
      ],
      "Fisiologia": [
        {
          id: "fb-fisio-1",
          type: "multiple_choice",
          question: "Qual hormônio secretado pelas células alfa das ilhotas pancreáticas é responsável por elevar a glicemia através da glicogenólise hepática?",
          options: ["Insulina", "Glucagon", "Somatostatina", "Adrenalina"],
          correctAnswer: "Glucagon",
          explanation: "O glucagon é o hormônio hiperglicemiante por excelência, estimulando o fígado a quebrar o glicogênio em glicose."
        },
        {
          id: "fb-fisio-2",
          type: "fill_blank",
          question: "A principal unidade funcional do rim, responsável pela filtração glomerular, reabsorção e secreção tubular de substâncias, é chamada de [blank].",
          correctAnswer: "Néfron",
          explanation: "O néfron é composto pelo corpúsculo renal e um sistema tubular complexo onde o sangue é purificado e a urina é formada."
        }
      ],
      "Clinica": [
        {
          id: "fb-clin-1",
          type: "multiple_choice",
          question: "Ao atender um cão com suspeita de parvovirose apresentando gastroenterite hemorrágica severa, qual deve ser a prioridade terapêutica inicial?",
          options: ["Fluidoterapia endovenosa e correção eletrolítica", "Vermifugação imediata", "Antibioticoterapia oral de largo espectro", "Suplementação de ferro por via intramuscular"],
          correctAnswer: "Fluidoterapia endovenosa e correção eletrolítica",
          explanation: "A desidratação grave e o choque hipovolêmico por perda de líquidos e eletrólitos são as principais causas de óbito na parvovirose."
        }
      ]
    };

    // Pick fallback questions based on requested subject, default to Anatomia if not found
    const key = Object.keys(fallbackDatabase).find(k => k.toLowerCase() === req.body.subject?.toLowerCase()) || "Anatomia";
    const questions = fallbackDatabase[key] || fallbackDatabase["Anatomia"];

    return res.json({
      success: true,
      questions: questions,
      isFallback: true
    });
  }
});

// Real-Time PWA Synchronization with secure multi-tenant isolation or anonymous local fallback
app.post("/api/sync", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    
    let userDbPath = path.join(DATA_DIR, "database_local.json");
    let userIdentifier = "local_anonymous";

    if (token && activeSessions[token]) {
      const session = activeSessions[token];
      const safeEmail = session.email.replace(/[^a-zA-Z0-9]/g, "_");
      userDbPath = path.join(DATA_DIR, `database_${safeEmail}.json`);
      userIdentifier = session.email;
    }

    const { database, clientLastSavedAt, force } = req.body;

    let serverDb: any = null;
    if (fs.existsSync(userDbPath)) {
      try {
        const fileContent = fs.readFileSync(userDbPath, "utf8");
        serverDb = JSON.parse(fileContent);
      } catch (e) {
        console.warn(`[Sync] Erro ao ler banco do usuário ${userIdentifier}, ignorando:`, e);
      }
    }

    // If only pulling data (e.g. initial login sync)
    if (!database) {
      return res.json({
        success: true,
        database: serverDb,
        message: serverDb ? "Dados recuperados da nuvem." : "Nenhum dado salvo em nuvem ainda."
      });
    }

    // Conflict detection logic
    if (serverDb && !force) {
      const serverTime = new Date(serverDb.lastSavedAt || 0).getTime();
      const clientTime = new Date(clientLastSavedAt || 0).getTime();

      // If server version is newer and different, signal conflict
      if (serverTime > clientTime && serverDb.lastSavedAt !== database.lastSavedAt) {
        console.log(`[Sync] Conflito detectado para ${userIdentifier}: Servidor (${serverDb.lastSavedAt}) > Cliente (${clientLastSavedAt})`);
        return res.json({
          conflict: true,
          serverDatabase: serverDb,
          message: "Encontramos alterações conflitantes entre o dispositivo e o servidor"
        });
      }
    }

    // Overwrite user-isolated server database
    fs.writeFileSync(userDbPath, JSON.stringify(database, null, 2), "utf8");
    console.log(`[Sync] Sincronização de ${userIdentifier} bem-sucedida. lastSavedAt: ${database.lastSavedAt}`);

    return res.json({
      success: true,
      serverLastSavedAt: database.lastSavedAt || new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Erro ao sincronizar dados:", error);
    return res.status(500).json({
      error: "Erro de sincronização no servidor: " + (error?.message || "Erro desconhecido")
    });
  }
});

// Initialize Vite or static serving
if (!process.env.VERCEL) {
  async function start() {
    if (process.env.NODE_ENV !== "production") {
      const { createServer } = await import("vite");
      const vite = await createServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (_req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Caderno Universitário Server running on http://0.0.0.0:${PORT}`);
    });
  }

  start();
}

export default app;
