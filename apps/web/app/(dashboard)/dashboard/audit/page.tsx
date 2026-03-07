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

async function getAuditLogs(cookie: string) {
	"use cache";
	cacheLife("minutes");
	cacheTag("audit");

	const API_BASE_URL =
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";
	const API_BASE_URL_FORMATTED = API_BASE_URL.endsWith("/api")
		? API_BASE_URL
		: `${API_BASE_URL}/api`;

	console.log(`[Next.js Server] Fetching audit logs from: ${API_BASE_URL_FORMATTED}/records/audit`);

	try {
		const res = await fetch(`${API_BASE_URL_FORMATTED}/records/audit`, {
			headers: {
				cookie: cookie || "",
			},
		});

		if (!res.ok) {
			console.error(`Failed to fetch audit logs: ${res.status}`);
			return [];
		}

		const data = await res.json();
		return (data.logs as AuditLog[]) || [];
	} catch (error) {
		console.error("Error fetching audit logs on server:", error);
		return [];
	}
}

async function AuditContent() {
	const cookie = (await headers()).get("cookie") || "";
	const logs = await getAuditLogs(cookie);

	return <AuditClient initialLogs={logs} />;
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
