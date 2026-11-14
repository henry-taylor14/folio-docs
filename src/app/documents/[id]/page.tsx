import Link from "next/link";
import { notFound } from "next/navigation";
import DocumentEditor from "@/components/DocumentEditor";
import { HttpError } from "@/lib/api";
import { loadDocumentForUser } from "@/lib/documents";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  let doc;
  try {
    doc = await loadDocumentForUser(user.id, id, "read");
  } catch (err) {
    if (err instanceof HttpError && err.status === 404) notFound();
    if (err instanceof HttpError && err.status === 410) return <DeletedDocument message={err.message} />;
    throw err;
  }

  return (
    <DocumentEditor
      id={doc.id}
      initialTitle={doc.title}
      initialContent={doc.content}
      role={doc.role}
      ownerName={doc.ownerName}
    />
  );
}

function DeletedDocument({ message }: { message: string }) {
  return (
    <main className="login">
      <div className="login-inner">
        <div className="login-head">
          <h1 className="t-heading-24">Document deleted</h1>
          <p className="t-secondary">{message}</p>
        </div>
        <div>
          <Link className="btn btn-lg" href="/documents">
            Go to documents
          </Link>
        </div>
      </div>
    </main>
  );
}
