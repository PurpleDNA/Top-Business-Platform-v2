"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { LinkLoader } from "./LinkLoader";

/**
 * Drop-in replacement for next/link that appends an inline pending spinner.
 * Handy for plain text links — swap `import Link from "next/link"` for
 * `import { AppLink as Link } from "@/app/components/ui/AppLink"`.
 *
 * For links with custom layouts (icons, cards, tables) prefer placing
 * <LinkLoader /> manually so you control where the spinner sits.
 */
export const AppLink = ({
  children,
  loaderClassName,
  ...props
}: ComponentProps<typeof Link> & { loaderClassName?: string }) => {
  return (
    <Link {...props}>
      {children}
      <LinkLoader className={loaderClassName} />
    </Link>
  );
};
