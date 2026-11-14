import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/documents");
  return (
    <main className="login-wrap">
      <div className="login-sheet">
        <h1>Folio</h1>
        <p>Sign in to write and share documents.</p>
        <LoginForm />
      </div>
    </main>
  );
}
