import { NextConfig } from "next";

const nextConfig: NextConfig = {
	async headers() {
		console.log("headers");
		return [
			{
				source: "/api/:path*",
				headers: [
					{ key: "Access-Control-Allow-Credentials", value: "true" },
					{ key: "Access-Control-Allow-Origin", value: "*" }, // replace this your actual origin
					{
						key: "Access-Control-Allow-Methods",
						value: "GET,DELETE,PATCH,POST,PUT",
					},
					{
						key: "Access-Control-Allow-Headers",
						value:
							"X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
					},
				],
			},
		];
	},
	output: "standalone",
	reactStrictMode: true,
	serverExternalPackages: ["pino", "pino-pretty", "hono-pino/debug-log"],
	images: {
		remotePatterns: [
			{
				hostname: "res.cloudinary.com",
			},
		],
	},
	experimental: {
		turbopackFileSystemCacheForDev: true,
		authInterrupts: true,
		typedEnv: true,
		optimizeCss: true,
	},
	reactCompiler: true,
	allowedDevOrigins: ["mrlectus.local"],
	cacheComponents: true,
};

export default nextConfig;
