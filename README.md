# Noted

A full-stack notes application with React, Express, user authentication, and per-user data storage.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Without `DATABASE_URL`, local development uses `server/data/store.json` automatically.

## PostgreSQL

Copy `.env.example` to `.env`, set `DATABASE_URL`, and expose those variables to the Node process. The server creates the `users`, `sessions`, and `notes` tables automatically.

## Production

```bash
npm run build
NODE_ENV=production DATABASE_URL=postgresql://... npm start
```

In production, Express serves the built React application and the `/api` endpoints from one service. `render.yaml` can provision both the application and a PostgreSQL database on Render.

## Storage

- Production: PostgreSQL through `DATABASE_URL`
- Local fallback: `server/data/store.json`
- Browser: authentication token only

Passwords are salted and hashed using Node's `scrypt`. Session tokens are stored as SHA-256 hashes and expire after 30 days.

## Welcome emails

Create a Resend API key and verify a sending domain, then configure:

```text
RESEND_API_KEY=re_...
WELCOME_FROM_EMAIL=Noted <welcome@yourdomain.com>
```

New users receive a welcome email after successful signup. If email delivery fails, account creation still succeeds and the server records the error in its logs.
