import { cacheLife, cacheTag } from "next/cache";
import { headers } from "next/headers";
import { Suspense } from "react";
import AuditClient from "./audit-client";

interface AuditLog {
	id: string;
	userId: string;
	recordId: string | null;
	action: string;
	hederaTopicId: string;
	hederaTransactionId: string;
	hederaSequenceNumber: string;
	metadata: string | null;
	timestamp: number;
}

/**
 * Cached function to fetch audit logs for a specific session
 */
async function getAuditLogs(cookie: string, userAgent: string) {
	"use cache";
	cacheLife("minutes");
	cacheTag("audit");

	const rawApiUrl =
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";
	const API_BASE_URL_FORMATTED = rawApiUrl.endsWith("/api")
		? rawApiUrl
		: `${rawApiUrl}/api`;

	console.log(`[Next.js Server] Fetching audit logs from: ${API_BASE_URL_FORMATTED}/records/audit`);

	try {
		const res = await fetch(`${API_BASE_URL_FORMATTED}/records/audit`, {
			headers: {
				"Cookie": cookie || "",
				"User-Agent": userAgent || "Next.js Server",
				"Accept": "application/json",
			},
			cache: 'no-store',
		});

		if (!res.ok) {
			console.error(`[Next.js Server] Failed to fetch audit logs: ${res.status}`);
			if (res.status === 401) return null;
			return [];
		}

		const data = await res.json();
		return (data.logs as AuditLog[]) || [];
	} catch (error) {
		console.error("[Next.js Server] Error fetching audit logs:", error);
		return [];
	}
}

async function AuditContent() {
	const headerList = await headers();
	const cookie = headerList.get("cookie") || "";
	const userAgent = headerList.get("user-agent") || "";
	
	const logs = await getAuditLogs(cookie, userAgent);

	return <AuditClient initialLogs={logs || []} />;
}

export default function AuditHistoryPage() {
	return (
		<Suspense
			fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-xl" />}
		>
			<AuditContent />
		</Suspense>
	);
}
