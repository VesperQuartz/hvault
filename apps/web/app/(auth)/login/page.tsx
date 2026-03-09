"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { signIn } from "@/lib/auth-client";
import { Button } from "@hvault/ui/components/button";
import { Input } from "@hvault/ui/components/input";
import { Card, CardContent } from "@hvault/ui/components/card";
import { Label } from "@hvault/ui/components/label";
import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { Shield, ArrowRight, Lock, KeyRound, Fingerprint } from "lucide-react";

export default function LoginPage() {
	const router = useRouter();
	const [error, setError] = useState("");

	const form = useForm({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			setError("");
			
			await signIn.email({
				email: value.email,
				password: value.password,
			}, {
				onSuccess: () => {
					router.push("/dashboard");
				},
				onError: (ctx) => {
					setError(ctx.error.message || "Invalid credentials. Please verify your identity.");
				}
			});
		},
	});

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 selection:bg-blue-100">
			<div className="w-full max-w-[1000px] grid lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
				
				{/* Left Side: Brand & Visual */}
				<div className="hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
					<div className="absolute top-0 right-0 p-20 opacity-10">
						<Shield className="h-64 w-64 rotate-12" />
					</div>
					
					<div className="relative z-10">
						<Link href="/" className="flex items-center gap-3">
							<div className="bg-blue-600 p-2 rounded-xl">
								<Shield className="h-5 w-5 text-white" />
							</div>
							<span className="text-xl font-bold tracking-tight">MediVault</span>
						</Link>
					</div>

					<div className="relative z-10 space-y-6">
						<h2 className="text-4xl font-black leading-tight tracking-tighter">
							Secure gateway to your <span className="text-blue-400">medical history.</span>
						</h2>
						<p className="text-slate-400 font-medium leading-relaxed max-w-sm">
							Sign in to initiate the AWS KMS decryption protocol and access your fingerprinted records.
						</p>
						
						<div className="flex flex-col gap-4 pt-4">
							<AuthFeature icon={<Lock className="h-4 w-4" />} text="AES-256 Envelope Encryption" />
							<AuthFeature icon={<Fingerprint className="h-4 w-4" />} text="Hedera Consensus Validation" />
							<AuthFeature icon={<KeyRound className="h-4 w-4" />} text="Identity-Linked Master Keys" />
						</div>
					</div>

					<div className="relative z-10 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
						Verification Node: Testnet-v4
					</div>
				</div>

				{/* Right Side: Form */}
				<div className="p-8 md:p-16 flex flex-col justify-center">
					<div className="space-y-2 mb-10 text-center lg:text-left">
						<div className="lg:hidden flex justify-center mb-6">
							<div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100">
								<Shield className="h-8 w-8 text-white" />
							</div>
						</div>
						<h1 className="text-3xl font-black text-slate-950 tracking-tight">Welcome Back</h1>
						<p className="text-slate-500 font-medium">Enter your credentials to unlock your vault.</p>
					</div>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-6"
					>
						{error && (
							<Alert variant="destructive" className="rounded-2xl border-rose-100 bg-rose-50 text-rose-700">
								<AlertDescription className="font-bold text-xs">{error}</AlertDescription>
							</Alert>
						)}
						
						<div className="space-y-5">
							<form.Field name="email">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email Address</Label>
										<Input
											id={field.name}
											type="email"
											placeholder="name@company.com"
											className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<div className="flex justify-between items-center px-1">
											<Label htmlFor={field.name} className="text-[10px] font-black uppercase tracking-widest text-slate-400">Security Key</Label>
											<Link href="#" className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700">Forgot?</Link>
										</div>
										<Input
											id={field.name}
											type="password"
											placeholder="••••••••••••"
											className="h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>
						</div>

						<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
							{([canSubmit, isSubmitting]) => (
								<Button 
									type="submit" 
									className="w-full h-14 rounded-2xl text-base font-black shadow-blue-200 shadow-2xl bg-blue-600 hover:bg-blue-700 mt-4" 
									disabled={!canSubmit || isSubmitting}
								>
									{isSubmitting ? "Unlocking Vault..." : "Access Vault"}
									{!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
								</Button>
							)}
						</form.Subscribe>

						<div className="pt-8 text-center">
							<p className="text-sm text-slate-500 font-medium">
								Don't have a vault yet?{" "}
								<Link href="/signup" className="text-blue-600 font-black hover:underline underline-offset-4">
									Create One Now
								</Link>
							</p>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}

function AuthFeature({ icon, text }: { icon: React.ReactNode, text: string }) {
	return (
		<div className="flex items-center gap-3 text-sm font-medium text-slate-300">
			<div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
				{icon}
			</div>
			{text}
		</div>
	);
}
