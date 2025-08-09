import "./globals.css";
import { ChecklistProvider } from "@/components/checklist";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ChecklistProvider>{children}</ChecklistProvider>
      </body>
    </html>
  );
}
