import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { listReviews } from "@/lib/reviews";

export default async function HistoryPage() {
  const user = await requireUser();
  const reviews = await listReviews(user.id);
  const average = Math.round(reviews.reduce((sum, r) => sum + r.score, 0) / (reviews.length || 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique des séances</h1>
        {reviews.length > 0 && (
          <p className="mt-1 text-slate-600">
            {reviews.length} séance{reviews.length > 1 ? "s" : ""} · score moyen{" "}
            <strong className="font-semibold text-slate-900">{average} %</strong>
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-12 text-center">
          <p aria-hidden className="text-3xl">📈</p>
          <p className="mt-3 font-semibold">Aucune séance pour l&apos;instant</p>
          <p className="mt-1 text-sm text-slate-500">Vos scores apparaîtront ici après votre première révision.</p>
          <Link href="/" className="btn btn-primary mt-5">
            Voir mes documents
          </Link>
        </div>
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-3 py-3 font-semibold sm:px-5">Date</th>
                <th scope="col" className="px-3 py-3 font-semibold sm:px-4">Document</th>
                <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Bonnes réponses</th>
                <th scope="col" className="px-3 py-3 text-right font-semibold sm:px-5">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 whitespace-nowrap text-slate-500 sm:px-5">
                    {review.createdAt.toLocaleDateString("fr-FR")}
                    <span className="hidden sm:inline">
                      {" "}
                      {review.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td className="px-3 py-3 sm:px-4">
                    <Link
                      href={`/documents/${review.document.id}`}
                      className="block max-w-32 truncate font-medium text-indigo-600 hover:text-indigo-700 hover:underline sm:max-w-none"
                    >
                      {review.document.name}
                    </Link>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-slate-600 sm:table-cell">
                    {review.correct} / {review.total}
                  </td>
                  <td className="px-3 py-3 sm:px-5">
                    <div className="flex items-center justify-end gap-3">
                      <div aria-hidden className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 sm:block">
                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${review.score}%` }} />
                      </div>
                      <span className="w-12 text-right font-semibold tabular-nums">{review.score} %</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
