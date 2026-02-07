# ResponsiveModal Component - Visual Guide

## How It Works

The ResponsiveModal component automatically detects screen size and renders the appropriate UI:

```
┌─────────────────────────────────────────────────────────────┐
│                    ResponsiveModal                          │
│                                                             │
│  ┌─────────────┐                                           │
│  │ useIsMobile │  (called once via Context)                │
│  └──────┬──────┘                                           │
│         │                                                   │
│    ┌────▼─────┐                                            │
│    │ Context  │  (shares isMobile across all components)  │
│    └────┬─────┘                                            │
│         │                                                   │
│    ┌────▼─────────────────────────┐                       │
│    │   isMobile? (< 768px)        │                       │
│    └──┬─────────────────────┬─────┘                       │
│       │                     │                              │
│   YES │                     │ NO                           │
│       │                     │                              │
│   ┌───▼────┐           ┌────▼────┐                        │
│   │ Sheet  │           │ Dialog  │                        │
│   │(Drawer)│           │(Centered)│                       │
│   └────────┘           └─────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Mobile View (< 768px)

```
┌─────────────────────────┐
│                         │
│   Your Page Content     │
│                         │
│                         │
├─────────────────────────┤ ← Swipe down to dismiss
│  ┌───────────────────┐  │
│  │   X               │  │ ← Close button (top-right)
│  ├───────────────────┤  │
│  │                   │  │
│  │  Modal Title      │  │
│  │                   │  │
│  │  Modal Content    │  │
│  │  (Drawer)         │  │
│  │                   │  │
│  │  [Cancel] [Save]  │  │
│  │                   │  │
│  └───────────────────┘  │
│                         │
└─────────────────────────┘
         MOBILE
    (Sheet from bottom)
```

## Desktop/Tablet View (≥ 768px)

```
┌───────────────────────────────────────────────┐
│                                               │
│                                               │
│     ┌─────────────────────────────────┐      │
│     │● ●                              │      │ ← Mac-style buttons
│     ├─────────────────────────────────┤      │
│     │                                 │      │
│     │         Modal Title             │      │
│     │                                 │      │
│     │      Modal Content              │      │
│     │      (Centered Dialog)          │      │
│     │                                 │      │
│     │      [Cancel] [Save]            │      │
│     │                                 │      │
│     └─────────────────────────────────┘      │
│                                               │
│                                               │
└───────────────────────────────────────────────┘
              DESKTOP/TABLET
           (Centered Dialog)
```

## Component Architecture

```tsx
ResponsiveModal (Root)
├── ResponsiveModalContext.Provider
│   ├── Provides: isMobile (boolean)
│   └── Used by all sub-components
│
├── ResponsiveModalTrigger (Optional)
│   ├── Mobile: SheetTrigger
│   └── Desktop: DialogTrigger
│
└── ResponsiveModalContent (Required)
    ├── Mobile: SheetContent
    │   ├── Props: side, showCloseButton
    │   └── Features: Swipe-to-dismiss, X button
    │
    └── Desktop: DialogContent
        ├── Props: maxHeight, showCloseButton
        └── Features: Mac buttons, Expand button
        
        Sub-components (work in both):
        ├── ResponsiveModalHeader
        ├── ResponsiveModalTitle
        ├── ResponsiveModalDescription
        ├── ResponsiveModalFooter
        └── ResponsiveModalClose
```

## Props That Behave Differently

| Prop | Mobile (Sheet) | Desktop (Dialog) |
|------|----------------|------------------|
| `side` | ✅ Controls drawer position (top/bottom/left/right) | ❌ Ignored (always centered) |
| `maxHeight` | ❌ Ignored (uses default Sheet sizing) | ✅ Controls max height |
| `showCloseButton` | ✅ Shows X icon (top-right) | ✅ Shows Mac-style buttons (top-left) |

## Performance Optimization

```
❌ Without Context (Bad):
  ResponsiveModal calls useIsMobile()
  ResponsiveModalContent calls useIsMobile()
  ResponsiveModalHeader calls useIsMobile()
  ResponsiveModalFooter calls useIsMobile()
  ResponsiveModalTitle calls useIsMobile()
  → 5+ media query evaluations!

✅ With Context (Good):
  ResponsiveModal calls useIsMobile() ONCE
  Context provides value to all sub-components
  → 1 media query evaluation!
```

## Breakpoint Details

- **Breakpoint**: 768px (defined in `hooks/use-mobile.tsx`)
- **Mobile**: `width < 768px` → Sheet (Drawer)
- **Desktop/Tablet**: `width ≥ 768px` → Dialog (Centered)
- **Detection Method**: `window.matchMedia` with event listener

## Example Flow

1. User clicks "Create Task" button
2. ResponsiveModal opens with `open={true}`
3. useIsMobile hook checks screen width
4. Context provides isMobile value to all components
5. **Mobile**: Sheet slides up from bottom
   - User can swipe down to dismiss
   - Or tap X button to close
6. **Desktop**: Dialog fades in at center
   - User can click Mac button to close
   - Or click green button to expand
   - Or click overlay to dismiss

## Migration Example

```tsx
// BEFORE (Dialog only)
import { Dialog, DialogContent, DialogHeader, ... } from "@/components/ui/dialog"

function MyModal() {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        {/* content */}
      </DialogContent>
    </Dialog>
  )
}

// AFTER (Responsive!)
import { 
  ResponsiveModal as Dialog,
  ResponsiveModalContent as DialogContent,
  ResponsiveModalHeader as DialogHeader,
  ResponsiveModalTitle as DialogTitle,
} from "@/components/ui/responsive-modal"

function MyModal() {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>  {/* Now responsive! */}
        <DialogHeader>
          <DialogTitle>Title</DialogTitle>
        </DialogHeader>
        {/* same content */}
      </DialogContent>
    </Dialog>
  )
}
```

Only imports changed - component code stays the same! 🎉
