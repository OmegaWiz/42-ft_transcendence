/** @type {import('next').NextConfig} */
const nextConfig = {
	output: 'standalone',
	experimental: {
		turbo: {
			rules: {}
		}
	}
};

export default nextConfig;
