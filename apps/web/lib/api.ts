import ky from "ky";

/**
 * API Client using ky for Medical Records
 * ky handles credentials, retries, and error handling automatically
 */

const API_BASE_URL = "http://localhost:8787/api";

// Base ky instance with shared config
export const api = ky.create({
	prefixUrl: API_BASE_URL,
	credentials: "include", // Send cookies automatically
	retry: {
		limit: 2,
		methods: ["get"],
		statusCodes: [408, 429, 500, 502, 503, 504],
	},
	hooks: {
		beforeError: [
			async (error) => {
				const { response } = error;
				if (response?.body) {
					try {
						const body = await response.clone().json();
						if (body?.error) {
							error.message = body.error;
						}
					} catch {
						// ignore parse error
					}
				}
				return error;
			},
		],
	},
});

/**
 * TanStack Query Keys
 */
export const queryKeys = {
	records: {
		all: ["records"] as const,
		list: () => [...queryKeys.records.all, "list"] as const,
		detail: (id: string) => [...queryKeys.records.all, "detail", id] as const,
	},
	shares: {
		all: ["shares"] as const,
		forRecord: (recordId: string) =>
			[...queryKeys.shares.all, "record", recordId] as const,
		info: (token: string) => [...queryKeys.shares.all, "info", token] as const,
	},
};

/**
 * Records API
 */
export const recordsApi = {
	/**
	 * Upload a new medical record with optional metadata
	 */
	async upload(
		file: File,
		formData?: FormData,
	): Promise<{
		success: boolean;
		record: {
			id: string;
			fileName: string;
			fileSize: number;
			mimeType: string;
			uploadedAt: string;
			hederaTransactionId: string;
		};
	}> {
		const body = formData ?? new FormData();
		if (!formData) body.append("file", file);

		return api.post("records/upload", { body, timeout: 214748364 }).json();
	},

	/**
	 * List all records
	 */
	async list(): Promise<{
		success: boolean;
		records: Array<{
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
		}>;
	}> {
		return api.get("records").json();
	},

	/**
	 * Get a specific record
	 */
	async get(id: string): Promise<{
		success: boolean;
		record: {
			id: string;
			fileName: string;
			fileSize: number;
			mimeType: string;
			fileHash: string;
			uploadedAt: number;
			hederaTransactionId: string;
		};
	}> {
		return api.get(`records/${id}`).json();
	},

	/**
	 * Download a record (returns blob for file download)
	 */
	async download(id: string): Promise<Blob> {
		return api.get(`records/${id}/download`).blob();
	},

	/**
	 * Delete a record
	 */
	async delete(id: string): Promise<{ success: boolean; message: string }> {
		return api.delete(`records/${id}`).json();
	},
};

/**
 * Share Links API
 */
export const shareApi = {
	/**
	 * Generate a share link for a record
	 */
	async generateLink(
		recordId: string,
		expiresInHours = 24,
	): Promise<{
		success: boolean;
		shareLink: {
			id: string;
			token: string;
			url: string;
			expiresAt: string;
			recordId: string;
			fileName: string;
		};
	}> {
		return api
			.post("share/generate", { json: { recordId, expiresInHours } })
			.json();
	},

	/**
	 * Get share link info (public - no auth needed)
	 */
	async getInfo(token: string): Promise<{
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
	}> {
		// Public endpoint - create a separate ky instance without credentials
		return ky.get(`${API_BASE_URL}/share/${token}/info`).json();
	},

	/**
	 * Access a shared file (public - no auth needed)
	 * Returns the file blob + verification metadata from response headers
	 */
	async accessFile(token: string): Promise<{
		blob: Blob;
		verified: boolean;
		fileName: string;
		mimeType: string;
		fileHash: string;
		hederaTransaction: string;
	}> {
		const response = await ky.get(`${API_BASE_URL}/share/${token}`);

		const blob = await response.blob();
		// Case-insensitive header check
		const getHeader = (name: string) => 
			response.headers.get(name) || response.headers.get(name.toLowerCase());

		const verified = getHeader("X-File-Verified") === "true";
		const contentDisposition = getHeader("Content-Disposition") || "";
		const fileName = contentDisposition.match(/filename="(.+)"/)?.[1] || "file";
		const mimeType = getHeader("Content-Type") || "application/octet-stream";
		const fileHash = getHeader("X-File-Hash") || "";
		const hederaTransaction = getHeader("X-Hedera-Transaction") || "";

		return { blob, verified, fileName, mimeType, fileHash, hederaTransaction };
	},

	/**
	 * List all share links for a record
	 */
	async listForRecord(recordId: string): Promise<{
		success: boolean;
		shareLinks: Array<{
			id: string;
			token: string;
			url: string;
			expiresAt: number;
			isExpired: boolean;
			accessCount: number;
			accessedAt: number | null;
			createdAt: number;
		}>;
	}> {
		return api.get(`share/record/${recordId}`).json();
	},
};
