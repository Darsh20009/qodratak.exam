# Learning Engine Audit — Phase 01: Audit & Foundation

**Audit scope:** Repository and source-code audit only.  
**Date:** 2026-09-16  
**Product:** Qodratak / قدراتك  
**Phase rule:** No new feature, UI redesign, question-bank creation, chatbot, AI student feature, destructive migration, or data deletion was performed.

## Audit boundaries and evidence

This document is based on the current workspace source, package manifests, route definitions, database models, frontend hooks/pages, existing tests, and configured workflows.

The audit did **not**:

- Query or mutate production MongoDB/PostgreSQL data.
- Create or alter a database collection/table.
- Run an authenticated student or admin browser journey.
- Claim that iPad behavior is production-verified; the repository contains responsive code, but not a dedicated iPad QA suite.
- Treat the existing `attached_assets` exports or JSON files as the authoritative production dataset.

The main implementation areas reviewed were:

- `artifacts/qodratak` — React/Vite web application.
- `artifacts/api-server` — Express API and application services.
- `artifacts/api-server/src/mongodb` — Mongoose models, connection, and Mongo storage.
- `lib/db` — Drizzle/PostgreSQL schema and client package.
- `artifacts/qodratak/src/App.tsx` — routing, authentication boundary, and layouts.
- `artifacts/qodratak/src/hooks/use-student.ts` — student API contract adapter.

---

## Current Architecture

### Runtime topology

The repository is a pnpm workspace with separate artifact-owned services:

1. **Web artifact:** `artifacts/qodratak`
   - React application bundled by Vite.
   - Uses Wouter for client-side routing.
   - Uses the Vite `BASE_PATH` and proxies `/api` and WebSocket traffic to the API service during development.
2. **API artifact:** `artifacts/api-server`
   - Express 5 application.
   - Owns sessions, authentication, question APIs, tests/results, student APIs, admin APIs, subscriptions, notifications, uploads, and auxiliary services.
3. **Shared packages:**
   - `lib/db` — Drizzle schema/client package for PostgreSQL.
   - `lib/api-spec`, `lib/api-zod`, `lib/api-client-react` — API contract/code-generation packages, although a significant portion of the existing product still calls endpoints directly with `fetch`.
4. **Supporting artifacts:**
   - `artifacts/mockup-sandbox` and the migration/design preview are separate development/design artifacts, not the learning engine source of truth.

### Request and data flow

The common flow is:

`React page/hook → /api route → route-local policy/validation → MongoStorage or Drizzle storage → MongoDB/PostgreSQL`

There are several parallel variants:

- Newer student-product endpoints generally use MongoDB and derive the student identity from the server session.
- Older generic question/test routes may use PostgreSQL storage, MongoDB storage, or merge both.
- Some preview/development paths return in-memory or empty demo data when persistent services are not available.
- Some older test runners keep a local copy of the current test/result in `localStorage` before or alongside sending a server result.

### Frontend composition

`App.tsx` is a large route registry and global composition root. It contains:

- Public path classification.
- Server-session authentication boundary.
- Lazy-loaded routes for some large/reporting pages.
- Student shell routes.
- Legacy pages and runners.
- Admin routes.
- Main platform layout behavior, including test-mode exceptions.

The repository currently has more than one application shell:

- `StudentShell` for the newer student product surface.
- `MainLayout` and older platform navigation inside `App.tsx`.
- Teacher/admin-specific layouts or page-local navigation.
- Standalone exam/test layouts.

This works as an incremental product, but it creates route, auth, responsive, and design-system drift.

---

## Current Tech Stack

### Workspace and build

- pnpm workspace.
- Node.js 24 according to repository notes.
- TypeScript 5.9 according to repository notes.
- Vite 7 for the frontend.
- esbuild-based API build/start pipeline.
- Replit artifact workflows for web and API development.

### Frontend

- React 19 and React DOM 19.
- Wouter 3 for routing.
- TanStack React Query 5 for server state.
- Tailwind CSS 3 with class-based dark mode.
- Radix UI primitives and local `components/ui` wrappers.
- `react-hook-form` and Zod for selected forms/validation.
- Framer Motion for animation.
- Lucide React and React Icons for icons.
- Recharts for charts.
- `react-helmet-async` for route metadata.
- `jspdf`, `html2canvas`, and related packages for reports/document output.
- WebAuthn browser support and PWA/iOS installation support are present.

### Backend

- Express 5.
- `express-session` with optional `connect-mongo`.
- Mongoose 9 for MongoDB.
- Drizzle ORM with `pg` and `@neondatabase/serverless` for PostgreSQL.
- Zod / drizzle-zod in shared schema areas.
- `bcryptjs` for passwords.
- `ws` for WebSocket features.
- Multer and Sharp for uploads/image processing.
- Baileys, WhatsApp/Telegram/email/push integrations in supporting services.
- SimpleWebAuthn server for passkey support.

### State and API conventions

There is no single API access convention yet:

- Some frontend surfaces use typed React Query hooks.
- Some use `apiRequest`.
- Many admin and legacy pages call `fetch` directly and manually parse JSON.
- API contract/codegen packages exist but are not the universal boundary for current product routes.

---

## Current Database

### MongoDB

MongoDB is the active source of truth for the newer student product and is required in production:

- `MONGODB_URI` is required in production startup.
- `artifacts/api-server/src/mongodb/connection.ts` refuses a production start without it.
- `MongoStorage.initialize()` connects without migrations or reseeding.
- Connection health is tracked and the application has a Mongo health alert service.
- Sessions use MongoStore when `MONGODB_URI` is available, with a 30-day TTL.

The Mongoose model registry in `artifacts/api-server/src/mongodb/models.ts` includes, among others:

- `User`, `Admin`, `Subscription`.
- `Question`, `TahsiliQuestion`.
- `TestResult`, `ExamBooking`, `PaperModelResult`, `TestTemplate`.
- `QuestionHistory`, `ErrorLog`, `AdaptiveProfile`.
- `DailyGoal`, `DailyProgress`.
- `FoundationContent`, `DiagnosticAttempt`, `StudentLearningProfile`.
- `Folder`, `FolderQuestion`.
- `TeacherClass`, `TeacherClassMembership`.
- `Institution`, `InstitutionRequest`.
- Notifications, support, wallet, leaderboard, badges, reviews, and operational entities.

The connected MongoDB must be treated as an existing dataset. The current repository strategy is additive rather than destructive.

### PostgreSQL / Drizzle

`lib/db/src/schema/schema.ts` defines a parallel relational model, including:

- `users`, `institutions`, `subscriptions`.
- `questions`, `user_test_results`, `advanced_test_results`.
- `test_sessions`, `exam_templates`, `exam_sections`, `user_custom_exams`.
- Achievements, analytics, folders, audit logs, and other supporting tables.

`artifacts/api-server/src/db.ts` makes PostgreSQL optional. If `DATABASE_URL` is present, a Drizzle client is configured; otherwise the application logs that it is using in-memory storage. `migrations.ts` contains bootstrap-style `CREATE TABLE IF NOT EXISTS` SQL for an older subset of the relational schema.

### Current persistence split

The split is material:

- Some legacy storage interfaces use numeric PostgreSQL IDs.
- MongoDB users/results use string/ObjectId-compatible identities.
- Routes branch on whether a session identity is a valid Mongo ObjectId.
- Generic question endpoints can merge Mongo questions with PostgreSQL questions and deduplicate by ID/text.
- The same conceptual entities have different field shapes in Mongo, PostgreSQL, and legacy JSON.

This is the primary architectural constraint for a future learning engine. A new domain should not silently introduce a third source of truth.

### Development fallback

Development can continue without one or both persistent databases in selected paths:

- Mongo connection falls back to in-memory behavior outside production.
- PostgreSQL client is optional.
- Development/demo users and empty dashboard data are available in selected routes.

This is useful for preview work, but it can hide persistence and authorization defects unless integration tests explicitly run with real database connections.

---

## Existing Question System

### General question model

The Mongo `Question` model contains:

- Numeric `questionId`.
- `category`: verbal, quantitative, or general.
- `subcategory`.
- Question `text`.
- `options: string[]`.
- `correctOptionIndex`.
- `difficulty`.
- Optional `topic`, dialect, keywords, and section.
- Explanation.
- Legacy single-image fields and newer multi-image fields:
  - `imageUrl`, `imageUrls`.
  - Original image URLs and processing metadata.

The PostgreSQL `questions` table contains a similar but older shape using:

- `category`, `subcategory`, `text`, JSONB `options`.
- `correct_option_index`, difficulty, topic, dialect, keywords, section, explanation.

### Tahsili question model

`TahsiliQuestion` is intentionally a separate Mongo collection to preserve compatibility with the general Qudrat question categories. It adds:

- A controlled subject enum: رياضيات، فيزياء، كيمياء، أحياء، علم الأرض.
- `subcategory` and topic.
- Source page, source question number, and source book.
- `answerConfidence`: `verified` or `review`.
- A unique source-oriented index.

This is a useful review boundary for scanned/imported content, but it is not yet a unified course/subject/topic taxonomy shared with Qudrat.

### Question sources and APIs

Current question sources include:

- MongoDB question collections.
- PostgreSQL question storage.
- Legacy JSON/data files in the API workspace and attached assets.
- Admin bulk insert/import flows.
- Foundation content quizzes referencing Mongo `Question` ObjectIds.

Representative APIs include:

- `GET /api/questions`
- `GET /api/questions/stats`
- `GET /api/questions/all`
- `GET /api/questions/search`
- `GET /api/questions/random`
- `GET /api/questions/:id`
- `GET /api/questions/free-test/:category`
- `POST /api/questions/bulk`
- `POST /api/questions/report`
- `POST /api/questions/log-error`
- `/api/questions/unseen` and `/api/questions/mark-seen`

### Current answer-key exposure risk

Several public/legacy question endpoints serialize `correctOptionIndex` or `correctAnswer` to the client. This includes generic question retrieval and random-question flows. That is acceptable only for a trusted authoring/review context, not for a student delivery endpoint.

The future learning engine should separate:

1. Student question delivery, which omits answer keys.
2. Server-side grading, which reads the answer key.
3. Admin/authoring review, which may read answer keys under explicit permission.

### Current content governance

There is an admin question-management surface, question reporting, image processing, and Tahsili confidence states. However, the schema does not yet provide a consistent content lifecycle such as draft → review → approved → published → retired for every question family.

---

## Existing Student Progress

### Test-result progress

The Mongo `TestResult` model is the primary progress ledger for many current student flows. It stores:

- User and program.
- Test type and test ID/name.
- Difficulty.
- Score, total, correct, wrong, skipped.
- Percentage and time.
- Points.
- Official/non-official flag.
- Optional question details, weak areas, and strong areas.
- Completion timestamp.

The relational `user_test_results` and `advanced_test_results` tables represent older/parallel versions of the same concept.

### Student dashboard aggregation

`GET /api/student/dashboard` aggregates Mongo records into:

- Total tests/questions/correct/wrong/skipped.
- Overall, Qudrat, verbal, quantitative, and Tahsili progress buckets.
- Recent tests.
- Weak areas based on `ErrorLog`.
- Upcoming booking or target exam date.
- Recommended plan based on level and official scores.
- Subscription/trial state.
- Folder and saved-question counts.

`useStudentDashboard` adapts this response into the student dashboard contract and supplies fallback defaults for missing fields.

### Per-question and adaptive progress

Existing progress-related models include:

- `QuestionHistory` — seen questions per user to reduce repetition.
- `ErrorLog` — per-question wrong-answer records, selected/correct options, category, subcategory, and source.
- `AdaptiveProfile` — ability/seen/correct counters per subcategory.
- `DailyGoal` and `DailyProgress` — daily question targets and completion by Saudi date.
- `StudentLearningProfile` — diagnostic status, baseline, skill summaries, focus skill, and recommendation.
- `DiagnosticAttempt` — expiring, user-bound diagnostic attempts.

Daily progress updates are present in route logic, including fire-and-forget updates after seen/question activity. This should be verified for failure visibility and idempotency before it becomes a foundation metric.

### Foundation learning progress

The current foundation flow is the most complete learning-oriented path:

1. Student requests foundation content for `qudrat` or `tahsili`.
2. Published content is returned in `order`.
3. Optional embedded quizzes reference questions.
4. Student submits answers.
5. Server loads correct answers and writes a `TestResult`.
6. A diagnostic attempt can establish a `StudentLearningProfile`.
7. The student dashboard can use official scores and diagnostic focus to recommend a next action.

### Important limitation

Lesson/video completion is not represented as a first-class durable progress record. A quiz result exists, and diagnostic/profile progress exists, but there is no reviewed `LessonProgress`/completion state that clearly answers:

- Which lesson was opened?
- Which lesson was completed?
- How much video was watched?
- Which lesson is the next unfinished item?
- Was the lesson completion earned by a valid interaction?

This should be addressed in the learning-engine design rather than inferred from dashboard percentages.

### Answer submission trust model

There are three materially different submission patterns:

1. **Server-authoritative flow:** mobile free tests store the attempt and answer keys in the server session, then grade submitted answers against that session state.
2. **Server-authoritative foundation flow:** foundation quizzes and diagnostics reload question answer keys server-side and grade there.
3. **Legacy/client-trusted flow:** `/api/test-results` receives `score`, `skippedQuestions`, and related values from the client and computes points from those values. It verifies the session user identity, but it does not independently recompute the score from a server-owned attempt/question set.

The third pattern is a major integrity risk for any official progress, points, or adaptive recommendation.

---

## Existing Course Structure

### What exists

There are multiple partial structures:

- `FoundationContent` has program, title, description, video, thumbnail, ordering, publication state, duration, and an optional quiz.
- A foundation quiz contains a title, instructions, passing score, time limit, and question references.
- General questions contain category, subcategory, topic, section, and difficulty.
- Tahsili questions have a controlled subject plus subcategory/topic.
- `TeacherClass` has a free-text subject, program, grade level, and description.
- Exam templates and exam sections exist in both relational schema and Mongo-backed product areas.
- Admin has a foundation content management tab and test-builder surface.

### What does not exist as a unified domain

There is no normalized, shared course hierarchy equivalent to:

`Program → Course → Subject → Topic → Lesson → Activity/Assessment`

There is also no single taxonomy registry that guarantees that a question subcategory, a foundation lesson, a Tahsili subject, a teacher subject, and a dashboard weakness use the same stable identifier.

Current labels are often free text or derived from fields such as `category`, `subcategory`, or `topic`. That is sufficient for the current pages but unsafe as the permanent basis for personalized sequencing.

---

## Reusable Components

### Frontend primitives

The repository already has a substantial reusable base:

- `components/ui` Radix-based controls: buttons, cards, dialogs, inputs, selects, tabs, tables, tooltips, progress, and more.
- `StudentShell` with desktop sidebar, mobile header, bottom navigation, theme toggle, notifications, and account/logout access.
- `NewProtectedRoute` and legacy protected-route variants.
- `useUser`, `useSubscription`, `useStudentDashboard`, and foundation-related hooks.
- React Query client/cache conventions.
- `BrandMark`, `PageTransition`, `BrandLoadingScreen`, `ImageZoom`.
- Existing exam layouts/runners, including `QiyasExamLayout`.
- Charts and analytics components such as `ActivityHeatmap` and performance/report pages.

### Backend services

Reusable backend boundaries include:

- `MongoStorage`.
- Session and role middleware.
- Permission definitions in `shared/permissions`.
- Subscription/entitlement service.
- Media storage and question image processor.
- Notification, push, email, and audit-log services.
- Existing result notification and parent-linking helpers.

### Reusable product capabilities

The current platform already has authoring/admin surfaces for:

- Questions and reports.
- Foundation content.
- Test templates.
- Scheduled/seasonal exams.
- Accounts, teachers, institutions, subscriptions, and notifications.

The main issue is not absence of every primitive; it is inconsistent composition and inconsistent ownership of data across old and new paths.

---

## Missing Components

### Learning-domain components

- A canonical program/course/subject/topic/lesson taxonomy.
- Stable IDs and mapping tables between current free-text labels and canonical learning entities.
- A first-class lesson progress record.
- A server-owned assessment attempt lifecycle.
- A canonical answer event/answer record for each attempt.
- A content publication/review lifecycle shared across Qudrat and Tahsili.
- Explicit prerequisites, sequencing, and completion rules.

### Data and API components

- One documented source-of-truth policy for each domain entity.
- One identity adapter between numeric legacy IDs and Mongo ObjectIds.
- Typed, generated contracts for the student-learning APIs.
- Centralized request validation and consistent error envelopes.
- Pagination/filter contracts for large question/content collections.
- Idempotency keys for result submission and progress events.
- Auditability for score changes and manual grading.

### Frontend components

- A shared learning-engine shell distinct from the legacy platform shell.
- Reusable lesson card, lesson player state, topic navigator, progress summary, and assessment-attempt components.
- Shared loading, empty, retry, and error states across student pages.
- Responsive data-table/card-list patterns for admin and teacher views.
- Centralized route/capability registry instead of route-local role assumptions.
- Shared tablet/iPad layout policy and test harness.

### QA and operations

- Authenticated end-to-end coverage for student, teacher, and admin roles.
- iPad portrait, landscape, and split-screen smoke tests.
- Server-side grading integrity tests.
- Data reconciliation tests between Mongo and PostgreSQL where both are still read.
- Migration observability and rollback/repair tooling.

---

## Technical Risks

### High priority

1. **Multiple database sources of truth**
   - MongoDB, PostgreSQL, legacy JSON, and in-memory fallbacks coexist.
   - The same question/result/user concepts have incompatible IDs and fields.
   - A future feature can appear correct in preview while writing to a different store from production.

2. **Client-trusted result submission**
   - The legacy `/api/test-results` route accepts score-related values from the client.
   - Session ownership is checked, but score integrity is not guaranteed by a server-owned attempt.
   - This can affect points, dashboard progress, leaderboards, recommendations, and official-looking reports.

3. **Answer-key exposure**
   - Some public question endpoints return correct answer indexes.
   - Student delivery and authoring/review permissions are not consistently separated.

4. **Potential cross-user result access**
   - The legacy `GET /api/test-results/user/:userId` and points-history family must be reviewed for authorization because the route definitions do not consistently show a user/session ownership guard.
   - Admin and teacher report access also needs explicit class/institution scoping tests.

5. **Inconsistent authorization layers**
   - The app has global authentication boundaries, legacy protected routes, `requireAuth`, `requireRole`, RBAC permissions, and a separate admin token/session bridge.
   - This is flexible but increases the chance that a newly added route is authenticated but not correctly role-scoped.

### Medium priority

6. **Free-text taxonomy**
   - `category`, `subcategory`, `topic`, and teacher subjects can drift in spelling and meaning.
   - Dashboard weaknesses and recommendations may aggregate labels that do not map to teachable content.

7. **Progress semantics are mixed**
   - Test performance, diagnostic baseline, question history, daily goals, and lesson completion are different measures.
   - Current dashboard aggregation is mostly test-result based and should not be treated as complete learning mastery.

8. **Duplicate shells and route ownership**
   - `App.tsx`, `StudentShell`, admin pages, teacher pages, and legacy pages implement overlapping navigation/layout concerns.
   - Route aliases and older paths increase direct-link and regression risk.

9. **Design-system drift**
   - Tailwind semantic theme tokens coexist with fixed legacy colors and page-local palettes.
   - Dark-mode overrides are scoped in places, but adoption is inconsistent.

10. **iPad/tablet uncertainty**
    - Responsive behavior relies mainly on `sm/md/lg/xl`.
    - `md` can activate desktop sidebars on an iPad portrait or split-screen viewport.
    - Fixed bars, nested scroll containers, dense tables, dialogs, keyboard overlap, and safe-area handling need real-device/browser verification.

11. **Type and test quality debt**
    - The repository has a small set of focused backend tests and a verbal-bank validation test.
    - There is no broad learning-engine integration suite.
    - Existing typecheck debt was previously observed across admin and Tahsili areas; this should be treated as a release risk, not silently inherited by new learning work.

12. **Silent fallback/error handling**
    - Several API paths catch database/seen-history failures and continue with fallback behavior.
    - This improves availability but can hide missing progress records, duplicate exposure, or persistence failure.

### Operational constraints

- Production must not fall back to ephemeral storage.
- Existing MongoDB data must not be reseeded or replaced.
- Any migration must be additive, observable, and reversible.
- The current product already contains AI/backend services, but no AI feature should be added to the student UI in this phase.

---

## Recommended Architecture

The recommended target is an additive learning domain layered onto the current product, not a rewrite.

### 1. Establish explicit domain ownership

Use MongoDB as the initial source of truth for the new learning domain because:

- The current student product routes already use MongoDB.
- `FoundationContent`, `Question`, `TestResult`, `DiagnosticAttempt`, and `StudentLearningProfile` already live there.
- Production already requires MongoDB.

Keep PostgreSQL and legacy storage available for existing routes until each domain is migrated and reconciled. Do not create a new parallel learning engine in PostgreSQL first.

### 2. Introduce a canonical taxonomy

Additive domain entities should represent:

```text
Program
  └── Course
       └── Subject
            └── Topic
                 └── Lesson
                      ├── Learning activity
                      └── Assessment
```

Each entity should have:

- Stable internal ID.
- Program ownership.
- Human-readable Arabic title.
- Optional slug/code.
- Status/publication state.
- Ordering.
- Audit timestamps.

Existing `FoundationContent`, question categories/subcategories/topics, and Tahsili subjects should map into this taxonomy rather than being deleted or renamed in place.

### 3. Use server-owned assessment attempts

Every new student assessment should follow:

```text
create attempt
  → server selects and records question set
  → client receives question presentation without answer keys
  → client submits answer events
  → server grades from stored question/version data
  → attempt is finalized exactly once
  → progress projections update
```

The attempt should retain enough immutable information to reproduce the score after a question is later edited:

- Question/version IDs.
- Delivered options or question snapshot where necessary.
- Start/end timestamps.
- Answers and skipped state.
- Grading policy/version.
- Final result and audit metadata.

### 4. Separate ledgers from projections

Use durable source records for:

- Assessment attempts and answers.
- Lesson/activity completion.
- Question error events.
- Daily goal events.

Use projections for:

- Student dashboard totals.
- Topic mastery.
- Recommended next action.
- Streaks and summaries.

If a projection is wrong, it should be rebuildable from source records.

### 5. Make authorization part of the domain boundary

The learning API should expose explicit policies:

- Student may read only their own attempts/progress.
- Student may receive published content only.
- Teacher may read students only through an active class/membership relation.
- Admin access is permission-based and audited.
- Authoring endpoints may read answer keys; student delivery endpoints may not.

### 6. Keep the frontend contract-oriented

New learning pages should use:

- One typed API client/hook pattern.
- Query keys scoped by user/program/course.
- Shared states for loading, empty, error, and retry.
- The existing design tokens and shells until a later approved design phase.
- Responsive layout rules that work at desktop, mobile, iPad portrait, landscape, and split-screen sizes.

This is an architectural recommendation only; no such components were added in Phase 01.

---

## Recommended Migration Strategy

### Phase 0 — Freeze and inventory

1. Keep the current UI and routes unchanged.
2. Inventory production collections/tables and document counts, indexes, and identity formats using read-only access.
3. Identify every writer and reader for users, questions, results, progress, and foundation content.
4. Choose an owner for each domain field.
5. Add no destructive migration and no data deletion.

### Phase 1 — Add canonical IDs and mappings

1. Additive mapping records connect current:
   - `program/category/subcategory/topic`
   - foundation content
   - Tahsili subjects
   - teacher subjects
   to canonical learning entities.
2. Backfill mappings in reviewable batches.
3. Preserve all original labels and IDs.
4. Flag unmapped or ambiguous content for admin review.

### Phase 2 — Add server-authoritative attempts

1. Introduce a new attempt endpoint family behind a feature flag.
2. Store question selection and answer keys server-side.
3. Grade only from the server-owned attempt.
4. Make finalization idempotent.
5. Write compatibility summaries to the existing `TestResult` shape only after the new attempt is finalized.
6. Compare old/new scores in non-user-visible reconciliation logs.

### Phase 3 — Add durable lesson/activity progress

1. Add a first-class progress record for lesson/activity completion.
2. Define completion rules explicitly.
3. Keep quiz results and lesson completion separate.
4. Build dashboard projections from both assessment and activity records.
5. Do not infer completion from page visits alone.

### Phase 4 — Migrate reads safely

1. Read new learning pages from canonical entities and projections.
2. Continue serving legacy pages from existing endpoints.
3. Use read comparison/telemetry to detect mismatches.
4. Migrate one route family at a time.
5. Keep a rollback flag to return reads to the previous path.

### Phase 5 — Deprecate only after evidence

Only after reconciliation and authenticated regression coverage:

- Stop new writes to obsolete paths.
- Keep historical reads available.
- Export or archive old records according to retention requirements.
- Remove old code only in a separately approved cleanup phase.

### Required gates before Phase 02 implementation

- Confirm the production source of truth for users, questions, and results.
- Confirm whether official scores and training scores are intentionally separate.
- Decide the canonical identity bridge for numeric and ObjectId users.
- Define the course taxonomy and mapping review policy.
- Define the grading/attempt integrity contract.
- Add authorization tests for student, teacher, institution admin, support admin, and system admin.
- Establish iPad/browser smoke-test viewports.

---

## Short Summary

### WHAT EXISTS

- React/Vite frontend with multiple shells and a large route registry.
- Express API with session authentication, role checks, admin permissions, and many existing APIs.
- MongoDB-backed current student product plus parallel PostgreSQL/legacy storage.
- General and Tahsili question models, question reports, image handling, foundation quizzes, test results, diagnostics, error logs, daily goals, and adaptive/profile records.
- Student and admin dashboards with real aggregation and management surfaces.
- Tailwind/Radix design system and responsive mobile/PWA patterns.

### WHAT IS MISSING

- A unified Course → Subject → Topic → Lesson model.
- Canonical taxonomy IDs and mappings.
- First-class lesson completion/progress.
- One server-authoritative assessment-attempt contract for all test paths.
- Fully typed API boundary and consistent authorization coverage.
- Dedicated iPad/tablet QA and broad learning-engine integration tests.

### WHAT SHOULD BE BUILT FIRST

1. Confirm data ownership and identity mapping.
2. Define the canonical learning taxonomy.
3. Define server-authoritative assessment attempts and immutable result semantics.
4. Add additive mappings and progress records without changing the existing UI.
5. Add authorization, grading-integrity, migration-reconciliation, and responsive smoke tests.

### WHAT SHOULD NOT BE TOUCHED

- Do not delete or replace the existing MongoDB dataset.
- Do not rebuild the frontend or change the current design in this phase.
- Do not create a new question bank.
- Do not change the existing student UI.
- Do not add Chatbot, Floating Assistant, or any student-facing AI element.
- Do not add AI features in Phase 01.
- Do not migrate databases by replacement or run destructive schema changes.
