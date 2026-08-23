import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
} from 'docx';
import { Lesson, Notebook, Discipline } from '../types';

/**
 * Strips HTML tags and parses into structural paragraphs and headings for DOCX export.
 */
function parseHtmlToDocxElements(html: string): Paragraph[] {
  const container = document.createElement('div');
  container.innerHTML = html;

  const paragraphs: Paragraph[] = [];

  const processNode = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text, size: 24, font: 'Calibri' })],
            spacing: { after: 120 },
          })
        );
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();

      if (tag === 'h1') {
        paragraphs.push(
          new Paragraph({
            text: el.innerText.trim(),
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (tag === 'h2') {
        paragraphs.push(
          new Paragraph({
            text: el.innerText.trim(),
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
      } else if (tag === 'h3') {
        paragraphs.push(
          new Paragraph({
            text: el.innerText.trim(),
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 160, after: 80 },
          })
        );
      } else if (tag === 'p') {
        const textRuns: TextRun[] = [];
        el.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            textRuns.push(new TextRun({ text: child.textContent || '', size: 24, font: 'Calibri' }));
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const childEl = child as HTMLElement;
            const isBold = childEl.tagName === 'STRONG' || childEl.tagName === 'B';
            const isItalic = childEl.tagName === 'EM' || childEl.tagName === 'I';
            textRuns.push(
              new TextRun({
                text: childEl.innerText || '',
                bold: isBold,
                italics: isItalic,
                size: 24,
                font: 'Calibri',
              })
            );
          }
        });
        if (textRuns.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: textRuns,
              spacing: { after: 140, line: 360 },
            })
          );
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const items = el.querySelectorAll('li');
        items.forEach((li, idx) => {
          paragraphs.push(
            new Paragraph({
              text: (tag === 'ol' ? `${idx + 1}. ` : '• ') + li.innerText.trim(),
              spacing: { after: 80 },
              indent: { left: 400 },
            })
          );
        });
      } else if (el.classList.contains('academic-callout') || tag === 'blockquote') {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '📌 ' + el.innerText.trim(),
                italics: true,
                bold: true,
                size: 22,
                color: '2C3E50',
                font: 'Calibri',
              }),
            ],
            spacing: { before: 140, after: 140 },
            indent: { left: 600, right: 400 },
          })
        );
      } else {
        // Recurse children
        el.childNodes.forEach((child) => processNode(child));
      }
    }
  };

  container.childNodes.forEach((node) => processNode(node));

  if (paragraphs.length === 0) {
    paragraphs.push(
      new Paragraph({
        text: container.innerText || 'Sem conteúdo escrito.',
        spacing: { after: 120 },
      })
    );
  }

  return paragraphs;
}

export async function exportLessonToDocx(lesson: Lesson, disciplineName: string = 'Disciplina Acadêmica'): Promise<Blob> {
  const contentParagraphs = parseHtmlToDocxElements(lesson.contentHtml || '');

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: `${disciplineName.toUpperCase()} — ${lesson.lessonNumber ? lesson.lessonNumber + ' : ' : ''}${lesson.title}`,
                alignment: AlignmentType.RIGHT,
                spacing: { after: 200 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Caderno Digital Universitário | Página ' }),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            text: disciplineName,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 80 },
          }),
          new Paragraph({
            text: `${lesson.lessonNumber ? lesson.lessonNumber + ' — ' : ''}${lesson.title}`,
            heading: HeadingLevel.TITLE,
            spacing: { after: 140 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Data: ${lesson.date || 'Não informada'} | `, bold: true, color: '555555' }),
              new TextRun({ text: `Professor(a): ${lesson.professor || 'Não informado'}`, color: '555555' }),
            ],
            spacing: { after: 300 },
          }),
          ...contentParagraphs,
          ...(lesson.summary
            ? [
                new Paragraph({
                  text: 'Resumo da Aula:',
                  heading: HeadingLevel.HEADING_3,
                  spacing: { before: 300, after: 100 },
                }),
                new Paragraph({
                  children: [new TextRun({ text: lesson.summary, italics: true, size: 22 })],
                  spacing: { after: 200 },
                }),
              ]
            : []),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function exportNotebookToDocx(
  notebook: Notebook,
  lessons: Lesson[],
  disciplineName: string = 'Disciplina'
): Promise<Blob> {
  const sectionsChildren: Paragraph[] = [
    new Paragraph({
      text: notebook.name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 300 },
    }),
    new Paragraph({
      text: `Disciplina: ${disciplineName}`,
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: notebook.description || 'Caderno Digital Universitário',
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    }),
    new Paragraph({
      text: 'SUMÁRIO DAS AULAS',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    }),
  ];

  lessons.forEach((l, idx) => {
    sectionsChildren.push(
      new Paragraph({
        text: `${idx + 1}. ${l.lessonNumber ? l.lessonNumber + ' - ' : ''}${l.title} (${l.date || ''})`,
        spacing: { after: 80 },
      })
    );
  });

  lessons.forEach((lesson) => {
    sectionsChildren.push(
      new Paragraph({
        text: '____________________________________________________',
        spacing: { before: 400, after: 300 },
      }),
      new Paragraph({
        text: `${lesson.lessonNumber ? lesson.lessonNumber + ' — ' : ''}${lesson.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 120 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Data: ${lesson.date || ''} | Professor: ${lesson.professor || ''}`, italics: true, color: '666666' }),
        ],
        spacing: { after: 200 },
      }),
      ...parseHtmlToDocxElements(lesson.contentHtml || '')
    );
  });

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: `${notebook.name} — ${disciplineName}`,
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT] })],
              }),
            ],
          }),
        },
        children: sectionsChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export async function exportSemesterToDocx(
  semesterName: string,
  disciplines: Discipline[],
  notebooks: Notebook[],
  allLessons: Lesson[],
  studentName: string,
  course: string,
  institution: string
): Promise<Blob> {
  const sectionsChildren: Paragraph[] = [
    new Paragraph({
      text: institution.toUpperCase(),
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 1200 },
    }),
    new Paragraph({
      text: semesterName,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
    new Paragraph({
      text: 'Compilado Completo de Aulas',
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      spacing: { after: 1500 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Estudante: `, bold: true }),
        new TextRun({ text: studentName }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Curso: `, bold: true }),
        new TextRun({ text: course }),
      ],
      spacing: { after: 800 },
    }),
    new Paragraph({
      text: 'TABELA DE CONTEÚDOS (SUMÁRIO)',
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 300 },
    }),
  ];

  let itemIdx = 1;
  disciplines.forEach((disc) => {
    const discNotebooks = notebooks.filter((n) => n.disciplineId === disc.id);
    discNotebooks.forEach((nb) => {
      const nbLessons = allLessons
        .filter((l) => l.notebookId === nb.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      nbLessons.forEach((lesson) => {
        sectionsChildren.push(
          new Paragraph({
            text: `${itemIdx++}. [${disc.name}] ${lesson.lessonNumber ? lesson.lessonNumber + ' - ' : ''}${lesson.title} (${lesson.date})`,
            spacing: { after: 80 },
            indent: { left: 240 },
          })
        );
      });
    });
  });

  disciplines.forEach((disc) => {
    const discNotebooks = notebooks.filter((n) => n.disciplineId === disc.id);
    discNotebooks.forEach((nb) => {
      const nbLessons = allLessons
        .filter((l) => l.notebookId === nb.id)
        .sort((a, b) => a.date.localeCompare(b.date));

      nbLessons.forEach((lesson) => {
        sectionsChildren.push(
          new Paragraph({
            text: '____________________________________________________',
            spacing: { before: 600, after: 400 },
          }),
          new Paragraph({
            text: `[${disc.name}] ${lesson.lessonNumber ? lesson.lessonNumber + ' — ' : ''}${lesson.title}`,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 300, after: 120 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Data: ${lesson.date} | Professor: ${lesson.professor || disc.professor || 'Não informado'}`, italics: true, color: '666666' }),
            ],
            spacing: { after: 350 },
          }),
          ...parseHtmlToDocxElements(lesson.contentHtml || '')
        );
      });
    });
  });

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: `${semesterName} — Compilado Acadêmico`,
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ children: [PageNumber.CURRENT] })],
              }),
            ],
          }),
        },
        children: sectionsChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
