import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LoginForm from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/documents");
  return (
    <main className="login">
      <div className="login-inner">
        <div className="login-head">
          <h1 className="t-heading-24">Sign in to Folio</h1>
          <p className="t-secondary">Write, format and share documents.</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
