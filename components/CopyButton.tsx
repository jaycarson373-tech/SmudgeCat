"use client";

import { useEffect, useRef, useState } from "react";

type CopyButtonProps = {
  value: string;
  compact?: boolean;
};

export function CopyButton({ value, compact = false }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  async function copyValue() {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      className={`copy-button${compact ? " copy-button-compact" : ""}`}
      type="button"
      onClick={copyValue}
      aria-label="Copy contract address"
    >
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}
