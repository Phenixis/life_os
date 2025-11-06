# Task State Feature

## Overview

The task state feature adds a workflow state to tasks, enabling Kanban-style task management. Each task now has a `state` attribute that represents its position in a workflow.

## States

Tasks can be in one of the following states:
- **"to do"** (default): Task hasn't been started yet
- **"work in progress"**: Task is currently being worked on
- **"stalled"**: Task is blocked or paused
- **"done"**: Task is completed

## Automatic State Transitions

- When a task is **created**, its state is automatically set to **"to do"**
- When a task is **marked as complete** (completed_at is set), its state is automatically set to **"done"**
- When a task is **marked as incomplete** (completed_at is cleared), its state is automatically set to **"to do"**

## API Usage

### Creating a Task
```typescript
POST /api/task
{
  "title": "Task title",
  "importance": 1,
  "dueDate": "2024-01-01",
  "duration": 1,
  "project": { "id": 1, "title": "Project Name" },
  // state is optional, defaults to "to do"
  "state": "to do"
}
```

### Updating a Task
```typescript
PUT /api/task
{
  "id": 123,
  "title": "Updated title",
  "importance": 2,
  "dueDate": "2024-01-02",
  "duration": 2,
  "project": { "id": 1, "title": "Project Name" },
  // state can be updated manually
  "state": "work in progress"
}
```

### Filtering Tasks by State
```typescript
GET /api/task?state=work%20in%20progress
```

## Database Migration

### Running the Schema Migration
To add the `state` column to the database:
```bash
pnpm db:migrate
```

### Updating Existing Tasks
After running the schema migration, update existing tasks to have the appropriate state:
```bash
pnpm db:migrate-task-state
```

This will:
- Set state to **"done"** for all tasks where `completed_at IS NOT NULL`
- Set state to **"to do"** for all tasks where `completed_at IS NULL`

## Schema

The `state` field is defined in the task table schema:
```typescript
state: varchar('state', {length: 20}).notNull().default('to do')
```

Valid state values are defined in the `State` enum:
```typescript
export enum State {
    TODO = "to do",
    WORK_IN_PROGRESS = "work in progress",
    STALLED = "stalled",
    DONE = "done"
}
```

## Usage in Queries

The state field is included in all task queries and can be used for filtering, sorting, and grouping tasks in Kanban-style views.
