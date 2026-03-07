import { Suspense } from "react";
import { cacheLife } from "next/cache";
import ViewShareClient from "./view-share-client";

interface ShareInfo {
	success: boolean;
	shareLink: {
		expiresAt: number;
		accessCount: number;
	};
	record: {
		fileName: string;
		fileSize: number;
		mimeType: string;
		uploadedAt: number;
		hederaTransactionId: string;
	};
}

async function getSharedInfo(token: string) {
	"use cache";
	cacheLife("minutes");

	const rawApiUrl =
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";
	const API_BASE_URL = rawApiUrl.endsWith("/api")
		? rawApiUrl
		: `${rawApiUrl}/api`;

	console.log(`[Next.js Server] Fetching shared info from: ${API_BASE_URL}/share/${token}/info`);

	try {
		const res = await fetch(`${API_BASE_URL}/share/${token}/info`);
		if (!res.ok) return null;
		return (await res.json()) as ShareInfo;
	} catch (error) {
		console.error("Failed to fetch shared info:", error);
		return null;
	}
}

async function ViewShareContent({ token }: { token: string }) {
	const info = await getSharedInfo(token);
	return <ViewShareClient token={token} initialInfo={info} />;
}

export default function ViewSharePage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	return (
		<Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div></div>}>
			<ViewShareWrapper params={params} />
		</Suspense>
	);
}

async function ViewShareWrapper({ params }: { params: Promise<{ token: string }> }) {
	const { token } = await params;
	return <ViewShareContent token={token} />;
}
