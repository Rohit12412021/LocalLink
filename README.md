# LocalLink (Kaali)

A **local-services marketplace** that connects people who need home/vehicle help with nearby professionals (mechanics, electricians, plumbers, car/mobile/AC repair).

| Name | Meaning |
|------|---------|
| **LocalLink** | Product brand shown in the UI (navbar, titles, copy) |
| **kaali** | npm package / folder name (`package.json` → `"name": "kaali"`) |

Primary geography in defaults: **Dharuhera / Rewari, Haryana** (`28.205, 76.795`). Guests can browse without an account; booking and provider tools require real email signup (no demo logins).

---

## Table of contents

1. [What you are building](#1-what-you-are-building)
2. [High-level architecture](#2-high-level-architecture)
3. [Tech stack (exact)](#3-tech-stack-exact)
4. [Repository layout](#4-repository-layout)
5. [How everything connects](#5-how-everything-connects)
6. [Domain model & database](#6-domain-model--database)
7. [Backend (NestJS) — module by module](#7-backend-nestjs--module-by-module)
8. [Frontend (Next.js) — layer by layer](#8-frontend-nextjs--layer-by-layer)
9. [Auth end-to-end](#9-auth-end-to-end)
10. [API reference](#10-api-reference)
11. [Page map & user journeys](#11-page-map--user-journeys)
12. [Components catalog](#12-components-catalog)
13. [Styling & UX patterns](#13-styling--ux-patterns)
14. [Environment & local setup](#14-environment--local-setup)
15. [Rebuild from scratch (checklist)](#15-rebuild-from-scratch-checklist)
16. [Data flow diagrams](#16-data-flow-diagrams)
17. [Known gaps / legacy code](#17-known-gaps--legacy-code)

---

## 1. What you are building

### Problem

People need on-demand local help (bike repair, wiring, leak, AC). Providers need a simple inbox to accept jobs. There is no shared place that is:

- searchable by category / distance / price / rating
- bookable with status tracking
- role-aware (customer vs provider)

### Roles

| Role (API value) | UI label | Can do |
|------------------|----------|--------|
| `User` | Customer | Browse, search, book, track “My Bookings” |
| `Provider` | Provider | Dashboard, services CRUD, availability, inbox Accept/Reject/Complete |
| `Admin` | — | Exists in types/enums only; **no admin UI** |

### Booking lifecycle

```
Pending  →  Accepted  →  Completed
    │
    └────→  Rejected
```

Only the **provider who owns the booking** can change status (`PATCH /requests/:id/status`).

---

## 2. High-level architecture

This repo is a **two-process app** in one folder:

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  Next.js App Router (port 3000)                              │
│  React 19 + Tailwind 4 + AuthProvider (localStorage JWT)     │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTP JSON
                             │  Authorization: Bearer <JWT>
                             │  NEXT_PUBLIC_API_URL
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  NestJS API (port 4000)                                      │
│  Controllers → Services → TypeORM entities                   │
│  JWT (passport-jwt) + bcrypt + class-validator               │
└────────────────────────────┬────────────────────────────────┘
                             │  SQL
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  PostgreSQL                                                  │
│  tables: users, providers, services, requests                │
└─────────────────────────────────────────────────────────────┘
```

**Important:** Frontend mock files under `src/data/providers.ts` and `src/data/requests.ts` are **legacy**. Live pages call the Nest API. Only `src/data/categories.ts` is still used (static UI category list + Lucide icons).

Frontend TypeScript **excludes** `backend/` (`tsconfig.json`), so the two packages are independent.

---

## 3. Tech stack (exact)

### Frontend (repo root)

| Package | Version | Why it is here |
|---------|---------|----------------|
| `next` | `16.3.3` | App Router, RSC, Turbopack, React Compiler flag |
| `react` / `react-dom` | `19.2.8` | UI |
| `typescript` | `^5` | Types |
| `tailwindcss` + `@tailwindcss/postcss` | `^4` | Utility CSS |
| `framer-motion` | `^13.4.0` | List/page motion on home, auth, dashboard, inbox |
| `lucide-react` | `^1.34.0` | Icons |
| `babel-plugin-react-compiler` | `1.0.0` | Enabled via `next.config.ts` → `reactCompiler: true` |

Scripts: `dev`, `build`, `start`, `lint`.

Path alias: `@/*` → `./src/*`.

### Backend (`backend/`)

| Package | Role |
|---------|------|
| `@nestjs/common` / `core` / `platform-express` `^12` | HTTP API |
| `@nestjs/typeorm` + `typeorm` + `pg` | PostgreSQL ORM |
| `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` | Auth |
| `bcrypt` | Password hashing (cost 10) |
| `class-validator` / `class-transformer` | DTO validation (global `ValidationPipe`) |
| `@nestjs/config` | Env loading |
| `uuid` | IDs where needed |

Port default **4000**. CORS origin default `http://localhost:3000`.

### Infrastructure

- **PostgreSQL only** (Neon / Supabase / Railway / local). Config throws if `DATABASE_URL` / host fields are missing.
- A leftover `backend/locallink.sqlite` file may exist on disk; it is **not** used by current config.

---

## 4. Repository layout

```
kaali/
├── package.json                 # Frontend app "kaali"
├── next.config.ts               # reactCompiler + turbopack.root
├── tsconfig.json                # paths @/* ; exclude backend
├── .env.example                 # NEXT_PUBLIC_API_URL
├── LOCAL_LINK.md                # Short ops guide (Postgres + accounts)
├── src/                         # Next.js frontend
│   ├── app/                     # Routes (App Router)
│   ├── components/              # Presentational UI pieces
│   ├── context/                 # AuthProvider
│   ├── data/                    # categories (live) + legacy mocks
│   ├── lib/                     # api, auth-storage, location
│   └── types/                   # Shared domain TypeScript types
└── backend/                     # NestJS API (own package.json)
    ├── .env.example
    ├── package.json
    └── src/
        ├── main.ts              # Bootstrap, CORS, ValidationPipe
        ├── app.module.ts        # Wires TypeORM + feature modules
        ├── auth/                # register, login, me, JWT strategy/guards
        ├── providers/           # list, detail, me/profile, services CRUD
        ├── requests/            # bookings + inbox + status
        ├── smart/               # price-suggest heuristic
        ├── users/entities/      # UserEntity
        ├── services/entities/   # ServiceEntity (provider offerings)
        ├── seed/                # Optional demo seed (SEED_DEMO)
        ├── config/              # Postgres TypeORM config
        └── common/              # enums, decorators, geo + price utils
```

---

## 5. How everything connects

### Boot sequence

1. Start Postgres (or use a hosted `DATABASE_URL`).
2. `cd backend && npm run start:dev` → Nest listens on `:4000`, `synchronize: true` creates tables.
3. Root `npm run dev` → Next on `:3000`.
4. Browser loads any page → `layout.tsx` wraps with `AppProviders` → `AuthProvider` boots:
   - read `localStorage['locallink_token']`
   - if present → `GET /auth/me`
   - on 401/403 → clear token

### Request path (typical client page)

```
Page useEffect / event handler
  → function in src/lib/api.ts (e.g. getProviders)
    → apiFetch()
      → fetch(`${NEXT_PUBLIC_API_URL}/providers?...`)
      → attaches Bearer token if present
      → JSON parse or ApiError
  → setState → React re-render → components
```

### Exception: provider detail is a Server Component

`src/app/provider/[id]/page.tsx` fetches the API **on the server** (no JWT needed for public profiles). Call / WhatsApp / Request buttons are plain links.

### Role routing (client-side only)

There is **no Next.js middleware**. Guards live inside pages:

| Route | Guard |
|-------|--------|
| `/dashboard`, `/provider-requests` | Must be logged in **and** `role === 'Provider'` |
| `/request-service` | Must be logged in (else redirect to login with `returnUrl`) |
| `/requests`, `/profile` | Soft empty state “Sign in” if guest |

Navbar shows an extra **Dashboard** link when `user.role === 'Provider'`.

---

## 6. Domain model & database

### ER relationships

```
User (1) ──────── (0..1) Provider
  │                      │
  │                      ├── (1..n) Service
  │                      │
  └── (1..n) Request ────┘
```

- Registering as **Provider** creates: `User` + linked `Provider` + one starter `Service`.
- Registering as **Customer** creates only `User`.
- Creating a booking creates `Request` with `status = Pending` and a public `displayId` like `REQ-001` (this is what the UI uses as `id`).

### Tables (TypeORM entities)

**`users`**

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `name`, `email` (unique), `passwordHash` | Auth |
| `phone`, `location` | Optional profile |
| `role` | `User` \| `Provider` \| `Admin` |
| `createdAt`, `updatedAt` | |

**`providers`**

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `name`, `category`, `location` | Business listing |
| `rating`, `reviewCount` | Defaults: new providers get rating `5`, reviews `0` |
| `distance`, `price` | Cached labels; distance often recomputed from lat/lng |
| `available` | Toggle from dashboard |
| `phone`, `whatsapp`, `experience`, `about` | Profile |
| `latitude`, `longitude` | Default Dharuhera on register |
| `userId` | Unique FK → users (1:1) |
| `services` | Eager `OneToMany` |

**`services`**

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `name`, `price`, `description` | Offering |
| `providerId` | FK, cascade delete |

**`requests`**

| Column | Notes |
|--------|--------|
| `id` | Internal UUID |
| `displayId` | Public id (`REQ-001`) returned to frontend as `id` |
| `userId`, `providerId`, `serviceId` | FKs (nullable / SET NULL) |
| `providerName`, `category`, `service`, `description` | Snapshot at booking time |
| `date`, `time`, `location`, `phone`, `price` | Booking details |
| `status` | Pending / Accepted / Rejected / Completed |
| `latitude`, `longitude` | Optional |

### Frontend types mirror the API

Canonical file: `src/types/index.ts`.

Key types: `Provider`, `ProviderService`, `ServiceRequest`, `RequestStatus`, `AuthUser`, `AuthResponse`, `LoginPayload`, `RegisterPayload`, `ProviderQueryParams`, `CreateServiceRequestPayload`, `PriceSuggestResponse`, etc.

---

## 7. Backend (NestJS) — module by module

### `main.ts`

- Loads `dotenv`
- `NestFactory.create(AppModule)`
- CORS for frontend origin
- Global `ValidationPipe`: whitelist, forbid non-whitelisted, transform + implicit conversion
- Listen on `PORT` (default 4000)

### `app.module.ts`

Imports:

- `ConfigModule` (global, `.env`)
- `TypeOrmModule.forRoot(getTypeOrmConfig())`
- `AuthModule`, `ProvidersModule`, `RequestsModule`, `SmartModule`, `SeedModule`

### `config/database.config.ts`

- **Asserts Postgres is configured** or throws a clear error
- Supports `DATABASE_URL` **or** `DATABASE_HOST` / `PORT` / `USERNAME` / `PASSWORD` / `NAME`
- `DATABASE_SYNC !== 'false'` → `synchronize: true` (auto schema; fine for learning, use migrations later)
- SSL when `DATABASE_SSL=true` or URL contains `sslmode=require`

### Auth module

| File | Job |
|------|-----|
| `auth.controller.ts` | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| `auth.service.ts` | Hash password, create user (+ provider starter if role Provider), issue JWT |
| `jwt.strategy.ts` | Extract Bearer token; payload → `{ userId, email, role, providerId }` |
| `jwt-auth.guard.ts` | Protect routes |
| `roles.guard.ts` + `@Roles()` | Restrict to Provider (etc.) |
| `dto/auth.dto.ts` | Email, password ≥8 with letter+number; Provider requires `businessName` + `category` |

JWT payload:

```ts
{ sub: userId, email, role, providerId }
```

Signed with `JWT_SECRET` (fallback only for local: `locallink-dev-secret-change-me`).

### Providers module

Public:

- `GET /providers?lat&lng&q&category&sort` — filter + Haversine distance + sort
- `GET /providers/:id`

Provider-only (`JwtAuthGuard` + `RolesGuard` + `@Roles(Provider)`):

- `GET|PATCH /providers/me/profile`
- `POST /providers/me/services`
- `PATCH|DELETE /providers/me/services/:serviceId`

**Sort modes** (see `providers.service.ts`): `distance`, `rating`, `price`, `smart` (blend of distance + rating + availability). Distance uses `haversineKm` in `common/utils/geo.util.ts`.

### Requests module

- `POST /requests` — JWT required; creates Pending booking; assigns `displayId`
- `GET /requests/mine` — customer’s bookings
- `GET /requests/inbox` — provider’s bookings (via linked provider profile)
- `GET /requests/:id` — by **displayId** (e.g. `REQ-001`)
- `PATCH /requests/:id/status` — provider only; must own the request
- Also: `GET /requests`, `GET /requests/provider/:id`, `DELETE /requests/:id` (wrappers exist; not all used by UI)

### Smart module

`GET /smart/price-suggest?category=&service=`

Rule-based heuristic (`suggestServicePrice`): keyword regex table → `{ suggested, min, max, confidence }`. Labeled `method: 'heuristic-ml'` in the response — not a trained model.

### Seed module

Optional demo providers when `SEED_DEMO` is enabled. Default is off; real users register their own accounts.

---

## 8. Frontend (Next.js) — layer by layer

### Root layout (`src/app/layout.tsx`)

```
<html>
  <body>
    <AppProviders>   {/* AuthProvider */}
      <Navbar />     {/* every page */}
      {children}
    </AppProviders>
  </body>
</html>
```

Metadata title: **LocalLink**.

### `src/lib/api.ts` — HTTP client

- Base URL: `process.env.NEXT_PUBLIC_API_URL` or `http://localhost:4000`
- `apiFetch<T>`: JSON headers, Bearer from `getToken()`, `cache: 'no-store'`
- Network failure → friendly error asking to start backend on 4000
- `ApiError` carries HTTP `status`
- Named exports for every endpoint the UI needs (auth, providers, services, requests, price suggest)

### `src/lib/auth-storage.ts`

```ts
TOKEN_KEY = 'locallink_token'
getToken / setToken / clearToken  // SSR-safe (no-op / null on server)
```

### `src/lib/location.ts`

- `detectUserLocation()` — browser geolocation; on fail → Dharuhera fallback
- `useUserLocation()` — currently a **stub** that always returns the fallback (pages that need real geo call `detectUserLocation` directly, e.g. home)

### `src/context/auth-context.tsx`

State: `user`, `token`, `loading`.

| Method | Behavior |
|--------|----------|
| bootstrap | token → `getMe()` |
| `login` / `register` | API → store token + user |
| `logout` | clear storage + state |
| `refreshMe` | re-fetch `/auth/me` |

`useAuth()` must be under `AuthProvider` or it throws.

### `src/data/categories.ts`

Six static categories with Lucide icons: Mechanic, Electrician, Plumber, Car Repair, Mobile Repair, AC Repair. Used on landing, home, register (provider category), search links.

---

## 9. Auth end-to-end

```
Register / Login form
  → AuthProvider.login|register
    → POST /auth/login|register
    → { accessToken, user }
    → localStorage.setItem('locallink_token', accessToken)
    → set React user state
  → redirect:
       Provider → /dashboard
       Customer → /home
       (login respects ?returnUrl=)

Later API calls
  → apiFetch reads token
  → Authorization: Bearer …

Page reload
  → AuthProvider mount → GET /auth/me
```

Password rules (backend enforced): min 8 chars, at least one letter and one number.

Provider registration **also** creates the business listing + starter service on the server in the same request.

---

## 10. API reference

Base: `http://localhost:4000` (or your `NEXT_PUBLIC_API_URL`).

| Method | Path | Auth | Used by |
|--------|------|------|---------|
| POST | `/auth/register` | No | Register page |
| POST | `/auth/login` | No | Login page |
| GET | `/auth/me` | JWT | Auth bootstrap |
| GET | `/providers` | No | Home, Search |
| GET | `/providers/:id` | No | Provider page, booking form |
| GET | `/providers/me/profile` | Provider | Dashboard |
| PATCH | `/providers/me/profile` | Provider | Availability toggle |
| POST | `/providers/me/services` | Provider | Dashboard add service |
| PATCH | `/providers/me/services/:id` | Provider | API ready; **UI unused** |
| DELETE | `/providers/me/services/:id` | Provider | Dashboard |
| GET | `/smart/price-suggest` | No | Booking form hint |
| POST | `/requests` | JWT | Create booking |
| GET | `/requests/mine` | JWT | My Bookings |
| GET | `/requests/inbox` | Provider | Inbox + dashboard counts |
| GET | `/requests/:id` | No* | Booking detail (`displayId`) |
| PATCH | `/requests/:id/status` | Provider | Accept / Reject / Complete |

\*Detail is public by id in current API; production apps often tighten this.

---

## 11. Page map & user journeys

### Routes

| Route | Kind | Purpose |
|-------|------|---------|
| `/` | Client | Marketing landing + CTA to `/home` |
| `/home` | Client | Greeting, location, categories, nearby providers (`sort=smart`) |
| `/search` | Client | `q`, `category`, filters; API + client re-filter |
| `/provider/[id]` | **Server** | Profile, services, Call / WhatsApp / Request |
| `/request-service?provider=` | Client | Booking form (auth required) |
| `/booking-confirmed?id=` | Client | Success screen |
| `/requests` | Client | Customer booking list |
| `/request/[id]` | Client | Detail + status timeline |
| `/login` | Client | Sign in + `returnUrl` |
| `/register` | Client | Customer / Provider signup |
| `/profile` | Client | Account info, logout, quick links |
| `/dashboard` | Client | Provider stats, availability, services |
| `/provider-requests` | Client | Inbox actions |

### Journey A — Guest browse

1. `/` → Find Services → `/home`
2. Geolocation (or fallback) + `GET /providers`
3. Category / search → `/search` → `/provider/:id`
4. Call / WhatsApp work without login
5. Request → redirected to `/login?returnUrl=...`

### Journey B — Customer book

1. Register as Customer (or login)
2. Browse → provider → Request
3. Form: pick service, date/time, location/phone (prefilled from profile), optional price hint
4. `POST /requests` → `/booking-confirmed?id=REQ-…`
5. Track at `/requests` and `/request/REQ-…`

### Journey C — Provider operate

1. Register as Provider (`businessName` + `category`) → `/dashboard`
2. Toggle availability; add/delete services
3. `/provider-requests`: Pending → Accept/Reject; Accepted → Complete
4. Customer sees new status on refresh of booking detail

---

## 12. Components catalog

| Component | Role |
|-----------|------|
| `layout/navbar.tsx` | Sticky LocalLink nav; role-aware links; mobile menu |
| `providers/app-providers.tsx` | Thin wrapper → `AuthProvider` |
| `home/search-bar.tsx` | Visual search entry → `/search` |
| `home/category-card.tsx` | Tile → `/search?category=` |
| `home/provider-card.tsx` | Nearby card → `/provider/:id` |
| `search/search-header.tsx` | Controlled `q` query param |
| `search/search-filters.tsx` | Chips: all / available / top-rated / nearest / low-price |
| `search/search-result-card.tsx` | Result row |
| `provider/provider-header.tsx` | Avatar initial, rating, distance, availability |
| `provider/provider-about.tsx` | About copy |
| `provider/provider-services.tsx` | Services & prices |

Pages own fetching and state; these components stay mostly presentational.

---

## 13. Styling & UX patterns

- Tailwind v4 via `@import "tailwindcss"` in `globals.css`
- Forced light body colors (avoid OS dark mode washing text)
- App chrome: teal primary (`teal-700` / `#0F766E`), amber accent, warm cream backgrounds on some screens
- Motion: Framer Motion stagger lists; CSS helpers `.animate-fade-in-up` / `-down`
- Landing page has its own marketing visuals (including a hopping rabbit `styled-jsx` animation) — slightly different from the teal “app shell”

---

## 14. Environment & local setup

### Frontend `.env.local` (from `.env.example`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Backend `backend/.env` (from `backend/.env.example`)

```env
PORT=4000
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=change-me-to-a-long-random-secret
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
DATABASE_SYNC=true
# SEED_DEMO=false
```

URL-encode special characters in passwords (`@` → `%40`, etc.).

### Run

```bash
# Terminal 1 — API
cd backend
npm install
npm run start:dev

# Terminal 2 — Web
npm install
npm run dev
```

Open http://localhost:3000 → **Create account** with a real email (Customer or Provider).

More ops notes: see `LOCAL_LINK.md`.

---

## 15. Rebuild from scratch (checklist)

Use this if you want to recreate the product yourself.

### A. Backend

1. NestJS 12 app on port 4000 with CORS to `:3000`.
2. PostgreSQL + TypeORM entities: User, Provider, Service, Request (as above).
3. Auth: register/login/me; bcrypt; JWT Bearer; RolesGuard for Provider routes.
4. On Provider register: create provider row + starter service; default lat/lng Dharuhera.
5. Providers list with category/`q` filter, Haversine distance, sort modes including `smart`.
6. Requests: display ids `REQ-00N`, mine/inbox, status updates owned by provider.
7. Smart price heuristic endpoint.
8. Global ValidationPipe matching DTO rules.

### B. Frontend

1. Next 16 App Router + Tailwind 4 + path alias `@/*`.
2. Types file matching API DTOs.
3. `api.ts` + `auth-storage` + `AuthProvider` wired in root layout + Navbar.
4. Implement every route in the page map with the same guards and redirects.
5. Categories static data; everything else from API.
6. Booking flow: provider → request-service → confirmed → detail/list.
7. Provider dashboard + inbox.

### C. Glue

1. Same field names between frontend types and backend DTOs.
2. Frontend treats request `id` as **displayId**.
3. `NEXT_PUBLIC_API_URL` points at the Nest server.

---

## 16. Data flow diagrams

### Auth + session

```
┌──────────────┐   locallink_token   ┌──────────────┐
│ AuthProvider │ ◄──────────────────► │ localStorage │
└──────┬───────┘                      └──────────────┘
       │ login / register / getMe
       ▼
┌──────────────┐   Bearer JWT   ┌──────────────┐
│   api.ts     │ ──────────────► │ Nest /auth/* │
└──────────────┘                 └──────────────┘
```

### Browse → book → manage

```
Home/Search                    Provider detail
GET /providers                 GET /providers/:id
       │                              │
       └──────────► Request form ◄────┘
                    (must be logged in)
                           │
                    POST /requests
                           │
                    booking-confirmed
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
     GET /requests/mine         GET /requests/inbox
     (customer)                 (provider)
                                       │
                              PATCH .../status
```

### Provider self-service

```
Dashboard
  GET  /providers/me/profile
  GET  /requests/inbox          (stats)
  PATCH /providers/me/profile   (available)
  POST  /providers/me/services
  DELETE /providers/me/services/:id
```

---

## 17. Known gaps / legacy code

| Item | Notes |
|------|--------|
| `src/data/providers.ts`, `requests.ts` | Old mocks; not used by live pages |
| `updateService` API | Implemented; no dashboard UI yet |
| `Admin` role | Typed only |
| `useUserLocation()` | Stub; prefer `detectUserLocation()` |
| `getRequests` / `getRequestsByProvider` | Client wrappers exist; pages use mine/inbox |
| Nested `backend/` | Separate `package.json` (and may have its own git history) |
| Root / backend default READMEs | Replaced here for the product; Nest’s stock README under `backend/` is the framework template |

---

## Quick mental model (one paragraph)

**LocalLink** is a Next.js client that talks to a NestJS + PostgreSQL API. Users register as Customer or Provider with email/password; JWT lives in `localStorage` and is sent on API calls. Customers discover providers (geo + category + sort), open a profile, and create a **Pending** booking. Providers manage their listing on the dashboard and move bookings through Accept/Reject/Complete in the inbox. Categories are static in the frontend; providers, services, and requests are owned by the database.

---

## License / status

Private learning / product prototype (`"private": true`). No demo accounts — register with your own email after Postgres is connected.
