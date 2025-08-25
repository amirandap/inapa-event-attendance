/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'nodemailer'],
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    PORT: process.env.PORT || '3000',
  },
  // Configuración del puerto del servidor de desarrollo
  async serverOptions() {
    return {
      port: parseInt(process.env.PORT || '3000', 10),
    }
  },
}

export default nextConfig
