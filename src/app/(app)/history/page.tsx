import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listReviews } from "@/lib/reviews";

export default async function HistoryPage() {
  const user = await requireUser();
  const reviews = await listReviews(user.id);

  return (
    <div>
      <h1 className="text-xl font-semibold">Historique des séances</h1>
      {reviews.length === 0 ? (
        <p className="mt-3 text-slate-500">Aucune séance de révision pour l&apos;instant.</p>
      ) : (
        <table className="mt-4 w-full overflow-hidden rounded-lg bg-white text-sm shadow">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Document</th>
              <th className="px-4 py-2 text-right font-medium">Bonnes réponses</th>
              <th className="px-4 py-2 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reviews.map((review) => (
              <tr key={review.id}>
                <td className="px-4 py-2 text-slate-500">
                  {review.createdAt.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-2">
                  <Link href={`/documents/${review.document.id}`} className="text-indigo-600 hover:underline">
                    {review.document.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-right">
                  {review.correct} / {review.total}
                </td>
                <td className="px-4 py-2 text-right font-semibold">{review.score} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
