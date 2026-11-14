import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login-wrap">
      <div className="login-sheet">
        <h1>Not found</h1>
        <p>This document doesn&apos;t exist, or it hasn&apos;t been shared with you.</p>
        <Link className="btn" href="/documents">Back to documents</Link>
      </div>
    </main>
  );
}
