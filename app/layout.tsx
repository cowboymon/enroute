import type { Metadata } from "next";
import Link from "next/link";
import {
  trovical,
  liquidEmbrace,
  advercaseBold,
  advercaseRegular,
  comico,
} from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enroute",
  description: "Send a message that arrives on the recipient's terms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${trovical.variable} ${liquidEmbrace.variable} ${advercaseBold.variable} ${advercaseRegular.variable} ${comico.variable}`}
    >
      <body>
        <header className="header">
          <div className="header-inner">
            <Link href="/" className="logotype">
              Enroute
            </Link>
          </div>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
