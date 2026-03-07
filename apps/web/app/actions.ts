"use server";

import { revalidateTag } from "next/cache";

/**
 * Server action to revalidate the records cache tag.
 * This is used after a new record is uploaded.
 */
export async function revalidateRecords() {
	console.log("[Server Action] Revalidating 'records' tag...");
	revalidateTag("records");
}

/**
 * Server action to revalidate the audit cache tag.
 */
export async function revalidateAudit() {
	console.log("[Server Action] Revalidating 'audit' tag...");
	revalidateTag("audit");
}
