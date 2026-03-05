"use client";

import { Button } from "@hvault/ui/components/button";
import { FileText, History, LogOut, Shield, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const router = useRouter();
	return (
		<div className="min-h-screen">
			{/* Header */}
			<header className="">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div className="flex items-center space-x-2">
							<Shield className="h-8 w-8 text-primary" />
							<h1 className="text-xl font-bold text-gray-900">
								Medical Records Locker
							</h1>
						</div>
						<div className="flex items-center space-x-4">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => {
									authClient.signOut(
										{},
										{
											onSuccess: () => {
												router.push("/login");
											},
											onError: () => {
												console.error("Sign out failed");
											},
										},
									);
								}}
							>
								<LogOut className="h-4 w-4 mr-2" />
								Sign out
							</Button>
						</div>
					</div>
				</div>
			</header>

			{/* Navigation */}
			<nav className="border-b">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex space-x-8">
						<Link
							href="/dashboard"
							className="flex items-center px-3 py-4 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
						>
							<FileText className="h-4 w-4 mr-2" />
							My Records
						</Link>
						<Link
							href="/dashboard/upload"
							className="flex items-center px-3 py-4 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
						>
							<Upload className="h-4 w-4 mr-2" />
							Upload
						</Link>
						<Link
							href="/dashboard/audit"
							className="flex items-center px-3 py-4 text-sm font-medium border-b-2 border-transparent hover:border-primary transition-colors"
						>
							<History className="h-4 w-4 mr-2" />
							Audit History
						</Link>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{children}
			</main>
		</div>
	);
}
