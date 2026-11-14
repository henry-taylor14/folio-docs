import Link from "next/link";
import AppBar from "@/components/AppBar";
import ImportButton from "@/components/ImportButton";
import LocalTime from "@/components/LocalTime";
import NewDocumentButton from "@/components/NewDocumentButton";
import { listDocumentsForUser, type DocumentSummary } from "@/lib/documents";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const ROLE_LABEL = { owner: "Owner", editor: "Can edit", viewer: "Can view" } as const;

function DocRow({ doc, showOwner }: { doc: DocumentSummary; showOwner: boolean }) {
  return (
    <li>
      <Link href={`/documents/${doc.id}`} className="doc-row">
        <span className="doc-title">{doc.title}</span>
        <span className="doc-meta">
          Edited <LocalTime iso={doc.updatedAt.toISOString()} />
        </span>
        {showOwner && (
          <span className="doc-meta">
            Shared by {doc.ownerName} <span className="badge">{ROLE_LABEL[doc.role]}</span>
          </span>
        )}
      </Link>
    </li>
  );
}

export default async function DocumentsPage() {
  const user = await requireUser();
  const { owned, shared } = await listDocumentsForUser(user.id);

  return (
    <>
      <AppBar userName={user.name} />
      <main className="dash">
        <div className="dash-actions">
          <NewDocumentButton />
          <ImportButton />
        </div>

        <section aria-labelledby="owned-h">
          <h2 id="owned-h">My documents</h2>
          <ul className="doc-list">
            {owned.length === 0 ? (
              <li className="empty">No documents yet. Create one or import a file to get started.</li>
            ) : (
              owned.map((d) => <DocRow key={d.id} doc={d} showOwner={false} />)
            )}
          </ul>
        </section>

        <section aria-labelledby="shared-h">
          <h2 id="shared-h">Shared with me</h2>
          <ul className="doc-list">
            {shared.length === 0 ? (
              <li className="empty">Documents other people share with you will appear here.</li>
            ) : (
              shared.map((d) => <DocRow key={d.id} doc={d} showOwner />)
            )}
          </ul>
        </section>
      </main>
    </>
  );
}
