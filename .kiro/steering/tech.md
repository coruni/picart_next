# Tech Stack

## Framework & Core

- **Next.js 16** (App Router) - React framework with SSR/SSG
- **React 19** - UI library with React Compiler enabled
- **TypeScript 5.9** - Type safety

## Styling & UI

- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** (New York style) - Component library base
- **lucide-react** - Icon library
- **class-variance-authority** - Component variant management
- **tailwind-merge + clsx** - Conditional class merging via `cn()` utility

## State Management

- **Zustand** - Lightweight state management with persist middleware
- Stores: `useUserStore`, `useAppStore`, `useModalStore`, `useNotificationStore`
- Cookie sync for auth tokens (SSR-compatible)

## Internationalization

- **next-intl** - i18n with locale routing
- Supported locales: `zh` (default), `en`
- Locale prefix: `as-needed`
- Translation files: `messages/zh.json`, `messages/en.json`

## API Client

- **@hey-api/openapi-ts** - Type-safe API client generation from OpenAPI spec
- **@hey-api/client-fetch** - Fetch-based HTTP client
- Auto-generated from `openapi.json`
- Runtime config with interceptors for auth/device-id headers

## Additional Libraries

- **@fingerprintjs/fingerprintjs** - Device fingerprinting
- **uuid** - Unique ID generation

## Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting (via openapi-ts)
- **pnpm** - Package manager

## Common Commands

```bash
# Development
pnpm dev              # Start dev server (localhost:3000)

# Build & Production
pnpm build            # Build for production
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint

# API Client
pnpm openapi          # Regenerate API client from openapi.json
```

## Path Aliases

- `@/*` → `src/*` (configured in tsconfig.json)
- Component aliases via components.json:
  - `@/components` → UI components
  - `@/lib/utils` → Utility functions
  - `@/hooks` → Custom hooks
