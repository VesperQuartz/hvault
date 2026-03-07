import { createAuthClient } from "better-auth/react";

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787/api";

// Ensure we get just the origin (protocol + host + port) 
// to avoid path conflicts between baseURL and basePath
const getOrigin = (url: string) => {
	try {
		return new URL(url).origin;
	} catch (e) {
		return url;
	}
};

export const authClient = createAuthClient({
	baseURL: getOrigin(rawApiUrl),
	basePath: "/api/auth",
});

export const { signIn, signUp, signOut, useSession } = authClient;
