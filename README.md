# Life Progress Tracker — navigation and session-state increment

A partial implementation of a much broader AI Life Progress Tracker specification. **This increment adds two real routes and shared session memory to the manual journal; it does not complete the six-area architecture or the AI tracker.** It is for source review and experimentation with fictional data, not real health-record storage.

The interface is Traditional Chinese, with Hong Kong dates/times (`Asia/Hong_Kong`). Code identifiers and documentation are English. Light/dark styling follows the operating system.

## Completed scope

- **Today (`/`)**: chronological two-lane daily journal, date picker, seven-day selector, previous/next-day controls and record-type filtering.
- **Add Record (`/add-record`)**: dedicated manual capture, review, return-to-edit and explicit save confirmation. Saving returns to the journal on the saved record's date and clears the filter so the record is visible.
- Desktop navigation and mobile bottom navigation link only these two implemented areas. Active-route styling, a skip link, one main landmark and route-change focus handling are included; these do not establish accessibility conformance.
- A shared **Zustand session-memory store** retains records, selected date, filter, unsaved check-in fields, and Add Record draft/review state across route changes. It is not persistent storage. A populated Add Record draft is retained instead of being silently overwritten by a quick action.
- Manual meals, water, exercise, hobbies/rest and notes. Numeric values are optional: unknown (`null`) is distinct from zero. Meal calories are user-entered estimates, not AI measurements.
- Shared record review/edit form, original-input preservation when editing, and deletion requiring confirmation.
- Optional sleep hours, mood, energy and reflection check-in. A saved check-in replaces an existing check-in for the same date rather than adding a duplicate.
- JSON export of the complete current in-memory record list. Import and restore are not implemented.

**Not implemented:** full History, Progress, Reflections or Settings; persistence, backend, authentication, authorization, private media storage, photo/screenshot/voice capture, OCR, transcription, AI providers, mock extraction or AI insights. Installed libraries and reusable scaffold components are not claims of product features.

## Screens and source layout

These are source-based descriptions, not screenshots or browser-test receipts.

1. Today presents date/filter controls, the two-lane journal, inline daily check-in, quick manual-entry actions and JSON export. Existing records open the shared review/edit form in a dialog.
2. Add Record presents the reusable manual form and review step. Navigation away and back retains its draft within the current loaded session; confirmation saves and returns to Today.
3. Desktop and mobile navigation expose only Today and Add Record. Four requested main areas remain TODOs, not placeholder completed screens.

The existing stack is **React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui/Radix, React Router 7, Zustand and Bun**; it is not a Next.js/Supabase implementation.

```text
.
├── README.md
├── VALIDATION.md
├── .env.example
├── .gitignore
├── package.json
├── bun.lock
├── package-lock.json
├── components.json
├── eslint.config.js
├── index.html
├── tsconfig*.json
├── vite.config.ts
├── vite-dev-reload.ts
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── routes.tsx
    ├── index.css
    ├── components/
    │   ├── app-shell.tsx
    │   ├── record-form.tsx
    │   └── ...
    ├── hooks/
    ├── lib/
    │   ├── life-data.ts
    │   ├── store.ts
    │   ├── life-data.test.mjs
    │   ├── store.test.mjs
    │   ├── navigation.test.mjs
    │   └── ...
    ├── pages/
    │   ├── home.tsx
    │   ├── add-record.tsx
    │   └── not-found.tsx
    └── types/
```

Required scaffold source, manifests, both lockfiles and build configuration are retained unchanged. `vite.config.ts` imports `vite-dev-reload.ts`, which must remain present. Hosting metadata and instruction documents are excluded. Reader-facing documentation and the staged `.gitignore` are archive-specific, not application-code changes.

## Local setup

Use Bun with a compatible JavaScript/Node tooling environment. Vite 7's Node toolchain requires Node.js 20.19+ or 22.12+ when invoked through Node. Packaging checks used Bun 1.3.14, Node.js v24.7.0 and Vite 7.3.5 with existing installed dependencies. The archive retains the original Bun and npm lockfiles; this is not proof that either clean external installation has been tested.

From the extracted project directory:

```sh
bun install --frozen-lockfile
bun run dev
```

Open the local address Vite prints (normally `http://127.0.0.1:5173`). The existing development config uses a strict port: an occupied port can prevent startup. Do not expose the development server as a production service. Fresh-machine installation and standalone deployment remain unverified.

### Environment and integrations

There are **no required app-specific environment variables or API keys** because this increment has no integrations. `.env.example` contains explanatory comments only and need not be copied. There is no database, migration, storage bucket, AI-provider setup or mock-provider switch.

Future credentials belong only in a trusted server-side environment, never browser code or `VITE_*` variables. Do not commit real `.env` files or registry credentials.

### Platform dependency and portability

The unchanged scaffold depends on **`@microsoft/managed-apps`** and includes hosted preview/connector/runtime helpers. Passing checks with already-installed dependencies does not establish registry availability, clean restoration, embedded-host compatibility, standalone routing or deployment portability. An external developer may need access to the relevant package registry and must review hosting assumptions. No dependency removal, configuration rewrite or portability workaround is included.

## Development, tests and build

```sh
# Static TypeScript check; no browser execution.
bun run typecheck

# Data/store unit tests plus Happy DOM React component integration tests.
bun test src/lib/life-data.test.mjs src/lib/store.test.mjs src/lib/navigation.test.mjs

# Full existing repository lint command.
bun run lint

# Actual production build, distinct from build-check mode.
bun run build

# Optional inspection of an already-produced build.
bun run preview
```

`bun run check` combines typecheck, build-check and lint; its build-check mode is not the actual production build. **New packaging checks passed:** typecheck; full lint with zero errors and two retained scaffold warnings; **30 tests passed, zero failed, 145 assertions** across three files; and the actual production build. Test groups are nine data tests, eleven store tests and ten Happy DOM component integration tests. The build transformed 2,530 modules and emitted a large-chunk warning. See `VALIDATION.md` for exact receipts and boundaries. The combined `check` command and `preview` were not rerun.

The source includes data validation/fixture unit tests, store tests for draft retention, date selection, validation, original-input preservation and check-in replacement, and React component integration tests using Happy DOM/MemoryRouter. Component coverage includes navigation, draft/review retention, save/return, edit/delete confirmation, check-in replacement, error association and JSON payload/download-request construction. **Happy DOM is not a real browser:** it does not validate responsive rendering, actual browser history/server fallback behavior or a saved download on disk. Clean external install and actual-browser coverage must be reported separately.

**This archive does not publish the updated code. The previously published app is unchanged by this source-only iteration.** No deployment, GitHub upload, push or commit is included. Uploading the source to GitHub does not automatically create a working website.

## Data, privacy and safety

**Journal data and drafts live only in the currently loaded JavaScript session. In-app route changes retain the shared store; refreshing, closing, or navigating away/reloading loses manual data and drafts and reloads the fixture.** There is no localStorage, IndexedDB, persistence middleware, database, sync, durable backup or restore. Check-in draft retention is across route changes, not a durable per-date draft archive. Edit-dialog state is local and is not a cross-route retained Add Record draft.

`initialRecords` remains the **same eight-row fictional fixture**, generated relative to the current Hong Kong date. It is not real personal history. Fixture and manual entries share one collection; there is no secure isolated demo mode. JSON export includes all remaining fixture entries plus manual additions. Remove unwanted fixture records before exporting. Downloads are unencrypted, may contain sensitive information, and should never be committed to a repository. Deletion in the app only affects current session memory, not already-downloaded copies.

There is **no true health-record security**: no sign-in, ownership enforcement, authorization or private storage. Do not enter real sensitive health data or rely on this as the only copy of records. Authored journal workflows do not send entries to an AI provider, cloud database or analytics service; retained hosting/diagnostic helpers mean this is not a blanket guarantee about host telemetry. No security certification is claimed.

The staged `.gitignore` excludes real environment files (while allowing `.env.example`), local registry credentials, personal export filenames and private upload/data directories. Ignore rules do not provide access control or remove already-tracked files; review every file before publishing a public repository.

This is not a medical device and provides no diagnosis, causal health inference or arbitrary life score. Nutrition values are manual estimates; absent values are not invented.

## Deferred specification / concrete TODOs

The following are not implemented. They describe future work, not available or simulated features.

1. **Remaining navigation and localization:** Today and Add Record routes, desktop navigation and mobile bottom navigation are implemented. Add the four missing main areas: full History, Progress, Reflections and Settings. Keep Add Record reachable throughout and expand localization without losing original Cantonese/English text.
2. **Secure identity and persistence:** add sign-in, ownership, server authorization, user-scoped relational tables and migrations, timestamps/UUIDs, preferences, private storage with signed access, durable backups and sync. If Supabase is selected, add and test RLS policies and private buckets. Do not expose service-role credentials.
3. **Relational record model:** add profiles/preferences, daily check-ins, meals/items, workouts, sleep, hydration, cycles, Life Areas/activities, notes, uploads, voice entries, extractions and insight reports, preserving original/normalized inputs, source, confidence, confirmation and processing metadata with ownership.
4. **Today dashboard:** add optional calorie targets, nutrition/protein summaries, exercise, sleep quality, enabled-only cycle status, Life Area time, missing-log prompts and quick photo/screenshot/voice capture without overloading the screen.
5. **Universal capture:** implement camera/photo/screenshot/audio/text input, probable-type identification and extraction with missing fields, confidence/needs-confirmation status, original evidence beside results, editable record types and explicit approval before saving uncertain output.
6. **Food and nutrition:** add food items, portions and meal types, protein/carbohydrate/fat, fruit/vegetables/drinks, editable unknown-aware estimates and confidence, targets, meal reuse and favorites. Never fabricate image details or treat estimates as medical measurements.
7. **Fitness screenshot OCR:** extract activity/date/start time/duration/distance/steps/calories/heart rate/pace/source when present, retain original OCR and image evidence, validate uploads, show progress/errors and detect duplicate file hashes and related extracted fields to avoid double-counting.
8. **Cantonese voice:** record supported browser audio, upload privately, transcribe Cantonese, retain audio and the original transcript, normalize into Traditional Chinese, and support individually approved linked records from one input, with safe retry/error handling.
9. **Full daily health check-in:** add optional sleep quality, stress, water, exercise completion, discomfort and enabled-only cycle fields; retain the per-date update rule and extend coverage to all future fields. Store and Happy DOM component tests now exercise the current create/update rule; real-browser verification remains separate.
10. **Optional cycle tracking:** keep disabled by default; add start/end, cycle day, flow, symptoms and notes, enable/hide controls, cycle-only export/permanent deletion and cautiously labeled history-based estimates without medical claims.
11. **Custom Life Areas:** allow creation, renaming, reordering, archiving and colors for reading, learning, social/family time, creative work, projects, rest and other interests; add start/end, duration, optional images, before/after mood and completion without punitive scoring.
12. **Full History:** implement timeline/calendar search and date-range, type, meal, exercise, Life Area, input-method and confirmation filters; support duplication, original media/OCR, normalized detail and clear destructive-action confirmation or undo.
13. **Progress:** add daily/weekly/monthly and custom-range calculations for nutrition, recorded days, exercise frequency/minutes/distance, sleep/quality, mood, energy, stress, hydration, Life Area time and check-in consistency. Provide mobile charts, accessible equivalents, honest axes/empty states and missing-versus-zero handling; avoid causal claims.
14. **Reflections:** create evidence-linked weekly/monthly summaries from confirmed data, showing the range, facts, patterns, positives, areas to notice, reflection questions and one optional realistic next step. Acknowledge incomplete data and avoid diagnosis, shame and arbitrary life scores.
15. **AI service architecture:** add provider-independent interfaces for food/general images, OCR, speech, normalization, structured extraction and insights; validate structured responses with schemas; record provider/model, raw response when appropriate, normalized output, confidence, status and sanitized errors. Use secure server-side calls, file size/type validation, retries and clearly labeled mock providers. No providers exist yet.
16. **Privacy and account controls:** implement complete account export, record and account deletion, cycle-specific controls, secure configuration, safe errors, sensitive-log minimization, input/file validation and access-control tests. Publish a concrete privacy notice once storage/providers are selected.
17. **Separate demonstration mode:** isolate fictional data from personal data, clearly label sample/simulated results, add representative screenshot, Life Area, chart and reflection fixtures and simulated processing only after mock providers exist. The current mixed eight-row list does not meet that requirement.
18. **Import, restore and settings:** implement schema-validated restore/import, user preferences and optional targets, account/settings workflows and backup recovery; document export formats and deletion boundaries.
19. **UX and accessibility:** verify responsive/mobile, dark mode, contrast, zoom, forced colors, keyboard/screen-reader behavior and form semantics in real browsers; add appropriate loading/skeleton, upload, processing, error, success and empty states as asynchronous features arrive.
20. **Testing and release readiness:** add dashboard/nutrition/date-range calculations, ownership, AI-schema rejection and correction, duplicate screenshot and persistent check-in create/update tests beyond the current store/Happy DOM coverage; add end-to-end coverage for sign-in/demo, manual meal, image review, workout, check-in, hobby, progress and deletion. Extend automated regression, visual/accessibility QA, fresh-machine installation and standalone production-hosting tests; add database/storage/provider/migration/deployment documentation when those systems exist.
