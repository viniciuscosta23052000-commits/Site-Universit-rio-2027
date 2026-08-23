// Static templates and symbols for the OnlyOffice-style rich text Academic Editor

export const MATH_SYMBOLS = [
  'α', 'β', 'γ', 'δ', 'θ', 'λ', 'μ', 'π', 'σ', 'Δ', 'Ω', '→', '⇄', '±', '≤', '≥', '≠', '≈', '∞', '√', '∫', '∑', '²', '³', '℃', 'pH', 'CO₂', 'O₂', 'Ca²⁺', 'Na⁺', 'K⁺'
];

export const FONTS_LIST = [
  'Arial', 'Times New Roman', 'Calibri', 'Georgia', 'Courier New', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS', 'Verdana'
];

export const FONT_SIZES = [
  '8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36', '48', '72'
];

export const getSmartArtProcess = () => `
  <div style="display: flex; align-items: center; justify-content: space-around; gap: 8px; margin: 16px 0; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;" contenteditable="false">
    <div style="flex: 1; padding: 10px; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border-radius: 6px; text-align: center; font-weight: bold; font-size: 13px;">Passo 1<br/><span style="font-size: 10px; font-weight: normal;">Planejar...</span></div>
    <div style="font-weight: bold; color: #94a3b8;">➔</div>
    <div style="flex: 1; padding: 10px; background: linear-gradient(135deg, #059669, #047857); color: white; border-radius: 6px; text-align: center; font-weight: bold; font-size: 13px;">Passo 2<br/><span style="font-size: 10px; font-weight: normal;">Executar...</span></div>
    <div style="font-weight: bold; color: #94a3b8;">➔</div>
    <div style="flex: 1; padding: 10px; background: linear-gradient(135deg, #d97706, #b45309); color: white; border-radius: 6px; text-align: center; font-weight: bold; font-size: 13px;">Passo 3<br/><span style="font-size: 10px; font-weight: normal;">Revisar...</span></div>
  </div>
  <p></p>
`;

export const getSmartArtList = () => `
  <div style="display: flex; flex-direction: column; gap: 8px; margin: 16px 0;" contenteditable="false">
    <div style="display: flex; border-left: 5px solid #2563eb; background: #eff6ff; padding: 10px; border-radius: 0 8px 8px 0; font-size: 13px; color: #1e3a8a;"><strong>Conceito Base:</strong> &nbsp; Fundamentação teórica principal.</div>
    <div style="display: flex; border-left: 5px solid #059669; background: #ecfdf5; padding: 10px; border-radius: 0 8px 8px 0; font-size: 13px; color: #064e3b;"><strong>Hipótese Secundária:</strong> &nbsp; Variáveis testadas em laboratório.</div>
  </div>
  <p></p>
`;

export const getChartHtml = () => `
  <div style="margin: 16px auto; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; background-color: #f8fafc; max-width: 380px;" contenteditable="false">
    <h4 style="text-align: center; margin-top: 0; margin-bottom: 12px; color: #475569; font-size: 13px; font-weight: bold;">Relação de Desempenho</h4>
    <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 120px; border-left: 2px solid #94a3b8; border-bottom: 2px solid #94a3b8; padding: 10px 0 0 10px;">
      <div style="display: flex; flex-direction: column; align-items: center; width: 40px;">
        <div style="background-color: #3b82f6; height: 90px; width: 18px; border-radius: 3px 3px 0 0;"></div>
        <span style="font-size: 9px; margin-top: 4px; color: #64748b;">Média</span>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; width: 40px;">
        <div style="background-color: #10b981; height: 110px; width: 18px; border-radius: 3px 3px 0 0;"></div>
        <span style="font-size: 9px; margin-top: 4px; color: #64748b;">Aluno</span>
      </div>
    </div>
  </div>
  <p></p>
`;

export const getWordArtHtml = () => `
  <h2 style="font-family: 'Georgia', serif; font-size: 28px; background: linear-gradient(to right, #2563eb, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; text-align: center; margin: 12px 0;">Arte Acadêmica</h2>
  <p></p>
`;

export const getDropCapHtml = () => `
  <p style="margin-bottom: 12px;"><span style="float: left; font-size: 48px; line-height: 36px; padding-top: 4px; padding-right: 8px; font-weight: bold; color: #2563eb; font-family: 'Times New Roman', serif;">E</span>ste parágrafo foi formatado com uma letra capitular imponente no início da linha, simulando perfeitamente a editoração de artigos acadêmicos clássicos...</p>
`;

export const getSignatureHtml = (studentName: string) => `
  <div style="margin: 32px 0 16px auto; text-align: center; max-width: 240px;" contenteditable="false">
    <div style="border-bottom: 1px solid #94a3b8; height: 32px; font-family: 'Georgia', serif; font-style: italic; font-size: 18px; color: #2563eb;">${studentName}</div>
    <div style="font-size: 10px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px;">Assinatura do Aluno</div>
  </div>
  <p></p>
`;

export const getTOC = () => `
  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 14px; margin: 16px 0;" contenteditable="false">
    <h4 style="margin-top:0; color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; font-size: 13px; font-weight: bold;">Sumário do Documento</h4>
    <ul style="list-style: none; padding-left: 0; margin: 8px 0 0 0; font-size: 12px; color: #475569;">
      <li style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>1. Introdução Teórica</span><span style="border-bottom: 1px dotted #94a3b8; flex-grow: 1; margin: 0 8px; height: 10px;"></span><span>Pág. 1</span></li>
      <li style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>2. Análise de Variáveis</span><span style="border-bottom: 1px dotted #94a3b8; flex-grow: 1; margin: 0 8px; height: 10px;"></span><span>Pág. 1</span></li>
      <li style="display: flex; justify-content: space-between;"><span>3. Conclusão Acadêmica</span><span style="border-bottom: 1px dotted #94a3b8; flex-grow: 1; margin: 0 8px; height: 10px;"></span><span>Pág. 1</span></li>
    </ul>
  </div>
  <p></p>
`;

export const getCalloutHtml = (type: 'highlight' | 'definition' | 'warning' | 'example' | 'obs' | 'formula') => {
  switch (type) {
    case 'highlight':
      return `<div class="academic-callout" style="background-color: #fef9e7; border-left: 4px solid #d97706; padding: 12px; margin: 12px 0; border-radius: 6px; font-size: 13px;"><strong>💡 Destaque Especial:</strong> Digite a informação chave aqui...</div><p></p>`;
    case 'definition':
      return `<div class="academic-callout" style="background-color: #f0f7f3; border-left: 4px solid #059669; padding: 12px; margin: 12px 0; border-radius: 6px; font-size: 13px;"><strong>📖 Definição Conceitual:</strong> Digite o termo técnico e seu significado formal...</div><p></p>`;
    case 'warning':
      return `<div class="academic-callout" style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; margin: 12px 0; border-radius: 6px; font-size: 13px;"><strong>⚠️ Nota Crucial / Prova:</strong> Preste extrema atenção nesta questão...</div><p></p>`;
    case 'example':
      return `<div class="academic-callout" style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 12px; margin: 12px 0; border-radius: 6px; font-size: 13px;"><strong>🔬 Exemplo Prático:</strong> Exemplo ilustrativo do conceito discutido...</div><p></p>`;
    case 'formula':
      return `<div class="academic-callout" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #475569; padding: 12px; margin: 12px 0; border-radius: 6px; font-family: monospace; font-size: 13px;"><strong>📐 Relação Matemática:</strong> ΔH = m · c · ΔT</div><p></p>`;
    case 'obs':
      return `<div class="academic-callout" style="background-color: #f5f3ff; border-left: 4px solid #7c3aed; padding: 12px; margin: 12px 0; border-radius: 6px; font-size: 13px;"><strong>✍️ Comentário do Professor:</strong> Observação anotada em sala de aula...</div><p></p>`;
  }
};
