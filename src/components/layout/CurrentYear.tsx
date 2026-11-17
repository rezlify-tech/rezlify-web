"use client";

import { useEffect, useState } from "react";

const FALLBACK_YEAR = 2026;

/** Shows the visitor's current year without freezing it at build time. */
export function CurrentYear() {
  const [year, setYear] = useState(FALLBACK_YEAR);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <>{year}</>;
}
