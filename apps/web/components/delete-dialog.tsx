"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@hvault/ui/components/alert-dialog";

interface DeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	record: {
		id: string;
		fileName: string;
	};
	onConfirm: () => void;
}

export default function DeleteDialog({
	open,
	onOpenChange,
	record,
	onConfirm,
}: DeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Medical Record?</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete <strong>{record.fileName}</strong>?
						This action cannot be undone. The file will be permanently removed from storage.
						<br />
						<br />
						Note: The deletion will be logged on Hedera blockchain as an audit trail.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
						Delete
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
