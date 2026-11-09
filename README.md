# SanjeshP.Payeh Frontend

Next.js App Router frontend for the SanjeshP.Payeh ASP.NET Core API.

## Requirements

- Node.js 20.9 or newer (Node.js 22 LTS recommended)
- npm 10 or newer
- ASP.NET Core API running locally

## Setup (Windows PowerShell)

```powershell
cd D:\dev\payeh-frontend
Copy-Item .env.example .env.local
npm install
```

Edit `.env.local` and set `API_BASE_URL` to the ASP.NET Core API origin. Do not add `/api/v1` to the value.

```powershell
npm run dev
```

Open `http://localhost:3000/fa/login`. English is available at `/en/login`.

## Scripts

```powershell
npm run dev
npm run lint
npm run build
npm run start
```

## Architecture

- Browser calls same-origin `/api/bff/*` only.
- Next.js BFF calls `${API_BASE_URL}/api/v1/*` and holds Access/Refresh tokens in HttpOnly cookies.
- Refresh is rotating and single-flight per Node.js process. Multi-instance deployments should move refresh coordination to a shared store (for example Redis) before horizontal scaling.
- Mutating BFF requests require same-origin validation and a double-submit CSRF token.
- API responses are unwrapped from `{ isSuccess, statusCode, message, data }` and runtime-validated with Zod.
- User permissions and sidebar items are fetched from `GET /api/v1/permissions/me`. This endpoint is included in the companion backend source changes.
- UI permission checks are convenience only. The backend authorization middleware remains authoritative.

## Excel export

Audit logs export the currently displayed page as UTF-8 CSV with BOM, which opens correctly in Microsoft Excel. The backend currently has no export endpoint; the export is intentionally limited to the loaded page (maximum 100 records per API request).

## Environment

See `.env.example`. All API origins and security settings are server-only; no backend secret is exposed through `NEXT_PUBLIC_*`.
