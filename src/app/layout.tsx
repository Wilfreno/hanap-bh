import type { Metadata } from "next";
import "./globals.css";
import { Poppins } from "next/font/google";
import NextAuthProvider from "@/lib/providers/NextAuthProvider";
import { cn } from "@/lib/utils";
import ReactQueryProvider from "@/lib/providers/ReactQueryProvider";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hanap BH",
  description: "A  Web Application that help Filipinos locate the nearest lodgings on their vicinity",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(poppins.className, "antialiased")}>
        <NextAuthProvider>
          <ReactQueryProvider>{children}</ReactQueryProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
