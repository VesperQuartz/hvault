"use client";

import { Badge } from "@hvault/ui/components/badge";
import { Button } from "@hvault/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@hvault/ui/components/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	Clock,
	Copy,
	QrCode,
	Trash2,
	X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { queryKeys, shareApi } from "@/lib/api";
import { revalidateRecords } from "@/app/actions";

interface ManageLinksDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	record: {
		id: string;
		fileName: string;
	};
}

export default function ManageLinksDialog({
	open,
	onOpenChange,
	record,
}: ManageLinksDialogProps) {
	const queryClient = useQueryClient();
	const [copiedId, setCopiedId] = useState<string | null>(null);
	const [showQRForId, setShowQRForId] = useState<string | null>(null);

	// Fetch existing share links
	const { data: activeLinksData, isLoading } = useQuery({
		queryKey: queryKeys.shares.forRecord(record.id),
		queryFn: () => shareApi.listForRecord(record.id),
		enabled: open,
	});

	const activeLinks = activeLinksData?.shareLinks ?? [];

	// Revoke mutation
	const revokeMutation = useMutation({
		mutationFn: (id: string) => shareApi.revokeLink(id),
		onSuccess: async () => {
			// Revalidate server-side cache
			await revalidateRecords();

			queryClient.invalidateQueries({
				queryKey: queryKeys.shares.forRecord(record.id),
			});
			// Also invalidate records to update the count
			queryClient.invalidateQueries({ queryKey: queryKeys.records.list() });
		},
	});

	const handleCopy = async (url: string, id: string) => {
		try {
			await navigator.clipboard.writeText(url);
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 2000);
		} catch (err) {
			alert("Failed to copy to clipboard");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Manage Share Links</DialogTitle>
					<DialogDescription className="mt-1.5">
						Active and recent links for: <span className="font-semibold text-gray-900">{record.fileName}</span>
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{isLoading ? (
						<div className="flex justify-center py-8">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
						</div>
					) : activeLinks.length === 0 ? (
						<div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
							<p className="text-sm text-muted-foreground">No share links generated for this record.</p>
						</div>
					) : (
						<div className="space-y-3">
							{activeLinks.map((link) => (
								<div
									key={link.id}
									className="bg-gray-50 border rounded-lg p-3 space-y-2"
								>
									{showQRForId === link.id ? (
										<div className="flex flex-col items-center justify-center p-4 space-y-4">
											<div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100">
												<QRCodeSVG
													value={link.url}
													size={160}
													level="H"
													includeMargin={true}
												/>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => setShowQRForId(null)}
												className="text-xs h-8"
											>
												<X className="h-3.5 w-3.5 mr-1.5" />
												Hide QR Code
											</Button>
										</div>
									) : (
										<>
											<div className="flex items-center justify-between">
												<Badge
													variant={link.isExpired ? "secondary" : "outline"}
													className="text-[10px]"
												>
													{link.isExpired ? "Expired" : "Active"}
												</Badge>
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-gray-500"
														onClick={() => handleCopy(link.url, link.id)}
														title="Copy Link"
													>
														{copiedId === link.id ? (
															<Check className="h-3.5 w-3.5 text-green-600" />
														) : (
															<Copy className="h-3.5 w-3.5" />
														)}
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-gray-500"
														onClick={() => setShowQRForId(link.id)}
														title="Show QR Code"
													>
														<QrCode className="h-3.5 w-3.5" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600"
														disabled={revokeMutation.isPending}
														onClick={() => revokeMutation.mutate(link.id)}
														title="Revoke Link"
													>
														<Trash2 className="h-3.5 w-3.5" />
													</Button>
												</div>
											</div>
											<div className="text-xs space-y-1">
												<div className="flex items-center gap-1.5 text-muted-foreground">
													<Clock className="h-3 w-3" />
													<span>
														Expires: {new Date(link.expiresAt).toLocaleString()}
													</span>
												</div>
												<div className="flex items-center gap-1.5 text-muted-foreground">
													<Check className="h-3 w-3" />
													<span>Accessed: {link.accessCount} times</span>
												</div>
											</div>
										</>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				<div className="flex justify-end">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
