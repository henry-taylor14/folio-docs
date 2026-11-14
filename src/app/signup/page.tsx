import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import SignupForm from "@/components/SignupForm";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/documents");
  return (
    <main className="login">
      <div className="login-inner">
        <div className="login-head">
          <h1 className="t-heading-24">Create your Folio account</h1>
          <p className="t-secondary">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
        <SignupForm />
      </div>
    </main>
  );
}
