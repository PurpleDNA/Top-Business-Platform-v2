"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  // Top-center on mobile so the toast is in the user's line of sight;
  // bottom-right on larger screens (sonner's default placement).
  const [position, setPosition] =
    useState<ToasterProps["position"]>("bottom-right");

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 640px)");
    const update = () =>
      setPosition(mql.matches ? "top-center" : "bottom-right");

    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      richColors
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
