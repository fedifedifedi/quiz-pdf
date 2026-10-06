import { describe, expect, test } from "vitest";
import { MAX_PDF_BYTES, readPdf } from "@/lib/pdf";
import { makePdf, pdfFile } from "./helpers";

const LONG_TEXT = "La photosynthese convertit la lumiere en energie chimique. ".repeat(6);

describe("readPdf", () => {
  test("extrait le texte d'un PDF valide", async () => {
    const result = await readPdf(pdfFile(makePdf(LONG_TEXT)));
    if ("error" in result) throw new Error(result.error);
    expect(result.text).toContain("La photosynthese convertit la lumiere");
    expect(new TextDecoder().decode(result.bytes.subarray(0, 5))).toBe("%PDF-");
  });

  test("refuse l'absence de fichier", async () => {
    expect(await readPdf(null)).toEqual({ error: "Choisissez un fichier PDF." });
  });

  test("refuse un fichier trop lourd", async () => {
    const big = new File([new Uint8Array(MAX_PDF_BYTES + 1)], "gros.pdf");
    expect(await readPdf(big)).toEqual({ error: "Le fichier dépasse la taille maximale de 10 Mo." });
  });

  test("refuse un fichier qui n'est pas un PDF, même renommé", async () => {
    const fake = new File(["ceci n'est pas un pdf"], "faux.pdf", { type: "application/pdf" });
    expect(await readPdf(fake)).toEqual({ error: "Le fichier doit être un PDF." });
    expect(await readPdf(pdfFile(makePdf(LONG_TEXT), "cours.txt"))).toEqual({
      error: "Le fichier doit être un PDF.",
    });
  });

  test("refuse un PDF corrompu", async () => {
    const broken = new File(["%PDF-1.4\n n'importe quoi"], "casse.pdf");
    expect(await readPdf(broken)).toEqual({ error: "Ce PDF est illisible ou corrompu." });
  });

  test("signale un PDF scanné (sans texte)", async () => {
    const result = await readPdf(pdfFile(makePdf()));
    expect(result).toEqual({ error: expect.stringContaining("PDF scanné") });
  });

  test("considère comme scanné un PDF avec trop peu de texte", async () => {
    const result = await readPdf(pdfFile(makePdf("Page 1")));
    expect(result).toEqual({ error: expect.stringContaining("PDF scanné") });
  });
});
