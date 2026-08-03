import type { Metadata } from "next";
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
  description: "Send a little anticipation — a message that arrives on the recipient's terms.",
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
        <div className="noise" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
