# Northstar frontend

Vite + React app for the Northstar learning portal. The signed-in product is light by default, with a light/dark toggle stored in `localStorage` (`ns-theme`). The first visit follows `prefers-color-scheme`. Landing and sign-in stay on the night theme.

## Run

```bash
npm install
npm run dev
```

Set `VITE_API_URL` (see `.env.example`) to the API origin. Paths in `src/api` already include the `/api` prefix.

```bash
npm run build
```

## Design system

Color, type, radius, and motion live as `--ns-*` variables in `src/styles/tokens.css`. Components use those variables (and the semantic aliases such as `--bg-canvas` and `--text-primary`). Do not hard-code hex colors in components.

Headings use Plus Jakarta Sans. Body text uses Inter. Both are self-hosted through Fontsource with `font-display: swap`.

Shared controls are in `src/components/primitives` (button, input, password input, badge, card, avatar, tabs, dialog, confirm dialog, combobox, toast, skeleton, empty state, stat card). Course images go through `CourseCover`. A dev gallery is at `/_design`.

## Routes

| Path | Who |
|---|---|
| `/` | Public landing. Signed-in visitors stay here and can open their dashboard. |
| `/login`, `/signup` | Email + password + role. Signup also asks for a username. |
| `/courses`, `/courses/:id` | Students. `/student` redirects here. |
| `/teacher`, `/teacher/courses/:id` | Teachers. |
| `/admin`, `/admin/courses`, `/admin/people` | Admins. |

Unknown paths show a 404 with the compass mark.

Students only see courses an admin assigned. Teachers edit lessons on assigned courses and do not create courses. A lesson is an ordered stack of text and video blocks. The teacher adds, reorders, and removes those blocks. The student course page renders them in that order, after Previous and Next.

Admins create and manage courses, including an optional cover sent as a `cover` object on `POST` and `PATCH /api/admin/courses`. Unsplash search uses `GET /api/images/unsplash/search`. The access key stays on the server.
