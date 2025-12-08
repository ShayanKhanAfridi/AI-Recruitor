# AI Interview System - Design Guidelines

## Design Approach
**System**: Hybrid approach drawing from Linear's clean SaaS aesthetic + Notion's calm professionalism + Zoom's functional video interface
**Rationale**: This is a professional productivity tool requiring clarity, trust, and minimal distraction during high-stakes interviews.

---

## Typography System

**Font Families** (via Google Fonts CDN):
- Primary: 'Inter' - All UI text, buttons, labels
- Secondary: 'JetBrains Mono' - Interview ID, technical displays

**Hierarchy**:
- Page Titles: 2.5rem (40px), font-weight 700
- Section Headers: 1.5rem (24px), font-weight 600  
- Body Text: 1rem (16px), font-weight 400
- Labels/Metadata: 0.875rem (14px), font-weight 500
- Interview Questions: 1.25rem (20px), font-weight 500, line-height 1.6

---

## Layout System

**Spacing Primitives**: Use Tailwind units: 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: mb-8, mt-12
- Grid gaps: gap-4 to gap-6
- Button padding: px-6 py-3

**Grid Structure**:
- Landing/Login: Single column, max-w-md centered
- Interview Room: 60/40 split (video left, AI panel right) on desktop
- Mobile: Stack vertically, video first

**Container Constraints**:
- Max width: 1400px for interview room
- Login/Landing cards: max-w-md (448px)
- Form inputs: w-full within container

---

## Core Components

### Landing Page
- Centered card layout with logo/title
- Brief 2-3 line explanation
- Single prominent CTA: "Access Your Interview"
- Minimal footer with support link

### Login Page
**Layout**: Centered card (max-w-md)
- Interview ID field (pre-filled, read-only, mono font)
- Password input with visibility toggle icon
- "Begin Interview" button (full width)
- Error message area (text-sm, above button)
- "Interview scheduled for [date]" metadata below

### Interview Room
**Desktop Layout**:
- **Left Panel (60%)**: Video container with aspect ratio 16:9, rounded corners (rounded-lg), contains live camera feed
- **Right Panel (40%)**: Question display area with generous padding (p-8)
- **Top Bar**: Fixed header spanning full width
  - Left: Candidate name + role badge
  - Center: Countdown timer (text-lg, mono font, prominent)
  - Right: Exit button (subtle, text-only)
- **Bottom Controls**: Fixed bar with centered control group
  - Start/End Interview (primary buttons)
  - Mute/Camera toggles (icon buttons with status indicators)

**Mobile Layout** (< 768px):
- Stack vertically: Top bar → Video (full width, 16:9) → Controls → Question panel
- Sticky top bar and controls
- Question panel scrollable below fold

### Question Display Component
- Large question text (text-xl)
- Question number indicator (top-left, subtle)
- Generous whitespace around text (p-8 to p-12)
- Next button (bottom-right, secondary style)
- Space reserved for future transcript area

### Video Controls
**Button Group** (horizontal flex, gap-3):
- Each button: Square 48x48px (w-12 h-12), rounded-lg
- Icon-only with tooltips
- Active state indicators: Visual ring or fill for mute/camera off states
- Microphone, Camera, Settings icons from Heroicons

### Status Indicators
- Recording indicator: Small red dot with "Recording" text
- Time warning: When < 5 minutes, emphasize countdown
- Connectivity status: Subtle icon in top bar

### Expired/Not Started Pages
- Centered message card (max-w-lg)
- Clear icon (exclamation or clock from Heroicons)
- Large heading explaining status
- Scheduled time display
- Support contact link

---

## Responsive Breakpoints

**Mobile (< 640px)**:
- Single column everything
- Video: Full width, aspect-ratio-video
- Controls: Stacked or 2-column grid
- Top bar: Compressed (name abbreviation, smaller timer)

**Tablet (640px - 1024px)**:
- Video: 50%, Question panel: 50%
- Maintain top/bottom bars

**Desktop (> 1024px)**:
- Full 60/40 split as specified
- All elements at optimal size

---

## Animations
**Minimal, purposeful only**:
- Page transitions: Simple fade (150ms)
- Timer: Pulse effect when < 2 minutes remaining
- Button states: Subtle scale on press (scale-95)
- NO animated backgrounds, particles, or decorative motion

---

## Accessibility
- All controls keyboard navigable (tab order logical)
- Focus indicators: 2px ring on all interactive elements
- Video controls: Clear ARIA labels
- Countdown: Announced at 5min, 1min intervals
- Form inputs: Proper label associations
- Error states: Clear messaging with sufficient contrast

---

## Images
**No large hero images needed** - This is a functional application where clarity and trust matter more than marketing appeal. Use:
- Simple logo/icon for landing page
- Placeholder avatar for candidate display (before camera activates)
- Clean iconography throughout (Heroicons)

---

## Component Specifications

**Buttons**:
- Primary: Substantial padding (px-8 py-3), rounded-lg, font-weight 600
- Secondary: Similar size, different visual treatment
- Icon buttons: Square (w-10 h-10 to w-12 h-12), rounded-md

**Form Fields**:
- Height: h-12
- Padding: px-4
- Border: 1px, rounded-md
- Focus: Ring effect (ring-2)

**Cards**:
- Padding: p-6 to p-8
- Border radius: rounded-xl
- Shadow: Subtle (shadow-sm on desktop, shadow-md on hover)

**Top/Bottom Bars**:
- Height: h-16
- Padding: px-6
- Border: 1px on appropriate edge
- Sticky positioning on mobile

This system prioritizes clarity, professionalism, and zero distraction during critical interview moments while maintaining full responsiveness across all devices.