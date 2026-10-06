import { extractText, getDocumentProxy } from "unpdf";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
// En dessous, on considère le PDF comme scanné (images sans texte sélectionnable).
const MIN_TEXT_CHARS = 200;

type PdfResult = { error: string } | { bytes: Uint8Array<ArrayBuffer>; text: string };

export async function readPdf(file: File | null): Promise<PdfResult> {
  if (!file || file.size === 0) return { error: "Choisissez un fichier PDF." };
  if (file.size > MAX_PDF_BYTES) return { error: "Le fichier dépasse la taille maximale de 10 Mo." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf =
    file.name.toLowerCase().endsWith(".pdf") &&
    new TextDecoder().decode(bytes.subarray(0, 5)) === "%PDF-";
  if (!isPdf) return { error: "Le fichier doit être un PDF." };

  let text: string;
  try {
    // pdf.js peut s'approprier le buffer : on lui passe une copie.
    const pdf = await getDocumentProxy(bytes.slice());
    text = (await extractText(pdf, { mergePages: true })).text.trim();
  } catch {
    return { error: "Ce PDF est illisible ou corrompu." };
  }

  if (text.replace(/\s/g, "").length < MIN_TEXT_CHARS) {
    return {
      error: "Ce PDF ne contient pas de texte sélectionnable (PDF scanné ?). Utilisez un PDF texte.",
    };
  }
  return { bytes, text };
}
