import { Geist, Geist_Mono } from "next/font/google";

import "@hvault/ui/globals.css";
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers";

const fontSans = Geist({
	subsets: ["latin"],
	variable: "--font-sans",
});

const fontMono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

import { Suspense } from "react";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
			>
				<Suspense>
					<Providers>
						{children}
					</Providers>
					<Analytics />
				</Suspense>
			</body>
		</html>
	);
}
