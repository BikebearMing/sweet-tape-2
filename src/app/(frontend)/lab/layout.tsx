import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/* The labs are working drawings, not pages. In production every route under
   /lab is a 404 — nothing to crawl, nothing to stumble on — and in dev they are
   exactly what they were. */
export default function LabLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
