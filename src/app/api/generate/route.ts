import { getUser } from "@/lib/auth";
import { parseCardCount } from "@/lib/cards";
import { generateCards } from "@/lib/generation";

// Réponse en flux NDJSON : une ligne JSON par étape ({ step }), puis { done, requested } ou { error }.
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Session expirée, reconnectez-vous." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const count = parseCardCount(body?.count);
  if (typeof body?.documentId !== "string" || !count) {
    return Response.json({ error: "Choisissez entre 5 et 30 cartes." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        const result = await generateCards(user.id, body.documentId, count, (step) => send({ step }));
        send("error" in result ? result : { done: result.count, requested: result.requested });
      } catch (error) {
        // Message seul (jamais la requête ni ses en-têtes, qui contiennent la clé).
        console.error("Échec de l'appel à Gemini :", error instanceof Error ? error.message : error);
        send({ error: "Le service Gemini n'a pas répondu correctement. Réessayez dans un instant." });
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8" } });
}
