// app/layout.tsx
import "./globals.css";
import { ChecklistProvider } from "@/components/checklist";
import Script from "next/script";
import GaTracker from "./ga-tracker";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ja">
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <ChecklistProvider>
          <GaTracker />
          {children}
        </ChecklistProvider>
      </body>
    </html>
  );
}
