import { Shield, Plus } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@hvault/ui/components/button";
import { SidebarLinks } from "@/components/sidebar-links";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="min-h-screen bg-[#f8fafc]">
			{/* Sidebar - Desktop */}
			<aside className="fixed inset-y-0 left-0 w-64 bg-white border-r hidden lg:flex flex-col z-50">
				<div className="p-6 border-b">
					<Link href="/dashboard" className="flex items-center space-x-3">
						<div className="bg-blue-600 p-2 rounded-xl shadow-blue-200 shadow-lg">
							<Shield className="h-5 w-5 text-white" />
						</div>
						<span className="text-xl font-bold tracking-tight text-slate-900">
							MediVault
						</span>
					</Link>
				</div>

				<SidebarLinks />

				<div className="p-4 border-t bg-slate-50/50">
					<div className="flex items-center justify-between px-3 py-2">
						<div className="flex items-center gap-2">
							<div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
								<Shield className="h-4 w-4" />
							</div>
							<div className="flex flex-col overflow-hidden">
								<span className="text-xs font-bold text-slate-900 truncate">Patient Vault</span>
								<span className="text-[10px] font-medium text-slate-500 truncate">Identity Verified</span>
							</div>
						</div>
						<SignOutButton />
					</div>
				</div>
			</aside>

			{/* Main Content Area */}
			<div className="lg:pl-64 flex flex-col min-h-screen">
				{/* Top Navigation - Mobile & Actions */}
				<header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b h-16 flex items-center justify-between px-4 lg:px-8">
					<div className="flex items-center lg:hidden">
						<Shield className="h-6 w-6 text-blue-600 mr-2" />
						<span className="font-bold text-lg">MediVault</span>
					</div>
					
					<div className="hidden lg:flex items-center bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
						<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2" />
						<span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
							System Status: Secure & Synchronized
						</span>
					</div>

					<div className="flex items-center space-x-3">
						<Link href="/dashboard/upload">
							<Button size="sm" className="h-9 px-4 rounded-full shadow-sm">
								<PlusIcon className="h-4 w-4 mr-2" />
								New Upload
							</Button>
						</Link>
					</div>
				</header>

				{/* Page Content */}
				<main className="flex-1 p-4 lg:p-8 max-w-7xl">
					{children}
				</main>
			</div>
		</div>
	);
}

function PlusIcon({ className }: { className?: string }) {
	return (
		<svg 
			className={className} 
			fill="none" 
			viewBox="0 0 24 24" 
			stroke="currentColor" 
			strokeWidth={2.5}
		>
			<path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
	);
}
