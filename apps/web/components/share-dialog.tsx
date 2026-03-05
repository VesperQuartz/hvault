"use client";

import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { shareApi } from "@/lib/api";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@hvault/ui/components/dialog";
import { Button } from "@hvault/ui/components/button";
import { Label } from "@hvault/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@hvault/ui/components/select";
import { Input } from "@hvault/ui/components/input";
import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { Copy, Check, ExternalLink } from "lucide-react";

interface ShareDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	record: {
		id: string;
		fileName: string;
	};
}

export default function ShareDialog({ open, onOpenChange, record }: ShareDialogProps) {
	const [error, setError] = useState("");
	const [shareLink, setShareLink] = useState<{
		url: string;
		expiresAt: string;
	} | null>(null);
	const [copied, setCopied] = useState(false);

	const form = useForm({
		defaultValues: {
			expiresInHours: "24",
		},
		onSubmit: async ({ value }) => {
			setError("");

			try {
				const response = await shareApi.generateLink(record.id, parseInt(value.expiresInHours));
				setShareLink({
					url: response.shareLink.url,
					expiresAt: response.shareLink.expiresAt,
				});
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to generate share link");
			}
		},
	});

	const handleCopy = async () => {
		if (!shareLink) return;

		try {
			await navigator.clipboard.writeText(shareLink.url);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch (err) {
			alert("Failed to copy to clipboard");
		}
	};

	const handleClose = () => {
		setShareLink(null);
		setError("");
		form.reset();
		setCopied(false);
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Share Medical Record</DialogTitle>
					<DialogDescription>
						Generate a secure, time-limited link for {record.fileName}
					</DialogDescription>
				</DialogHeader>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{!shareLink ? (
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
					>
						<div className="space-y-4">
							<form.Field
								name="expiresInHours"
								validators={{
									onChange: ({ value }) => {
										const hours = parseInt(value);
										return hours < 1 || hours > 168
											? "Expiry must be between 1 hour and 7 days"
											: undefined;
									},
								}}
							>
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Link expires in</Label>
										<Select
											value={field.state.value}
											onValueChange={(value) => field.handleChange(value)}
										>
											<SelectTrigger id={field.name}>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="1">1 hour</SelectItem>
												<SelectItem value="6">6 hours</SelectItem>
												<SelectItem value="24">24 hours (1 day)</SelectItem>
												<SelectItem value="72">72 hours (3 days)</SelectItem>
												<SelectItem value="168">7 days</SelectItem>
											</SelectContent>
										</Select>
										{field.state.meta.errors.length > 0 && (
											<p className="text-sm text-destructive">
												{field.state.meta.errors.join(", ")}
											</p>
										)}
									</div>
								)}
							</form.Field>

							<div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
								<p className="font-medium mb-1">🔒 Security Features:</p>
								<ul className="list-disc list-inside space-y-1 text-xs">
									<li>File integrity verified against Hedera blockchain</li>
									<li>Access blocked if tampering detected</li>
									<li>All access logged permanently</li>
								</ul>
							</div>

							<DialogFooter>
								<Button type="button" variant="outline" onClick={handleClose}>
									Cancel
								</Button>
								<form.Subscribe
									selector={(state) => [state.canSubmit, state.isSubmitting]}
								>
									{([canSubmit, isSubmitting]) => (
										<Button type="submit" disabled={!canSubmit || isSubmitting}>
											{isSubmitting ? "Generating..." : "Generate Link"}
										</Button>
									)}
								</form.Subscribe>
							</DialogFooter>
						</div>
					</form>
				) : (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label>Share Link</Label>
							<div className="flex space-x-2">
								<Input
									readOnly
									value={shareLink.url}
									className="flex-1"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={handleCopy}
								>
									{copied ? (
										<Check className="h-4 w-4 text-green-600" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</Button>
							</div>
						</div>

						<div className="bg-gray-50 rounded-lg p-3 text-sm">
							<p className="text-muted-foreground">
								<span className="font-medium">Expires:</span>{" "}
								{new Date(shareLink.expiresAt).toLocaleString()}
							</p>
						</div>

						<Alert>
							<AlertDescription className="text-xs">
								Share this link with your doctor. The file will be automatically verified
								against the blockchain before being displayed.
							</AlertDescription>
						</Alert>

						<DialogFooter>
							<Button onClick={handleClose} className="w-full">
								Done
							</Button>
						</DialogFooter>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
