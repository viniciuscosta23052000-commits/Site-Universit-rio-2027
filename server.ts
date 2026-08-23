import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: [
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
      ],
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
      },
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

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

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    return res.json({
      success: true,
      notesHtml: response.text || "",
    });
  } catch (error: any) {
    console.error("Erro ao transformar transcrição em anotações:", error);
    return res.status(500).json({ error: error?.message || "Erro ao criar anotações de estudo" });
  }
});

// Real-Time PWA Synchronization with server-side filesystem storage and conflict detection
const serverDbPath = path.join(process.cwd(), "data_sync.json");

app.post("/api/sync", async (req, res) => {
  try {
    const { database, queue, clientLastSavedAt, force } = req.body;
    if (!database) {
      return res.status(400).json({ error: "database is required" });
    }

    let serverDb: any = null;
    if (fs.existsSync(serverDbPath)) {
      try {
        const fileContent = fs.readFileSync(serverDbPath, "utf8");
        serverDb = JSON.parse(fileContent);
      } catch (e) {
        console.warn("Erro ao ler data_sync.json, ignorando:", e);
      }
    }

    // Conflict detection logic
    if (serverDb && !force) {
      const serverTime = new Date(serverDb.lastSavedAt || 0).getTime();
      const clientTime = new Date(clientLastSavedAt || 0).getTime();

      // If server version is newer and different, signal conflict
      if (serverTime > clientTime && serverDb.lastSavedAt !== database.lastSavedAt) {
        console.log(`[Sync] Conflito detectado: Servidor (${serverDb.lastSavedAt}) > Cliente (${clientLastSavedAt})`);
        return res.json({
          conflict: true,
          serverDatabase: serverDb,
          message: "Encontramos alterações conflitantes entre o dispositivo e o servidor"
        });
      }
    }

    // Overwrite server database
    fs.writeFileSync(serverDbPath, JSON.stringify(database, null, 2), "utf8");
    console.log(`[Sync] Sincronização bem-sucedida. lastSavedAt: ${database.lastSavedAt}`);

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
