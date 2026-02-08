## Start the Express app (Prisma → build → server)

### Prerequisites

- **Node.js + npm** installed
- **PostgreSQL** connection string

### 1) Install dependencies

```bash
cd real_state_backend
npm install
```

### 2) Configure environment variables

- Copy the example env file and fill values:

```bash
cp .env.example .env
```

- Required in `.env`:
  - **DATABASE_URL**: Postgres connection string
  - **PORT**: server port (default in example: `4000`)
  - **API_VERSION**: API prefix (example: `/api/v1`)
  - **ACCESS_TOKEN_SECRET**, **REFRESH_TOKEN_SECRET**
  - **RESEND_API_KEY**, 
  - **RESEND_FROM_EMAIL**

### 3) Prisma: generate client + sync schema

```bash
npm run prisma:generate
npm run prisma:push
```

If `prisma db push` complains about a missing datasource URL, ensure your `prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 4) Build the server

```bash
npm run build
```

### 5) Start the server

```bash
npm start
```

### Dev mode (optional)

```bash
npm run dev
```

### Verify it’s running

- **Health check**: `GET /health`
- **API base paths** (from `src/index.ts`):
  - `GET/POST ... ${API_VERSION}/user/...`
  - `GET/POST ... ${API_VERSION}/property/...`