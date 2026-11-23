# Japaika Admin Frontend (`admin-frontend/`)

Internal administrative portal for the **Japaika E-commerce** platform, built with Next.js App Router, strict TypeScript, Tailwind CSS v4, and shadcn/ui (`base-nova` on `@base-ui/react`).

## Stack

- **Framework**: Next.js 16 (App Router, Turbopack) + React 19
- **Language**: TypeScript (`strict: true`)
- **Styling & UI**: Tailwind CSS v4, shadcn/ui (`base-nova`), `@base-ui/react`, `lucide-react`
- **State & Data**: Redux Toolkit, TanStack Query, Axios (`withCredentials: true`)
- **Forms & Validation**: React Hook Form, Zod, `@hookform/resolvers`
- **Notifications**: Sonner

## Local Development

1. Configure environment variables (copy `.env.example` to `.env.local` if customizing the API URL):
   ```bash
   NEXT_PUBLIC_ADMIN_API_URL=http://localhost:5001/api/v1
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Ensure `admin-backend` is running on `http://localhost:5001` with `ADMIN_FRONTEND_URL=http://localhost:3001`.
4. Start the admin portal on port `3001`:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3001](http://localhost:3001).

## Scripts

- `npm run dev` — Start development server on port `3001`
- `npm run build` — Create production build
- `npm run start` — Start production server on port `3001`
- `npm run lint` — Run ESLint
- `npm run typecheck` — Run TypeScript type check (`tsc --noEmit`)
