# Technology Stack

## Core Framework

- **Next.js 16** with App Router and React 19
- **TypeScript** with strict mode enabled
- **React Compiler** enabled for optimizations

## Styling & UI

- **Tailwind CSS 4** for utility-first styling
- **class-variance-authority** for component variant management
- **lucide-react** for icons
- Custom UI components in `src/components/ui/`
- Use `cn()` utility from `@/lib/utils` to merge Tailwind classes

## State Management

- **Zustand** for global state (similar to Pinia/Redux)
- Stores located in `src/stores/`
- Key stores: `useUserStore`, `useAppStore`, `useModalStore`, `useNotificationStore`
- Persist middleware used for auth state

## Internationalization

- **next-intl** for i18n support
- Locales: `zh` (default), `en`
- Translation files in `messages/` directory
- Locale-prefixed routes: `[locale]` dynamic segment
- Use `useTranslations()` hook in components

## API Integration

- **@hey-api/openapi-ts** for type-safe API client generation
- Generated client in `src/api/client/`
- OpenAPI spec: `openapi.json`
- Regenerate with `npm run openapi`

## Additional Libraries

- **@fingerprintjs/fingerprintjs** for device fingerprinting
- **react-photo-view** for image galleries
- **swiper** for carousels
- **nextjs-toploader** for page transition loading bar
- **uuid** for unique identifiers

## Common Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Building
npm run build            # Production build
npm run start            # Run production server

# Code Quality
npm run lint             # Run ESLint

# API Client
npm run openapi          # Regenerate API client from openapi.json
```

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure API endpoints and other environment variables
3. Run `npm install` to install dependencies

## Path Aliases

- `@/*` maps to `src/*` (configured in tsconfig.json)
- Always use path aliases for imports: `import { cn } from "@/lib/utils"`

## Image Configuration

- Remote images allowed from all HTTPS/HTTP hosts
- Image qualities: 75, 95
- Use Next.js `<Image>` component for optimization
