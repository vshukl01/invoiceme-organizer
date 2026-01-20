// apps/web/src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "InvoiceMe Organizer",
  description: "Invoice/Memo Organizer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        {children}
      </body>
    </html>
  );
}
