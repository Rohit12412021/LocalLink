# LocalLink — PostgreSQL + real email accounts

## How accounts work (no demo logins)

1. Open **Create account** (`/register`)
2. Choose **Customer** or **Provider**
3. Sign up with **your real email** + password
4. Sign in later with that same email

| Role | What they do |
|------|----------------|
| **Customer** | Browse providers, book services with their email account |
| **Provider** | Register business email → Dashboard → add services → accept/reject bookings |

---

## REQUIRED: connect PostgreSQL

There is **no local SQLite**. The API will not start without Postgres.

### Steps

1. Create a Postgres database (pick one):
   - [Neon](https://neon.tech) (free) → copy connection string  
   - [Supabase](https://supabase.com) → Project Settings → Database → URI  
   - Local Postgres: create DB `locallink`

2. Open **`backend/.env`** and set:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
```

Example (local):

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/locallink
```

3. Restart backend:

```bash
cd backend
npm run start:dev
```

Tables are created automatically (`DATABASE_SYNC=true`).

### Run the app

```bash
# Terminal 1
cd backend && npm run start:dev

# Terminal 2
npm run dev
```

Then: http://localhost:3000 → **Create an account with your email**
