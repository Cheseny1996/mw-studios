# Mzima Wells Studios

Digital ecosystem for Mzima Wells, built with Next.js and MongoDB and designed for deployment on Vercel.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `MONGODB_URI` to a MongoDB Atlas connection string in `.env.local`.
Set `AUTH_SECRET` to a unique, long random value. To bootstrap a global administrator,
set `SUPER_ADMIN_EMAIL` to the administrator's email before that account registers.
Restart the development server after changing `.env.local`. Never commit the file or
share the secret values.

## Database health

`GET /api/health/db` reports whether MongoDB is configured and connected. It does not expose credentials.

## Deployment

Deploy to Vercel and add `MONGODB_URI` in the Vercel production environment settings. Do not commit `.env.local`.
