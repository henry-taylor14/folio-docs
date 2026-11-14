"use client";

/** Short, scannable timestamp in the viewer's timezone; full value on hover. */
export default function LocalTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const sameYear = d.getFullYear() === now.getFullYear();
  const text = sameDay
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString(undefined, sameYear ? { month: "short", day: "numeric" } : { dateStyle: "medium" });
  return (
    <time dateTime={iso} title={d.toLocaleString()} suppressHydrationWarning>
      {text}
    </time>
  );
}
