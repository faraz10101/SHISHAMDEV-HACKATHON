# ScamShield API (for the frontend)

Base URL: your backend URL. All responses: `{ success: boolean, message?: string, data?: ... }`.
Every `message` is already user-friendly English: show it directly on errors.

## 0. Accounts (email OTP via Resend) — required to REPORT
Responses: `{ success, message, ... }`. Auth works with the `token` cookie (send `credentials: "include"`) **or** `Authorization: Bearer <token>`.
Flow: **register -> email gets 6-digit code -> verify-email (returns token, user is now logged in) -> go to home page (`GET /api/feed`)**.

- `POST /api/auth/register` `{ username, email, password }` -> `{ email, expiresIn: 60 }` (account stays unverified until the code is entered)
- `POST /api/auth/verify-email` `{ email, code }` -> `{ token, user }` + login cookie. Errors carry `action: "resend"` when the code expired or 5 wrong guesses were used.
- `POST /api/auth/resend-code` `{ email }` (30 s cooldown, 429 + `retryAfter`)
- `POST /api/auth/login` `{ username | email, password }` -> `{ token, user }`. Unverified account -> 403 `{ action: "verify", email }` (send the user to the code screen)
- `GET /api/auth/me` -> `{ user }` (use it on app start to restore the session)
- `POST /api/auth/logout`

Only **email-verified** accounts can call `POST /api/reports` (401 `action: "login"` if not logged in, 403 `action: "verify"` if unverified).
Checking (`/api/check`), lookup, complaint and the home feed stay public.

## 1. Homepage "scam weather"
`GET /api/feed?city=Hyderabad`  (city optional)
data: `{ date, headline, summary, tips[], totals:{ reportsToday, peopleReported, reportedLossToday },
byType[{type,label,reports,people}], trending[{brand,label,reports}], topNumbers[{number,label,uniqueReporters}],
last7Days[{date,reports}], topCities[{city,reports}], recent[{label,brand,snippet,city,createdAt}], summaryMode }`
Tip: "peopleReported" = unique people who reported being targeted today. Cached for 60s.

## 2. Check a message / link / number
`POST /api/check`  body: `{ "content": "pasted text, link or phone number" }`
data: `{ verdict: "scam|suspicious|safe", level: "red|yellow|green", riskScore 0-100, headline, reasons[], whatToDo[],
extracted:{numbers,urls,scamTypeLabel,brand,summary}, ruleFindings[], reputation:{numbers[],hosts[]},
similar:{matchCount,uniqueReporters,samples[]}, analysisMode: "ai|fallback", disclaimer }`
reputation item: `{ value, uniqueReporters, totalReports, level: none|suspicious|dangerous|critical }`
Always show `disclaimer`.

## 3. Report a case (login + verified email required)
`POST /api/reports`  body: `{ message?, numbers?: string[], url?, amountLost?, city?, scamType? }`
At least one of: message (20+ chars), numbers, url. 409 = this account already reported it (one report per verified person; "unique reporters" now means unique verified accounts).
data: `{ reportId, reputation, complaintReady }`  (complaintReady = 20+ unique reporters)

## Extras
- `GET /api/reports/lookup?q=<number or link>`: quick reputation, no AI
- `GET /api/reports/complaint?target=<number or link>`: copy-ready complaint text (needs 20+ unique reporters). data.text
- `GET /api/health`

## Admin (header `x-admin-key: <ADMIN_KEY>`)
- `GET /api/admin/providers`
- `POST /api/admin/providers` `{ name, type: "gemini"|"openai", model, embedModel?, baseUrl?, apiKey, priority }`
- `PATCH /api/admin/providers/:id` `{ enabled, priority, model, apiKey ... }`
- `DELETE /api/admin/providers/:id`
- `POST /api/admin/providers/:id/test`
- `POST /api/admin/providers/reset-cooldowns`
