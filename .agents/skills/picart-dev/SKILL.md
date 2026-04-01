---
name: picart-dev
description: Develop features for PicArt Next social content platform. Use when working with articles, topics, channels, user interactions, API client, Zustand stores, next-intl i18n, or Quill rich text editor. Trigger when user mentions "article", "topic", "channel", "API call", "store", "i18n", "editor", or asks about project architecture and conventions.
---

# PicArt Development Assistant

Guide for developing features in the PicArt Next social content platform.

## API Client Usage

Auto-generated from `openapi.json` via `@hey-api/openapi-ts`. All functions in `@/api`.

### Standard Pattern

```typescript
import { articleControllerFindAll } from "@/api";

const response = await articleControllerFindAll({
  query: { page: 1, limit: 10 }
});

// Response has 3-level nesting: response.data.data.data
const data = response?.data?.data?.data || [];
const total = response?.data?.data?.meta?.total || 0;
```

### Key Points

- Auth headers (token + device fingerprint) auto-injected via interceptors in `src/runtime.config.ts`
- Always handle the 3-level nesting: `response?.data?.data?.data`
- Use optional chaining for safety
- Check `src/api/` for available endpoints

## State Management

Zustand stores in `src/stores/`:

| Store | Purpose | Persistence |
|-------|---------|-------------|
| `useUserStore` | Auth state, token | localStorage + cookie |
| `useAppStore` | App config | None |
| `useModalStore` | Modal state | None |
| `useNotificationStore` | Toast notifications | None |

### Token Sync Pattern

Token persists to cookie for SSR support. See `useUserStore.ts` for implementation.

```typescript
// Server reads from cookie via getRequestAuthState()
import { getRequestAuthState } from "@/lib/request-auth";
const auth = getRequestAuthState(request);
```

## Internationalization

Uses `next-intl` with zh (default) and en locales.

```typescript
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/routing";

const t = useTranslations();
// Usage: t('key.subkey')
```

Config in `src/i18n/routing.ts`:
- Locales: `zh`, `en`
- Default: `zh`
- Prefix: `as-needed`

## Component Conventions

- **PascalCase** for files: `ArticleCard.tsx`
- **`.client.tsx`** suffix for client-only components
- **camelCase** for hooks and utilities
- Use `cn()` from `@/lib/utils` for class merging
- Only Tailwind utility classes (no inline styles)

### Component Structure

```typescript
// Server component (default)
// src/components/ArticleCard.tsx

// Client component
// src/components/ArticleCard.client.tsx
"use client";

// Hook
// src/hooks/useArticle.ts
```

## Rich Text Editor

Located in `src/components/editor/`. Uses Quill 2.0.3 directly (NOT react-quill).

### Structure

```
src/components/editor/
├── Editor.tsx          # Main component
├── blots/              # Custom blots
│   ├── CustomImageBlot
│   └── CustomEmojiBlot
├── specs/              # BlotSpec for blot-formatter2
├── actions/            # Toolbar actions
│   ├── CopyAction
│   ├── DeleteAction
│   └── EditLinkAction
└── toolbar.ts          # Toolbar rendering
```

### Custom Blot Pattern

```typescript
// Register custom blot
Quill.register(CustomImageBlot, true);

// Create blot extends existing blot
class CustomImageBlot extends Blot {
  static create(value) {
    const node = super.create();
    node.setAttribute('data-id', value.id);
    return node;
  }
}
```

## Authentication Flow

1. Server reads token from cookie via `getRequestAuthState()` in `src/lib/request-auth.ts`
2. `initializeInterceptors()` injects auth headers
3. Client store hydrates from localStorage
4. `UserStateProvider` syncs server state to client

## Common Tasks

### Add New API Endpoint

1. Update `openapi.json` with endpoint definition
2. Run `pnpm run openapi` to regenerate client
3. Import and use from `@/api`

### Add New Store

```typescript
// src/stores/useNewStore.ts
import { create } from "zustand";

interface NewState {
  data: SomeType;
  setData: (data: SomeType) => void;
}

export const useNewStore = create<NewState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
}));
```

### Add New i18n Key

1. Add key to `src/messages/zh.json` and `src/messages/en.json`
2. Use with `t('new.key')`

## Build Commands

```bash
pnpm run dev          # Development (localhost:3000)
pnpm run build        # Production build
pnpm run lint         # ESLint check
pnpm run typecheck    # TypeScript check
pnpm run openapi      # Generate API client
```