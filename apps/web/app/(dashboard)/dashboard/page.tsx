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
}

/**
 * Cached function to fetch records for a specific session cookie
 * In a real-world app, you might want to cache by User ID instead of cookie
 */
async function getRecords(cookie: string) {
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
				cookie: cookie || "",
			},
		});

		if (!res.ok) {
			console.error(`Failed to fetch records: ${res.status}`);
			return [];
		}

		const data = await res.json();
		return (data.records as Record[]) || [];
	} catch (error) {
		console.error("Error fetching records on server:", error);
		return [];
	}
}

async function DashboardContent() {
	const cookie = (await headers()).get("cookie") || "";
	const records = await getRecords(cookie);

	return <DashboardClient initialRecords={records} />;
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
