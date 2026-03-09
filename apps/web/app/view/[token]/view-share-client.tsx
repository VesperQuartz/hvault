"use client";

import { useEffect, useState } from "react";
import { shareApi, formatHederaTxId } from "@/lib/api";
import { Button } from "@hvault/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hvault/ui/components/card";
import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { CheckCircle, XCircle, Shield, ExternalLink, Download, AlertTriangle, ArrowLeft, Eye, FileText, Fingerprint, Lock, ShieldCheck, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { cn } from "@hvault/ui/lib/utils";
import { Badge } from "@hvault/ui/components/badge";

interface ShareInfo {
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

interface ViewShareClientProps {
	token: string;
	initialInfo?: ShareInfo | null;
}

export default function ViewShareClient({ token, initialInfo }: ViewShareClientProps) {
	const { data: session } = useSession();

	const [loading, setLoading] = useState(!initialInfo);
	const [error, setError] = useState("");
	const [info, setInfo] = useState<ShareInfo | null>(initialInfo || null);
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
		if (!initialInfo) {
			loadInfo();
		}
	}, [token, initialInfo]);

	const loadInfo = async () => {
		try {
			setLoading(true);
			const response = await shareApi.getInfo(token);
			if (response.success) {
				setInfo(response);
			} else {
				throw new Error("Invalid or expired share token.");
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to load document info.");
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
			setError(err instanceof Error ? err.message : "Access denied. Verification failed.");
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
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-[#f8fafc] py-12 px-6 selection:bg-blue-100">
			<div className="max-w-5xl mx-auto space-y-10">
				{/* Public Header */}
				<div className="flex flex-col md:flex-row justify-between items-center gap-6">
					<Link href="/" className="flex items-center gap-3 group">
						<div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100 group-hover:scale-105 transition-transform">
							<Shield className="h-5 w-5 text-white" />
						</div>
						<span className="text-xl font-bold tracking-tight text-slate-900">MediVault</span>
					</Link>
					
					<div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-2xl border shadow-sm">
						<div className="flex items-center gap-1.5 border-r pr-4">
							<Lock className="h-3 w-3 text-blue-500" />
							End-to-End Encrypted
						</div>
						<div className="flex items-center gap-1.5">
							<Fingerprint className="h-3 w-3 text-emerald-500" />
							Blockchain Verified
						</div>
					</div>
				</div>

				{error ? (
					<div className="max-w-md mx-auto py-20 text-center space-y-6">
						<div className="bg-rose-50 w-20 h-20 rounded-[32px] flex items-center justify-center mx-auto border border-rose-100">
							<AlertTriangle className="h-10 w-10 text-rose-500" />
						</div>
						<div className="space-y-2">
							<h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
							<p className="text-slate-500 font-medium">{error}</p>
						</div>
						<Link href="/">
							<Button variant="outline" className="rounded-full px-8">Return Home</Button>
						</Link>
					</div>
				) : info && (
					<div className="grid lg:grid-cols-3 gap-10 items-start">
						{/* Sidebar Info */}
						<div className="space-y-6">
							<Card className="rounded-[32px] border-none bg-slate-900 text-white overflow-hidden shadow-2xl relative">
								<div className="absolute top-0 right-0 p-6 opacity-10">
									<FileText className="h-24 w-24" />
								</div>
								<CardHeader className="p-8">
									<Badge className="w-fit mb-4 bg-blue-600 border-none font-black text-[10px] uppercase tracking-widest px-3">Shared Document</Badge>
									<CardTitle className="text-2xl font-bold tracking-tight leading-tight">
										{info.record.fileName}
									</CardTitle>
									<CardDescription className="text-slate-400 font-medium pt-2">
										Uploaded {formatDistanceToNow(new Date(info.record.uploadedAt))} ago
									</CardDescription>
								</CardHeader>
								<CardContent className="p-8 pt-0 space-y-6">
									<div className="grid grid-cols-2 gap-4">
										<InfoStat label="File Size" value={formatFileSize(info.record.fileSize)} />
										<InfoStat label="Accessed" value={`${info.shareLink.accessCount} times`} />
									</div>
									
									<div className="pt-6 border-t border-white/10 flex items-center justify-between">
										<div className="space-y-1">
											<div className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
												<Clock className="h-3 w-3" />
												Expires In
											</div>
											<div className="text-sm font-bold text-blue-400">
												{formatDistanceToNow(new Date(info.shareLink.expiresAt))}
											</div>
										</div>
										
										{info.record.hederaTransactionId && (
											<a 
												href={`https://hashscan.io/testnet/transaction/${formatHederaTxId(info.record.hederaTransactionId)}`}
												target="_blank"
												rel="noopener noreferrer"
												className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/10"
												title="Blockchain Consensus Proof"
											>
												<ShieldCheck className="h-5 w-5 text-blue-400" />
											</a>
										)}
									</div>
								</CardContent>
							</Card>

							<div className="bg-white rounded-[32px] border p-8 space-y-4 shadow-sm">
								<h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Security Protocol</h4>
								<p className="text-sm text-slate-500 leading-relaxed font-medium">
									This document is retrieved via an ephemeral AWS KMS session. The hash will be 
									instantly compared against the Hedera public ledger upon decryption.
								</p>
							</div>
						</div>

						{/* Main View Area */}
						<div className="lg:col-span-2 space-y-6">
							{!fileData ? (
								<div className="bg-white rounded-[40px] border shadow-sm p-16 text-center space-y-8 min-h-[500px] flex flex-col items-center justify-center">
									<div className="bg-blue-50 w-24 h-24 rounded-[32px] flex items-center justify-center border border-blue-100 shadow-sm mb-4">
										<Eye className="h-10 w-10 text-blue-600" />
									</div>
									<div className="space-y-2">
										<h3 className="text-2xl font-black text-slate-900 tracking-tight">Protected Content</h3>
										<p className="text-slate-500 font-medium max-w-sm mx-auto">
											Click below to initiate the secure verification and decryption sequence.
										</p>
									</div>
									<Button 
										onClick={handleViewFile} 
										disabled={viewLoading}
										size="lg"
										className="h-14 px-12 rounded-full font-black text-base shadow-blue-200 shadow-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
									>
										{viewLoading ? "Verifying Fingerprint..." : "Verify & View File"}
									</Button>
								</div>
							) : (
								<div className="space-y-6 animate-in fade-in duration-700">
									<div className={cn(
										"rounded-3xl border p-6 flex items-center gap-4 shadow-sm",
										fileData.verified ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
									)}>
										<div className={cn(
											"p-2 rounded-xl",
											fileData.verified ? "bg-emerald-100" : "bg-rose-100"
										)}>
											{fileData.verified ? <ShieldCheck className="h-6 w-6 text-emerald-600" /> : <XCircle className="h-6 w-6 text-rose-600" />}
										</div>
										<div className="flex-1">
											<h4 className={cn("font-bold text-sm", fileData.verified ? "text-emerald-900" : "text-rose-900")}>
												{fileData.verified ? "Cryptographic Integrity Confirmed" : "Integrity Verification Failed"}
											</h4>
											<p className={cn("text-xs font-medium", fileData.verified ? "text-emerald-700" : "text-rose-700")}>
												{fileData.verified 
													? "This document matches its original blockchain fingerprint. No tampering detected." 
													: "Document mismatch detected. This file may have been altered since upload."}
											</p>
										</div>
										<Button 
											variant="ghost" 
											size="sm" 
											onClick={handleDownload}
											className="rounded-xl font-bold text-xs"
										>
											<Download className="h-4 w-4 mr-2" />
											Download
										</Button>
									</div>

									<Card className="rounded-[40px] border shadow-2xl overflow-hidden bg-white">
										<CardContent className="p-0">
											{fileData.mimeType === "application/pdf" ? (
												<iframe
													src={fileData.url}
													className="w-full h-[750px]"
													title={fileData.fileName}
												/>
											) : fileData.mimeType.startsWith("image/") ? (
												<div className="p-4 bg-slate-50 min-h-[500px] flex items-center justify-center">
													<img
														src={fileData.url}
														alt={fileData.fileName}
														className="max-w-full h-auto rounded-2xl shadow-lg border border-white"
													/>
												</div>
											) : (
												<div className="p-32 text-center space-y-4">
													<AlertTriangle className="h-12 w-12 text-slate-300 mx-auto" />
													<p className="text-slate-500 font-bold">
														Native preview not available for this type
													</p>
													<Button onClick={handleDownload} variant="outline" className="rounded-full">Download to View</Button>
												</div>
											)}
										</CardContent>
									</Card>
								</div>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function InfoStat({ label, value }: { label: string, value: string }) {
	return (
		<div className="space-y-1">
			<div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
			<div className="text-sm font-bold text-white">{value}</div>
		</div>
	);
}
