# Alaa Eldien Dashboard

A responsive admin dashboard built with React, Vite, Tailwind CSS, and daisyUI. Uses the Alaa Eldien logo in `public/alaa-logo.png`.

Run locally:

```sh
npm install
npm run dev
```

Each page has its own component in `src/pages`: Home, Users, Services, ServiceAppointments, Marketplace, MarketplaceOrders, and Store. Shared UI lives in `src/components`; demo records live in `src/data/demo.js`.

Navigation uses hash URLs (for example, `/#/users`) and supports refreshing and browser back/forward navigation without server routing configuration.

Home includes a sales chart with a period selector, revenue breakdown, recent orders, and appointments. Other pages include searchable records or catalogs, category/status filters, pagination, record details, and CSV exports. The layout includes a collapsible mobile sidebar.

Users is the default landing page. It separates Individuals and Companies, supports all five supplied roles, and provides user details and confirmed deletion. Account type is independent of role. Unknown types remain visible in a separate section. Other pages still use dummy data; Home is reserved for later work.

The Users integration targets `https://alaaeldin.runasp.net`. Sign in through the Users page with an existing account or a JWT access token. Tokens stay in memory and are cleared when the Users page unmounts or the browser refreshes. No credentials are bundled into the app. Login calls `POST /api/v1/authentication/login`, using the Swagger spelling `remeberMe`; account information calls `GET /api/v1/users/me`. Both send `Accept-Language: en`. The live login response must return a JWT string or an object with `accessToken` or `token`.

The live Swagger currently exposes no admin user-directory or delete-by-ID routes. `DELETE /api/v1/users/me` deletes the signed-in account and is deliberately never used to delete another user. Until admin endpoints are supplied, the live directory displays an unavailable state. The clearly labeled Preview UI mode lets you review Individuals, Companies, role filters, and local deletion; refreshing preview restores its sample records. Live request errors never fall back to preview data.

To wire the missing admin routes, copy `.env.example` to `.env.local` and fill `VITE_USERS_LIST_PATH` and `VITE_USER_DELETE_PATH` with the actual documented paths. The delete path must contain `{id}`. Restart Vite after changing environment variables. Do not set the directory path to `/api/v1/users/me`. The directory adapter currently accepts an array, or `{ items: [], totalCount }`, directly or inside an `isSuccess`/`data` envelope. Only loaded records are searched and filtered; if the backend reports more records, the UI identifies the partial list. Confirm the backend pagination and account response schemas before connecting paginated endpoints. JWT authentication is documented by the live API; cookie credentials are optional and disabled by default.

If the backend uses different account fields, update `normalizeUser` in `src/api/users.js`. It accepts `accountType` or `userType` values `Individual`/`Company`, or an explicit `isCompany` boolean; it does not infer account type from a role.

Use `npm run build` for a production build, `npm run lint` for code checks, and `npm test` for mocked API contract/error tests. Tests never delete real accounts.
