# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development server (localhost:3000)
pnpm run dev

# Production build
pnpm run build

# Run production server
pnpm run start

# Lint code
pnpm run lint

# Generate API client from openapi.json
pnpm run openapi
```

## Project Architecture

**PicArt Next** is a social content platform built with Next.js 16, React 19, and TypeScript. It supports article sharing, image galleries, user interactions, and social features.

### Technology Stack

- **Framework**: Next.js 16 with App Router and React Compiler
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4 with `cn()` utility from `src/lib/utils.ts`
- **State Management**: Zustand with persistence middleware
- **Internationalization**: next-intl (locales: `zh`, `en`; default: `zh`)
- **API Client**: Auto-generated from OpenAPI spec via `@hey-api/openapi-ts`
- **Icons**: lucide-react

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Localized routes (zh|en)
│   │   ├── (home)/        # Route group: home feed
│   │   ├── account/[id]/  # User profiles
│   │   ├── article/[id]/  # Article detail
│   │   ├── channel/       # Channel pages
│   │   └── topic/         # Topic pages
│   ├── layout.tsx         # Root layout (fonts)
│   └── globals.css        # Tailwind imports
├── api/                   # Generated API client (auto-generated)
│   ├── client/           # Client types
│   ├── core/             # Core utilities
│   ├── sdk.gen.ts        # API functions
│   └── types.gen.ts      # TypeScript types
├── components/
│   ├── account/          # Account-related components
│   ├── article/          # Article display components
│   ├── channel/          # Channel components
│   ├── comment/          # Comment components
│   ├── home/             # Home feed components
│   ├── layout/           # Header, layout parts
│   ├── providers/        # Context providers (UserStateProvider, DeviceFingerprintProvider)
│   ├── shared/           # Shared/common components
│   ├── sidebar/          # Sidebar widgets
│   ├── topic/            # Topic components
│   └── ui/               # Base UI components (Button, Input, Dialog, etc.)
├── hooks/                 # Custom React hooks
├── i18n/                  # i18n configuration
│   ├── request.ts        # Message loading
│   └── routing.ts        # Locale routing setup
├── lib/                   # Utility functions
│   ├── utils.ts          # `cn()` for Tailwind class merging
│   ├── cookies.ts        # Client-side cookie utilities
│   ├── server-cookies.ts # Server-side cookie utilities
│   └── validation.ts     # Form validation
├── stores/                # Zustand stores
│   ├── useUserStore.ts   # Auth state (token, user profile)
│   ├── useAppStore.ts    # App config state
│   ├── useModalStore.ts  # Modal state
│   └── useNotificationStore.ts # Notifications
├── types/                 # TypeScript type definitions
├── middleware.ts          # next-intl middleware
└── rumtime.config.ts      # API client config and interceptors

messages/                  # Translation files
├── zh.json
└── en.json

openapi.json              # API specification for client generation
```

### API Client Pattern

The API client is auto-generated from `openapi.json`. Import functions from `@/api`:

```typescript
import { articleControllerFindAll, userControllerGetProfile } from "@/api";

// API responses are wrapped: { data: { data: T, meta: {...} } }
const response = await articleControllerFindAll({ query: { page: 1, limit: 10 } });
const articles = response?.data?.data?.data || [];
const total = response?.data?.data?.meta?.total || 0;
```

Authentication and device fingerprinting are handled automatically via interceptors in `rumtime.config.ts`.

### Component Conventions

- **File naming**: PascalCase for components (`ArticleCard.tsx`), camelCase for hooks/utilities
- **Client components**: Use `.client.tsx` suffix for client-only components
- **Component props**: Extend HTML attributes where appropriate, use `cn()` for class merging
- **Styling**: Only Tailwind utility classes, responsive mobile-first approach

### State Management Pattern

Zustand stores with persistence for auth:

```typescript
// Access store
const { user, token, login, logout } = useUserStore();

// Use selectors for reactive state
const user = useUserStore((state) => state.user);
```

The `UserStateProvider` synchronizes server-side auth state with the client store during hydration.

### Internationalization Pattern

Use next-intl hooks for translations:

```typescript
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";

const t = useTranslations();
const title = t("article.title");
```

Routes are automatically prefixed with locale when needed (`localePrefix: "as-needed"`).

### SSR vs Client Data Fetching

- **Server Components**: Fetch initial data directly using API functions
- **Client Components**: Receive initial data via props, use `.client.tsx` suffix
- **Auth SSR**: Server reads token from cookie, fetches user profile via `initializeInterceptors()`

### Important Configuration Files

- `next.config.ts`: Next.js config with `reactCompiler: true`, image domains configured
- `tsconfig.json`: Path alias `@/*` → `src/*`, strict TypeScript
- `eslint.config.mjs`: Next.js ESLint preset
- `src/i18n/routing.ts`: Locale config (zh/en, default zh)

### Required Environment Variables

```bash
NEXT_PUBLIC_API_BASE_URL=    # Backend API URL
NEXT_PUBLIC_APP_URL=         # Site domain
```
