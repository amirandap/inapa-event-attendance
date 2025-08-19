# INSTRUCCIONES 01: Configuración Inicial y Estructura del Proyecto

## Objetivo
Configurar la estructura inicial del proyecto Next.js 14 con App Router, TypeScript, y todas las dependencias necesarias para el sistema de registro de asistencias.

## Tareas a Ejecutar

### 1. Inicialización del Proyecto Next.js

```bash
npx create-next-app@latest inapa-event-attendance --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd inapa-event-attendance
```

### 2. Instalación de Dependencias

```bash
# Dependencias principales
npm install prisma @prisma/client
npm install @auth/prisma-adapter
npm install nodemailer @types/nodemailer
npm install googleapis
npm install @react-pdf/renderer
npm install exceljs
npm install qrcode @types/qrcode
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react
npm install react-email
npm install @upstash/qstash @upstash/redis
npm install jsonwebtoken @types/jsonwebtoken
npm install date-fns

# Dependencias de desarrollo
npm install -D @types/react-pdf
npm install -D prettier
```

### 3. Configuración de shadcn/ui

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add card
npx shadcn-ui@latest add table
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add form
npx shadcn-ui@latest add select
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
```

### 4. Estructura de Directorios

Crear la siguiente estructura de carpetas:

```
app/
  (public)/
    layout.tsx
    page.tsx
  a/[token]/
    page.tsx
  eventos/[id]/
    page.tsx
  dashboard/
    page.tsx
    layout.tsx
  api/
    webhooks/google/calendar/
      route.ts
    events/sync/
      route.ts
    checkins/
      route.ts
    exports/[id]/pdf/
      route.ts
    exports/[id]/xlsx/
      route.ts
    mail/send/
      route.ts
    jobs/pre-close/
      route.ts
    jobs/final/
      route.ts
components/
  forms/
  events/
  ui/
lib/
  google/
  pdf/
  excel/
  qr/
  jobs/
  email/
    templates/
  utils/
prisma/
  migrations/
public/
  images/
```

### 5. Variables de Entorno

Crear archivo `.env.local`:

```env
# Base
DATABASE_URL="postgresql://username:password@localhost:5432/inapa_attendance"
APP_BASE_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret-here"

# Google APIs
GOOGLE_PROJECT_ID="your-project-id"
GOOGLE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID="minutas@inapa.gob.do"

# Gmail
GMAIL_SENDER="minutas@inapa.gob.do"

# Upstash (para production)
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""
QSTASH_URL=""
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# NODE_ENV
NODE_ENV="development"
```

### 6. Configuración de TypeScript

Actualizar `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./components/*"],
      "@/lib/*": ["./lib/*"],
      "@/app/*": ["./app/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 7. Configuración de Tailwind CSS

Actualizar `tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        inapa: {
          primary: "#1e40af",
          secondary: "#64748b",
          accent: "#f59e0b",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

### 8. Configuración de Next.js

Crear/actualizar `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'nodemailer'],
  },
  images: {
    domains: ['localhost'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
```

## Entregables

✅ Proyecto Next.js 14 inicializado con TypeScript  
✅ Todas las dependencias instaladas  
✅ shadcn/ui configurado con componentes básicos  
✅ Estructura de directorios creada  
✅ Variables de entorno configuradas  
✅ TypeScript y Tailwind CSS configurados  
✅ Next.js configurado para el proyecto

## Siguiente Paso
Continuar con **INSTRUCCIONES_02_BASE_DATOS_PRISMA.md** para configurar la base de datos y los modelos de Prisma.
