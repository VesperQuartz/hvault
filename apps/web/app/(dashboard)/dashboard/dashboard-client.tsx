"use client";

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
	SelectValue,
} from "@hvault/ui/components/select";
import { cn } from "@hvault/ui/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
	CheckCircle2,
	Clock,
	Download,
	ExternalLink,
	FileText,
	Filter,
	Lock,
	Plus,
	Search,
	Share2,
	Shield,
	Trash2,
	Upload,
	X,
	FilePieChart,
	Activity,
	Database,
	MoreVertical,
	Calendar
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import DeleteDialog from "@/components/delete-dialog";
import ShareDialog from "@/components/share-dialog";
import ManageLinksDialog from "@/components/manage-links-dialog";
import { formatHederaTxId, queryKeys, recordsApi } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@hvault/ui/components/dropdown-menu";
import Image from "next/image";

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
	totalAccessCount?: number;
}

const DOCUMENT_TYPES = [
	{ value: "all", label: "All Records" },
	{ value: "lab_result", label: "Laboratory" },
	{ value: "prescription", label: "Pharmacy" },
	{ value: "imaging", label: "Radiology" },
	{ value: "vaccination", label: "Immunization" },
	{ value: "report", label: "Consultation" },
	{ value: "other", label: "Miscellaneous" },
];

export default function DashboardClient({
	initialRecords,
}: {
	initialRecords: Record[];
}) {
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const [shareDialogOpen, setShareDialogOpen] = useState(false);
	const [manageLinksDialogOpen, setManageLinksDialogOpen] = useState(false);
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

	const allRecords = useMemo(() => {
		const records = (data?.records as Record[]) ?? [];
		return records;
	}, [data.records]);

	// Filtered records
	const filteredRecords = useMemo(() => {
		return allRecords.filter((record) => {
			const matchesSearch = (record.title || record.fileName)
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchesType =
				typeFilter === "all" || record.documentType === typeFilter;
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

	const handleManageLinks = (record: Record) => {
		setSelectedRecord(record);
		setManageLinksDialogOpen(true);
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
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-24">
				<div className="text-center">
					<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
					<p className="mt-4 text-slate-500 font-medium">Synchronizing with blockchain...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-10 animate-in fade-in duration-500">
			{/* Hero / Greeting */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div className="space-y-1">
					<h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
						Welcome back, {session?.user?.name?.split(" ")[0] || "Patient"}
					</h1>
					<p className="text-slate-500 text-sm flex items-center">
						<Shield className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
						All records are currently encrypted and verified.
					</p>
				</div>
				
				<div className="flex items-center p-1 bg-white border rounded-2xl shadow-sm">
					<div className="flex items-center gap-2 px-4 py-2 border-r">
						<div className="h-2 w-2 rounded-full bg-green-500" />
						<span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live</span>
					</div>
					<div className="px-4 py-2">
						<span className="text-xs font-medium text-slate-500">Last updated: Just now</span>
					</div>
				</div>
			</div>

			{/* Top Metrics */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<MetricCard 
					title="Total Records" 
					value={allRecords.length.toString()} 
					subtitle="Encrypted in Vault"
					icon={<FilePieChart className="h-5 w-5 text-blue-600" />}
					trend="neutral"
				/>
				<MetricCard 
					title="Link Views" 
					value={allRecords.reduce((acc, r) => acc + (r.totalAccessCount || 0), 0).toString()} 
					subtitle="Total External Views"
					icon={<Activity className="h-5 w-5 text-indigo-600" />}
					trend="neutral"
				/>
				<MetricCard 
					title="Storage Used" 
					value={formatFileSize(allRecords.reduce((acc, r) => acc + r.fileSize, 0))} 
					subtitle="Cloudflare R2 Storage"
					icon={<Database className="h-5 w-5 text-slate-600" />}
					trend="neutral"
				/>
			</div>

			{/* Search and Filters Section */}
			<div className="space-y-6">
				<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
					<div className="flex items-center gap-2">
						<h2 className="text-lg font-bold text-slate-900">Medical Repository</h2>
						<Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold">
							{filteredRecords.length} Files
						</Badge>
					</div>
					
					<div className="flex items-center gap-3 w-full md:w-auto">
						<div className="relative group flex-1 md:w-64">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
							<Input
								placeholder="Quick search..."
								className="pl-10 bg-white border-slate-200 focus:ring-blue-500 rounded-xl h-10 shadow-sm"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
						<Select value={typeFilter} onValueChange={setTypeFilter}>
							<SelectTrigger className="w-[160px] bg-white border-slate-200 rounded-xl h-10 shadow-sm">
								<div className="flex items-center gap-2">
									<Filter className="h-3.5 w-3.5 text-slate-400" />
									<SelectValue placeholder="All Types" />
								</div>
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

				{/* Records View */}
				{allRecords.length === 0 ? (
					<div className="bg-white border border-dashed rounded-3xl p-20 text-center space-y-6 shadow-sm">
						<div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto">
							<Upload className="h-10 w-10 text-blue-600" />
						</div>
						<div className="space-y-2">
							<h3 className="text-xl font-bold text-slate-900">Your vault is empty</h3>
							<p className="text-slate-500 max-w-xs mx-auto">
								Start securing your health data by uploading your first medical record.
							</p>
						</div>
						<Link href="/dashboard/upload">
							<Button className="rounded-full px-8 h-12 shadow-blue-200 shadow-xl">
								Upload First Document
							</Button>
						</Link>
					</div>
				) : filteredRecords.length === 0 ? (
					<div className="bg-white border rounded-3xl p-20 text-center space-y-4 shadow-sm">
						<div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
							<Search className="h-8 w-8 text-slate-300" />
						</div>
						<h3 className="text-lg font-bold text-slate-900">No matches found</h3>
						<p className="text-slate-500">Try refining your search terms or filters.</p>
						<Button variant="link" className="text-blue-600 font-bold" onClick={() => { setSearchQuery(""); setTypeFilter("all"); }}>
							Clear all filters
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
						{filteredRecords.map((record) => (
							<RecordCard 
								key={record.id}
								record={record}
								onDownload={() => handleDownload(record)}
								onShare={() => handleShare(record)}
								onManageLinks={() => handleManageLinks(record)}
								onDelete={() => handleDelete(record)}
								isDeleting={deleteMutation.isPending && selectedRecord?.id === record.id}
							/>
						))}
					</div>
				)}
			</div>

			{selectedRecord && (
				<>
					<ShareDialog
						open={shareDialogOpen}
						onOpenChange={setShareDialogOpen}
						record={selectedRecord}
					/>
					<ManageLinksDialog
						open={manageLinksDialogOpen}
						onOpenChange={setManageLinksDialogOpen}
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

function MetricCard({ title, value, subtitle, icon, trend }: { title: string, value: string, subtitle: string, icon: React.ReactNode, trend: 'up' | 'down' | 'neutral' }) {
	return (
		<div className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
			<div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
				{icon}
			</div>
			<div className="space-y-4">
				<div className="flex items-center gap-3">
					<div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 transition-colors group-hover:bg-white group-hover:border-blue-100">
						{icon}
					</div>
					<span className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</span>
				</div>
				<div>
					<div className="text-3xl font-extrabold text-slate-900">{value}</div>
					<div className="flex items-center gap-1.5 mt-1">
						{trend === 'up' && <div className="h-1.5 w-1.5 rounded-full bg-green-500" />}
						<span className="text-xs font-medium text-slate-400">{subtitle}</span>
					</div>
				</div>
			</div>
		</div>
	);
}

function RecordCard({ 
	record, 
	onDownload, 
	onShare, 
	onManageLinks, 
	onDelete,
	isDeleting 
}: { 
	record: Record, 
	onDownload: () => void, 
	onShare: () => void, 
	onManageLinks: () => void, 
	onDelete: () => void,
	isDeleting: boolean
}) {
	const typeStyles = {
		lab_result: "border-red-100 bg-red-50 text-red-700 icon-bg-red-100",
		prescription: "border-green-100 bg-green-50 text-green-700 icon-bg-green-100",
		imaging: "border-purple-100 bg-purple-50 text-purple-700 icon-bg-purple-100",
		vaccination: "border-orange-100 bg-orange-50 text-orange-700 icon-bg-orange-100",
		report: "border-blue-100 bg-blue-50 text-blue-700 icon-bg-blue-100",
		other: "border-slate-100 bg-slate-50 text-slate-700 icon-bg-slate-100"
	};

	const currentStyle = typeStyles[record.documentType as keyof typeof typeStyles] || typeStyles.other;

	return (
		<div className="bg-white rounded-[32px] border p-6 flex flex-col h-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative">
			{/* Badge / Type */}
			<div className="flex items-start justify-between mb-6">
				<Badge className={cn("px-3 py-1 rounded-full border border-transparent font-bold text-[10px] uppercase tracking-wider shadow-none", currentStyle)}>
					{record.documentType?.replace("_", " ") || "Record"}
				</Badge>
				
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100">
							<MoreVertical className="h-4 w-4 text-slate-400" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
						<DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">Actions</DropdownMenuLabel>
						<DropdownMenuItem onClick={onDownload} className="rounded-xl flex items-center gap-2 cursor-pointer">
							<Download className="h-4 w-4 text-slate-400" />
							<span>Download File</span>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={onShare} className="rounded-xl flex items-center gap-2 cursor-pointer">
							<Share2 className="h-4 w-4 text-slate-400" />
							<span>Share Securely</span>
						</DropdownMenuItem>
						{record.shareLinkCount && record.shareLinkCount > 0 ? (
							<DropdownMenuItem onClick={onManageLinks} className="rounded-xl flex items-center gap-2 cursor-pointer">
								<ExternalLink className="h-4 w-4 text-orange-400" />
								<span>Manage Links ({record.shareLinkCount})</span>
							</DropdownMenuItem>
						) : null}
						<DropdownMenuSeparator className="my-1" />
						<DropdownMenuItem onClick={onDelete} className="rounded-xl flex items-center gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
							<Trash2 className="h-4 w-4" />
							<span>Delete Record</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Main Content */}
			<div className="flex-1 space-y-4">
				<div className="space-y-1">
					<h3 className="font-bold text-lg text-slate-900 leading-tight group-hover:text-blue-600 transition-colors line-clamp-2">
						{record.title || record.fileName}
					</h3>
					<div className="flex items-center text-[11px] font-medium text-slate-400 gap-3 uppercase tracking-widest">
						<span className="flex items-center gap-1">
							<Calendar className="h-3 w-3" />
							{record.recordDate ? new Date(record.recordDate).toLocaleDateString() : formatDistanceToNow(new Date(record.uploadedAt)) + " ago"}
						</span>
						<span>•</span>
						<span>{Math.round(record.fileSize / 1024)} KB</span>
					</div>
				</div>

				{record.notes && (
					<p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-3 rounded-2xl border border-slate-100/50">
						{record.notes}
					</p>
				)}
			</div>

			{/* Footer / Blockchain Proof */}
			<div className="mt-8 pt-6 border-t flex items-center justify-between">
				<div className="flex items-center gap-2">
					<div className="bg-green-100 p-1 rounded-full">
						<CheckCircle2 className="h-3 w-3 text-green-600" />
					</div>
					<span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verified Integrity</span>
				</div>
				
				{record.hederaTransactionId && (
					<a 
						href={`https://hashscan.io/testnet/transaction/${formatHederaTxId(record.hederaTransactionId)}`}
						target="_blank"
						rel="noopener noreferrer"
						className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
						title="View Hedera Proof"
					>
							<Image 
						src="/logo.png" 
						alt="MediVault Logo" 
						width={15} 
						height={15} 
						className="rounded-full"
					/>
					</a>
				)}
			</div>
		</div>
	);
}
