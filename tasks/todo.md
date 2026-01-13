# UI Redesign Plan - Transcript App

## Aesthetic Direction: "Analog Media Studio"

A retro-futuristic editorial style inspired by analog recording equipment, film editing suites, and magazine typography. Professional, memorable, and distinctly NOT generic AI aesthetics.

### Design Pillars
- **Typography**: Instrument Serif (display) + Space Mono (data/timestamps) + Inter (body)
- **Colors**: Deep charcoal (#0f0f0f) base, electric coral (#FF6B5B) accent, warm cream for contrast
- **Textures**: Subtle grain overlays, film-strip inspired dividers
- **Layout**: Asymmetric, generous whitespace, dramatic visual hierarchy
- **Motion**: Smooth page transitions, staggered reveals, hover micro-interactions

---

## Todo Items

### Phase 1: Foundation
- [x] Update globals.css with new color palette, typography, and base styles
- [x] Add Google Fonts: Instrument Serif + Space Mono + Inter
- [x] Create grain texture overlay utility class
- [x] Define new button and card component styles

### Phase 2: Core Pages
- [x] Redesign landing page (page.tsx) - hero, features, platform showcase
- [x] Redesign dashboard (dashboard/page.tsx) - transcript cards, layout
- [x] Redesign transcript viewer page (transcript/[id]/page.tsx)

### Phase 3: Components
- [x] Redesign Navbar.tsx - editorial header style
- [x] Redesign TranscriptViewer.tsx - studio control panel aesthetic
- [x] Redesign URLForm.tsx - prominent, tactile input experience
- [x] Update PlatformBadge styling (inherits from globals.css)

### Phase 4: Auth Pages
- [x] Redesign login page (auth/login/page.tsx)
- [x] Redesign register page (auth/register/page.tsx)

---

## Review Section

### Summary of Changes

**1. Design System (globals.css)**
- New color palette: Deep charcoal (#0f0f0f) with electric coral (#FF6B5B) accent
- Added CSS variables for consistent theming
- New typography system with display, body, and mono fonts
- Created `.film-card` component with coral left accent border
- Added grain texture overlay (`.grain`)
- Smooth ambient background animation
- Refined button styles (`.btn-primary`, `.btn-secondary`, `.btn-ghost`)
- Skeleton loading states
- Staggered animation utilities

**2. Layout (layout.tsx)**
- Updated to use Instrument Serif, Space Mono, and Inter fonts
- Clean font variable setup

**3. Landing Page (page.tsx)**
- Editorial hero with asymmetric 2-column layout
- Film-strip decorative elements
- Platform ticker with icons
- "Three steps" section with step cards
- Feature grid with icons
- Staggered animations on scroll
- Stats row (15+ platforms, Free captions, AI fallback)

**4. Dashboard (dashboard/page.tsx)**
- Film-card styling for transcript list
- Monospace typography for stats/metadata
- Refined usage card with progress bar
- Staggered list item animations
- Delete button with icon

**5. Navbar (Navbar.tsx)**
- Logo with icon + display font
- Refined navigation links
- Monospace email display

**6. TranscriptViewer (TranscriptViewer.tsx)**
- Film-card container
- Display font for title
- Monospace tabs with uppercase tracking
- Refined action buttons
- Topic badges with monospace styling

**7. URL Form (URLForm.tsx)**
- Monospace input field
- Refined loading state
- Icon in submit button

**8. Auth Pages (login + register)**
- Centered film-card layout
- Monospace labels with uppercase tracking
- Refined password strength indicator
- Divider between form and links

### Key Aesthetic Elements
- **Electric coral (#FF6B5B)** as the primary accent - departure from generic purple/blue
- **Film-strip inspired cards** - left border accent suggests media/editing
- **Editorial typography** - Instrument Serif headlines give magazine quality
- **Monospace data** - Space Mono for timestamps, stats, and labels
- **Grain texture** - subtle analog feel
- **Staggered animations** - professional reveal timing

### Files Modified
1. `src/app/globals.css` - Complete redesign
2. `src/app/layout.tsx` - Font updates
3. `src/app/page.tsx` - Landing page redesign
4. `src/app/dashboard/page.tsx` - Dashboard redesign
5. `src/app/transcript/[id]/page.tsx` - Transcript page redesign
6. `src/app/auth/login/page.tsx` - Login page redesign
7. `src/app/auth/register/page.tsx` - Register page redesign
8. `src/components/Navbar.tsx` - Navbar redesign
9. `src/components/URLForm.tsx` - Form redesign
10. `src/components/TranscriptViewer.tsx` - Viewer redesign
