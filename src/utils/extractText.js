// ─────────────────────────────────────────────────────────
//  extractText.js  —  Extract text from PDF, DOCX, TXT
// ─────────────────────────────────────────────────────────

// ── PDF ────────────────────────────────────────────────
export async function extractFromPDF(file) {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    fullText += `\n[Page ${i}]\n${pageText}`;
  }
  return fullText.trim();
}

// ── DOCX ───────────────────────────────────────────────
export async function extractFromDOCX(file) {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}

// ── TXT / MD ───────────────────────────────────────────
export async function extractFromTXT(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ── ROUTER ─────────────────────────────────────────────
export async function extractText(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) return extractFromPDF(file);
  if (name.endsWith('.docx')) return extractFromDOCX(file);
  if (name.endsWith('.txt') || name.endsWith('.md')) return extractFromTXT(file);

  throw new Error(`Unsupported file type: ${file.name}`);
}

// ── STATS ──────────────────────────────────────────────
export function getDocStats(text) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5).length;
  const readingMinutes = Math.ceil(words / 200);
  return { words, chars, sentences, readingMinutes };
}
