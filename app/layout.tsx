import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host") || "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return {
    metadataBase: new URL(origin),
    title: { default: "CovenantDesk — Commercial Agreement Studio", template: "%s | CovenantDesk" },
    description: "A professional contract workspace for recurring commercial property and facility-use agreements.",
    applicationName: "CovenantDesk",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "CovenantDesk — Commercial Agreement Studio", description: "Build, review, sign, and preserve professional commercial property rental agreements.", type: "website", url: origin, images: [{ url: `${origin}/og.png`, width: 1730, height: 909, alt: "CovenantDesk Commercial Agreement Studio" }] },
    twitter: { card: "summary_large_image", title: "CovenantDesk — Commercial Agreement Studio", description: "Build, review, sign, and preserve professional commercial property rental agreements.", images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
