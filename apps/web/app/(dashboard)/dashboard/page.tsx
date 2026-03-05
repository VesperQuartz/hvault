"use client";

import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { Badge } from "@hvault/ui/components/badge";
import { Button } from "@hvault/ui/components/button";
import { Card, CardContent } from "@hvault/ui/components/card";
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
} from "lucide-react";
import { useState } from "react";
import DeleteDialog from "@/components/delete-dialog";
import ShareDialog from "@/components/share-dialog";
import { queryKeys, recordsApi } from "@/lib/api";

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

export default function DashboardPage() {
	const queryClient = useQueryClient();
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);

	// Fetch records using TanStack Query
	const { data, isLoading, error } = useQuery({
		queryKey: queryKeys.records.list(),
		queryFn: () => recordsApi.list(),
	});

	const records = data?.records ?? [];

	// Delete mutation
	const deleteMutation = useMutation({
		mutationFn: (id: string) => recordsApi.delete(id),
		onSuccess: () => {
			// Invalidate and refetch
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
			<div>
				<h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
					My Medical Records
				</h1>
				<p className="text-muted-foreground text-lg">
					Your files are encrypted, verified, and protected by blockchain
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid md:grid-cols-4 gap-4">
				<Card className="border-2 hover:shadow-lg transition-shadow">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-muted-foreground mb-1">
									Total Records
								</p>
								<p className="text-3xl font-bold">{records.length}</p>
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
								<p className="text-sm font-medium text-muted-foreground mb-1">
									Encrypted
								</p>
								<p className="text-3xl font-bold">{records.length}</p>
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
								<p className="text-sm font-medium text-muted-foreground mb-1">
									Verified
								</p>
								<p className="text-3xl font-bold">{records.length}</p>
							</div>
							<div className="bg-purple-100 p-3 rounded-xl">
								<Shield className="h-6 w-6 text-purple-600" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-2 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm font-medium text-blue-100 mb-1">
									Upload New
								</p>
								<Button
									onClick={() => (window.location.href = "/dashboard/upload")}
									variant="secondary"
									size="sm"
									className="mt-2"
								>
									<Plus className="h-4 w-4 mr-1" />
									Add File
								</Button>
							</div>
							<Upload className="h-8 w-8 text-blue-200" />
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

			{/* Records List */}
			{records.length === 0 ? (
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
			) : (
				<div>
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-2xl font-semibold">
							All Records ({records.length})
						</h2>
						<Button
							onClick={() => (window.location.href = "/dashboard/upload")}
							size="sm"
						>
							<Plus className="h-4 w-4 mr-2" />
							Upload New
						</Button>
					</div>

					<div className="grid gap-4">
						{records.map((record) => (
							<Card
								key={record.id}
								className="border-2 hover:shadow-lg transition-all group"
							>
								<CardContent className="p-6">
									<div className="flex items-start justify-between gap-4">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-3 mb-2">
												<div className="bg-blue-100 p-2 rounded-lg">
													<FileText className="h-5 w-5 text-blue-600" />
												</div>
												<div className="flex-1 min-w-0">
													<h3 className="font-semibold text-base truncate">
														{record.title || record.fileName}
													</h3>
													<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-1">
														{record.documentType && (
															<Badge
																variant="secondary"
																className="text-xs capitalize"
															>
																{record.documentType.replace("_", " ")}
															</Badge>
														)}
														{record.recordDate && (
															<span>
																{new Date(
																	record.recordDate,
																).toLocaleDateString()}
															</span>
														)}
														{record.doctorName && (
															<span>· {record.doctorName}</span>
														)}
														{record.hospitalName && (
															<span>· {record.hospitalName}</span>
														)}
													</div>
													<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
														<span className="flex items-center gap-1">
															<Clock className="h-3 w-3" />
															{formatDistanceToNow(new Date(record.uploadedAt))}{" "}
															ago
														</span>
														<span>·</span>
														<span>{formatFileSize(record.fileSize)}</span>
														<span>·</span>
														<Badge
															variant="outline"
															className="flex items-center gap-1 text-xs"
														>
															<CheckCircle2 className="h-3 w-3 text-green-600" />
															Verified
														</Badge>
													</div>
												</div>
											</div>

											{record.notes && (
												<p className="text-xs text-muted-foreground mt-2 line-clamp-1">
													{record.notes}
												</p>
											)}

											<div className="flex items-center gap-4 mt-3 text-xs">
												<div className="flex items-center gap-1.5 text-muted-foreground">
													<span className="font-medium">Hash:</span>
													<code className="bg-gray-100 px-2 py-0.5 rounded">
														{record.fileHash.substring(0, 16)}...
													</code>
												</div>
												{record.hederaTransactionId && (
													<a
														href={`https://hashscan.io/testnet/transaction/${record.hederaTransactionId}`}
														target="_blank"
														rel="noopener noreferrer"
														className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
													>
														<Shield className="h-3 w-3" />
														Hedera Proof
														<ExternalLink className="h-3 w-3" />
													</a>
												)}
											</div>
										</div>

										<div className="flex items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDownload(record)}
												className="hover:bg-blue-50"
											>
												<Download className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleShare(record)}
												className="hover:bg-purple-50"
											>
												<Share2 className="h-4 w-4" />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => handleDelete(record)}
												className="hover:bg-red-50 hover:text-red-600"
												disabled={
													deleteMutation.isPending &&
													selectedRecord?.id === record.id
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
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
