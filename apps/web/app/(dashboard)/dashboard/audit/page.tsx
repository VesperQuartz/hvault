"use client";

import { Badge } from "@hvault/ui/components/badge";
import { Button } from "@hvault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@hvault/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, isValid } from "date-fns";
import {
	AlertTriangle,
	ArrowLeft,
	CheckCircle2,
	Clock,
	Download,
	ExternalLink,
	Share2,
	Shield,
	Trash2,
	Upload,
} from "lucide-react";
import Link from "next/link";
import { formatHederaTxId, queryKeys, recordsApi } from "@/lib/api";

export default function AuditHistoryPage() {
	const { data, isLoading, error } = useQuery({
		queryKey: queryKeys.records.audit(),
		queryFn: () => recordsApi.listAudit(),
	});

	const logs = data?.logs ?? [];

	const getActionIcon = (action: string) => {
		switch (action) {
			case "UPLOAD":
				return <Upload className="h-4 w-4 text-blue-600" />;
			case "ACCESS":
				return <Download className="h-4 w-4 text-green-600" />;
			case "SHARE":
				return <Share2 className="h-4 w-4 text-purple-600" />;
			case "DELETE":
				return <Trash2 className="h-4 w-4 text-red-600" />;
			case "VERIFY":
				return <CheckCircle2 className="h-4 w-4 text-green-600" />;
			case "TAMPER_DETECTED":
				return <AlertTriangle className="h-4 w-4 text-red-600" />;
			default:
				return <Shield className="h-4 w-4 text-gray-600" />;
		}
	};

	const getActionColor = (action: string) => {
		switch (action) {
			case "UPLOAD":
				return "bg-blue-100 text-blue-700 border-blue-200";
			case "ACCESS":
				return "bg-green-100 text-green-700 border-green-200";
			case "SHARE":
				return "bg-purple-100 text-purple-700 border-purple-200";
			case "DELETE":
				return "bg-red-100 text-red-700 border-red-200";
			case "VERIFY":
				return "bg-green-100 text-green-700 border-green-200";
			case "TAMPER_DETECTED":
				return "bg-red-100 text-red-700 border-red-200";
			default:
				return "bg-gray-100 text-gray-700 border-gray-200";
		}
	};

	const formatLogDate = (timestamp: any) => {
		const date = new Date(timestamp);
		if (!isValid(date)) return "Unknown date";
		return `${date.toLocaleString()} (${formatDistanceToNow(date)} ago)`;
	};

	const getMetadataDisplay = (metadataStr: string | null) => {
		if (!metadataStr) return "No additional details";
		try {
			const meta = JSON.parse(metadataStr);
			return meta.fileName || meta.action || meta.message || "Action recorded";
		} catch (e) {
			return metadataStr;
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-muted-foreground">Loading audit trail...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<Link
						href="/dashboard"
						className="flex items-center text-sm text-muted-foreground hover:text-primary mb-2"
					>
						<ArrowLeft className="h-4 w-4 mr-1" />
						Back to Dashboard
					</Link>
					<h1 className="text-3xl font-bold tracking-tight">Audit History</h1>
					<p className="text-muted-foreground">
						Immutable record of all actions on your medical records, secured by
						Hedera Hashgraph.
					</p>
				</div>
			</div>

			{error && (
				<Card className="border-red-200 bg-red-50">
					<CardContent className="p-4 text-red-700">
						Failed to load audit history.{" "}
						{error instanceof Error ? error.message : ""}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader>
					<CardTitle className="text-lg flex items-center gap-2">
						<Shield className="h-5 w-5 text-primary" />
						Blockchain Audit Trail
					</CardTitle>
					<CardDescription>
						Every action is permanently stamped on the Hedera blockchain.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{logs.length === 0 ? (
						<div className="text-center py-12">
							<p className="text-muted-foreground">No audit logs found yet.</p>
						</div>
					) : (
						<div className="relative space-y-4">
							{logs.map((log, index) => (
								<div key={log.id} className="relative pl-8 pb-4 last:pb-0">
									{/* Timeline line */}
									{index !== logs.length - 1 && (
										<div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-gray-100" />
									)}

									{/* Status Circle */}
									<div
										className={`absolute left-0 top-1 p-1.5 rounded-full border-2 bg-white z-10 ${getActionColor(log.action)}`}
									>
										{getActionIcon(log.action)}
									</div>

									<div className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow">
										<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<span className="font-bold text-gray-900">
														{log.action}
													</span>
													<Badge
														variant="outline"
														className={`text-[10px] px-1.5 py-0 ${getActionColor(log.action)}`}
													>
														Verified
													</Badge>
												</div>
												<div className="text-sm text-muted-foreground flex items-center gap-1.5">
													<Clock className="h-3 w-3" />
													{formatLogDate(log.timestamp)}
												</div>
												<p className="text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded border border-dashed">
													{getMetadataDisplay(log.metadata)}
												</p>
											</div>

											<div className="flex flex-col items-start md:items-end gap-2 shrink-0">
												<div className="text-[10px] text-muted-foreground font-mono">
													Sequence: #{log.hederaSequenceNumber}
												</div>
												<a
													href={`https://hashscan.io/testnet/transaction/${formatHederaTxId(log.hederaTransactionId)}`}
													target="_blank"
													rel="noopener noreferrer"
													className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
													onClick={() => {
														console.log(
															"P_URL",
															formatHederaTxId(log.hederaTransactionId),
														);
													}}
												>
													<ExternalLink className="h-3 w-3" />
													Blockchain Proof
												</a>
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
