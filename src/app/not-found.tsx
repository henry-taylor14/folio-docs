import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login">
      <div className="login-inner">
        <div className="login-head">
          <h1 className="t-heading-24">Document not found</h1>
          <p className="t-secondary">
            It doesn&apos;t exist, or it hasn&apos;t been shared with you. Ask the owner to share it.
          </p>
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
