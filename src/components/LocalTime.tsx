"use client";

/** Renders a timestamp in the viewer's locale/timezone. */
export default function LocalTime({ iso }: { iso: string }) {
  const d = new Date(iso);
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}
