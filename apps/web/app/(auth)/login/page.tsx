"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "@tanstack/react-form";
import { signIn } from "@/lib/auth-client";
import { Button } from "@hvault/ui/components/button";
import { Input } from "@hvault/ui/components/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@hvault/ui/components/card";
import { Label } from "@hvault/ui/components/label";
import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { Shield, ArrowRight } from "lucide-react";

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
					setError(ctx.error.message || "Failed to sign in. Please check your credentials.");
				}
			});
		},
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg mb-4">
						<Shield className="h-8 w-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
						Welcome Back
					</h1>
					<p className="text-muted-foreground">
						Sign in to access your secure medical records
					</p>
				</div>

				<Card className="border-2 shadow-xl">
					<CardHeader className="space-y-1 pb-4">
						<CardTitle className="text-xl font-semibold">Sign In</CardTitle>
						<CardDescription>
							Enter your credentials to continue
						</CardDescription>
					</CardHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<CardContent className="space-y-4">
						{error && (
							<Alert variant="destructive">
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						
						<form.Field
							name="email"
							validators={{
								onChange: ({ value }) =>
									!value
										? "Email is required"
										: !value.includes("@")
											? "Invalid email format"
											: undefined,
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Email</Label>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										placeholder="you@example.com"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>

						<form.Field
							name="password"
							validators={{
								onChange: ({ value }) =>
									!value
										? "Password is required"
										: value.length < 8
											? "Password must be at least 8 characters"
											: undefined,
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Password</Label>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										placeholder="••••••••"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
									/>
									{field.state.meta.errors.length > 0 && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors.join(", ")}
										</p>
									)}
								</div>
							)}
						</form.Field>
					</CardContent>
					<CardFooter className="flex flex-col space-y-4 pt-6">
						<form.Subscribe
							selector={(state) => [state.canSubmit, state.isSubmitting]}
						>
							{([canSubmit, isSubmitting]) => (
								<Button 
									type="submit" 
									className="w-full h-12 text-base shadow-lg" 
									disabled={!canSubmit || isSubmitting}
								>
									{isSubmitting ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
											Signing in...
										</>
									) : (
										<>
											Sign In
											<ArrowRight className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							)}
						</form.Subscribe>
						<div className="relative">
							<div className="absolute inset-0 flex items-center">
								<span className="w-full border-t" />
							</div>
							<div className="relative flex justify-center text-xs uppercase">
								<span className="bg-background px-2 text-muted-foreground">
									New to MediVault?
								</span>
							</div>
						</div>
						<Link href="/signup" className="w-full">
							<Button variant="outline" className="w-full h-12" type="button">
								Create Account
							</Button>
						</Link>
					</CardFooter>
				</form>
			</Card>
			
			<p className="text-center text-sm text-muted-foreground mt-6">
				Protected by AWS KMS & Hedera Blockchain
			</p>
		</div>
		</div>
	);
}
