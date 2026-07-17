import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: { default: "CovenantDesk — Commercial Agreement Studio", template: "%s | CovenantDesk" },
    description: "A professional contract workspace for recurring commercial property and facility-use agreements.",
    applicationName: "CovenantDesk",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "CovenantDesk — Commercial Agreement Studio", description: "Build, review, sign, and preserve professional commercial property rental agreements.", type: "website", url: siteUrl, images: [{ url: `${siteUrl}/og.png`, width: 1730, height: 909, alt: "CovenantDesk Commercial Agreement Studio" }] },
    twitter: { card: "summary_large_image", title: "CovenantDesk — Commercial Agreement Studio", description: "Build, review, sign, and preserve professional commercial property rental agreements.", images: [`${siteUrl}/og.png`] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
