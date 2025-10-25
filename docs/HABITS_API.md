# Habits API Documentation

This document describes the REST API endpoints for the habit tracking system.

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <api_key>
```

## Base URL
```
/api/habits
```

## Endpoints

### 1. Habits Management

#### GET /api/habits
Get all habits for the authenticated user.

**Query Parameters:**
- `activeOnly` (boolean, optional): Filter only active habits (default: true)
- `frequency` (string, optional): Filter by frequency ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
- `search` (string, optional): Search habits by title

**Response:**
```json
{
    "habits": [
        {
            "id": 1,
            "user_id": "12345678",
            "title": "Morning Exercise",
            "description": "30 minutes of exercise",
            "color": "blue",
            "icon": "dumbbell",
            "frequency": "daily",
            "target_count": 1,
            "is_active": true,
            "created_at": "2025-06-08T10:00:00Z",
            "updated_at": "2025-06-08T10:00:00Z",
            "deleted_at": null
        }
    ]
}
```

#### POST /api/habits
Create a new habit.

**Request Body:**
```json
{
    "title": "Morning Exercise",
    "description": "30 minutes of exercise", // optional
    "color": "blue",
    "icon": "dumbbell",
    "frequency": "daily",
    "targetCount": 1
}
```

**Response:** (201 Created)
```json
{
    "habit": {
        "id": 1,
        "user_id": "12345678",
        "title": "Morning Exercise",
        "description": "30 minutes of exercise",
        "color": "blue",
        "icon": "dumbbell",
        "frequency": "daily",
        "target_count": 1,
        "is_active": true,
        "created_at": "2025-06-08T10:00:00Z",
        "updated_at": "2025-06-08T10:00:00Z",
        "deleted_at": null
    }
}
```

#### GET /api/habits/{habit-id}
Get a specific habit by ID.

**Response:**
```json
{
    "habit": {
        "id": 1,
        "user_id": "12345678",
        "title": "Morning Exercise",
        "description": "30 minutes of exercise",
        "color": "blue",
        "icon": "dumbbell",
        "frequency": "daily",
        "target_count": 1,
        "is_active": true,
        "created_at": "2025-06-08T10:00:00Z",
        "updated_at": "2025-06-08T10:00:00Z",
        "deleted_at": null
    }
}
```

#### PUT /api/habits/{habit-id}
Update a specific habit.

**Request Body:**
```json
{
    "title": "Evening Exercise", // optional
    "description": "45 minutes of exercise", // optional
    "color": "green", // optional
    "icon": "run", // optional
    "frequency": "daily", // optional
    "targetCount": 2, // optional
    "isActive": false // optional
}
```

**Response:**
```json
{
    "habit": {
        // Updated habit object
    }
}
```

#### DELETE /api/habits/{habit-id}
Delete a specific habit.

**Response:**
```json
{
    "message": "Habit deleted successfully",
    "habitId": 1
}
```

#### PATCH /api/habits/{habit-id}/toggle
Toggle habit active status.

**Response:**
```json
{
    "habit": {
        // Updated habit object
    },
    "message": "Habit activated successfully"
}
```

### 2. Habit Statistics

#### GET /api/habits/stats
Get overall user habit statistics.

**Response:**
```json
{
    "stats": {
        "totalHabits": 5,
        "activeHabits": 4,
        "totalCompletions": 120,
        "averageCompletionRate": 0.85
    }
}
```

#### GET /api/habits/{habit-id}/stats
Get statistics for a specific habit.

**Response:**
```json
{
    "stats": {
        "number_of_cycles": 30,
        "number_of_cycles_completed": 25,
        "number_of_cycles_uncompleted": 3,
        "number_of_cycles_in_progress": 2,
        "current_streak_of_cycles_completed": 5,
        "longest_streak_of_cycles_completed": 12,
        "completion_rate": 0.83
    }
}
```

### 3. Habit Entries Management

#### GET /api/habits/entries
Get all habit entries for the authenticated user.

**Query Parameters:**
- `startDate` (ISO date string, optional): Filter entries from this date
- `endDate` (ISO date string, optional): Filter entries until this date

**Response:**
```json
{
    "entries": [
        {
            "id": 1,
            "habit_id": 1,
            "user_id": "12345678",
            "date": "2025-06-08T00:00:00Z",
            "count": 1,
            "notes": "Great workout today!",
            "created_at": "2025-06-08T10:00:00Z",
            "updated_at": "2025-06-08T10:00:00Z",
            "habit": {
                // Habit object
            }
        }
    ]
}
```

#### GET /api/habits/{habit-id}/entries
Get all entries for a specific habit.

**Query Parameters:**
- `startDate` (ISO date string, optional): Filter entries from this date
- `endDate` (ISO date string, optional): Filter entries until this date
- `limit` (number, optional): Limit number of results

**Response:**
```json
{
    "entries": [
        {
            "id": 1,
            "habit_id": 1,
            "user_id": "12345678",
            "date": "2025-06-08T00:00:00Z",
            "count": 1,
            "notes": "Great workout today!",
            "created_at": "2025-06-08T10:00:00Z",
            "updated_at": "2025-06-08T10:00:00Z"
        }
    ]
}
```

#### POST /api/habits/{habit-id}/entries
Create a new entry for a specific habit.

**Request Body:**
```json
{
    "date": "2025-06-08T00:00:00Z",
    "count": 1,
    "notes": "Great workout today!" // optional
}
```

**Response:** (201 Created)
```json
{
    "entry": {
        "id": 1,
        "habit_id": 1,
        "user_id": "12345678",
        "date": "2025-06-08T00:00:00Z",
        "count": 1,
        "notes": "Great workout today!",
        "created_at": "2025-06-08T10:00:00Z",
        "updated_at": "2025-06-08T10:00:00Z"
    }
}
```

#### GET /api/habits/{habit-id}/entries/{entry-id}
Get a specific entry by ID.

**Response:**
```json
{
    "entry": {
        "id": 1,
        "habit_id": 1,
        "user_id": "12345678",
        "date": "2025-06-08T00:00:00Z",
        "count": 1,
        "notes": "Great workout today!",
        "created_at": "2025-06-08T10:00:00Z",
        "updated_at": "2025-06-08T10:00:00Z"
    }
}
```

#### PUT /api/habits/{habit-id}/entries/{entry-id}
Update a specific entry.

**Request Body:**
```json
{
    "count": 2, // optional
    "notes": "Updated notes" // optional
}
```

**Response:**
```json
{
    "entry": {
        // Updated entry object
    }
}
```

#### DELETE /api/habits/{habit-id}/entries/{entry-id}
Delete a specific entry.

**Response:**
```json
{
    "message": "Entry deleted successfully",
    "entryId": 1
}
```

### 4. Entries by Date

#### GET /api/habits/{habit-id}/entries/by-date/{date}
Get habit entry for a specific date.

**URL Parameters:**
- `date`: ISO date string (e.g., "2025-06-08")

**Response:**
```json
{
    "entry": {
        "id": 1,
        "habit_id": 1,
        "user_id": "12345678",
        "date": "2025-06-08T00:00:00Z",
        "count": 1,
        "notes": "Great workout today!",
        "created_at": "2025-06-08T10:00:00Z",
        "updated_at": "2025-06-08T10:00:00Z"
    }
}
```

#### PUT /api/habits/{habit-id}/entries/by-date/{date}
Update habit entry for a specific date.

**Request Body:**
```json
{
    "count": 2, // optional
    "notes": "Updated notes" // optional
}
```

**Response:**
```json
{
    "entry": {
        // Updated entry object
    }
}
```

#### DELETE /api/habits/{habit-id}/entries/by-date/{date}
Delete habit entry for a specific date.

**Response:**
```json
{
    "message": "Entry deleted successfully",
    "entryId": 1
}
```

## Error Responses

All endpoints return appropriate HTTP status codes and error messages:

### 400 Bad Request
```json
{
    "error": "Invalid data or missing required fields"
}
```

### 401 Unauthorized
```json
{
    "error": "Missing API key"
}
```

### 403 Forbidden
```json
{
    "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
    "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
    "error": "Internal server error message"
}
```

## Data Types

### HabitColor
Valid values: `red`, `orange`, `amber`, `yellow`, `lime`, `green`, `emerald`, `teal`, `cyan`, `sky`, `blue`, `indigo`, `violet`, `purple`, `fuchsia`, `pink`, `rose`, `gray`, `slate`, `zinc`

### HabitFrequency
Valid values: `daily`, `weekly`, `monthly`, `quarterly`, `yearly`

### HabitIcon
Any valid Lucide React icon name (e.g., `dumbbell`, `book`, `coffee`, `star`, etc.)

## Usage Examples

### Create a daily exercise habit
```bash
curl -X POST /api/habits \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Morning Exercise",
    "description": "30 minutes of cardio",
    "color": "blue",
    "icon": "dumbbell",
    "frequency": "daily",
    "targetCount": 1
  }'
```

### Log a habit completion
```bash
curl -X POST /api/habits/1/entries \
  -H "Authorization: Bearer your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-06-08T00:00:00Z",
    "count": 1,
    "notes": "Great workout today!"
  }'
```

### Get habit statistics
```bash
curl -X GET /api/habits/1/stats \
  -H "Authorization: Bearer your_api_key"
```
