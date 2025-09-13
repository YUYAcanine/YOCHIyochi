"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function GaTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!GA_ID) return;
    const url = pathname + searchParams.toString();
    // @ts-expect-error gtag is provided by Google Analytics script
    window.gtag("config", GA_ID, { page_path: url });
  }, [pathname, searchParams, GA_ID]);

  return null;
}
