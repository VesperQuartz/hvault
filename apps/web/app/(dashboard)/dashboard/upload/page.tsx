"use client";

import { Button } from "@hvault/ui/components/button";
import { Input } from "@hvault/ui/components/input";
import { Label } from "@hvault/ui/components/label";
import { Progress } from "@hvault/ui/components/progress";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@hvault/ui/components/select";
import { Separator } from "@hvault/ui/components/separator";
import { Textarea } from "@hvault/ui/components/textarea";
import { cn } from "@hvault/ui/lib/utils";
import { useForm } from "@tanstack/react-form";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle2,
	ExternalLink,
	FileText,
	ImageIcon,
	Upload,
	X,
	Shield,
	Lock,
	Zap,
	FileSearch,
	Info,
	Fingerprint
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { recordsApi } from "@/lib/api";
import { revalidateAudit, revalidateRecords } from "@/app/actions";
import { Badge } from "@hvault/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@hvault/ui/components/card";

const DOCUMENT_TYPES = [
	{ value: "lab_result", label: "Laboratory Result" },
	{ value: "prescription", label: "Pharmacy Prescription" },
	{ value: "imaging", label: "Radiology Scan" },
	{ value: "vaccination", label: "Immunization Record" },
	{ value: "report", label: "Consultation Report" },
	{ value: "other", label: "Miscellaneous Document" },
] as const;

function formatFileSize(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPage() {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);

	const [file, setFile] = useState<File | null>(null);
	const [dragOver, setDragOver] = useState(false);
	const [fileError, setFileError] = useState("");
	const [progress, setProgress] = useState(0);
	const [isProcessing, setIsProcessing] = useState(false);
	const [uploaded, setUploaded] = useState<{
		fileName: string;
		hederaTransactionId: string;
	} | null>(null);

	const validate = (f: File) => {
		const allowed = ["application/pdf", "image/jpeg", "image/png"];
		if (!allowed.includes(f.type))
			return "Only PDF, JPG, and PNG files are supported.";
		if (f.size > 10 * 1024 * 1024) return "File must be smaller than 10 MB.";
		return null;
	};

	const pickFile = (f: File) => {
		const err = validate(f);
		if (err) {
			setFileError(err);
			return;
		}
		setFileError("");
		setFile(f);
		const nameWithoutExt = f.name.replace(/\.[^/.]+$/, "");
		form.setFieldValue("title", nameWithoutExt);
	};

	const form = useForm({
		defaultValues: {
			title: "",
			documentType: "" as string,
			notes: "",
		},
		onSubmit: async ({ value }) => {
			if (!file) return;

			setIsProcessing(true);
			setProgress(0);
			const timer = setInterval(() => {
				setProgress((p) => (p >= 92 ? p : p + 4));
			}, 200);

			try {
				const formData = new FormData();
				formData.append("file", file);
				if (value.title) formData.append("title", value.title);
				if (value.documentType)
					formData.append("documentType", value.documentType);
				if (value.notes) formData.append("notes", value.notes);

				const res = await recordsApi.upload(file, formData);
				
				await revalidateRecords();
				await revalidateAudit();

				clearInterval(timer);
				setProgress(100);
				setTimeout(() => {
					setUploaded({
						fileName: res.record.fileName,
						hederaTransactionId: res.record.hederaTransactionId,
					});
					setIsProcessing(false);
				}, 500);
			} catch (err) {
				clearInterval(timer);
				setProgress(0);
				setIsProcessing(false);
				throw err;
			}
		},
	});

	if (uploaded) {
		return (
			<div className="max-w-2xl mx-auto pt-12 animate-in fade-in zoom-in-95 duration-500">
				<div className="bg-white rounded-[40px] border shadow-2xl p-12 text-center space-y-8 relative overflow-hidden">
					<div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
					<div className="bg-green-50 w-24 h-24 rounded-[32px] flex items-center justify-center mx-auto shadow-sm border border-green-100">
						<CheckCircle2 className="h-12 w-12 text-green-500" />
					</div>
					
					<div className="space-y-2">
						<h2 className="text-3xl font-black text-slate-900 tracking-tight">Encryption Complete</h2>
						<p className="text-slate-500 font-medium">
							<span className="text-slate-900 font-bold">{uploaded.fileName}</span> is now secured and fingerprinted.
						</p>
					</div>

					<div className="bg-slate-50 rounded-3xl p-6 border flex flex-col items-center gap-4">
						<div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
							<Shield className="h-3 w-3" />
							Blockchain Receipt
						</div>
						<code className="text-xs font-mono text-slate-400 break-all bg-white px-4 py-2 rounded-xl border w-full">
							{uploaded.hederaTransactionId}
						</code>
						<a
							href={`https://hashscan.io/testnet/transaction/${uploaded.hederaTransactionId}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
						>
							Verify on HashScan
							<ExternalLink className="h-4 w-4" />
						</a>
					</div>

					<div className="flex gap-4 pt-4">
						<Button
							variant="outline"
							className="flex-1 h-14 rounded-2xl font-bold border-2"
							onClick={() => {
								setFile(null);
								setUploaded(null);
								setProgress(0);
								form.reset();
							}}
						>
							Upload Another
						</Button>
						<Button
							className="flex-1 h-14 rounded-2xl font-bold bg-blue-600 hover:bg-blue-700 shadow-blue-200 shadow-xl"
							onClick={() => {
								router.refresh();
								router.push("/dashboard");
							}}
						>
							Go to Vault
						</Button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-10 pt-4 animate-in fade-in duration-500">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
				<div className="space-y-2">
					<Link href="/dashboard" className="inline-flex items-center text-xs font-bold text-slate-400 uppercase tracking-[0.2em] hover:text-blue-600 transition-colors mb-2 group">
						<ArrowLeft className="h-3 w-3 mr-2 group-hover:-translate-x-1 transition-transform" />
						Back to Vault
					</Link>
					<h1 className="text-4xl font-black tracking-tighter text-slate-900">
						Secure Deposit
					</h1>
					<p className="text-slate-500 font-medium">
						Add a new medical record to your private, encrypted locker.
					</p>
				</div>
				
				<div className="hidden lg:flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-4 py-2 rounded-2xl border shadow-sm">
					<div className="flex items-center gap-1.5 border-r pr-4">
						<Lock className="h-3 w-3 text-blue-500" />
						KMS Active
					</div>
					<div className="flex items-center gap-1.5">
						<Zap className="h-3 w-3 text-yellow-500" />
						HCS Ready
					</div>
				</div>
			</div>

			<div className="grid lg:grid-cols-5 gap-10">
				{/* Main Form */}
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						if (!file) {
							setFileError("No file selected.");
							return;
						}
						form.handleSubmit();
					}}
					className="lg:col-span-3 space-y-8"
				>
					{/* Drop Zone */}
					<div className="space-y-3">
						<div className="flex items-center justify-between">
							<Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">File Selection</Label>
							{file && <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none font-bold text-[10px]">{formatFileSize(file.size)}</Badge>}
						</div>
						
						<div
							onClick={() => !file && !isProcessing && inputRef.current?.click()}
							onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
							onDragLeave={() => setDragOver(false)}
							onDrop={(e) => {
								e.preventDefault();
								setDragOver(false);
								const f = e.dataTransfer.files[0];
								if (f) pickFile(f);
							}}
							className={cn(
								"relative rounded-[32px] border-2 border-dashed transition-all duration-300 min-h-[240px] flex items-center justify-center overflow-hidden",
								dragOver
									? "border-blue-500 bg-blue-50/50 scale-[0.99]"
									: file
										? "border-slate-200 bg-white"
										: "border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 cursor-pointer",
								isProcessing && "opacity-50 cursor-wait"
							)}
						>
							<input
								ref={inputRef}
								type="file"
								accept=".pdf,.jpg,.jpeg,.png"
								className="sr-only"
								onChange={(e) => {
									const f = e.target.files?.[0];
									if (f) pickFile(f);
								}}
								disabled={isProcessing}
							/>

							{file ? (
								<div className="w-full p-8 flex flex-col items-center text-center space-y-4 animate-in fade-in zoom-in-95">
									<div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center border shadow-sm relative group">
										{file.type === "application/pdf" ? (
											<FileText className="h-10 w-10 text-rose-500" />
										) : (
											<ImageIcon className="h-10 w-10 text-blue-500" />
										)}
										<button
											type="button"
											onClick={(e) => {
												e.stopPropagation();
												setFile(null);
												setFileError("");
												form.setFieldValue("title", "");
											}}
											className="absolute -top-2 -right-2 bg-white rounded-full p-1.5 border shadow-md hover:text-red-600 transition-colors"
										>
											<X className="h-3 w-3" />
										</button>
									</div>
									<div className="space-y-1">
										<p className="font-bold text-slate-900 truncate max-w-[240px]">{file.name}</p>
										<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ready for encryption</p>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center gap-4 py-12 text-center px-6">
									<div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border shadow-sm group-hover:scale-110 transition-transform">
										<Upload className="h-8 w-8 text-slate-400" />
									</div>
									<div className="space-y-1">
										<p className="text-sm font-bold text-slate-900">Drop your file here</p>
										<p className="text-xs text-slate-400 font-medium">PDF, JPG or PNG up to 10MB</p>
									</div>
									<Button type="button" variant="outline" className="rounded-xl h-9 text-xs font-bold px-6">Browse Files</Button>
								</div>
							)}
						</div>
						{fileError && (
							<p className="text-xs text-rose-600 flex items-center gap-1.5 font-bold px-1 py-1">
								<AlertCircle className="h-3.5 w-3.5" />
								{fileError}
							</p>
						)}
					</div>

					{/* Progress Overlay */}
					{isProcessing && (
						<div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
							<div className="flex justify-between items-end px-1">
								<div className="space-y-1">
									<div className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest">
										<Lock className="h-3 w-3 animate-pulse" />
										Applying AES-256 Envelope
									</div>
									<p className="text-xs text-slate-500 font-medium">Securing document with AWS KMS...</p>
								</div>
								<span className="text-lg font-black text-slate-900 tracking-tighter">{progress}%</span>
							</div>
							<Progress value={progress} className="h-3 rounded-full bg-slate-100 border overflow-hidden" />
						</div>
					)}

					{/* Document Details */}
					<div className={cn("space-y-6 transition-opacity duration-500", isProcessing ? "opacity-20 pointer-events-none" : "opacity-100")}>
						<div className="grid md:grid-cols-2 gap-6">
							<form.Field name="title">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name} className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Document Title</Label>
										<Input
											id={field.name}
											placeholder="e.g. Health Summary"
											className="bg-white rounded-xl border-slate-200 h-11 font-medium"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="documentType">
								{(field) => (
									<div className="space-y-2">
										<Label className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Classification</Label>
										<Select
											value={field.state.value}
											onValueChange={(v) => field.handleChange(v)}
										>
											<SelectTrigger className="bg-white rounded-xl border-slate-200 h-11 font-medium">
												<SelectValue placeholder="Select type" />
											</SelectTrigger>
											<SelectContent className="rounded-xl">
												{DOCUMENT_TYPES.map((t) => (
													<SelectItem key={t.value} value={t.value} className="rounded-lg">
														{t.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="notes">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name} className="text-xs font-black uppercase tracking-widest text-slate-500 px-1">Confidential Notes</Label>
									<Textarea
										id={field.name}
										placeholder="Any context for this record..."
										rows={4}
										className="bg-white rounded-2xl border-slate-200 font-medium resize-none"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
								</div>
							)}
						</form.Field>

						<Button
							type="submit"
							className="w-full h-14 rounded-2xl font-black text-base shadow-blue-200 shadow-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
							disabled={!file || isProcessing}
						>
							Confirm & Secure Deposit
						</Button>
					</div>
				</form>

				{/* Sidebar / Info */}
				<div className="lg:col-span-2 space-y-6">
					<Card className="rounded-[32px] border-none bg-slate-900 text-white overflow-hidden relative shadow-2xl">
						<div className="absolute top-0 right-0 p-8 opacity-10">
							<Shield className="h-32 w-32" />
						</div>
						<CardHeader className="p-8 pb-4">
							<div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-white/10">
								<Info className="h-5 w-5 text-blue-400" />
							</div>
							<CardTitle className="text-xl font-bold tracking-tight">Security Protocol</CardTitle>
							<CardDescription className="text-slate-400 text-xs font-medium uppercase tracking-widest">Version 4.0 Standard</CardDescription>
						</CardHeader>
						<CardContent className="p-8 pt-0 space-y-6">
							<SecurityStep 
								icon={<Lock className="h-4 w-4 text-blue-400" />}
								title="Envelope Encryption"
								text="Each file is uniquely locked using an ephemeral AES-256 data key."
							/>
							<SecurityStep 
								icon={<Fingerprint className="h-4 w-4 text-blue-400" />}
								title="Public Consensus"
								text="Hash fragments are verified by 20+ Hedera mainnet nodes for immutability."
							/>
							<SecurityStep 
								icon={<FileSearch className="h-4 w-4 text-blue-400" />}
								title="Tamper Detection"
								text="Automated checks verify integrity every time the file is viewed."
							/>
						</CardContent>
					</Card>

					<div className="bg-blue-50/50 rounded-[32px] border border-blue-100 p-8 space-y-4">
						<h4 className="text-xs font-black uppercase tracking-widest text-blue-600">Privacy Notice</h4>
						<p className="text-sm text-slate-600 leading-relaxed font-medium">
							Your health data never leaves the encrypted state after leaving your browser. 
							Only you hold the identity keys required to initiate the decryption protocol.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

function SecurityStep({ icon, title, text }: { icon: React.ReactNode, title: string, text: string }) {
	return (
		<div className="flex gap-4">
			<div className="shrink-0 mt-1">{icon}</div>
			<div className="space-y-1">
				<h5 className="text-sm font-bold text-white">{title}</h5>
				<p className="text-xs text-slate-400 leading-relaxed font-medium">{text}</p>
			</div>
		</div>
	);
}
