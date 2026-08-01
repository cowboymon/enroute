import localFont from "next/font/local";

export const trovical = localFont({
  src: [
    {
      path: "../../public/fonts/Trovical-Reg-Free.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Trovical-Italic-Free.otf",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-trovical",
  display: "swap",
});

export const liquidEmbrace = localFont({
  src: "../../public/fonts/DK-Liquid-Embrace.ttf",
  variable: "--font-liquid-embrace",
  display: "swap",
});

export const advercaseBold = localFont({
  src: "../../public/fonts/Advercase-Font-Demo-Bold.otf",
  variable: "--font-advercase-bold",
  display: "swap",
});

export const comico = localFont({
  src: "../../public/fonts/Comico-Regular.otf",
  variable: "--font-comico",
  display: "swap",
});

export const advercaseRegular = localFont({
  src: [
    {
      path: "../../public/fonts/Advercase-Font-Demo-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Advercase-Font-Demo-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/Advercase-Font-Demo-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-advercase-regular",
  display: "swap",
});
