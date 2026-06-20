export async function extractTextFromPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  // pdf-parse has inconsistent ESM/CJS interop; handle both export shapes
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfModule = (await import("pdf-parse")) as any;
  const pdfParse = pdfModule.default ?? pdfModule;
  const data = await pdfParse(buffer);
  return {
    text: data.text as string,
    pageCount: data.numpages as number,
  };
}

export async function fetchAndExtractPdf(url: string): Promise<{ text: string; pageCount: number }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return extractTextFromPdf(buffer);
}
