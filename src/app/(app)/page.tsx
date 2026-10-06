import { requireUser } from "@/lib/auth";

export default async function HomePage() {
  await requireUser();

  return <h1 className="text-2xl font-semibold">Mes documents</h1>;
}
