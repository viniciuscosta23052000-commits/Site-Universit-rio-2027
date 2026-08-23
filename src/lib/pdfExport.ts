import { Lesson, Notebook, Discipline, Semester, AppDatabase } from '../types';

/**
 * Injeta conteúdo HTML estruturado em um iframe temporário e dispara a impressão do navegador (salvar como PDF).
 * Mantém alta fidelidade visual usando tipografia premium, estilos de cadernos acadêmicos e quebras de páginas automáticas.
 */
export function exportToPdf(
  title: string,
  subtitle: string,
  htmlContent: string,
  metadata?: {
    studentName?: string;
    courseName?: string;
    institution?: string;
    professor?: string;
    date?: string;
    lessonsList?: { title: string; date: string; number?: string }[];
  }
) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!iframeDoc) return;

  // Gerando página de capa se for uma exportação maior (notebook ou semestre)
  let coverPageHtml = '';
  if (metadata && (metadata.courseName || metadata.studentName)) {
    coverPageHtml = `
      <div class="cover-page">
        <div class="cover-university">${metadata.institution || 'UNIVERSIDADE FEDERAL'}</div>
        <div class="cover-title-container">
          <h1 class="cover-title">${title}</h1>
          <h2 class="cover-subtitle">${subtitle}</h2>
        </div>
        <div class="cover-metadata">
          <p><strong>Estudante:</strong> ${metadata.studentName || 'Vinícius'}</p>
          <p><strong>Curso:</strong> ${metadata.courseName || 'Graduação'}</p>
          ${metadata.professor ? `<p><strong>Docente:</strong> ${metadata.professor}</p>` : ''}
          ${metadata.date ? `<p><strong>Período:</strong> ${metadata.date}</p>` : ''}
        </div>
        <div class="cover-footer">
          Gerado pelo Caderno Digital Acadêmico
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }

  // Gerando tabela de conteúdos se tiver lista de aulas
  let tocPageHtml = '';
  if (metadata?.lessonsList && metadata.lessonsList.length > 0) {
    tocPageHtml = `
      <div class="toc-page">
        <h2 class="section-title">SUMÁRIO DO CADERNO</h2>
        <div class="toc-list">
          ${metadata.lessonsList
            .map(
              (l, idx) => `
            <div class="toc-item">
              <span class="toc-number">${idx + 1}.</span>
              <span class="toc-title">${l.number ? l.number + ' — ' : ''}${l.title}</span>
              <span class="toc-dots">................................................................................</span>
              <span class="toc-date">${l.date}</span>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }

  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4;
            margin: 20mm 15mm;
          }
          
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            color: #1F2937;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Capa Acadêmica */
          .cover-page {
            height: 250mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            text-align: center;
            padding: 20mm 0;
            box-sizing: border-box;
          }

          .cover-university {
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 0.15em;
            color: #374151;
            text-transform: uppercase;
            border-bottom: 2px solid #1F2937;
            padding-bottom: 8px;
            width: 100%;
          }

          .cover-title-container {
            margin: auto 0;
          }

          .cover-title {
            font-family: 'Playfair Display', serif;
            font-size: 36px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 10px 0;
            line-height: 1.2;
          }

          .cover-subtitle {
            font-size: 18px;
            font-weight: 500;
            color: #4B5563;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin: 0;
          }

          .cover-metadata {
            text-align: left;
            width: 100%;
            border-top: 1px solid #E5E7EB;
            padding-top: 20px;
            font-size: 14px;
            color: #4B5563;
          }

          .cover-metadata p {
            margin: 6px 0;
          }

          .cover-footer {
            font-size: 12px;
            color: #9CA3AF;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          /* Tabela de Conteúdos (Sumário) */
          .toc-page {
            padding: 10mm 0;
          }

          .section-title {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            border-bottom: 2px solid #374151;
            padding-bottom: 10px;
            margin-bottom: 25px;
            color: #111827;
          }

          .toc-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .toc-item {
            display: flex;
            align-items: center;
            font-size: 14px;
            color: #374151;
          }

          .toc-number {
            font-weight: 700;
            width: 30px;
          }

          .toc-title {
            font-weight: 500;
          }

          .toc-dots {
            flex-grow: 1;
            overflow: hidden;
            white-space: nowrap;
            color: #9CA3AF;
            padding: 0 10px;
          }

          .toc-date {
            color: #6B7280;
            font-size: 13px;
          }

          /* Estilos de Documento / Aulas */
          h1, h2, h3, h4 {
            font-family: 'Playfair Display', serif;
            color: #111827;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
          }

          h1 {
            font-size: 26px;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 8px;
          }

          h2 {
            font-size: 20px;
            color: #1F2937;
          }

          h3 {
            font-size: 16px;
          }

          p {
            margin-bottom: 1.2em;
            font-size: 14px;
            color: #374151;
            text-align: justify;
          }

          strong {
            color: #111827;
          }

          /* Callouts e Destaques Acadêmicos */
          .academic-callout, blockquote {
            background-color: #F9FAFB !important;
            border-left: 4px solid #4B5563 !important;
            padding: 14px 18px !important;
            margin: 1.5em 0 !important;
            border-radius: 6px !important;
            font-size: 13px !important;
          }

          .academic-callout.definition {
            background-color: #ECFDF5 !important;
            border-left: 4px solid #10B981 !important;
          }

          .academic-callout.important {
            background-color: #FEF2F2 !important;
            border-left: 4px solid #EF4444 !important;
          }

          .academic-callout.concept {
            background-color: #EFF6FF !important;
            border-left: 4px solid #3B82F6 !important;
          }

          /* Código e fórmulas */
          pre, code {
            font-family: 'JetBrains Mono', monospace;
            background-color: #F3F4F6;
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 13px;
          }

          pre {
            padding: 15px;
            overflow-x: auto;
            border-radius: 8px;
            display: block;
          }

          /* Tabelas */
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            font-size: 13px;
          }

          th, td {
            border: 1px solid #E5E7EB;
            padding: 10px 12px;
            text-align: left;
          }

          th {
            background-color: #F9FAFB;
            font-weight: 600;
            color: #111827;
          }

          /* Cabeçalho e Rodapé de Página */
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #E5E7EB;
            padding-bottom: 8px;
            margin-bottom: 20px;
            font-size: 11px;
            color: #6B7280;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .footer-note {
            display: flex;
            justify-content: space-between;
            border-top: 1px solid #E5E7EB;
            padding-top: 8px;
            margin-top: 30px;
            font-size: 10px;
            color: #9CA3AF;
          }

          .page-break {
            page-break-after: always;
            break-after: always;
          }

          @media print {
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        ${coverPageHtml}
        ${tocPageHtml}

        <div class="main-content">
          ${htmlContent}
        </div>
      </body>
    </html>
  `);

  iframeDoc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };
}

/**
 * Constrói o HTML consolidado de um caderno inteiro e o exporta para PDF.
 */
export function exportNotebookToPdf(
  notebook: Notebook,
  lessons: Lesson[],
  discipline: Discipline | undefined,
  profileName: string,
  course: string,
  institution: string
) {
  const sortedLessons = [...lessons].sort((a, b) => a.date.localeCompare(b.date));

  let fullHtml = '';
  sortedLessons.forEach((lesson, idx) => {
    fullHtml += `
      <div class="lesson-container">
        <div class="header">
          <span>${discipline?.name || 'Geral'} • ${notebook.name}</span>
          <span>${lesson.lessonNumber || 'Aula'}</span>
        </div>

        <h1 style="margin-top: 0;">${lesson.title}</h1>
        
        <p style="font-size: 12px; color: #6B7280; margin-bottom: 25px;">
          <strong>Data:</strong> ${lesson.date} &nbsp;|&nbsp; 
          <strong>Professor:</strong> ${lesson.professor || 'Não informado'}
        </p>

        <div class="lesson-content">
          ${lesson.contentHtml}
        </div>

        ${
          lesson.summary
            ? `
          <div class="academic-callout concept" style="margin-top: 30px;">
            <strong>📌 Resumo da Aula:</strong>
            <p style="margin: 6px 0 0 0; font-style: italic;">${lesson.summary}</p>
          </div>
        `
            : ''
        }

        <div class="footer-note">
          <span>Gerado automaticamente • Caderno Digital</span>
          <span>${discipline?.name || ''}</span>
        </div>
      </div>
    `;

    // Adiciona quebra de página se não for a última aula
    if (idx < sortedLessons.length - 1) {
      fullHtml += '<div class="page-break"></div>';
    }
  });

  const lessonsList = sortedLessons.map((l) => ({
    title: l.title,
    date: l.date,
    number: l.lessonNumber,
  }));

  exportToPdf(notebook.name, discipline?.name || 'Anotações', fullHtml, {
    studentName: profileName,
    courseName: course,
    institution: institution,
    professor: discipline?.professor,
    lessonsList,
  });
}

/**
 * Constrói o HTML consolidado de um semestre letivo inteiro e o exporta para PDF.
 */
export function exportSemesterToPdf(
  semester: Semester,
  db: AppDatabase
) {
  const profile = db.profile;
  const disciplines = db.disciplines.filter((d) => d.semesterId === semester.id);
  const notebooks = db.notebooks.filter((n) => n.semesterId === semester.id);

  let fullHtml = '';
  const lessonsList: { title: string; date: string; number?: string }[] = [];

  disciplines.forEach((disc, dIdx) => {
    const discNotebooks = notebooks.filter((n) => n.disciplineId === disc.id);
    
    discNotebooks.forEach((nb) => {
      const nbLessons = db.lessons
        .filter((l) => l.notebookId === nb.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      nbLessons.forEach((lesson) => {
        lessonsList.push({
          title: `[${disc.name}] ${lesson.title}`,
          date: lesson.date,
          number: lesson.lessonNumber,
        });

        fullHtml += `
          <div class="lesson-container">
            <div class="header">
              <span>${semester.name} • ${disc.name}</span>
              <span>${lesson.lessonNumber || 'Aula'}</span>
            </div>

            <h1 style="margin-top: 0;">${lesson.title}</h1>
            
            <p style="font-size: 12px; color: #6B7280; margin-bottom: 25px;">
              <strong>Matéria:</strong> ${disc.name} &nbsp;|&nbsp; 
              <strong>Professor:</strong> ${disc.professor || 'Não informado'} &nbsp;|&nbsp; 
              <strong>Data:</strong> ${lesson.date}
            </p>

            <div class="lesson-content">
              ${lesson.contentHtml}
            </div>

            ${
              lesson.summary
                ? `
              <div class="academic-callout concept" style="margin-top: 30px;">
                <strong>📌 Resumo da Aula:</strong>
                <p style="margin: 6px 0 0 0; font-style: italic;">${lesson.summary}</p>
              </div>
            `
                : ''
            }

            <div class="footer-note">
              <span>Grade Semestral • ${semester.name}</span>
              <span>Pág.</span>
            </div>
          </div>
          <div class="page-break"></div>
        `;
      });
    });
  });

  // Remove a última quebra de página vazia se existir conteúdo
  if (fullHtml.endsWith('<div class="page-break"></div>')) {
    fullHtml = fullHtml.slice(0, -'<div class="page-break"></div>'.length);
  }

  if (!fullHtml) {
    alert('Nenhuma aula cadastrada neste semestre para exportação.');
    return;
  }

  exportToPdf(semester.name, 'Compilado Completo de Aulas', fullHtml, {
    studentName: profile.name,
    courseName: profile.course,
    institution: profile.institution || profile.university,
    date: semester.code,
    lessonsList,
  });
}
