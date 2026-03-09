"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, History, Upload, LayoutDashboard } from "lucide-react";
import { cn } from "@hvault/ui/lib/utils";

export function SidebarLinks() {
	const pathname = usePathname();

	return (
		<nav className="flex-1 p-4 space-y-1.5 mt-4">
			<SidebarLink 
				href="/dashboard" 
				icon={<FileText className="h-4 w-4" />} 
				label="My Records" 
				active={pathname === "/dashboard"} 
			/>
			<SidebarLink 
				href="/dashboard/upload" 
				icon={<Upload className="h-4 w-4" />} 
				label="Secure Upload" 
				active={pathname === "/dashboard/upload"} 
			/>
			<SidebarLink 
				href="/dashboard/audit" 
				icon={<History className="h-4 w-4" />} 
				label="Audit Trail" 
				active={pathname === "/dashboard/audit"} 
			/>
		</nav>
	);
}

function SidebarLink({ 
	href, 
	icon, 
	label, 
	active = false,
	badge
}: { 
	href: string; 
	icon: React.ReactNode; 
	label: string; 
	active?: boolean;
	badge?: string;
}) {
	return (
		<Link
			href={href}
			className={cn(
				"flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
				active 
					? "bg-blue-50 text-blue-700 shadow-sm shadow-blue-100 border border-blue-100" 
					: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
			)}
		>
			<div className="flex items-center">
				<span className={cn(
					"mr-3 transition-colors",
					active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
				)}>
					{icon}
				</span>
				{label}
			</div>
			{badge && (
				<span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
					{badge}
				</span>
			)}
		</Link>
	);
}
