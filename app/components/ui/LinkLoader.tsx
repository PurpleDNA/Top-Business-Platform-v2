"use client";

import { useLinkStatus } from "next/link";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A tiny spinner scoped to the <Link> it lives inside. Uses Next's
 * useLinkStatus(), so it only shows for the exact link that was clicked.
 *
 * Must be rendered as a descendant of a <Link>. A short delay keeps it from
 * flickering on instant (prefetched/cached) navigations — those stay clean.
 */
export const LinkLoader = ({ className }: { className?: string }) => {
  const { pending } = useLinkStatus();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => setShow(true), 100);
    return () => clearTimeout(t);
  }, [pending]);

  if (!show) return null;

  return (
    <Loader2
      aria-hidden
      className={cn("size-3.5 shrink-0 animate-spin text-current opacity-70", className)}
    />
  );
};
