# ResponsiveModal Component

## Overview

The `ResponsiveModal` component is a responsive modal wrapper that automatically adapts its behavior based on screen size:

- **Mobile (< 768px)**: Displays as a **Drawer** (Sheet) sliding from the bottom
- **Tablet/Desktop (≥ 768px)**: Displays as a **Dialog** (centered modal)

This component provides a consistent API while delivering an optimal user experience across different devices.

## Features

- ✅ Automatic responsive behavior based on screen size
- ✅ Maintains a single, consistent API
- ✅ Drawer behavior on mobile with swipe-to-dismiss
- ✅ Centered dialog on desktop with expand functionality
- ✅ TypeScript support
- ✅ Compatible with all existing Dialog/Sheet props

## Installation

The component is already available in `components/ui/responsive-modal.tsx` and ready to use.

## Usage

### Basic Example

```tsx
import {
    ResponsiveModal,
    ResponsiveModalContent,
    ResponsiveModalHeader,
    ResponsiveModalTitle,
    ResponsiveModalDescription,
    ResponsiveModalFooter,
} from "@/components/ui/responsive-modal"
import { Button } from "@/components/ui/button"

function MyComponent() {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

            <ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
                <ResponsiveModalContent>
                    <ResponsiveModalHeader>
                        <ResponsiveModalTitle>Title</ResponsiveModalTitle>
                        <ResponsiveModalDescription>
                            Description text
                        </ResponsiveModalDescription>
                    </ResponsiveModalHeader>

                    {/* Your content here */}

                    <ResponsiveModalFooter>
                        <Button onClick={() => setIsOpen(false)}>Close</Button>
                    </ResponsiveModalFooter>
                </ResponsiveModalContent>
            </ResponsiveModal>
        </>
    )
}
```

### With Form

```tsx
<ResponsiveModal open={isOpen} onOpenChange={setIsOpen}>
    <ResponsiveModalContent side="bottom" maxHeight="max-h-124">
        <form onSubmit={handleSubmit}>
            <ResponsiveModalHeader>
                <ResponsiveModalTitle>Create Task</ResponsiveModalTitle>
            </ResponsiveModalHeader>

            <div className="space-y-4 py-4">
                <Input placeholder="Task title" />
                {/* More form fields */}
            </div>

            <ResponsiveModalFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                </Button>
                <Button type="submit">Create</Button>
            </ResponsiveModalFooter>
        </form>
    </ResponsiveModalContent>
</ResponsiveModal>
```

## API Reference

### ResponsiveModal

Main wrapper component.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls the open state |
| `onOpenChange` | `(open: boolean) => void` | - | Callback when state changes |
| `children` | `ReactNode` | - | Modal content |

### ResponsiveModalContent

Content wrapper with different rendering based on screen size.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | Drawer position on mobile only (no effect on desktop) |
| `maxHeight` | `string` | `"max-h-124 lg:max-h-124"` | Maximum height for desktop dialog only (no effect on mobile) |
| `showCloseButton` | `boolean` | `true` | Show/hide close button. On desktop: displays Mac-style window buttons. On mobile: displays X icon in top-right |
| `className` | `string` | - | Additional CSS classes |

### Other Components

- `ResponsiveModalHeader`: Header section
- `ResponsiveModalFooter`: Footer section
- `ResponsiveModalTitle`: Title text
- `ResponsiveModalDescription`: Description text
- `ResponsiveModalClose`: Close button trigger
- `ResponsiveModalTrigger`: Open button trigger

## Migrating Existing Modals

To migrate an existing modal component:

1. Replace Dialog imports with ResponsiveModal imports:

```tsx
// Before
import { Dialog, DialogContent, DialogHeader, ... } from "@/components/ui/dialog"

// After
import { 
    ResponsiveModal as Dialog, 
    ResponsiveModalContent as DialogContent,
    ResponsiveModalHeader as DialogHeader,
    // ...
} from "@/components/ui/responsive-modal"
```

2. No other changes needed! The API is compatible.

## Examples

See the demo component at `components/big/responsive-modal-demo.tsx` or visit `/my/responsive-modal-test` (when logged in) for a live example.

## Technical Details

- **Breakpoint**: 768px (defined in `hooks/use-mobile.tsx`)
- **Mobile**: Uses `Sheet` component with bottom slide-in animation
- **Desktop**: Uses `Dialog` component with center positioning and expand functionality
- **Detection**: Uses `useIsMobile` hook with `window.matchMedia` for responsive detection
- **Performance**: Uses React Context to call `useIsMobile` only once, sharing the value across all sub-components

### Prop Behavior Differences

Some props behave differently based on device type:

- **`side`**: Only affects mobile drawer position (top, bottom, left, right). Ignored on desktop.
- **`maxHeight`**: Only affects desktop dialog height. Mobile drawers use default Sheet sizing.
- **`showCloseButton`**: 
  - On desktop: Shows Mac-style window buttons (red close, green expand)
  - On mobile: Shows a simple X icon in the top-right corner

## Browser Support

Works in all modern browsers that support:
- CSS media queries
- Radix UI Dialog/Sheet primitives
- React hooks
