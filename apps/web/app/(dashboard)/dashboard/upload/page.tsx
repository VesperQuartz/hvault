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
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { recordsApi } from "@/lib/api";
import { revalidateAudit, revalidateRecords } from "@/app/actions";

const DOCUMENT_TYPES = [
	{ value: "lab_result", label: "Lab Result" },
	{ value: "prescription", label: "Prescription" },
	{ value: "imaging", label: "Imaging / Scan" },
	{ value: "vaccination", label: "Vaccination Record" },
	{ value: "report", label: "Doctor's Report" },
	{ value: "other", label: "Other" },
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
		// Auto-fill title from filename (strip extension)
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

			setProgress(0);
			const timer = setInterval(() => {
				setProgress((p) => (p >= 85 ? p : p + 8));
			}, 300);

			try {
				const formData = new FormData();
				formData.append("file", file);
				if (value.title) formData.append("title", value.title);
				if (value.documentType)
					formData.append("documentType", value.documentType);
				if (value.notes) formData.append("notes", value.notes);

				const res = await recordsApi.upload(file, formData);
				
				// Revalidate records and audit cache
				await revalidateRecords();
				await revalidateAudit();

				clearInterval(timer);
				setProgress(100);
				setUploaded({
					fileName: res.record.fileName,
					hederaTransactionId: res.record.hederaTransactionId,
				});
			} catch (err) {
				clearInterval(timer);
				setProgress(0);
				throw err;
			}
		},
	});

	// ─── Success State ──────────────────────────────────────────────────────────
	if (uploaded) {
		return (
			<div className="max-w-lg mx-auto pt-10">
				<div className="rounded-xl border bg-white p-8 text-center space-y-4">
					<CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
					<div>
						<p className="font-semibold text-lg">{uploaded.fileName}</p>
						<p className="text-sm text-muted-foreground mt-1">
							Encrypted and stored securely
						</p>
					</div>
					{uploaded.hederaTransactionId && (
						<a
							href={`https://hashscan.io/testnet/transaction/${uploaded.hederaTransactionId}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
						>
							View Hedera proof
							<ExternalLink className="h-3.5 w-3.5" />
						</a>
					)}
					<div className="flex gap-3 pt-2">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => {
								setFile(null);
								setUploaded(null);
								setProgress(0);
								form.reset();
							}}
						>
							Upload another
						</Button>
						<Button
							className="flex-1"
							onClick={() => router.push("/dashboard")}
						>
							View records
						</Button>
					</div>
				</div>
			</div>
		);
	}

	// ─── Upload Form ────────────────────────────────────────────────────────────
	return (
		<div className="max-w-2xl mx-auto space-y-6 pt-4">
			{/* Back link + title */}
			<div>
				<Link
					href="/dashboard"
					className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to records
				</Link>
				<h1 className="text-2xl font-semibold text-gray-900">
					Upload a record
				</h1>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					if (!file) {
						setFileError("Please select a file first.");
						return;
					}
					form.handleSubmit();
				}}
				className="space-y-6"
			>
				{/* ── File Drop Zone ─────────────────────────────────── */}
				<div className="space-y-2">
					<Label className="text-sm font-medium text-gray-900">File</Label>
					<div
						onClick={() => !file && inputRef.current?.click()}
						onDragOver={(e) => {
							e.preventDefault();
							setDragOver(true);
						}}
						onDragLeave={() => setDragOver(false)}
						onDrop={(e) => {
							e.preventDefault();
							setDragOver(false);
							const f = e.dataTransfer.files[0];
							if (f) pickFile(f);
						}}
						className={cn(
							"rounded-lg border-2 border-dashed transition-colors",
							dragOver
								? "border-blue-500 bg-blue-50"
								: file
									? "border-gray-300 bg-white cursor-default"
									: "border-gray-300 hover:border-blue-400 cursor-pointer",
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
						/>

						{file ? (
							<div className="flex items-center gap-4 p-4">
								<div className="shrink-0 rounded-md border bg-gray-50 p-3">
									{file.type === "application/pdf" ? (
										<FileText className="h-6 w-6 text-red-500" />
									) : (
										<ImageIcon className="h-6 w-6 text-blue-500" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-gray-900 truncate">
										{file.name}
									</p>
									<p className="text-sm text-gray-500 mt-0.5">
										{formatFileSize(file.size)}
									</p>
								</div>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										setFile(null);
										setFileError("");
										form.setFieldValue("title", "");
									}}
									className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
								>
									<X className="h-4 w-4" />
								</button>
							</div>
						) : (
							<div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
								<Upload className="h-8 w-8 text-gray-400 mb-1" />
								<p className="text-sm font-medium text-gray-700">
									Drop a file here, or{" "}
									<span className="text-blue-600">click to browse</span>
								</p>
								<p className="text-sm text-gray-500">
									PDF, JPG, PNG — max 10 MB
								</p>
							</div>
						)}
					</div>
					{fileError && (
						<p className="text-sm text-red-600 flex items-center gap-1.5 font-medium">
							<AlertCircle className="h-4 w-4" />
							{fileError}
						</p>
					)}
				</div>

				<Separator />

				{/* ── Document Information ───────────────────────────── */}
				<div className="space-y-5">
					<div>
						<h2 className="text-base font-semibold text-gray-900">
							Document details
						</h2>
						<p className="text-sm text-gray-500 mt-0.5">
							All fields are optional
						</p>
					</div>

					{/* Title */}
					<form.Field name="title">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor={field.name}
									className="text-sm font-medium text-gray-900"
								>
									Title
								</Label>
								<Input
									id={field.name}
									placeholder="e.g. Blood Test Results – March 2025"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									className="text-gray-900 placeholder:text-gray-400"
								/>
							</div>
						)}
					</form.Field>

					{/* Type */}
					<form.Field name="documentType">
						{(field) => (
							<div className="space-y-1.5">
								<Label className="text-sm font-medium text-gray-900">
									Document type
								</Label>
								<Select
									value={field.state.value}
									onValueChange={(v) => field.handleChange(v)}
								>
									<SelectTrigger className="text-gray-900">
										<SelectValue placeholder="Select a type" />
									</SelectTrigger>
									<SelectContent>
										{DOCUMENT_TYPES.map((t) => (
											<SelectItem key={t.value} value={t.value}>
												{t.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</form.Field>

					{/* Notes */}
					<form.Field name="notes">
						{(field) => (
							<div className="space-y-1.5">
								<Label
									htmlFor={field.name}
									className="text-sm font-medium text-gray-900"
								>
									Notes
								</Label>
								<Textarea
									id={field.name}
									placeholder="Any additional context about this document…"
									rows={3}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									className="resize-none text-gray-900 placeholder:text-gray-400"
								/>
							</div>
						)}
					</form.Field>
				</div>

				{/* ── Progress ───────────────────────────────────────── */}
				{form.state.isSubmitting && (
					<div className="space-y-2">
						<div className="flex justify-between text-sm font-medium text-gray-700">
							<span>Encrypting and uploading…</span>
							<span>{progress}%</span>
						</div>
						<Progress value={progress} className="h-2" />
					</div>
				)}

				{/* ── Submit ─────────────────────────────────────────── */}
				<form.Subscribe selector={(s) => [s.isSubmitting]}>
					{([isSubmitting]) => (
						<Button
							type="submit"
							className="w-full"
							size="lg"
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<>
									<div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-2" />
									Uploading…
								</>
							) : (
								"Upload & Encrypt"
							)}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
