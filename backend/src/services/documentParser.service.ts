import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { detectFileType } from '../utils/fileValidator';
import { cleanExtractedText } from '../utils/textCleaner';
import { FileParsingError } from '../utils/errors';

/**
 * Extracts plain text from uploaded PDF/DOCX files. Files are processed
 * in memory only — nothing is persisted to disk.
 */
export async function extractTextFromFile(file: Express.Multer.File): Promise<string> {
  const fileType = detectFileType(file);

  const rawText =
    fileType === 'pdf' ? await extractFromPdf(file) : await extractFromDocx(file);

  const cleaned = cleanExtractedText(rawText);
  if (cleaned.length < 50) {
    throw new FileParsingError(
      `Could not extract readable text from "${file.originalname}". If it is a scanned/image PDF, export a text-based version and try again.`,
    );
  }
  return cleaned;
}

async function extractFromPdf(file: Express.Multer.File): Promise<string> {
  try {
    const result = await pdfParse(file.buffer);
    return result.text;
  } catch (error) {
    throw new FileParsingError(
      `Failed to read the PDF "${file.originalname}". The file may be corrupted or password-protected.`,
      { cause: String(error) },
    );
  }
}

async function extractFromDocx(file: Express.Multer.File): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  } catch (error) {
    throw new FileParsingError(
      `Failed to read the DOCX "${file.originalname}". The file may be corrupted.`,
      { cause: String(error) },
    );
  }
}
