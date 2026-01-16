"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function GaInnerTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  useEffect(() => {
    if (!GA_ID) return;

    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;

    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("config", GA_ID, { page_path: url });
    }
  }, [pathname, searchParams, GA_ID]);

  return null;
}

export default function GaTracker() {
  return (
    <Suspense fallback={null}>
      <GaInnerTracker />
    </Suspense>
  );
}
