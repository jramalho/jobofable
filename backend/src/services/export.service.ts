import PDFDocument from 'pdfkit';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx';
import { OptimizedResume, ResumeHeader } from '../schemas/resume.schema';

/**
 * ATS-friendly document generation that mirrors the aesthetics of a classic
 * professional resume: centered name/contact header, underlined uppercase
 * section titles, "Company — Title" bold lines with an italic location/date
 * line, plain round bullets. Single column; no tables, images or icons.
 */

export interface ResumeExportInput {
  resume: OptimizedResume;
  candidateName?: string;
  companyName?: string;
  jobTitle?: string;
}

export interface CoverLetterExportInput {
  coverLetter: string;
  candidateName?: string;
  companyName?: string;
  jobTitle?: string;
}

const PDF_MARGIN = 56;
const FONT = 'Helvetica';
const FONT_BOLD = 'Helvetica-Bold';
const FONT_ITALIC = 'Helvetica-Oblique';

function contactLine(header: ResumeHeader): string {
  return [header.location, header.phone, header.email, header.linkedin, header.github, header.website]
    .filter(Boolean)
    .join('  |  ');
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

export async function buildResumePdf(input: ResumeExportInput): Promise<Buffer> {
  const { resume } = input;
  const name = resume.header.name ?? input.candidateName;

  return renderPdf((doc) => {
    if (name) {
      doc.font(FONT_BOLD).fontSize(17).text(name.toUpperCase(), { align: 'center' });
    }
    if (resume.header.title) {
      doc.moveDown(0.2);
      doc.font(FONT).fontSize(11).text(resume.header.title, { align: 'center' });
    }
    const contact = contactLine(resume.header);
    if (contact) {
      doc.moveDown(0.2);
      doc.font(FONT).fontSize(9).fillColor('#333333').text(contact, { align: 'center' });
      doc.fillColor('#000000');
    }
    doc.moveDown(1);

    if (resume.summary) {
      pdfSection(doc, 'Professional Summary', () => {
        doc.font(FONT).fontSize(10).text(resume.summary, { lineGap: 2 });
      });
    }

    if (resume.skills.length > 0) {
      pdfSection(doc, 'Technical Skills', () => {
        for (const group of resume.skills) {
          doc.font(FONT_BOLD).fontSize(10).text(`${group.category}: `, { continued: true });
          doc.font(FONT).text(group.items.join(', '), { lineGap: 2 });
        }
      });
    }

    if (resume.experience.length > 0) {
      pdfSection(doc, 'Professional Experience', () => {
        for (const role of resume.experience) {
          doc.font(FONT_BOLD).fontSize(10.5).text(`${role.company} — ${role.title}`);
          const detail = [role.location, formatDateRange(role.startDate, role.endDate)]
            .filter(Boolean)
            .join('  |  ');
          if (detail) doc.font(FONT_ITALIC).fontSize(9).fillColor('#444444').text(detail);
          doc.fillColor('#000000').moveDown(0.2);
          pdfBullets(doc, role.bullets);
          doc.moveDown(0.6);
        }
      });
    }

    if (resume.projects.length > 0) {
      pdfSection(doc, 'Projects', () => {
        for (const project of resume.projects) {
          doc.font(FONT_BOLD).fontSize(10.5).text(project.name);
          if (project.description) doc.font(FONT).fontSize(10).text(project.description, { lineGap: 2 });
          if (project.technologies.length > 0) {
            doc.font(FONT_ITALIC).fontSize(9).fillColor('#444444').text(`Technologies: ${project.technologies.join(', ')}`);
            doc.fillColor('#000000');
          }
          doc.moveDown(0.2);
          pdfBullets(doc, project.bullets);
          doc.moveDown(0.6);
        }
      });
    }

    if (resume.education.length > 0) {
      pdfSection(doc, 'Education', () => {
        for (const entry of resume.education) {
          const degreeLine = [entry.degree, entry.field].filter(Boolean).join(', ');
          const range = formatDateRange(entry.startDate, entry.endDate);
          doc.font(FONT_BOLD).fontSize(10).text(degreeLine || entry.institution, { continued: true });
          doc
            .font(FONT)
            .text(`${degreeLine ? ` — ${entry.institution}` : ''}${range ? `  |  ${range}` : ''}`, {
              lineGap: 2,
            });
          doc.moveDown(0.2);
        }
      });
    }

    if (resume.certifications.length > 0) {
      pdfSection(doc, 'Certifications', () => {
        for (const cert of resume.certifications) {
          const detail = [cert.issuer, cert.date].filter(Boolean).join(', ');
          doc.font(FONT_BOLD).fontSize(10).text(cert.name, { continued: Boolean(detail) });
          if (detail) doc.font(FONT).text(` — ${detail}`, { lineGap: 2 });
          doc.moveDown(0.2);
        }
      });
    }

    if (resume.languages.length > 0) {
      pdfSection(doc, 'Languages', () => {
        const line = resume.languages
          .map((entry) => (entry.level ? `${entry.language} (${entry.level})` : entry.language))
          .join(', ');
        doc.font(FONT).fontSize(10).text(line);
      });
    }
  });
}

export async function buildCoverLetterPdf(input: CoverLetterExportInput): Promise<Buffer> {
  return renderPdf((doc) => {
    if (input.candidateName) {
      doc.font(FONT_BOLD).fontSize(14).text(input.candidateName.toUpperCase(), { align: 'center' });
      doc.moveDown(0.3);
    }
    const subject = [input.jobTitle, input.companyName].filter(Boolean).join(' — ');
    if (subject) {
      doc.font(FONT).fontSize(10).fillColor('#444444').text(subject, { align: 'center' });
      doc.fillColor('#000000');
    }
    doc.moveDown(1.2);

    for (const paragraph of splitParagraphs(input.coverLetter)) {
      doc.font(FONT).fontSize(11).text(paragraph, { lineGap: 3, align: 'left' });
      doc.moveDown(0.8);
    }
  });
}

function renderPdf(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: PDF_MARGIN });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    draw(doc);
    doc.end();
  });
}

function pdfSection(doc: PDFKit.PDFDocument, title: string, body: () => void): void {
  doc.font(FONT_BOLD).fontSize(11).text(title.toUpperCase());
  doc
    .moveTo(PDF_MARGIN, doc.y + 2)
    .lineTo(doc.page.width - PDF_MARGIN, doc.y + 2)
    .lineWidth(0.7)
    .strokeColor('#555555')
    .stroke();
  doc.moveDown(0.6);
  body();
  doc.moveDown(0.8);
}

function pdfBullets(doc: PDFKit.PDFDocument, bullets: string[]): void {
  const bulletX = PDF_MARGIN + 4;
  const textX = PDF_MARGIN + 16;
  const textWidth = doc.page.width - PDF_MARGIN - textX;

  doc.font(FONT).fontSize(10);
  for (const bullet of bullets) {
    // Keep the glyph and the first line together across page breaks.
    if (doc.y + doc.currentLineHeight() > doc.page.height - PDF_MARGIN) {
      doc.addPage();
    }
    // Draw the glyph and the text as separate columns so wrapped lines
    // hang-indent under the text instead of under the bullet.
    const y = doc.y;
    doc.text('•', bulletX, y, { lineBreak: false });
    doc.text(bullet, textX, y, { width: textWidth, lineGap: 2 });
    doc.moveDown(0.15);
  }
  doc.x = PDF_MARGIN;
}

// ---------------------------------------------------------------------------
// DOCX
// ---------------------------------------------------------------------------

export async function buildResumeDocx(input: ResumeExportInput): Promise<Buffer> {
  const { resume } = input;
  const name = resume.header.name ?? input.candidateName;
  const children: Paragraph[] = [];

  if (name) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: name.toUpperCase(), bold: true, size: 34 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
    );
  }
  if (resume.header.title) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.header.title, size: 23 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
      }),
    );
  }
  const contact = contactLine(resume.header);
  if (contact) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: contact, size: 18, color: '333333' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      }),
    );
  }

  if (resume.summary) {
    docxSection(children, 'Professional Summary');
    children.push(docxBody(resume.summary));
  }

  if (resume.skills.length > 0) {
    docxSection(children, 'Technical Skills');
    for (const group of resume.skills) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${group.category}: `, bold: true }),
            new TextRun(group.items.join(', ')),
          ],
          spacing: { after: 80 },
        }),
      );
    }
  }

  if (resume.experience.length > 0) {
    docxSection(children, 'Professional Experience');
    for (const role of resume.experience) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `${role.company} — ${role.title}`, bold: true })],
          spacing: { before: 120, after: 30 },
        }),
      );
      const detail = [role.location, formatDateRange(role.startDate, role.endDate)]
        .filter(Boolean)
        .join('  |  ');
      if (detail) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: detail, italics: true, size: 18, color: '555555' })],
            spacing: { after: 80 },
          }),
        );
      }
      children.push(...role.bullets.map(docxBullet));
    }
  }

  if (resume.projects.length > 0) {
    docxSection(children, 'Projects');
    for (const project of resume.projects) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: project.name, bold: true })],
          spacing: { before: 120, after: 30 },
        }),
      );
      if (project.description) children.push(docxBody(project.description));
      if (project.technologies.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Technologies: ${project.technologies.join(', ')}`,
                italics: true,
                size: 18,
                color: '555555',
              }),
            ],
            spacing: { after: 80 },
          }),
        );
      }
      children.push(...project.bullets.map(docxBullet));
    }
  }

  if (resume.education.length > 0) {
    docxSection(children, 'Education');
    for (const entry of resume.education) {
      const degreeLine = [entry.degree, entry.field].filter(Boolean).join(', ');
      const range = formatDateRange(entry.startDate, entry.endDate);
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: degreeLine || entry.institution, bold: true }),
            ...(degreeLine ? [new TextRun(` — ${entry.institution}`)] : []),
            ...(range ? [new TextRun({ text: `  |  ${range}`, color: '555555' })] : []),
          ],
          spacing: { after: 80 },
        }),
      );
    }
  }

  if (resume.certifications.length > 0) {
    docxSection(children, 'Certifications');
    for (const cert of resume.certifications) {
      const detail = [cert.issuer, cert.date].filter(Boolean).join(', ');
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: cert.name, bold: true }),
            ...(detail ? [new TextRun(` — ${detail}`)] : []),
          ],
          spacing: { after: 80 },
        }),
      );
    }
  }

  if (resume.languages.length > 0) {
    docxSection(children, 'Languages');
    const line = resume.languages
      .map((entry) => (entry.level ? `${entry.language} (${entry.level})` : entry.language))
      .join(', ');
    children.push(docxBody(line));
  }

  return packDocx(children);
}

export async function buildCoverLetterDocx(input: CoverLetterExportInput): Promise<Buffer> {
  const children: Paragraph[] = [];

  if (input.candidateName) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: input.candidateName.toUpperCase(), bold: true, size: 28 })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
      }),
    );
  }
  const subject = [input.jobTitle, input.companyName].filter(Boolean).join(' — ');
  if (subject) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: subject, italics: true, color: '555555' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      }),
    );
  }

  for (const paragraph of splitParagraphs(input.coverLetter)) {
    children.push(
      new Paragraph({
        children: [new TextRun(paragraph)],
        spacing: { after: 200, line: 300 },
        alignment: AlignmentType.LEFT,
      }),
    );
  }

  return packDocx(children);
}

function docxSection(children: Paragraph[], title: string): void {
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: title.toUpperCase(), bold: true, color: '222222' })],
      spacing: { before: 240, after: 120 },
      border: { bottom: { style: 'single', size: 6, color: '555555', space: 2 } },
    }),
  );
}

function docxBody(text: string): Paragraph {
  return new Paragraph({ children: [new TextRun(text)], spacing: { after: 120, line: 280 } });
}

function docxBullet(text: string): Paragraph {
  return new Paragraph({
    children: [new TextRun(text)],
    bullet: { level: 0 },
    spacing: { after: 60 },
  });
}

async function packDocx(children: Paragraph[]): Promise<Buffer> {
  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Helvetica', size: 21 } } },
    },
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate && !endDate) return '';
  if (!startDate) return endDate ?? '';
  if (!endDate) return `${startDate} – Present`;
  if (startDate === endDate) return startDate;
  return `${startDate} – ${endDate}`;
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\n/g, ' ').trim())
    .filter(Boolean);
}
