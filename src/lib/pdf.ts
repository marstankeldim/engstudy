/**
 * PDF text extraction.
 *
 * Uses `unpdf` (a serverless-safe build of pdfjs) rather than pdf-parse, which
 * pulls in pdfjs-dist and requires the browser-only `DOMMatrix`/canvas APIs —
 * those don't exist in Vercel's serverless Node runtime and crash at load.
 *
 * The import is dynamic and lives INSIDE the function so the PDF engine is only
 * loaded when a PDF is actually processed (the upload/reprocess routes), never
 * at module-eval time on unrelated routes that transitively import this file.
 */
export async function extractTextFromPdf(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, pageCount: totalPages };
}

export async function fetchAndExtractPdf(
  url: string
): Promise<{ text: string; pageCount: number }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return extractTextFromPdf(buffer);
}
