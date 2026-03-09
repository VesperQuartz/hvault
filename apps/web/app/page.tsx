/** biome-ignore-all lint/a11y/useValidAnchor: <explanation> */
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@hvault/ui/components/button";
import {
	Shield,
	Lock,
	FileCheck,
	Share2,
	Check,
	Zap,
	Eye,
	Clock,
	ArrowRight,
	Fingerprint,
	ShieldCheck,
	Globe,
} from "lucide-react";
import { Badge } from "@hvault/ui/components/badge";
import Image from "next/image";

export default function HomePage() {
	const router = useRouter();
	const { data: session, isPending } = useSession();

	useEffect(() => {
		if (!isPending && session) {
			router.push("/dashboard");
		}
	}, [session, isPending, router]);

	if (isPending) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	if (session) {
		return null;
	}

	return (
		<div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
			{/* Minimal Navigation */}
			<nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
				<div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className=" p-2 rounded-xl shadow-blue-200 shadow-lg">
							<Image
								src="/logo.png"
								alt="MediVault Logo"
								width={20}
								height={20}
								className="rounded-full"
							/>
						</div>
						<span className="text-xl font-bold tracking-tight text-slate-950">
							MediVault
						</span>
					</div>

					<div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-500">
						<a
							href="#security"
							className="hover:text-blue-600 transition-colors"
						>
							Security
						</a>
						<a
							href="#how-it-works"
							className="hover:text-blue-600 transition-colors"
						>
							How it Works
						</a>
						<a
							href="#compliance"
							className="hover:text-blue-600 transition-colors"
						>
							Compliance
						</a>
					</div>

					<div className="flex items-center gap-4">
						<Link href="/login">
							<Button
								variant="ghost"
								className="text-sm font-bold text-slate-600 hover:text-blue-600"
							>
								Sign In
							</Button>
						</Link>
						<Link href="/signup">
							<Button className="rounded-full px-6 h-11 shadow-blue-100 shadow-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold">
								Create Free Vault
							</Button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Modern Hero Section */}
			<section className="relative pt-40 pb-20 overflow-hidden">
				{/* Decorative Background Elements */}
				<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-3xl -z-10 opacity-50" />

				<div className="max-w-7xl mx-auto px-6 text-center space-y-10">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[11px] font-bold text-blue-600 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-4 duration-700">
						<ShieldCheck className="h-3.5 w-3.5" />
						Enterprise-Grade Health Data Security
					</div>

					<h1 className="text-6xl md:text-8xl font-black text-slate-950 leading-[1.1] tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
						Ownership of your <br className="hidden md:block" />
						<span className="text-blue-600">medical history.</span>
					</h1>

					<p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
						MediVault combines AWS hardware security with Hedera blockchain to
						ensure your records are encrypted, immutable, and entirely yours.
					</p>

					<div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
						<Link href="/signup">
							<Button
								size="lg"
								className="h-14 px-10 rounded-full text-base font-bold shadow-blue-200 shadow-2xl bg-blue-600 hover:bg-blue-700"
							>
								Open Your Vault
								<ArrowRight className="ml-2 h-5 w-5" />
							</Button>
						</Link>
						<Link href="/signup">
							<Button
								size="lg"
								variant="outline"
								className="h-14 px-10 rounded-full text-base font-bold border-2 border-slate-100 bg-white hover:bg-slate-50"
							>
								Watch Demo
							</Button>
						</Link>
					</div>

					{/* Platform Preview Placeholder */}
					<div className="mt-20 relative animate-in fade-in zoom-in-95 duration-1000 delay-500">
						<div className="max-w-5xl mx-auto rounded-[40px] border-[12px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden aspect-[16/9]">
							<div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 z-10" />
							<div className="w-full h-full bg-[#f8fafc] p-8 flex flex-col items-start text-left space-y-8">
								<div className="w-full h-12 flex justify-between items-center border-b pb-4">
									<div className="flex gap-2">
										<div className="w-3 h-3 rounded-full bg-red-400" />
										<div className="w-3 h-3 rounded-full bg-yellow-400" />
										<div className="w-3 h-3 rounded-full bg-green-400" />
									</div>
									<div className="bg-slate-100 px-4 py-1 rounded-lg text-[10px] font-bold text-slate-400 uppercase tracking-widest">
										secure.medivault.io
									</div>
								</div>
								<div className="flex w-full gap-8 h-full overflow-hidden">
									<div className="w-48 space-y-4 pt-4">
										<div className="h-8 w-full bg-blue-100 rounded-xl" />
										<div className="h-8 w-3/4 bg-slate-100 rounded-xl" />
										<div className="h-8 w-5/6 bg-slate-100 rounded-xl" />
									</div>
									<div className="flex-1 grid grid-cols-2 gap-6 pt-4 overflow-hidden">
										<div className="h-40 bg-white border rounded-3xl p-6 space-y-4">
											<div className="h-4 w-1/2 bg-slate-100 rounded-full" />
											<div className="h-2 w-full bg-slate-50 rounded-full" />
											<div className="h-2 w-full bg-slate-50 rounded-full" />
										</div>
										<div className="h-40 bg-white border rounded-3xl p-6 space-y-4">
											<div className="h-4 w-1/3 bg-slate-100 rounded-full" />
											<div className="h-2 w-full bg-slate-50 rounded-full" />
											<div className="h-2 w-full bg-slate-50 rounded-full" />
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Trust / Stats Section */}
			<section className="py-20 border-y border-slate-50">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
						<div className="space-y-2">
							<div className="text-4xl font-black text-slate-900">256-bit</div>
							<div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
								KMS Encryption
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-4xl font-black text-slate-900">Zero</div>
							<div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
								Access Protocol
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-4xl font-black text-slate-900">100%</div>
							<div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
								Immutable Logs
							</div>
						</div>
						<div className="space-y-2">
							<div className="text-4xl font-black text-slate-900">Global</div>
							<div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
								HIPAA Ready
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Core Pillar Section */}
			<section id="security" className="py-32">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid md:grid-cols-2 gap-20 items-center">
						<div className="space-y-8">
							<Badge
								variant="outline"
								className="rounded-full border-blue-200 text-blue-600 bg-blue-50/50 h-8 px-4 font-bold uppercase tracking-widest text-[10px]"
							>
								Security Infrastructure
							</Badge>
							<h2 className="text-5xl font-extrabold tracking-tight text-slate-950">
								Your privacy is protected by the strongest tools available.
							</h2>
							<p className="text-lg text-slate-500 leading-relaxed font-medium">
								We believe your health data shouldn't be accessible by anyone
								but you. Our architecture ensures that even we cannot read your
								files.
							</p>

							<div className="space-y-6">
								<Pillar
									icon={<Lock className="h-5 w-5 text-blue-600" />}
									title="AWS KMS Envelope Encryption"
									description="Every file is encrypted with its own unique data key, which is protected by hardware-backed master keys."
								/>
								<Pillar
									icon={<Fingerprint className="h-5 w-5 text-blue-600" />}
									title="Hedera Blockchain Hash"
									description="A permanent cryptographic fingerprint of every document is stored on-chain to detect any tampering instantly."
								/>
								<Pillar
									icon={<Globe className="h-5 w-5 text-blue-600" />}
									title="Decentralized Identity"
									description="Session-based access control means your keys are only live when you are actively using the vault."
								/>
							</div>
						</div>
						<div className="bg-slate-50 rounded-[60px] aspect-square flex items-center justify-center relative overflow-hidden group">
							<div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent group-hover:scale-110 transition-transform duration-1000" />
							<ShieldCheck className="h-48 w-48 text-blue-600/20 animate-pulse" />
							<div className="absolute bottom-12 left-12 right-12 bg-white/80 backdrop-blur-xl border border-white p-8 rounded-3xl shadow-xl">
								<p className="text-sm font-bold text-slate-900 leading-relaxed italic">
									"The combination of AWS and Hedera creates a security layer
									that is virtually impossible to compromise."
								</p>
								<div className="mt-4 flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-slate-900" />
									<div>
										<div className="text-xs font-bold text-slate-900">
											Dr. Sarah Chen
										</div>
										<div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
											Head of Cybersecurity
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="bg-slate-950 text-white py-24">
				<div className="max-w-7xl mx-auto px-6">
					<div className="grid md:grid-cols-4 gap-12 pb-20 border-b border-white/10">
						<div className="col-span-2 space-y-6">
							<div className="flex items-center gap-3">
								<div className=" rounded-xl">
									<Image
										src="/logo.png"
										alt="MediVault Logo"
										width={25}
										height={25}
										className="rounded-full"
									/>
								</div>
								<span className="text-2xl font-bold tracking-tight text-white">
									MediVault
								</span>
							</div>
							<p className="max-w-sm text-slate-400 font-medium leading-relaxed">
								The future of medical record storage. Secure, private, and 100%
								owned by the patient.
							</p>
						</div>
						<div className="space-y-6">
							<h4 className="text-sm font-bold uppercase tracking-widest text-white">
								Product
							</h4>
							<ul className="space-y-4 text-slate-400 font-medium text-sm">
								<li>
									<a href="#" className="hover:text-white transition-colors">
										How it works
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white transition-colors">
										Security
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white transition-colors">
										Enterprise
									</a>
								</li>
							</ul>
						</div>
						<div className="space-y-6">
							<h4 className="text-sm font-bold uppercase tracking-widest text-white">
								Legal
							</h4>
							<ul className="space-y-4 text-slate-400 font-medium text-sm">
								<li>
									<a href="#" className="hover:text-white transition-colors">
										Privacy Policy
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white transition-colors">
										Terms of Service
									</a>
								</li>
								<li>
									<a href="#" className="hover:text-white transition-colors">
										Cookie Policy
									</a>
								</li>
							</ul>
						</div>
					</div>
					<div className="pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
						<p className="text-sm font-medium text-slate-500 italic">
							© 2026 MediVault. All records are secured by AWS & Hedera
							Hashgraph.
						</p>
						<div className="flex items-center gap-6">
							<div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] border border-slate-800 px-3 py-1 rounded-full">
								Secure Node: Testnet-4
							</div>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

function Pillar({
	icon,
	title,
	description,
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
}) {
	return (
		<div className="flex items-start gap-5 group">
			<div className="shrink-0 w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-500">
				<span className="group-hover:text-white transition-colors duration-500">
					{icon}
				</span>
			</div>
			<div className="space-y-1 pt-1">
				<h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-500">
					{title}
				</h3>
				<p className="text-sm text-slate-500 font-medium leading-relaxed">
					{description}
				</p>
			</div>
		</div>
	);
}
