"use client";

import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { Button } from "@hvault/ui/components/button";
import { Input } from "@hvault/ui/components/input";
import { Label } from "@hvault/ui/components/label";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import {
	Shield,
	ArrowRight,
	Check,
	Lock,
	Fingerprint,
	Globe,
	ShieldCheck,
} from "lucide-react";
import Image from "next/image";

export default function SignupPage() {
	const router = useRouter();
	const [error, setError] = useState("");

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		onSubmit: async ({ value }) => {
			setError("");

			await signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
					callbackURL: "/dashboard",
				},
				{
					onSuccess: () => {
						router.push("/dashboard");
					},
					onError: (ctx) => {
						setError(
							ctx.error.message ||
							"Protocol initialization failed. Please try again.",
						);
					},
				},
			);
		},
	});

	return (
		<div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 selection:bg-blue-100">
			<div className="w-full max-w-[1100px] grid lg:grid-cols-5 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
				{/* Left Side: Brand & Benefits (2/5 columns) */}
				<div className="hidden lg:flex lg:col-span-2 flex-col justify-between p-12 bg-slate-900 text-white relative overflow-hidden">
					<div className="absolute top-0 right-0 p-20 opacity-10">
						<ShieldCheck className="h-64 w-64 -rotate-12" />
					</div>

					<div className="relative z-10">
						<Link href="/" className="flex items-center gap-3">
							<div className="bg-blue-600 p-2 rounded-xl">
								<Image
									src="/logo.png"
									alt="MediVault Logo"
									width={15}
									height={15}
									className="rounded-full"
								/>
							</div>
							<span className="text-xl font-bold tracking-tight">
								MediVault
							</span>
						</Link>
					</div>

					<div className="relative z-10 space-y-8">
						<div className="space-y-4">
							<h2 className="text-4xl font-black leading-[1.1] tracking-tighter">
								The future of{" "}
								<span className="text-blue-400">patient-owned</span> data.
							</h2>
							<p className="text-slate-400 font-medium leading-relaxed">
								Join thousands of users who have reclaimed ownership of their
								medical records using military-grade security.
							</p>
						</div>

						<div className="space-y-6">
							<BenefitItem
								icon={<Lock className="h-5 w-5 text-blue-400" />}
								title="End-to-End Encryption"
								desc="Files are encrypted locally before being stored in the vault."
							/>
							<BenefitItem
								icon={<Fingerprint className="h-5 w-5 text-blue-400" />}
								title="Blockchain Consensus"
								desc="Every record is fingerprinted on the Hedera public ledger."
							/>
							<BenefitItem
								icon={<Globe className="h-5 w-5 text-blue-400" />}
								title="Global Portability"
								desc="Access and share your records with any doctor, anywhere."
							/>
						</div>
					</div>

					<div className="relative z-10 flex items-center gap-2">
						<div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
						<span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
							Genesis Node: Active
						</span>
					</div>
				</div>

				{/* Right Side: Form (3/5 columns) */}
				<div className="lg:col-span-3 p-8 md:p-16 flex flex-col justify-center bg-white">
					<div className="max-w-md mx-auto w-full">
						<div className="space-y-2 mb-10 text-center lg:text-left">
							<div className="lg:hidden flex justify-center mb-6">
								<div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-100">
									<Shield className="h-8 w-8 text-white" />
								</div>
							</div>
							<h1 className="text-3xl font-black text-slate-950 tracking-tight">
								Create Vault
							</h1>
							<p className="text-slate-500 font-medium">
								Initialize your secure medical record environment.
							</p>
						</div>

						<form
							onSubmit={(e) => {
								e.preventDefault();
								e.stopPropagation();
								form.handleSubmit();
							}}
							className="space-y-5"
						>
							{error && (
								<Alert
									variant="destructive"
									className="rounded-2xl border-rose-100 bg-rose-50 text-rose-700"
								>
									<AlertDescription className="font-bold text-xs">
										{error}
									</AlertDescription>
								</Alert>
							)}

							<div className="grid md:grid-cols-2 gap-4">
								<form.Field name="name">
									{(field) => (
										<div className="space-y-1.5">
											<Label
												htmlFor={field.name}
												className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1"
											>
												Full Name
											</Label>
											<Input
												id={field.name}
												placeholder="John Doe"
												className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</div>
									)}
								</form.Field>

								<form.Field name="email">
									{(field) => (
										<div className="space-y-1.5">
											<Label
												htmlFor={field.name}
												className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1"
											>
												Email Address
											</Label>
											<Input
												id={field.name}
												type="email"
												placeholder="name@email.com"
												className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</div>
									)}
								</form.Field>
							</div>

							<form.Field name="password">
								{(field) => (
									<div className="space-y-1.5">
										<Label
											htmlFor={field.name}
											className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1"
										>
											Create Security Key
										</Label>
										<Input
											id={field.name}
											type="password"
											placeholder="Min. 8 characters"
											className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>

							<form.Field name="confirmPassword">
								{(field) => (
									<div className="space-y-1.5">
										<Label
											htmlFor={field.name}
											className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1"
										>
											Confirm Key
										</Label>
										<Input
											id={field.name}
											type="password"
											placeholder="Repeat security key"
											className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white transition-all font-medium"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
										/>
									</div>
								)}
							</form.Field>

							<div className="pt-2">
								<form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
									{([canSubmit, isSubmitting]) => (
										<Button
											type="submit"
											className="w-full h-14 rounded-2xl text-base font-black shadow-blue-200 shadow-2xl bg-blue-600 hover:bg-blue-700"
											disabled={!canSubmit || isSubmitting}
										>
											{isSubmitting
												? "Initializing Protocol..."
												: "Create Your Vault"}
											{!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
										</Button>
									)}
								</form.Subscribe>
							</div>

							<div className="pt-6 text-center">
								<p className="text-sm text-slate-500 font-medium">
									Already have a vault?{" "}
									<Link
										href="/login"
										className="text-blue-600 font-black hover:underline underline-offset-4"
									>
										Access It Now
									</Link>
								</p>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	);
}

function BenefitItem({
	icon,
	title,
	desc,
}: {
	icon: React.ReactNode;
	title: string;
	desc: string;
}) {
	return (
		<div className="flex gap-4">
			<div className="shrink-0 bg-white/5 p-2.5 rounded-xl border border-white/10 h-fit">
				{icon}
			</div>
			<div className="space-y-1">
				<h4 className="text-sm font-bold text-white">{title}</h4>
				<p className="text-xs text-slate-400 leading-relaxed font-medium">
					{desc}
				</p>
			</div>
		</div>
	);
}
