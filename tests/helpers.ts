import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function createUser(email: string) {
  return prisma.user.create({ data: { email, passwordHash: await hashPassword("motdepasse") } });
}

// PDF minimal d'une page ; sans texte, il simule un PDF scanné. Texte ASCII sans parenthèses,
// découpé en lignes de 80 caractères (pdf.js ignore le texte qui sort de la page).
export function makePdf(text = ""): Uint8Array<ArrayBuffer> {
  const lines = text.match(/.{1,80}/g) ?? [];
  const content = text
    ? `BT /F1 10 Tf 12 TL 20 750 Td ${lines.map((line) => `(${line}) Tj T*`).join(" ")} ET`
    : "";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = objects.map((object, i) => {
    const offset = pdf.length;
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("") +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

export function pdfFile(bytes: Uint8Array<ArrayBuffer>, name = "cours.pdf") {
  return new File([bytes], name, { type: "application/pdf" });
}
