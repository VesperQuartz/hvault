"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { shareApi, formatHederaTxId } from "@/lib/api";
import { Button } from "@hvault/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hvault/ui/components/card";
import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { CheckCircle, XCircle, Shield, ExternalLink, Download, AlertTriangle, ArrowLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

export default function ViewSharePage() {
	const params = useParams();
	const token = params.token as string;
	const { data: session } = useSession();

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [info, setInfo] = useState<{
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
	} | null>(null);
	const [fileData, setFileData] = useState<{
		url: string;
		verified: boolean;
		fileName: string;
		mimeType: string;
		fileHash: string;
		hederaTransaction: string;
	} | null>(null);
	const [viewLoading, setViewLoading] = useState(false);

	useEffect(() => {
		loadInfo();
	}, [token]);

	const loadInfo = async () => {
		try {
			setLoading(true);
			const response = await shareApi.getInfo(token);
			setInfo(response);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load file info");
		} finally {
			setLoading(false);
		}
	};

	const handleViewFile = async () => {
		setError("");
		setViewLoading(true);

		try {
			const result = await shareApi.accessFile(token);
			const url = URL.createObjectURL(result.blob);
			setFileData({
				url,
				verified: result.verified,
				fileName: result.fileName,
				mimeType: result.mimeType,
				fileHash: result.fileHash,
				hederaTransaction: result.hederaTransaction,
			});
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to access file");
		} finally {
			setViewLoading(false);
		}
	};

	const handleDownload = () => {
		if (!fileData) return;

		const a = document.createElement("a");
		a.href = fileData.url;
		a.download = fileData.fileName;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-muted-foreground">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
			<div className="max-w-4xl mx-auto space-y-6">
				{/* Top Navigation */}
				<div className="flex justify-start">
					{session ? (
						<Link href="/dashboard">
							<Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Dashboard
							</Button>
						</Link>
					) : (
						<Link href="/">
							<Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Home
							</Button>
						</Link>
					)}
				</div>

				{/* Header */}
				<div className="text-center">
					<div className="flex items-center justify-center mb-4">
						<Shield className="h-12 w-12 text-primary" />
					</div>
					<h1 className="text-3xl font-bold text-gray-900">
						Shared Medical Record
					</h1>
					<p className="text-muted-foreground mt-2">
						Secured with blockchain verification
					</p>
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertTriangle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{info && (
					<>
						{/* File Info Card */}
						<Card>
							<CardHeader>
								<CardTitle>{info.record.fileName}</CardTitle>
								<CardDescription>
									Uploaded {formatDistanceToNow(new Date(info.record.uploadedAt))} ago •{" "}
									{formatFileSize(info.record.fileSize)}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<p className="text-muted-foreground">File Type</p>
										<p className="font-medium">{info.record.mimeType}</p>
									</div>
									<div>
										<p className="text-muted-foreground">Times Accessed</p>
										<p className="font-medium">{info.shareLink.accessCount}</p>
									</div>
									<div>
										<p className="text-muted-foreground">Link Expires</p>
										<p className="font-medium">
											{formatDistanceToNow(new Date(info.shareLink.expiresAt))} from now
										</p>
									</div>
									<div>
										<p className="text-muted-foreground">Hedera Proof</p>
										{info.record.hederaTransactionId ? (
											<a
												href={`https://hashscan.io/testnet/transaction/${formatHederaTxId(info.record.hederaTransactionId)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="flex items-center text-primary hover:underline font-medium"
											>
												<ExternalLink className="h-3 w-3 mr-1" />
												View
											</a>
										) : (
											<p className="font-medium">N/A</p>
										)}
									</div>
								</div>

								{!fileData && (
									<Button
										onClick={handleViewFile}
										disabled={viewLoading}
										className="w-full"
										size="lg"
									>
										{viewLoading ? "Verifying & Loading..." : "View File"}
									</Button>
								)}
							</CardContent>
						</Card>

						{/* Verification Status */}
						{fileData && (
							<>
								<Alert className={fileData.verified ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
									<div className="flex items-start space-x-3">
										{fileData.verified ? (
											<CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
										) : (
											<XCircle className="h-5 w-5 text-red-600 mt-0.5" />
										)}
										<div className="flex-1">
											<h4 className={`font-medium ${fileData.verified ? "text-green-900" : "text-red-900"}`}>
												{fileData.verified ? "File Verified ✓" : "Verification Failed ✗"}
											</h4>
											<p className={`text-sm mt-1 ${fileData.verified ? "text-green-800" : "text-red-800"}`}>
												{fileData.verified
													? "This file matches its original Hedera blockchain fingerprint. No tampering detected."
													: "This file does NOT match its blockchain fingerprint. It may have been tampered with."}
											</p>
											{fileData.hederaTransaction && (
												<a
													href={`https://hashscan.io/testnet/transaction/${formatHederaTxId(fileData.hederaTransaction)}`}
													target="_blank"
													rel="noopener noreferrer"
													className="text-sm flex items-center mt-2 text-primary hover:underline"
												>
													<ExternalLink className="h-3 w-3 mr-1" />
													View blockchain proof
												</a>
											)}
										</div>
									</div>
								</Alert>

								{/* File Viewer */}
								<Card>
									<CardContent className="p-0">
										{fileData.mimeType === "application/pdf" ? (
											<iframe
												src={fileData.url}
												className="w-full h-[600px] rounded-lg"
												title={fileData.fileName}
											/>
										) : fileData.mimeType.startsWith("image/") ? (
											<img
												src={fileData.url}
												alt={fileData.fileName}
												className="w-full h-auto rounded-lg"
											/>
										) : (
											<div className="p-8 text-center">
												<p className="text-muted-foreground">
													Preview not available for this file type
												</p>
											</div>
										)}
									</CardContent>
								</Card>

								<Button onClick={handleDownload} variant="outline" className="w-full">
									<Download className="h-4 w-4 mr-2" />
									Download File
								</Button>
							</>
						)}

						{/* Security Info */}
						<Card className="bg-blue-50 border-blue-200">
							<CardContent className="pt-6">
								<div className="flex items-start space-x-3">
									<Shield className="h-5 w-5 text-blue-600 mt-0.5" />
									<div className="text-sm text-blue-900">
										<p className="font-medium mb-2">How this file is protected:</p>
										<ul className="space-y-1 list-disc list-inside">
											<li>Encrypted with AWS KMS encryption</li>
											<li>Original hash stored on Hedera blockchain</li>
											<li>Automatic tamper detection on every access</li>
											<li>All access permanently logged</li>
										</ul>
									</div>
								</div>
							</CardContent>
						</Card>
					</>
				)}
			</div>
		</div>
	);
}
