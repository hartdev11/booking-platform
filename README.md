# Booking Platform

A multi-tenant booking platform for salons, spas, and service businesses. Customers book via LINE LIFF; admins manage bookings and receive Line notifications.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Firebase Firestore
- **Auth:** Firebase Auth (admin), LINE LIFF (customer)
- **Messaging:** LINE Messaging API
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Deployment:** Vercel

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Web API key (client) | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Cloud Messaging sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app ID | Yes |
| `FIREBASE_ADMIN_PROJECT_ID` | Firebase project ID (server) | Production |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Service account client email | Production |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Service account private key (escape newlines) | Production |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket for Admin SDK (e.g. `project-id.appspot.com`) | Optional |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full service account JSON string (local dev alternative) | Local |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON file (local dev) | Local alternative |
| `NEXT_PUBLIC_LIFF_ID` | LINE LIFF app ID for customer booking | Yes (customer flow) |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `https://your-app.vercel.app`) for Line message links | Production |
| `VERCEL_URL` | Set by Vercel; used as fallback for `NEXT_PUBLIC_APP_URL` | Vercel |
| `CRON_SECRET` | Secret for cron endpoint auth (e.g. `/api/cron/reminders`) | Yes (cron) |

Tenant-specific credentials (LINE channel access token, channel secret, admin LINE user ID) are stored in Firestore per tenant.

## Local Development Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy environment template and fill in values:

   ```bash
   cp .env.local.example .env.local
   ```

3. For Firebase Admin locally, either:
   - Set `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` in `.env.local`, or
   - Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account JSON file, or
   - Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the full JSON string of the service account.

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000).

## Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com).
2. Enable Firestore Database and set security rules (use `firestore.rules`).
3. Enable Storage and set rules (use `storage.rules`).
4. Create a web app in the project; copy the client config into `.env.local` as `NEXT_PUBLIC_FIREBASE_*`.
5. Generate a service account key (Project Settings → Service accounts → Generate new private key). Use the JSON for local dev or set `FIREBASE_ADMIN_*` in production.
6. Deploy Firestore indexes: `npm run firebase:deploy` (or `firebase deploy --only firestore:indexes`).

## Line OA Setup

1. Create a LINE Official Account and a LINE Login (LIFF) app at [LINE Developers](https://developers.line.biz).
2. For the OA: get Channel ID, Channel Secret, and Channel Access Token (long-lived). Store these in Firestore in the `tenants` collection per tenant (or use a single tenant for testing).
3. For LIFF: create a LIFF app, set the endpoint URL to your app URL (e.g. `https://your-app.vercel.app/booking`), and copy the LIFF ID to `NEXT_PUBLIC_LIFF_ID`.
4. Set the webhook URL for your OA to `https://your-domain.com/api/webhook/line/[tenantId]` (replace `[tenantId]` with the tenant document ID).

## Vercel Deployment Steps

1. Push the repository to GitHub and import the project in [Vercel](https://vercel.com).
2. Add all environment variables in Vercel (Project Settings → Environment Variables). Use Production and Preview as needed.
3. For Firebase Admin on Vercel, set `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` (paste private key with `\n` for newlines).
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL (e.g. `https://your-project.vercel.app`).
5. Set `CRON_SECRET` to a random string and configure the cron job to send `Authorization: Bearer <CRON_SECRET>` when calling `/api/cron/reminders`.
6. Deploy: `npm run deploy` or push to the connected branch.

## Folder Structure

```
booking-platform/
├── .github/workflows/     # CI/CD (e.g. deploy.yml)
├── src/
│   ├── app/
│   │   ├── (admin)/       # Admin dashboard (tenant, services, staff, bookings)
│   │   ├── (auth)/        # Admin login
│   │   ├── (customer)/    # Customer booking flow (date, time, service, staff, confirm, success, status, reschedule)
│   │   ├── api/           # API routes (webhook, customer bookings, cron, auth)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/        # UI (admin, customer, shared)
│   ├── hooks/             # useTenantServices, useTenantStaff, useAvailability, useCustomerBookings
│   ├── lib/
│   │   ├── booking/       # stateMachine, reminderScheduler
│   │   ├── firebase/      # admin, client, Firestore helpers (createBooking, availability, etc.)
│   │   ├── line/          # LINE client, messages, notify, liff
│   │   └── utils/         # cn, error, validation, formatThaiDate
│   ├── stores/            # bookingFlowStore
│   └── types/             # Shared TypeScript types
├── firestore.indexes.json
├── firestore.rules
├── storage.rules
├── next.config.ts
├── vercel.json            # Cron configuration
└── package.json
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Run ESLint with auto-fix |
| `npm run type-check` | TypeScript check (no emit) |
| `npm run deploy` | Deploy to Vercel (production) |
| `npm run firebase:deploy` | Deploy Firebase (rules, indexes) |
| `npm run firebase:emulate` | Start Firebase emulators |
