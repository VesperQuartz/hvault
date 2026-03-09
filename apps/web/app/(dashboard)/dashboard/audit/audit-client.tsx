"use client";

import { useQuery } from "@tanstack/react-query";
import { recordsApi, queryKeys, formatHederaTxId } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@hvault/ui/components/card";
import { Badge } from "@hvault/ui/components/badge";
import { Shield, ExternalLink, Clock, ArrowLeft, Share2, Trash2, CheckCircle2, AlertTriangle, Download, Upload, Monitor, Smartphone, Globe, Search, Filter, Hash, Fingerprint } from "lucide-react";
import { formatDistanceToNow, isValid } from "date-fns";
import Link from "next/link";
import { Button } from "@hvault/ui/components/button";
import { Input } from "@hvault/ui/components/input";
import { useState, useMemo } from "react";
import { cn } from "@hvault/ui/lib/utils";

export default function AuditClient({ initialLogs }: { initialLogs: any[] }) {
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState("all");

	const { data, isLoading, error } = useQuery({
		queryKey: queryKeys.records.audit(),
		queryFn: () => recordsApi.listAudit(),
		initialData: { success: true, logs: initialLogs },
	});

	const rawLogs = (data?.logs ?? []) as any[];

	const filteredLogs = useMemo(() => {
		return rawLogs.filter(log => {
			const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) || 
								 (log.metadata && log.metadata.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesAction = actionFilter === "all" || log.action === actionFilter;
			return matchesSearch && matchesAction;
		});
	}, [rawLogs, searchQuery, actionFilter]);

	const getActionIcon = (action: string) => {
		switch (action) {
			case "UPLOAD": return <Upload className="h-4 w-4" />;
			case "ACCESS": return <Download className="h-4 w-4" />;
			case "SHARE": return <Share2 className="h-4 w-4" />;
			case "DELETE": return <Trash2 className="h-4 w-4" />;
			case "VERIFY": return <CheckCircle2 className="h-4 w-4" />;
			case "TAMPER_DETECTED": return <AlertTriangle className="h-4 w-4" />;
			case "EXPIRED_ACCESS": return <Clock className="h-4 w-4" />;
			case "LINK_EXPIRED": return <Clock className="h-4 w-4" />;
			default: return <Shield className="h-4 w-4" />;
		}
	};

	const getActionTheme = (action: string) => {
		switch (action) {
			case "UPLOAD": return "text-blue-600 bg-blue-50 border-blue-100";
			case "ACCESS": return "text-green-600 bg-green-50 border-green-100";
			case "SHARE": return "text-purple-600 bg-purple-50 border-purple-100";
			case "DELETE": return "text-red-600 bg-red-50 border-red-100";
			case "VERIFY": return "text-emerald-600 bg-emerald-50 border-emerald-100";
			case "TAMPER_DETECTED": return "text-rose-600 bg-rose-50 border-rose-100";
			case "EXPIRED_ACCESS": return "text-orange-600 bg-orange-50 border-orange-100";
			case "LINK_EXPIRED": return "text-slate-600 bg-slate-50 border-slate-100";
			default: return "text-slate-600 bg-slate-50 border-slate-100";
		}
	};

	const formatLogDate = (timestamp: any) => {
		const date = new Date(timestamp);
		if (!isValid(date)) return "Unknown date";
		return formatDistanceToNow(date) + " ago";
	};

	const getMetadataDisplay = (metadataStr: string | null) => {
		if (!metadataStr) return "Standard operation recorded";
		try {
			const meta = JSON.parse(metadataStr);
			return meta.fileName || meta.action || meta.message || "Operation details verified";
		} catch (e) {
			return metadataStr;
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<div className="space-y-10 animate-in fade-in duration-500">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-2">
					<Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors mb-2 group">
						<ArrowLeft className="h-3 w-3 mr-2 group-hover:-translate-x-1 transition-transform" />
						Back to Dashboard
					</Link>
					<h1 className="text-4xl font-black tracking-tighter text-slate-900">
						Audit History
					</h1>
					<p className="text-slate-500 font-medium max-w-xl">
						Every interaction with your vault is cryptographically signed and 
						permanently recorded on the Hedera public ledger.
					</p>
				</div>
				
				<div className="flex items-center gap-3">
					<div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-2 shadow-sm">
						<Fingerprint className="h-4 w-4" />
						<span className="text-xs font-bold uppercase tracking-widest text-[10px]">HCS Protocol Active</span>
					</div>
				</div>
			</div>

			{/* Filter Bar */}
			<div className="bg-white p-2 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center gap-2">
				<div className="relative flex-1 w-full">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
					<Input 
						placeholder="Search the ledger..."
						className="border-none shadow-none focus-visible:ring-0 pl-11 h-12 text-sm font-medium"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
				<div className="h-8 w-[1px] bg-slate-100 hidden md:block" />
				<div className="flex items-center gap-2 p-1">
					<ActionFilterBtn label="All" active={actionFilter === "all"} onClick={() => setActionFilter("all")} />
					<ActionFilterBtn label="Uploads" active={actionFilter === "UPLOAD"} onClick={() => setActionFilter("UPLOAD")} />
					<ActionFilterBtn label="Access" active={actionFilter === "ACCESS"} onClick={() => setActionFilter("ACCESS")} />
					<ActionFilterBtn label="Security" active={actionFilter === "VERIFY"} onClick={() => setActionFilter("VERIFY")} />
				</div>
			</div>

			{/* Timeline View */}
			<div className="bg-white rounded-[40px] border shadow-sm overflow-hidden">
				<div className="p-8 border-b bg-slate-50/50 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="bg-white p-2 rounded-xl border shadow-sm">
							<Hash className="h-4 w-4 text-slate-400" />
						</div>
						<h2 className="font-bold text-slate-900 tracking-tight text-lg">Consensus Timeline</h2>
					</div>
					<Badge variant="outline" className="rounded-full bg-white font-bold text-[10px] tracking-widest text-slate-400 uppercase border-slate-200">
						{filteredLogs.length} Consensus Messages
					</Badge>
				</div>

				<div className="divide-y divide-slate-100">
					{filteredLogs.length === 0 ? (
						<div className="py-32 text-center space-y-4">
							<div className="bg-slate-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto">
								<Search className="h-8 w-8 text-slate-200" />
							</div>
							<p className="text-slate-400 font-medium">No records found matching your criteria</p>
						</div>
					) : (
						filteredLogs.map((log) => (
							<div key={log.id} className="p-6 md:p-8 hover:bg-slate-50/50 transition-colors group">
								<div className="flex flex-col md:flex-row md:items-start gap-6">
									{/* Date & Time Column */}
									<div className="md:w-40 shrink-0 space-y-1">
										<div className="text-sm font-bold text-slate-900">
											{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</div>
										<div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
											{new Date(log.timestamp).toLocaleDateString()}
										</div>
										<div className="text-[10px] font-medium text-slate-400">
											{formatLogDate(log.timestamp)}
										</div>
									</div>

									{/* Action Icon */}
									<div className={cn("hidden md:flex shrink-0 w-12 h-12 rounded-2xl items-center justify-center border transition-all shadow-sm", getActionTheme(log.action))}>
										{getActionIcon(log.action)}
									</div>

									{/* Content Column */}
									<div className="flex-1 space-y-4">
										<div className="flex items-center gap-3">
											<div className={cn("md:hidden p-2 rounded-lg border", getActionTheme(log.action))}>
												{getActionIcon(log.action)}
											</div>
											<div className="space-y-0.5">
												<h3 className="font-bold text-slate-900 flex items-center gap-2">
													{log.action}
													<div className="h-1 w-1 rounded-full bg-slate-300" />
													<span className="text-blue-600 text-xs tracking-tight">Verified</span>
												</h3>
												<p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
													{getMetadataDisplay(log.metadata)}
												</p>
											</div>
										</div>

										{/* Connection Details */}
										<div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
											<div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md border border-slate-200/50">
												<Globe className="h-3 w-3" />
												IP: {log.ipAddress || "System"}
											</div>
											<div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md border border-slate-200/50">
												{log.userAgent?.includes("Cloudflare") ? <Shield className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
												{log.userAgent?.includes("Mobile") ? "Mobile" : log.userAgent?.includes("Cloudflare") ? "Cron Task" : "Desktop"}
											</div>
										</div>
									</div>

									{/* Blockchain Links */}
									<div className="md:w-48 shrink-0 flex flex-col md:items-end gap-2">
										<div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border">
											SEQ #{log.hederaSequenceNumber}
										</div>
										<a 
											href={`https://hashscan.io/testnet/transaction/${formatHederaTxId(log.hederaTransactionId)}`}
											target="_blank"
											rel="noopener noreferrer"
											className="inline-flex items-center gap-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/50 px-3 py-1.5 rounded-full border border-blue-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600"
										>
											<ExternalLink className="h-3 w-3" />
											Public Ledger Proof
										</a>
									</div>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
}

function ActionFilterBtn({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) {
	return (
		<button 
			onClick={onClick}
			className={cn(
				"px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap",
				active 
					? "bg-slate-900 text-white shadow-lg" 
					: "text-slate-500 hover:bg-slate-50"
			)}
		>
			{label}
		</button>
	);
}
