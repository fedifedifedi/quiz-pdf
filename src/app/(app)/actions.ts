"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createDocument } from "@/lib/documents";
import { readPdf } from "@/lib/pdf";

export type UploadState = { error: string } | undefined;

export async function uploadDocument(_: UploadState, formData: FormData): Promise<UploadState> {
  const user = await requireUser();
  const file = formData.get("file");
  const pdf = await readPdf(file instanceof File ? file : null);
  if ("error" in pdf) return pdf;

  const document = await createDocument(user.id, {
    name: (file as File).name,
    file: pdf.bytes,
    text: pdf.text,
  });
  redirect(`/documents/${document.id}`);
}
