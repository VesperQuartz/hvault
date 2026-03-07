"use client";

import { useState, useMemo } from "react";
import { formatHederaTxId, queryKeys, recordsApi } from "@/lib/api";
import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { Badge } from "@hvault/ui/components/badge";
import { Button } from "@hvault/ui/components/button";
import { Card, CardContent } from "@hvault/ui/components/card";
import { Input } from "@hvault/ui/components/input";
import { 
	Select, 
	SelectContent, 
	SelectItem, 
	SelectTrigger, 
	SelectValue 
} from "@hvault/ui/components/select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	CheckCircle2,
	Clock,
	Download,
	ExternalLink,
	FileText,
	Lock,
	Plus,
	Share2,
	Shield,
	Trash2,
	Upload,
	Search,
	Filter,
	X
} from "lucide-react";
import Link from "next/link";
import { cn } from "@hvault/ui/lib/utils";
import DeleteDialog from "@/components/delete-dialog";
import ShareDialog from "@/components/share-dialog";

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

const DOCUMENT_TYPES = [
	{ value: "all", label: "All Types" },
	{ value: "lab_result", label: "Lab Results" },
	{ value: "prescription", label: "Prescriptions" },
	{ value: "imaging", label: "Imaging / Scans" },
	{ value: "vaccination", label: "Vaccinations" },
	{ value: "report", label: "Reports" },
	{ value: "other", label: "Other" },
];

export default function DashboardClient({ initialRecords }: { initialRecords: Record[] }) {
	const queryClient = useQueryClient();
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
	
	// Filter and Search state
	const [searchQuery, setSearchQuery] = useState("");
	const [typeFilter, setTypeFilter] = useState("all");

	// Fetch records using TanStack Query
	const { data, isLoading, error } = useQuery({
		queryKey: queryKeys.records.list(),
		queryFn: () => recordsApi.list(),
		initialData: { success: true, records: initialRecords },
	});

	const allRecords = data?.records ?? [];

	// Filtered records
	const filteredRecords = useMemo(() => {
		return allRecords.filter(record => {
			const matchesSearch = (record.title || record.fileName)
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchesType = typeFilter === "all" || record.documentType === typeFilter;
			return matchesSearch && matchesType;
		});
	}, [allRecords, searchQuery, typeFilter]);

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id: string) => recordsApi.delete(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.records.list() });
			setDeleteDialogOpen(false);
			setSelectedRecord(null);
		},
		onError: (err: Error) => {
			alert(err.message || "Failed to delete");
		},
	});

	const handleDownload = async (record: Record) => {
		try {
			const blob = await recordsApi.download(record.id);
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = record.fileName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to download");
		}
	};

	const handleShare = (record: Record) => {
		setSelectedRecord(record);
		setShareDialogOpen(true);
	};

	const handleDelete = (record: Record) => {
		setSelectedRecord(record);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (!selectedRecord) return;
		deleteMutation.mutate(selectedRecord.id);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
					<p className="mt-4 text-muted-foreground">Loading records...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
						My Medical Records
					</h1>
					<p className="text-muted-foreground text-lg">
						Your files are encrypted, verified, and protected by blockchain
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Link href="/dashboard/audit">
						<Button variant="outline">
							<Shield className="h-4 w-4 mr-2" />
							Audit History
						</Button>
					</Link>
					<Button 
						onClick={() => (window.location.href = "/dashboard/upload")}
						className="shadow-md"
					>
						<Plus className="h-4 w-4 mr-2" />
						Upload New
					</Button>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid md:grid-cols-3 gap-4">
				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-1">Total Records</p>
								<p className="text-3xl font-bold">{allRecords.length}</p>
							</div>
							<div className="bg-blue-100 p-3 rounded-xl">
								<FileText className="h-6 w-6 text-blue-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-1">Security Status</p>
								<p className="text-xl font-bold text-green-600">All Verified</p>
							</div>
							<div className="bg-green-100 p-3 rounded-xl">
								<Lock className="h-6 w-6 text-green-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-1">Blockchain Network</p>
								<p className="text-xl font-bold text-purple-600">Hedera Testnet</p>
							</div>
							<div className="bg-purple-100 p-3 rounded-xl">
								<Shield className="h-6 w-6 text-purple-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{error && (
				<Alert variant="destructive">
					<AlertDescription>
						{error instanceof Error ? error.message : "An error occurred"}
					</AlertDescription>
				</Alert>
			)}

			{/* Search and Filters */}
			<div className="flex flex-col md:flex-row gap-4 items-center bg-gray-50 p-4 rounded-2xl border">
				<div className="relative flex-1 w-full">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
					<Input
						placeholder="Search by title or filename..."
						className="pl-10 bg-white border-gray-200 focus:ring-blue-500"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
					{searchQuery && (
						<button 
							onClick={() => setSearchQuery("")}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							<X className="h-4 w-4" />
						</button>
					)}
				</div>
				<div className="flex items-center gap-3 w-full md:w-auto">
					<Filter className="h-4 w-4 text-gray-400 hidden md:block" />
					<Select value={typeFilter} onValueChange={setTypeFilter}>
						<SelectTrigger className="w-full md:w-[180px] bg-white border-gray-200">
							<SelectValue placeholder="Document Type" />
						</SelectTrigger>
						<SelectContent>
							{DOCUMENT_TYPES.map((type) => (
								<SelectItem key={type.value} value={type.value}>
									{type.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{/* Records List */}
			{allRecords.length === 0 ? (
				<Card className="border-2 border-dashed">
					<CardContent className="flex flex-col items-center justify-center py-16">
						<div className="bg-blue-100 p-6 rounded-full mb-6">
							<FileText className="h-12 w-12 text-blue-600" />
						</div>
						<h3 className="text-2xl font-bold mb-2">No records yet</h3>
						<p className="text-muted-foreground mb-6 text-center max-w-sm">
							Upload your first medical record to start protecting your health
							data with encryption and blockchain
						</p>
						<Button
							onClick={() => (window.location.href = "/dashboard/upload")}
							size="lg"
							className="shadow-lg"
						>
							<Plus className="h-5 w-5 mr-2" />
							Upload Your First Record
						</Button>
					</CardContent>
				</Card>
			) : filteredRecords.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed">
					<Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
					<h3 className="text-lg font-medium text-gray-900">No matching records</h3>
					<p className="text-gray-500">Try adjusting your search or filter criteria</p>
					<Button 
						variant="link" 
						className="mt-2 text-blue-600"
						onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}
					>
						Clear all filters
					</Button>
				</div>
			) : (
				<div className="grid gap-4">
					<div className="flex items-center justify-between">
						<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
							Showing {filteredRecords.length} of {allRecords.length} records
						</h2>
					</div>
					{filteredRecords.map((record) => (
						<Card
							key={record.id}
							className="border-2 hover:shadow-lg transition-all group overflow-hidden"
						>
							<CardContent className="p-0">
								<div className="flex items-stretch">
									{/* Color strip based on type */}
									<div className={cn(
										"w-1.5",
										record.documentType === "lab_result" ? "bg-red-500" :
										record.documentType === "prescription" ? "bg-green-500" :
										record.documentType === "imaging" ? "bg-purple-500" :
										"bg-blue-500"
									)} />
									
									<div className="flex-1 p-6">
										<div className="flex items-start justify-between gap-4">
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-3 mb-2">
													<div className="bg-blue-100 p-2 rounded-lg">
														<FileText className="h-5 w-5 text-blue-600" />
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="font-semibold text-lg truncate text-gray-900">
															{record.title || record.fileName}
														</h3>
														<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
															{record.documentType && (
																<Badge
																	variant="secondary"
																	className="text-[10px] uppercase font-bold tracking-tight"
																>
																	{record.documentType.replace("_", " ")}
																</Badge>
															)}
															{record.recordDate && (
																<span className="flex items-center gap-1">
																	<Clock className="h-3 w-3" />
																	{new Date(record.recordDate).toLocaleDateString()}
																</span>
															)}
															{record.doctorName && (
																<span>· Dr. {record.doctorName}</span>
															)}
														</div>
														<div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-2">
															<span>{formatFileSize(record.fileSize)}</span>
															<span>·</span>
															<span>Uploaded {formatDistanceToNow(new Date(record.uploadedAt))} ago</span>
															<span>·</span>
															<Badge
																variant="outline"
																className="flex items-center gap-1 text-[10px] border-green-200 bg-green-50 text-green-700"
															>
																<CheckCircle2 className="h-3 w-3" />
																Blockchain Verified
															</Badge>
														</div>
													</div>
												</div>

												{record.notes && (
													<p className="text-xs text-gray-500 mt-3 line-clamp-1 italic bg-gray-50 p-2 rounded-md border border-gray-100">
														"{record.notes}"
													</p>
												)}

												<div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-[10px]">
													<div className="flex items-center gap-1.5 text-muted-foreground">
														<span className="font-medium text-gray-400">FILE HASH:</span>
														<code className="bg-gray-50 px-2 py-0.5 rounded border">
															{record.fileHash.substring(0, 24)}...
														</code>
													</div>
													{record.hederaTransactionId && (
														<a
															href={`https://hashscan.io/testnet/transaction/${formatHederaTxId(record.hederaTransactionId)}`}
															target="_blank"
															rel="noopener noreferrer"
															className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold"
														>
															<Shield className="h-3 w-3" />
															HEDERA PROOF
															<ExternalLink className="h-3 w-3" />
														</a>
													)}
												</div>
											</div>

											<div className="flex flex-col gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDownload(record)}
													className="hover:bg-blue-50 hover:text-blue-600 border-gray-200"
												>
													<Download className="h-4 w-4 mr-2" />
													Download
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleShare(record)}
													className="hover:bg-purple-50 hover:text-purple-600 border-gray-200"
												>
													<Share2 className="h-4 w-4 mr-2" />
													Share Securely
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => handleDelete(record)}
													className="hover:bg-red-50 hover:text-red-600 border-gray-200"
													disabled={
														deleteMutation.isPending &&
														selectedRecord?.id === record.id
													}
												>
													<Trash2 className="h-4 w-4 mr-2" />
													Delete
												</Button>
											</div>
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{selectedRecord && (
				<>
					<ShareDialog
						open={shareDialogOpen}
						onOpenChange={setShareDialogOpen}
						record={selectedRecord}
					/>
					<DeleteDialog
						open={deleteDialogOpen}
						onOpenChange={setDeleteDialogOpen}
						record={selectedRecord}
						onConfirm={handleDeleteConfirm}
					/>
				</>
			)}
		</div>
	);
}
