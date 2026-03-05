"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { Button } from "@hvault/ui/components/button";
import { Shield, Lock, FileCheck, Share2, Check, Zap, Eye, Clock } from "lucide-react";
import { Badge } from "@hvault/ui/components/badge";

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
			<div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
				<div className="text-center space-y-4">
					<div className="relative">
						<div className="animate-spin rounded-full h-16 w-16 border-4 border-primary/30 border-t-primary mx-auto"></div>
						<Shield className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
					</div>
					<p className="text-muted-foreground font-medium">Loading...</p>
				</div>
			</div>
		);
	}

	if (session) {
		return null; // Will redirect
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
			{/* Header */}
			<header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
				<div className="container mx-auto px-4 py-4">
					<div className="flex justify-between items-center">
						<div className="flex items-center space-x-3">
							<div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg">
								<Shield className="h-6 w-6 text-white" />
							</div>
							<div>
								<span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
									MediVault
								</span>
								<p className="text-xs text-muted-foreground">Secure Medical Records</p>
							</div>
						</div>
						<div className="flex items-center space-x-3">
							<Link href="/login">
								<Button variant="ghost" size="sm">Sign In</Button>
							</Link>
							<Link href="/signup">
								<Button size="sm" className="shadow-md">Get Started Free</Button>
							</Link>
						</div>
					</div>
				</div>
			</header>

			{/* Hero Section */}
			<main className="container mx-auto px-4 py-16 md:py-24">
				<div className="max-w-6xl mx-auto">
					{/* Hero */}
					<div className="text-center space-y-8 mb-20">
						<div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 text-sm font-medium text-blue-700 mb-4">
							<Zap className="h-4 w-4" />
							Powered by AWS KMS & Hedera Blockchain
						</div>
						<h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight tracking-tight">
							Your Medical Records,{" "}
							<span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
								Protected Forever
							</span>
						</h1>
						<p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
							Military-grade encryption meets blockchain verification. Store, share, and verify 
							your medical records with absolute confidence.
						</p>
						<div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
							<Link href="/signup">
								<Button size="lg" className="text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all">
									<Shield className="mr-2 h-5 w-5" />
									Start Securing Now
								</Button>
							</Link>
							<Link href="/login">
								<Button size="lg" variant="outline" className="text-lg px-10 py-6 border-2">
									Sign In
								</Button>
							</Link>
						</div>
						
						{/* Trust Indicators */}
						<div className="flex flex-wrap justify-center gap-6 pt-8 text-sm text-muted-foreground">
							<div className="flex items-center gap-2">
								<Check className="h-4 w-4 text-green-600" />
								<span>AWS KMS Encryption</span>
							</div>
							<div className="flex items-center gap-2">
								<Check className="h-4 w-4 text-green-600" />
								<span>Hedera Blockchain</span>
							</div>
							<div className="flex items-center gap-2">
								<Check className="h-4 w-4 text-green-600" />
								<span>Zero Knowledge</span>
							</div>
							<div className="flex items-center gap-2">
								<Check className="h-4 w-4 text-green-600" />
								<span>Tamper Detection</span>
							</div>
						</div>
					</div>

				{/* Features */}
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
					<div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-blue-200">
						<div className="bg-gradient-to-br from-blue-500 to-blue-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
							<Lock className="h-7 w-7 text-white" />
						</div>
						<h3 className="font-bold text-xl mb-3 text-gray-900">Military-Grade Encryption</h3>
						<p className="text-gray-600 text-sm leading-relaxed">
							AWS KMS envelope encryption ensures your files are unreadable even if storage is compromised. Each file gets a unique encryption key.
						</p>
					</div>

					<div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-green-200">
						<div className="bg-gradient-to-br from-green-500 to-green-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
							<FileCheck className="h-7 w-7 text-white" />
						</div>
						<h3 className="font-bold text-xl mb-3 text-gray-900">Blockchain Fingerprinting</h3>
						<p className="text-gray-600 text-sm leading-relaxed">
							SHA-256 hash stored on Hedera blockchain creates an immutable, tamper-proof record of your file's authenticity.
						</p>
					</div>

					<div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-purple-200">
						<div className="bg-gradient-to-br from-purple-500 to-purple-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
							<Share2 className="h-7 w-7 text-white" />
						</div>
						<h3 className="font-bold text-xl mb-3 text-gray-900">Smart Sharing</h3>
						<p className="text-gray-600 text-sm leading-relaxed">
							Generate time-limited, encrypted links for doctors. Files are automatically verified against blockchain before access.
						</p>
					</div>

					<div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100 hover:border-orange-200">
						<div className="bg-gradient-to-br from-orange-500 to-orange-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
							<Eye className="h-7 w-7 text-white" />
						</div>
						<h3 className="font-bold text-xl mb-3 text-gray-900">Real-Time Verification</h3>
						<p className="text-gray-600 text-sm leading-relaxed">
							Every access triggers automatic verification. If tampering is detected, access is blocked and you're instantly alerted.
						</p>
					</div>
				</div>

				{/* How It Works */}
				<div className="mt-32">
					<div className="text-center mb-16">
						<Badge variant="outline" className="mb-4">Simple & Secure</Badge>
						<h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
						<p className="text-xl text-gray-600 max-w-2xl mx-auto">
							Three simple steps to protect your medical records forever
						</p>
					</div>
					
					<div className="grid md:grid-cols-3 gap-8">
						<div className="relative">
							<div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
								<div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl font-bold mb-6 shadow-lg">
									1
								</div>
								<h3 className="font-bold text-2xl mb-4 text-gray-900">Upload & Encrypt</h3>
								<p className="text-gray-600 leading-relaxed">
									Upload your medical records. Files are instantly hashed, encrypted with AWS KMS 
									envelope encryption, and fingerprinted on Hedera blockchain for permanent verification.
								</p>
								<div className="mt-6 flex items-center gap-2 text-sm text-blue-600 font-medium">
									<Lock className="h-4 w-4" />
									<span>256-bit encryption</span>
								</div>
							</div>
							{/* Connector line */}
							<div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-300 to-transparent"></div>
						</div>

						<div className="relative">
							<div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
								<div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white text-2xl font-bold mb-6 shadow-lg">
									2
								</div>
								<h3 className="font-bold text-2xl mb-4 text-gray-900">Share Securely</h3>
								<p className="text-gray-600 leading-relaxed">
									Generate time-limited, encrypted sharing links for your doctors. Set custom expiry 
									times from 1 hour to 7 days. Links automatically verify file integrity.
								</p>
								<div className="mt-6 flex items-center gap-2 text-sm text-purple-600 font-medium">
									<Clock className="h-4 w-4" />
									<span>Time-limited access</span>
								</div>
							</div>
							{/* Connector line */}
							<div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-purple-300 to-transparent"></div>
						</div>

						<div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all">
							<div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white text-2xl font-bold mb-6 shadow-lg">
								3
							</div>
							<h3 className="font-bold text-2xl mb-4 text-gray-900">Auto-Verify</h3>
							<p className="text-gray-600 leading-relaxed">
								Every access triggers automatic blockchain verification. Files are decrypted and 
								compared against their blockchain fingerprint. Tampering instantly blocks access.
							</p>
							<div className="mt-6 flex items-center gap-2 text-sm text-green-600 font-medium">
								<Shield className="h-4 w-4" />
								<span>Tamper detection</span>
							</div>
						</div>
					</div>
				</div>

				{/* CTA Section */}
				<div className="mt-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-16 text-center shadow-2xl">
					<h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
						Ready to Secure Your Records?
					</h2>
					<p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
						Join thousands protecting their medical records with military-grade encryption and blockchain verification.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 justify-center">
						<Link href="/signup">
							<Button size="lg" variant="secondary" className="text-lg px-10 py-6 shadow-xl">
								Start Free Today
							</Button>
						</Link>
						<Link href="/login">
							<Button size="lg" variant="outline" className="text-lg px-10 py-6 bg-white/10 text-white border-white/30 hover:bg-white/20">
								Sign In
							</Button>
						</Link>
					</div>
				</div>
			</div>
			</main>

			{/* Footer */}
			<footer className="border-t bg-white/50 backdrop-blur-sm mt-20">
				<div className="container mx-auto px-4 py-12">
					<div className="flex flex-col md:flex-row justify-between items-center gap-4">
						<div className="flex items-center space-x-3">
							<div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl">
								<Shield className="h-5 w-5 text-white" />
							</div>
							<div>
								<span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
									MediVault
								</span>
								<p className="text-xs text-muted-foreground">Secure Medical Records</p>
							</div>
						</div>
						<p className="text-sm text-gray-600">
							© 2026 MediVault. Secured with AWS KMS & Hedera Blockchain.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
