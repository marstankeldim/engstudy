import { PDFParse } from "pdf-parse";

/**
 * Extracts plain text and page count from a PDF buffer using pdf-parse v2's
 * class-based API. Always destroys the parser to release the worker.
 */
export async function extractTextFromPdf(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    return { text: result.text, pageCount: result.total };
  } finally {
    await parser.destroy();
  }
}

export async function fetchAndExtractPdf(
  url: string
): Promise<{ text: string; pageCount: number }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return extractTextFromPdf(buffer);
}
