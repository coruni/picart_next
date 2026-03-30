# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
pnpm run dev          # Development server (localhost:3000)
pnpm run build        # Production build
pnpm run lint         # ESLint check
pnpm run typecheck    # TypeScript check
pnpm run openapi      # Generate API client from openapi.json
```

## Architecture Overview

**PicArt Next** is a social content platform with articles, topics, channels, and user interactions.

### Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.2 | App Router, React Compiler enabled |
| React | 19.2.3 | UI framework |
| Quill | 2.0.3 | Rich text editor (not react-quill) |
| Zustand | ^5.0.10 | State management with persistence |
| next-intl | ^4.7.0 | i18n (zh default, en supported) |
| @hey-api/openapi-ts | ^0.90.3 | Auto-generated API client |

### API Client

Auto-generated from `openapi.json`. All API functions are in `@/api`.

```typescript
import { articleControllerFindAll } from "@/api";

const response = await articleControllerFindAll({ query: { page: 1, limit: 10 } });
const data = response?.data?.data?.data || [];  // Note: 3-level nesting
const total = response?.data?.data?.meta?.total || 0;
```

Auth headers (token + device fingerprint) are injected automatically via interceptors in `src/runtime.config.ts`.

### State Management

Zustand stores in `src/stores/`:
- `useUserStore` - Auth state, persists token to localStorage and cookie
- `useAppStore` - App config
- `useModalStore` - Modal state
- `useNotificationStore` - Toast notifications

Token syncs to cookie for SSR support (see `useUserStore.ts`).

### Internationalization

```typescript
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";

const t = useTranslations();
```

Config in `src/i18n/routing.ts`: locales `zh`/`en`, default `zh`, prefix `as-needed`.

### Rich Text Editor

Located in `src/components/editor/`. Uses Quill 2.0.3 directly (not react-quill).

Structure:
- `Editor.tsx` - Main component
- `blots/` - Custom blots (CustomImageBlot, CustomEmojiBlot)
- `specs/` - BlotSpec implementations for blot-formatter2
- `actions/` - Toolbar actions (CopyAction, DeleteAction, EditLinkAction, etc.)
- `toolbar.ts` - Toolbar rendering

### Component Conventions

- **PascalCase** for component files: `ArticleCard.tsx`
- **`.client.tsx`** suffix for client-only components
- **camelCase** for hooks and utilities
- Use `cn()` from `@/lib/utils` for class merging
- Only Tailwind utility classes

### Authentication Flow

1. Server reads token from cookie via `getRequestAuthState()` in `src/lib/request-auth.ts`
2. `initializeInterceptors()` sets up request interceptor to inject auth headers
3. Client store hydrates from localStorage via Zustand persist middleware
4. `UserStateProvider` syncs server state to client on mount

### Important Files

| File | Purpose |
|------|---------|
| `src/runtime.config.ts` | API client config, interceptor initialization |
| `src/lib/request-auth.ts` | Auth state retrieval for SSR |
| `src/lib/cookies.ts` | Client-side cookie utilities |
| `src/lib/server-cookies.ts` | Server-side cookie utilities |
| `src/middleware.ts` | next-intl middleware |
| `src/i18n/routing.ts` | Locale and routing config |

### Environment Variables

```bash
NEXT_PUBLIC_API_BASE_URL=    # Backend API URL
NEXT_PUBLIC_APP_URL=         # Site domain
```

## Platform Notes

- **Windows development environment** - Use PowerShell/CMD commands
- **pnpm** is the package manager
- Husky + lint-staged runs ESLint on commit