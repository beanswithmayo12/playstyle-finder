import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { AnalyticsProvider } from "./providers";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: "Playstyle Finder — Same game. Different stage.",
  description:
    "Upload your highlights and meet the pro who plays like you. A free AI scouting report, head to head with the pros.",
};

// Runs before first paint so a saved dark theme never flashes light.
// Light is the default; only an explicit saved choice switches it.
const themeScript = `try{if(localStorage.getItem("theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${archivo.variable} ${plexMono.variable} antialiased`}>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
