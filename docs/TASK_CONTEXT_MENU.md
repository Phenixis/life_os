# Task Context Menu - Quick Actions

## Overview
The Task Display component now includes a right-click context menu that provides quick actions for task management. This feature uses the Shadcn/UI context menu component built on Radix UI primitives.

## Features

### Quick Actions
The context menu provides the following quick actions:

1. **Update due date to today** (Conditional)
   - Only shown for late tasks (overdue)
   - Sets the task's due date to the end of today
   - Useful for rescheduling overdue tasks

2. **Mark as completed** (Conditional)
   - Only shown for incomplete tasks
   - Marks the task as complete
   - Triggers completion animations and state updates

3. **Mark as incomplete** (Conditional)
   - Only shown for completed tasks
   - Reverts task to incomplete state

4. **Edit** (Separator before this)
   - Opens the task editing modal
   - Allows full task modification

5. **Delete**
   - Opens confirmation dialog
   - Soft deletes the task (can be recovered from Trash)

### Design Principles

1. **No Icons**: Quick actions do not include icons to keep the menu clean and text-focused
2. **Conditional Display**: Actions are shown/hidden based on task state (completed, overdue, etc.)
3. **Visual Separation**: Related actions are grouped with separators
4. **Maintainability**: Actions are defined in a TypeScript array for easy updates

## Implementation Details

### File Structure
- **UI Component**: `/components/ui/context-menu.tsx` (Shadcn/UI component)
- **Task Display**: `/components/big/tasks/task-display.tsx` (Modified to add context menu)

### Type Definition
```typescript
type QuickAction = {
  label: string;
  action: (task: Task.Task.TaskWithRelations) => void;
  shouldShow?: (task: Task.Task.TaskWithRelations) => boolean;
  separator?: boolean;
};
```

### Adding New Actions
To add a new quick action, simply add an entry to the `quickActions` array:

```typescript
const quickActions: QuickAction[] = [
  // ... existing actions
  {
    label: 'Your New Action',
    action: handleYourNewAction,
    shouldShow: (task) => /* condition */,
    separator: false, // Set to true to add separator before this action
  },
];
```

### State Management
- Uses React Query mutations for optimistic updates
- Integrates with existing task hooks: `useUpdateTask`, `useToggleTask`, `useDeleteTask`
- All actions follow the same mutation pattern as existing task operations

## Technical Notes

### Dependencies
- `@radix-ui/react-context-menu`: ^1.x.x (installed via npm)
- Integrates with existing mutation hooks
- No breaking changes to existing functionality

### Compatibility
- Works with all existing task display features (hover actions, expand/collapse)
- Context menu does not interfere with click-to-complete functionality
- Mobile-friendly (touch-and-hold support via Radix UI)

## Usage

1. **Right-click** on any task in the task list
2. Select an action from the context menu
3. The action executes immediately (or after confirmation for destructive actions)

## Future Enhancements

Potential additions to the quick actions menu:
- Duplicate task
- Move to different project
- Change importance level
- Add to favorites
- Set reminder
- Share task

## Security & Performance
- All actions use existing authenticated API endpoints
- Optimistic updates provide instant UI feedback
- Rollback on error ensures data consistency
- No additional network overhead compared to existing actions
