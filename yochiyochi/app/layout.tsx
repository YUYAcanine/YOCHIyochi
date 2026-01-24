// app/layout.tsx
import "./globals.css";
import { ChecklistProvider } from "@/components/checklist";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
      </head>
      <body>
        <ChecklistProvider>{children}</ChecklistProvider>

      </body>
    </html>
  );
}

