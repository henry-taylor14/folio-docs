import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default function AppBar({ userName }: { userName: string }) {
  return (
    <header className="appbar">
      <Link href="/documents" className="brand">
        Folio
      </Link>
      <div className="appbar-user">
        <span>{userName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
