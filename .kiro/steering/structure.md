# Project Structure

## Directory Organization

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes
│   │   ├── (home)/        # Home feed routes (route group)
│   │   ├── account/[id]/  # User profile pages
│   │   ├── article/[id]/  # Article detail pages
│   │   ├── channel/       # Channel pages
│   │   └── topic/         # Topic pages
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── api/                   # Generated API client
│   ├── client/           # API client code
│   └── core/             # API utilities
├── components/            # React components
│   ├── account/          # Account-related components
│   ├── article/          # Article components
│   ├── channel/          # Channel components
│   ├── comment/          # Comment components
│   ├── home/             # Home feed components
│   ├── layout/           # Layout components
│   ├── providers/        # Context providers
│   ├── shared/           # Shared/common components
│   ├── sidebar/          # Sidebar widgets
│   ├── topic/            # Topic components
│   └── ui/               # Base UI components (Button, Input, etc.)
├── constants/             # App constants
├── hooks/                 # Custom React hooks
├── i18n/                  # Internationalization config
├── lib/                   # Utility functions
├── stores/                # Zustand state stores
├── types/                 # TypeScript type definitions
└── middleware.ts          # Next.js middleware

messages/                  # Translation files
├── en.json               # English translations
└── zh.json               # Chinese translations
```

## Architectural Patterns

### Component Organization

- **Feature-based**: Components grouped by feature (article, account, topic)
- **Shared components**: Reusable components in `shared/`
- **Base UI**: Primitive components in `ui/` (Button, Input, Dialog, etc.)
- **Client components**: Suffix with `.client.tsx` for client-side only components

### Naming Conventions

- **Files**: PascalCase for components (`ArticleCard.tsx`)
- **Folders**: lowercase with hyphens for routes, camelCase for component folders
- **Components**: PascalCase, match filename
- **Hooks**: camelCase with `use` prefix (`useUserStore`)
- **Utilities**: camelCase (`formatRelativeTime`)

### Route Structure

- Use route groups `(name)` for layout organization without affecting URL
- Dynamic segments: `[id]`, `[locale]`
- Catch-all segments: `[[...slug]]`
- Each route can have: `page.tsx`, `layout.tsx`, `error.tsx`, `not-found.tsx`

### Component Patterns

**UI Components** (in `ui/`):
- Use `forwardRef` for ref forwarding
- Accept `className` prop for style overrides
- Use `cn()` utility to merge classes
- Define variant types with `class-variance-authority`
- Export both component and props interface

**Feature Components**:
- Client components marked with `"use client"` directive
- Server components by default (no directive)
- Use `index.ts` for clean exports
- Separate concerns: display vs. logic

### State Management

- **Global state**: Zustand stores in `src/stores/`
- **Local state**: React `useState` in components
- **Server state**: React Server Components, no client state needed
- **Persistent state**: Use Zustand persist middleware

### Styling Conventions

- Tailwind utility classes only
- Use `cn()` to conditionally merge classes
- Define variants in component props, not inline
- Responsive: mobile-first approach
- Dark mode: use Tailwind's dark mode classes

### Import Patterns

```typescript
// Always use path aliases
import { Button } from "@/components/ui/Button"
import { useUserStore } from "@/stores/useUserStore"
import { cn } from "@/lib/utils"

// Group imports: external → internal → types
import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/Button"
import type { UserProfile } from "@/types"
```

### File Exports

- Use named exports for components: `export { Button }`
- Use barrel exports (`index.ts`) for feature modules
- Export types alongside components when needed

### API Integration

- Generated API client in `src/api/`
- Never modify generated files manually
- Regenerate after OpenAPI spec changes
- Use type-safe client methods throughout app
