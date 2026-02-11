# Deploy to Vercel

## 1. Push your code to GitHub

Make sure your project is in a Git repository and push to GitHub (or connect another Git provider in Vercel).

## 2. Create a Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in.
2. Click **Add New…** → **Project**.
3. Import your **Hostel Management System** repository.
4. Leave **Build Command** as is (uses `npm run build` from `package.json`).
5. Leave **Output Directory** empty (Express is a server app).

## 3. Set environment variables

In your Vercel project: **Settings** → **Environment Variables**. Add:

| Name | Description |
|------|-------------|
| `DB_USER` | PostgreSQL user (e.g. from Neon) |
| `DB_HOST` | PostgreSQL host |
| `DB_NAME` | Database name |
| `DB_PASSWORD` | Database password |
| `DB_PORT` | `5432` (if not set) |
| `SESSION_SECRET` | Strong random string for sessions |

Optional (for email):

- `MAIL_USER` – SMTP user (e.g. Gmail)
- `MAIL_PASS` – SMTP password or app password

Use the same values you use in `index.env` locally (e.g. from Neon).

## 4. Deploy

Click **Deploy**. Vercel will:

- Run `npm install`
- Run `npm run build` (copies `static/public` → `public` for static assets)
- Deploy your Express app as a serverless function

Your app will be available at `https://your-project.vercel.app`.

## Notes

- **Sessions**: The app uses in-memory sessions. On Vercel (serverless), sessions do not persist across requests. For real login/session persistence, use a store like Redis or a database-backed session store.
- **Static files**: CSS, JS, and images are served from the root `public/` folder (created in build). HTML pages are still served by Express.
- **Local development**: Run `npm start` (or `node index.js`). Do not set `VERCEL` in your local env.
