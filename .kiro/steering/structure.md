# Project Structure

## Root Configuration

- `.env` / `.env.example` - Environment variables
- `openapi.json` - API specification
- `openapi-ts.config.ts` - API client generation config
- `components.json` - shadcn/ui configuration
- `next.config.ts` - Next.js config with next-intl plugin
- `tsconfig.json` - TypeScript config with `@/*` path alias

## Source Directory (`src/`)

### App Router (`src/app/`)

- `[locale]/` - Internationalized routes
  - `layout.tsx` - Root locale layout with providers
  - `page.tsx` - Home page
- `globals.css` - Global styles and Tailwind directives
- `layout.tsx` - Root HTML layout
- `favicon.ico` - Site icon

### API Layer (`src/api/`)

Auto-generated API client from OpenAPI spec. Do not manually edit files in this directory.

- `sdk.gen.ts` - API functions (e.g., `userControllerLogin`)
- `types.gen.ts` - TypeScript types for requests/responses
- `client/` - HTTP client implementation
- `core/` - Core utilities (auth, serialization, etc.)

### Components (`src/components/`)

- `ui/` - Base UI components (Button, Dialog, FloatingInput, Form, Input, Switch, Avatar, Tabs, FollowButtonWithStatus)
- `layout/` - Layout components (Header, UserDropdown, UserLoginDialog, MessageDropdown)
- `account/` - Account page components (AccountInfo)
- `article/` - Article related components (ArticleCard, ArticleAuthor, ImageGallery, ImageViewer)
- `home/` - Home page specific components (ArticleListClient, FeedTabs, HeaderTabs)
- `sidebar/` - Sidebar widgets (Sidebar, ArticleCreateWidget, RecommendUserWidget, RecommentTagWidget, LoadingWidget)
- `providers/` - React context providers (DeviceFingerprintProvider, UserStateProvider)
- `shared/` - Shared utility components (LanguageSwitcher, ThemeSwitcher, NotificationContainer)

### State Management (`src/stores/`)

Zustand stores with persist middleware:

- `useUserStore.ts` - User auth, profile, token (syncs to cookies)
- `useAppStore.ts` - Global app state
- `useModalStore.ts` - Modal/dialog state
- `useNotificationStore.ts` - Toast notifications

### Custom Hooks (`src/hooks/`)

- `useForm.ts` - Form state and validation
- `useClickOutside.ts` - Detect clicks outside element
- `useCopyToClipboard.ts` - Clipboard operations
- `useDebounce.ts` - Debounce values
- `useLocalStorage.ts` - localStorage wrapper
- `useMediaQuery.ts` - Responsive breakpoints
- `useToggle.ts` - Boolean state toggle
- `useWindowSize.ts` - Window dimensions

### Utilities (`src/lib/`)

- `utils.ts` - `cn()` for class merging
- `cookies.ts` - Client-side cookie helpers
- `server-cookies.ts` - Server-side cookie helpers
- `fingerprint.ts` - Device fingerprinting
- `modal-helpers.ts` - Modal utilities
- `storage.ts` - localStorage/sessionStorage wrappers
- `validation.ts` - Validation helpers
- `seo.ts` - SEO metadata generation

### Internationalization (`src/i18n/`)

- `routing.ts` - Locale routing config and navigation helpers
- `request.ts` - Server-side i18n request handler

### Types (`src/types/`)

- `index.ts` - Shared type definitions
- `api.ts` - API-related types (e.g., `UserProfile`)
- `theme.ts` - Theme-related types

### Constants (`src/constants/`)

- `index.ts` - App-wide constants

### Examples (`src/examples/`)

Component usage examples (for development reference):

- `FloatingFormExample.tsx`
- `DialogExample.tsx`
- `FormExample.tsx`
- etc.

## Translation Files (`messages/`)

- `zh.json` - Chinese translations
- `en.json` - English translations

## Documentation (`docs/`)

- `FLOATING-LABEL-FORM.md` - Floating label form documentation

## Public Assets (`public/`)

- `placeholder/` - Placeholder images (empty.png, loginLogo.png)

## Architecture Patterns

### Component Conventions

- Use `"use client"` directive for client components
- Forward refs for input components
- Use `cn()` utility for conditional classes
- Props extend native HTML element props when applicable

### State Management

- Use Zustand stores for global state
- Persist auth state to both localStorage and cookies
- Server components fetch initial data, pass to client providers

### API Integration

- Import functions from `@/api` (e.g., `userControllerLogin`)
- Types auto-generated, use for type safety
- Interceptors handle auth headers and device-id automatically

### Styling

- Tailwind utility classes preferred
- Dark mode support via `dark:` prefix
- Component variants via `class-variance-authority`
- CSS variables for theming in `globals.css`

### Forms

- Use `useForm` hook for validation and state
- `FloatingInput` for floating label inputs
- Validation rules defined per field
- Real-time validation after field is touched
