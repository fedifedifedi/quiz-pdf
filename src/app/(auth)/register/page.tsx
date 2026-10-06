import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export default async function RegisterPage() {
  if (await getUser()) redirect("/");
  return <AuthForm mode="register" />;
}
