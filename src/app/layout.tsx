import type { Metadata, Viewport } from "next";
import { Info } from "lucide-react";
import { AppNav } from "@/components/app-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyReceipt",
  description: "Record receipts and understand household spending.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen md:flex">
          <AppNav />
          <div className="min-w-0 flex-1">
            <p
              role="note"
              className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 md:px-8"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Shared demo — everyone can view and edit this data. Please use fictional receipts.
            </p>
            <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-10">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
