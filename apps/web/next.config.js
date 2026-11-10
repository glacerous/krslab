/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@krs/engine"],
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
};

module.exports = nextConfig;
