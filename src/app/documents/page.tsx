import Link from "next/link";
import AppBar from "@/components/AppBar";
import ImportButton from "@/components/ImportButton";
import LocalTime from "@/components/LocalTime";
import NewDocumentButton from "@/components/NewDocumentButton";
import { listDocumentsForUser } from "@/lib/documents";
import { requireUser } from "@/lib/session";
import { SUPPORTED_LABEL } from "@/lib/import";

export const dynamic = "force-dynamic";

const ACCESS_LABEL = { owner: "Owner", editor: "Can edit", viewer: "Can view" } as const;

export default async function DocumentsPage() {
  const user = await requireUser();
  const { owned, shared } = await listDocumentsForUser(user.id);

  return (
    <div className="page">
      <AppBar userName={user.name} />
      <main className="dash">
        <div className="dash-head">
          <div className="dash-intro">
            <h1 className="t-title">Documents</h1>
            <p className="t-secondary">Import accepts {SUPPORTED_LABEL} and creates a new document.</p>
          </div>
          <div className="dash-actions">
            <ImportButton />
            <NewDocumentButton />
          </div>
        </div>

        <section className="dash-section" aria-labelledby="owned-h">
          <h2 id="owned-h" className="t-heading-20">
            My documents
          </h2>
          <div className="table-wrap">
            <table className="table">
              <caption className="visually-hidden">Documents you own</caption>
              <thead>
                <tr>
                  <th scope="col" className="col-title">
                    Title
                  </th>
                  <th scope="col" className="col-fit">
                    Last edited
                  </th>
                </tr>
              </thead>
              <tbody>
                {owned.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="empty">
                      You don&apos;t own any documents yet. Create one or import a file.
                    </td>
                  </tr>
                ) : (
                  owned.map((d) => (
                    <tr key={d.id}>
                      <td className="col-title">
                        <Link href={`/documents/${d.id}`}>{d.title}</Link>
                      </td>
                      <td className="col-fit numeric">
                        <LocalTime iso={d.updatedAt.toISOString()} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="dash-section" aria-labelledby="shared-h">
          <h2 id="shared-h" className="t-heading-20">
            Shared with me
          </h2>
          <div className="table-wrap">
            <table className="table">
              <caption className="visually-hidden">Documents other people shared with you</caption>
              <thead>
                <tr>
                  <th scope="col" className="col-title">
                    Title
                  </th>
                  <th scope="col" className="col-fit">
                    Owner
                  </th>
                  <th scope="col" className="col-fit">
                    Access
                  </th>
                  <th scope="col" className="col-fit col-hide-sm">
                    Last edited
                  </th>
                </tr>
              </thead>
              <tbody>
                {shared.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty">
                      Nothing has been shared with you yet.
                    </td>
                  </tr>
                ) : (
                  shared.map((d) => (
                    <tr key={d.id}>
                      <td className="col-title">
                        <Link href={`/documents/${d.id}`}>{d.title}</Link>
                      </td>
                      <td className="col-fit">{d.ownerName}</td>
                      <td className="col-fit">{ACCESS_LABEL[d.role]}</td>
                      <td className="col-fit col-hide-sm numeric">
                        <LocalTime iso={d.updatedAt.toISOString()} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
