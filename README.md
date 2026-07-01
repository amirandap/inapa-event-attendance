# inapa-event-attendance

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=000)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Google Calendar](https://img.shields.io/badge/Google_Calendar-API-4285F4?style=flat-square&logo=googlecalendar)](https://developers.google.com/calendar)
[![SQLite](https://img.shields.io/badge/SQLite-embedded-003B57?style=flat-square&logo=sqlite)](https://www.sqlite.org/)

Complete institutional event management platform for INAPA — handles guest lists, QR-based check-in, Google Calendar sync, automated email campaigns, and PDF/Excel attendance reports. Designed for internal ceremonies, workshops, and official meetings.

---

## 🚀 Features

- **End-to-end event lifecycle** — create event → invite guests → send QR codes → check in → export report
- **QR code check-in** — unique token per invitee; public check-in page requires no authentication
- **Google Calendar sync** — two-way sync via `POST /api/calendar/sync`; iCal import via `ical.js`
- **Automated email** — Nodemailer + React Email templates; QStash-backed async job queue
- **PDF & Excel exports** — `@react-pdf/renderer` for attendance sheets, ExcelJS for tabular data
- **Audit log** — every state change captured in `AuditLog` model
- **Short URL support** — `ShortUrl` model for human-friendly attendance links
- **Radix UI components** — accessible dialog, dropdown, tabs, select, switch primitives
- **Dark mode** — `next-themes` with system preference detection

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) · React 19 |
| Language | TypeScript 5 |
| Styling | TailwindCSS 4 · Radix UI · shadcn/ui conventions |
| ORM / DB | Prisma 6 · SQLite |
| Auth | JWT (`jsonwebtoken`) |
| Email | Nodemailer 7 · React Email · QStash (Upstash) |
| Calendar | Google Calendar API v3 · `googleapis` v156 |
| Reports | `@react-pdf/renderer` · ExcelJS · pdfkit |
| QR codes | `qrcode` |
| Job queue | Upstash QStash + Redis |
| Forms | React Hook Form 7 · Zod 4 |

---

## 🏗️ Architecture

```
Browser / Mobile
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                   Next.js 15 App Router                 │
│                                                         │
│  app/                                                   │
│  ├── (dashboard)/          Admin UI (authenticated)     │
│  │   ├── events/           Event CRUD + calendar view   │
│  │   ├── invitees/         Guest management             │
│  │   └── reports/          Export triggers              │
│  │                                                      │
│  └── a/[token]/            Public attendance form       │
│      (no auth required)                                 │
│                                                         │
│  api/                                                   │
│  ├── events/[id]/          Event REST endpoints         │
│  ├── checkins/             Check-in records             │
│  ├── invitees/             Guest list                   │
│  ├── calendar/sync         Google Calendar integration  │
│  ├── attendance/[token]    Public form submission       │
│  ├── exports/              PDF/Excel generation         │
│  └── mail/send             Email dispatch               │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma
                    ┌──────▼──────┐
                    │   SQLite    │
                    └─────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   Google Calendar    Upstash QStash   Nodemailer
   (event sync)      (email jobs)     (SMTP delivery)
```

### Data Model

```
Organizer ──< Event ──< Invitee ──< Checkin
                │          │
                │          └──< EmailJob
                │
                ├──< ShortUrl
                └──< AuditLog
```

---

## ⚙️ Getting Started

### Prerequisites

- Node.js 18+
- Google Cloud project with Calendar API enabled and OAuth 2.0 credentials
- SMTP server (or Gmail app password)
- Upstash account (QStash + Redis) for background email jobs

### Installation

```bash
git clone https://github.com/amirandap/inapa-event-attendance.git
cd inapa-event-attendance
npm install

# Set up environment (see table below)
cp .env.local.example .env.local

# Initialise database
npm run db:push
npm run db:seed   # optional sample data
```

### Development

```bash
npm run dev          # runs scripts/dev.sh (Next.js dev server)
npm run db:studio    # Prisma Studio visual DB browser on :5556
```

### Production build

```bash
npm run build
npm start
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Prisma connection string — `file:./dev.db` for SQLite |
| `NEXTAUTH_SECRET` | ✅ | Session signing secret (32+ random chars) |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth 2.0 client secret |
| `GOOGLE_REFRESH_TOKEN` | ✅ | Offline refresh token for server-side Calendar calls |
| `UPSTASH_REDIS_URL` | ✅ | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | ✅ | Upstash Redis token |
| `UPSTASH_QSTASH_TOKEN` | ✅ | QStash publishing token |
| `QSTASH_CURRENT_SIGNING_KEY` | ✅ | QStash webhook verification key |
| `QSTASH_NEXT_SIGNING_KEY` | ✅ | QStash webhook rotation key |
| `SMTP_HOST` | ✅ | Outbound SMTP server hostname |
| `SMTP_PORT` | ❌ | SMTP port (default `587`) |
| `SMTP_USER` | ✅ | SMTP authentication username |
| `SMTP_PASS` | ✅ | SMTP authentication password |
| `SMTP_FROM` | ❌ | Sender address (default `minutas@inapa.gob.do`) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Public base URL for QR code generation |

---

## 📁 Project Structure

```
inapa-event-attendance/
├── app/
│   ├── (dashboard)/        # Admin views (auth required)
│   ├── a/[token]/          # Public attendance form
│   └── api/                # API route handlers
├── components/
│   ├── ui/                 # Radix UI / shadcn primitives
│   ├── forms/              # Form components
│   ├── events/             # Event-specific components
│   └── dashboard/          # Layout components
├── lib/
│   ├── google/             # Calendar API client
│   ├── pdf/                # PDF generation helpers
│   ├── excel/              # Excel generation helpers
│   ├── qr/                 # QR code generation
│   ├── jobs/               # QStash job definitions
│   └── email/              # Email templates
├── prisma/
│   ├── schema.prisma       # DB schema (7 models)
│   ├── migrations/         # Migration history
│   └── seed.ts             # Seed data
└── scripts/
    └── dev.sh              # Development startup script
```

---

## 📡 API Reference

### Events

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/events` | List all events |
| `POST` | `/api/events` | Create event |
| `GET` | `/api/events/[id]` | Get event detail |
| `PUT` | `/api/events/[id]` | Update event |
| `DELETE` | `/api/events/[id]` | Delete event |

### Invitees & Check-ins

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/invitees` | List invitees (filterable by `eventId`) |
| `POST` | `/api/invitees` | Add invitee |
| `GET` | `/api/checkins` | List check-in records |
| `POST` | `/api/checkins` | Manual check-in |
| `PUT` | `/api/checkins/[id]` | Update check-in record |
| `DELETE` | `/api/checkins/[id]` | Remove check-in |

### Integrations

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/calendar/sync` | Sync event to Google Calendar |
| `GET` | `/api/attendance/[token]` | Load public attendance form |
| `POST` | `/api/attendance/[token]` | Submit attendance (no auth) |
| `POST` | `/api/exports` | Trigger PDF/Excel export job |
| `GET` | `/api/exports/[id]/pdf` | Download generated PDF |
| `POST` | `/api/mail/send` | Dispatch email to invitees |

### Public page

`/a/[token]` — Invitee-facing attendance registration form. Accessible without login; token is unique per invitee and embedded in the QR code sent by email.

---

## 🚢 Deployment

```bash
# Build
npm run build

# Start (PM2 recommended)
pm2 start npm --name inapa-event-attendance -- start
pm2 save
pm2 startup
```

Ensure `NEXT_PUBLIC_APP_URL` matches the public domain so QR codes resolve correctly. The SQLite file should be on a persistent volume in containerised environments. For high-traffic deployments, migrate `DATABASE_URL` to PostgreSQL and update `prisma/schema.prisma` accordingly.

---

> Proprietary software — Instituto Nacional de Aguas Potables y Alcantarillados (INAPA), República Dominicana.
> Technical contact: minutas@inapa.gob.do · Departamento de TI
