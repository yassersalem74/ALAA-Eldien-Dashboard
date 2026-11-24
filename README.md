# Alaa Eldien Dashboard

A responsive admin dashboard built with React, Vite, Tailwind CSS, and daisyUI. Uses the Alaa Eldien logo in `public/alaa-logo.png`.

Run locally:

```sh
npm install
npm run dev
```

Pages live in `src/pages`. Shared UI lives in `src/components` and API adapters live in `src/api`.

Navigation uses hash URLs (for example, `/#/users`) and supports refreshing and browser back/forward navigation without server routing configuration.

Home shows API-backed service and product counts, pending company reviews, and the first page of partner order and appointment activity for the signed-in account. The order chart counts the orders shown on Home. Store and Marketplace share product and order workflows. All orders includes both customer and partner scopes and displays orders with an unclassified sales channel.

The Users page uses the dashboard's admin session and shows the signed-in account under My account. Its Companies tab lists companies with backend search, status filters, and pagination. Admins can review a company's details and submit an approval or rejection with an optional note.

The dashboard signs in against `https://alaaeldin.runasp.net` by default. It stores the admin access token in browser local storage for that backend and revalidates the account on refresh. Login calls `POST /api/v1/authentication/login` with `remeberMe` enabled, using the Swagger spelling. Account validation calls `GET /api/v1/users/me`. Login expects a JWT string or an object with `accessToken` or `token`. Enable `VITE_API_USE_COOKIES` for session renewal when the backend supplies a refresh cookie and supports credentialed CORS.

The Individuals tab requires an admin user-directory endpoint. Once configured, it supports search, role filters, and user details. Account type is independent of role. Records without an account type are labeled Unclassified. Deletion requires an admin delete-by-ID endpoint. `DELETE /api/v1/users/me` belongs to the signed-in account.

To wire the missing admin routes, copy `.env.example` to `.env.local` and fill `VITE_USERS_LIST_PATH` and `VITE_USER_DELETE_PATH` with the actual documented paths. The delete path must contain `{id}`. Restart Vite after changing environment variables. Do not set the directory path to `/api/v1/users/me`. The directory adapter currently accepts an array, or `{ items: [], totalCount }`, directly or inside an `isSuccess`/`data` envelope. Only loaded records are searched and filtered; if the backend reports more records, the UI identifies the partial list. Confirm the backend pagination and account response schemas before connecting paginated endpoints. JWT authentication is documented by the live API; cookie credentials are optional and disabled by default.

If the backend uses different account fields, update `normalizeUser` in `src/api/users.js`. It accepts `accountType` or `userType` values `Individual`/`Company`, or an explicit `isCompany` boolean; it does not infer account type from a role.

Use `npm run build` for a production build, `npm run lint` for code checks, and `npm test` for mocked API contract/error tests. Tests never delete real accounts.
