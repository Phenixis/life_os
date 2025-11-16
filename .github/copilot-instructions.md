# Life OS - AI Coding Agent Instructions

## Project Overview
Life OS is a personal knowledge management system built with Next.js 16 (App Router), TypeScript, Drizzle ORM, and PostgreSQL. It provides task management, note-taking, habit tracking, workout logging, mood tracking, AI chat, and more.

## Architecture

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL (Neon)
- **Schema location**: `lib/db/schema/` organized by domain (e.g., `task/`, `user/`, `note/`)
- **Schema pattern**: Each domain exports a namespace (e.g., `export * as Task from "./task"`) from `lib/db/schema/index.ts`
  ```typescript
  // Accessing schema types
  import { Task, User, Note } from "@/lib/db/schema"
  Task.Task.table  // The Drizzle table
  Task.Task.Select // TypeScript type for selected records
  ```
- **Queries**: Organized in `lib/db/queries/` and exported as namespaces (e.g., `TaskQueries`, `NoteQueries`) from `lib/db/queries/index.ts`
- **Migrations**: Use `pnpm db:generate` to create, `pnpm db:migrate` to apply

### API Routes
- **Location**: `app/(api)/api/` organized by domain
- **Authentication**: All endpoints use Bearer token auth via `verifyRequest()` from `lib/auth/api.ts`
  ```typescript
  const verification = await verifyRequest(request)
  if ('error' in verification) return verification.error
  // Use verification.userId
  ```
- **Pattern**: Export GET, POST, PUT, DELETE as named async functions in `route.ts` files
- **Documentation**: See `docs/HABITS_API.md` for example API patterns

### Frontend Architecture
- **App Router**: Next.js 16 `/app` router with route groups:
  - `(front-office)`: Landing page, marketing
  - `(door)`: Auth pages (login, signup, set-password)
  - `(back-office)`: Main app under `/my` route
- **Server vs Client**: Default to server components. Add `'use client'` **only** when using hooks (useState, useEffect, etc.) or browser APIs
- **Data fetching**: 
  - Client components: Use SWR hooks from `hooks/` (e.g., `useTasks`, `useNotes`, `useHabits`)
  - SWR hooks use the `fetcher` from `lib/fetcher.ts` with user's API key
  - Server components: Directly call query functions from `lib/db/queries/`

### Component Organization
- `components/ui/`: Radix UI primitives (shadcn/ui style)
- `components/big/`: Feature components organized by domain (`tasks/`, `notes/`, `habits/`, etc.)
- `components/utils/`: Utility components
- `contexts/`: React contexts (e.g., `modal-commands-context.tsx` for modal state management)
- `hooks/`: Custom hooks for data fetching and state management

### State Management
- **User context**: `UserProvider` in `hooks/use-user.tsx` provides authenticated user
- **Modal state**: `ModalCommandsProvider` in `contexts/modal-commands-context.tsx` manages task/note/mood modals
- **Feature flags**: `lib/flags.ts` defines cookie-based feature configurations
- **Cookies**: Server actions in `lib/cookies.ts` handle cookie reads/writes (dark mode, filters, etc.)

### Authentication
- **Session**: JWT-based sessions using `jose` library in `lib/auth/session.ts`
- **API auth**: API key stored in user table, validated via `verifyApiKey()` in `lib/auth/api.ts`
- **Special case**: CRON_SECRET env var bypasses auth for cron jobs

### Styling
- **Framework**: Tailwind CSS 4.1 with PostCSS
- **Theme**: Uses CSS variables with dark mode support
- **Fonts**: Space Grotesk (headings) and Inter (body) from Google Fonts
- **Indentation**: 4 spaces (not tabs)

## Development Workflow

### Commands
- `pnpm dev`: Start dev server with Turbopack
- `pnpm build`: Production build
- `pnpm db:generate`: Generate Drizzle migrations
- `pnpm db:migrate`: Apply migrations
- `pnpm commit`: Interactive conventional commit helper (bash script)
- `pnpm promote`: Promote changes with version bump

### Commit Conventions
Use conventional commits with these prefixes (can combine: `fix: style: ...`):
- `feat:` new features
- `fix:` bug fixes  
- `chore:` non-functional changes
- `refactor:` code refactoring
- `docs:` documentation
- `style:` formatting (not CSS)
- `perf:` performance improvements
- `test:` tests
- `security:` security fixes

### Key Patterns

**Task State Management**: Tasks have a `state` field ("to do", "work in progress", "stalled", "done"). See `docs/TASK_STATE.md`. State auto-updates when marking complete/incomplete.

**Note Encryption**: Notes support optional password encryption. See `decryptNote()` in `lib/utils/crypt.ts`. Encrypted content stored in DB.

**Project Association**: Tasks and notes belong to projects (optional). Projects defined in `lib/db/schema/project.ts`.

**Dark Mode**: User preferences stored in DB + cookie. Auto dark mode based on time ranges. See `lib/utils/dark-mode.ts` and `lib/cookies.ts`.

**SWR Pattern**: All data-fetching hooks use SWR with API key from user context:
```typescript
export function useTasks(params: UseTasksParams = {}) {
  const user = useUser().user
  const queryString = buildQueryString(params)
  const { data, error, mutate } = useSWR(
    user ? ['/api/task' + queryString, user.api_key] : null,
    ([url, api_key]) => fetcher(url, api_key)
  )
  // ...
}
```

**Stripe Integration**: Subscription management via `lib/services/payments/stripe.ts`. See `docs/SUBSCRIPTION_MANAGEMENT.md`.

## Code Quality Rules

1. **DRY principle**: Check for existing utilities before creating new ones
2. **Type safety**: Always use TypeScript, leverage schema types from `lib/db/schema`
3. **Server-first**: Prefer server components; add `'use client'` only when necessary
4. **Error handling**: Gracefully handle errors, validate inputs
5. **Accessibility**: Follow WCAG guidelines, ensure keyboard navigation
6. **Performance**: Optimize for SEO, accessibility, performance, readability (in that order)
7. **Scope**: Only modify code directly related to the task
8. **Documentation**: Comment complex logic, update docs/ for new features
9. **Responsive**: Ensure all UI works on mobile and desktop

## File Conventions
- TypeScript for all code
- 4-space indentation
- Server actions marked with `"use server"` directive
- Client components marked with `'use client'` directive
- Export patterns: Default export for pages/components, named exports for utilities

## Suggestions Requirement
After completing a task or analysis, provide 1-3 specific suggestions for improvement.