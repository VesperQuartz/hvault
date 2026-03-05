"use client";

import { Alert, AlertDescription } from "@hvault/ui/components/alert";
import { Button } from "@hvault/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@hvault/ui/components/card";
import { Input } from "@hvault/ui/components/input";
import { Label } from "@hvault/ui/components/label";
import { useForm } from "@tanstack/react-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signUp } from "@/lib/auth-client";
import { Shield, ArrowRight, Check } from "lucide-react";

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
					onError: (data) => {
						console.log("Error", data);
					},
				},
			);
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
						Join MediVault
					</h1>
					<p className="text-muted-foreground">
						Start securing your medical records today
					</p>
				</div>

				<Card className="border-2 shadow-xl">
					<CardHeader className="space-y-1 pb-4">
						<CardTitle className="text-xl font-semibold">
							Create Account
						</CardTitle>
						<CardDescription>
							Get started with your free secure vault
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
							name="name"
							validators={{
								onChange: ({ value }) =>
									!value
										? "Name is required"
										: value.length < 2
											? "Name must be at least 2 characters"
											: undefined,
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Full Name</Label>
									<Input
										id={field.name}
										name={field.name}
										type="text"
										placeholder="John Doe"
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

						<form.Field
							name="confirmPassword"
							validators={{
								onChangeListenTo: ["password"],
								onChange: ({ value, fieldApi }) => {
									const password = fieldApi.form.getFieldValue("password");
									return !value
										? "Please confirm your password"
										: value !== password
											? "Passwords do not match"
											: undefined;
								},
							}}
						>
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Confirm Password</Label>
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
						{/* Benefits */}
						<div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2 text-sm">
							<p className="font-semibold text-blue-900 flex items-center gap-2">
								<Shield className="h-4 w-4" />
								What you get:
							</p>
							<ul className="space-y-1.5 text-blue-800">
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-blue-600" />
									Military-grade encryption
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-blue-600" />
									Blockchain verification
								</li>
								<li className="flex items-center gap-2">
									<Check className="h-4 w-4 text-blue-600" />
									Secure sharing with doctors
								</li>
							</ul>
						</div>
						
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
											Creating account...
										</>
									) : (
										<>
											Create Account
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
									Already have an account?
								</span>
							</div>
						</div>
						<Link href="/login" className="w-full">
							<Button variant="outline" className="w-full h-12" type="button">
								Sign In
							</Button>
						</Link>
					</CardFooter>
				</form>
			</Card>
			
			<p className="text-center text-sm text-muted-foreground mt-6">
				Free forever • No credit card required
			</p>
		</div>
		</div>
	);
}
