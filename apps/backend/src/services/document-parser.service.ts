import * as fs from 'fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

import mammoth from 'mammoth';
import XLSX from 'xlsx';
import WordExtractor from 'word-extractor';

export interface ParsedDocument {
  text: string;
  metadata: {
    pages?: number;
    wordCount: number;
    charCount: number;
    format: string;
  };
}

export class DocumentParserService {
  private wordExtractor = new WordExtractor();

  private supportedFormats = {
    pdf: ['application/pdf'],
    docx: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    doc: [
      'application/msword',
    ],
    xlsx: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
    txt: ['text/plain'],
  };

  isSupported(mimetype: string): boolean {
    const allSupported = Object.values(this.supportedFormats).flat();
    return allSupported.includes(mimetype);
  }

  getFormatFromMimetype(mimetype: string): string | null {
    for (const [format, mimetypes] of Object.entries(this.supportedFormats)) {
      if (mimetypes.includes(mimetype)) {
        return format;
      }
    }
    return null;
  }

  async parseDocument(filePath: string, mimetype: string): Promise<ParsedDocument> {
    const format = this.getFormatFromMimetype(mimetype);

    if (!format) {
      throw new Error(`Unsupported document format: ${mimetype}`);
    }

    let text = '';
    let pages: number | undefined;

    switch (format) {
      case 'pdf':
        const pdfResult = await this.parsePdf(filePath);
        text = pdfResult.text;
        pages = pdfResult.pages;
        break;

      case 'docx':
        text = await this.parseDocx(filePath);
        break;

      case 'doc':
        text = await this.parseDoc(filePath);
        break;

      case 'xlsx':
        text = await this.parseXlsx(filePath);
        break;

      case 'txt':
        text = await this.parseTxt(filePath);
        break;

      default:
        throw new Error(`Parser not implemented for format: ${format}`);
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const charCount = text.length;

    return {
      text,
      metadata: {
        pages,
        wordCount,
        charCount,
        format,
      },
    };
  }

  private async parsePdf(filePath: string): Promise<{ text: string; pages: number }> {
    const dataBuffer = await fs.readFile(filePath);

    
    const uint8Array = new Uint8Array(dataBuffer);

    
    const loadingTask = getDocument({ data: uint8Array });
    const pdf = await loadingTask.promise;

    const textParts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    return {
      text: textParts.join('\n\n'),
      pages: pdf.numPages,
    };
  }

  private async parseDocx(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return result.value;
  }

  private async parseDoc(filePath: string): Promise<string> {
    const extracted = await this.wordExtractor.extract(filePath);
    return extracted.getBody();
  }

  private async parseXlsx(filePath: string): Promise<string> {
    const workbook = XLSX.readFile(filePath);
    const sheets: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      sheets.push(`=== Sheet: ${sheetName} ===\n${csv}`);
    }

    return sheets.join('\n\n');
  }

  private async parseTxt(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content;
  }
}

export const documentParserService = new DocumentParserService();
