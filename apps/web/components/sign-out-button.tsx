"use client";

import { Button } from "@hvault/ui/components/button";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
	const router = useRouter();

	const handleSignOut = async () => {
		try {
			await authClient.signOut({
				fetchOptions: {
					onSuccess: () => {
						router.push("/login");
					},
					onError: (ctx) => {
						console.error("Sign out failed:", ctx.error);
					},
				},
			});
		} catch (error) {
			console.error("Sign out error:", error);
		}
	};

	return (
		<Button variant="ghost" size="sm" onClick={handleSignOut}>
			<LogOut className="h-4 w-4 mr-2" />
			Sign out
		</Button>
	);
}
