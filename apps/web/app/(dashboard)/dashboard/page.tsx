import { cacheLife, cacheTag } from "next/cache";
import { headers } from "next/headers";
import { Suspense } from "react";
import DashboardClient from "./dashboard-client";

interface Record {
	id: string;
	fileName: string;
	fileSize: number;
	mimeType: string;
	fileHash: string;
	uploadedAt: number;
	hederaTransactionId: string;
	title?: string;
	documentType?: string;
	recordDate?: string;
	doctorName?: string;
	hospitalName?: string;
	notes?: string;
	shareLinkCount?: number;
}

/**
 * Cached function to fetch records for a specific session
 * We pass the cookie and user-agent to ensure better-auth can validate the session correctly.
 */
async function getRecords(cookie: string, userAgent: string) {
	"use cache";
	cacheLife("minutes");
	cacheTag("records");

	const rawApiUrl =
		process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";
	const API_BASE_URL = rawApiUrl.endsWith("/api")
		? rawApiUrl
		: `${rawApiUrl}/api`;

	console.log(`[Next.js Server] Fetching records from: ${API_BASE_URL}/records`);

	try {
		const res = await fetch(`${API_BASE_URL}/records`, {
			headers: {
				"Cookie": cookie || "",
				"User-Agent": userAgent || "Next.js Server",
				"Accept": "application/json",
			},
			cache: 'no-store',
		});

		if (!res.ok) {
			console.error(`[Next.js Server] Failed to fetch records: ${res.status} ${res.statusText}`);
			if (res.status === 401) return null;
			return [];
		}

		const data = await res.json();
		const records = (data.records as Record[]) || [];
		
		// Debug count
		console.log(`[Next.js Server] Fetched ${records.length} records. Counts:`, 
			records.map(r => `${r.fileName}: ${r.shareLinkCount || 0}`).join(", ")
		);
		
		return records;
	} catch (error) {
		console.error("[Next.js Server] Error fetching records:", error);
		return [];
	}
}

async function DashboardContent() {
	const headerList = await headers();
	const cookie = headerList.get("cookie") || "";
	const userAgent = headerList.get("user-agent") || "";
	
	const records = await getRecords(cookie, userAgent);

	return <DashboardClient initialRecords={records || []} />;
}

export default function DashboardPage() {
	return (
		<Suspense
			fallback={<div className="animate-pulse h-96 bg-gray-100 rounded-xl" />}
		>
			<DashboardContent />
		</Suspense>
	);
}
