# Workout Progression Tracking

## Overview

The workout progression tracking system allows users to compare their performance across different workout sessions by tracking the "best set" for each exercise.

## Key Concepts

### Best Set

The **best set** for an exercise is defined as the set lifted with the highest weight. When multiple sets share the same top weight, the tie is broken by the highest repetition count. The heaviest weight becomes the single metric used for comparisons.

Example:

- Set 1: 80kg × 8 reps
- Set 2: 85kg × 6 reps ⭐ **Best Set** (heaviest weight)
- Set 3: 80kg × 10 reps

### Progression

**Progression** is calculated by comparing the best set from the current workout against the best set from the most recent previous workout that included the same exercise.

## How It Works

### 1. Best Set Identification

For each exercise in a workout:

```typescript
bestSet = {
  weight: 85,      // kg (highest weight lifted)
  nb_rep: 6,       // repetitions
  score: 85        // heaviest weight metric (legacy field name)
}
```

### 2. Finding Previous Best Set

The system searches through previous workouts (ordered by date, most recent first) to find the last time the user performed the same exercise.

### 3. Comparison

Once both sets are identified, the system calculates:

- **Weight Difference**: Current weight - Previous weight (primary metric)
- **Percentage Change**: (Weight difference / Previous weight) × 100 (only when weight changes)
- **Reps Difference**: Current reps - Previous reps (only considered if weight stays the same)

### 4. Visual Display

Results are shown with intuitive indicators:

- 🟢 **↑** Improvement (positive change)
- 🔴 **↓** Decline (negative change)
- ⚪ **-** No change or new exercise

## Usage

### In React Components

```typescript
import { useWorkoutProgression } from "@/hooks/use-workouts"

function MyComponent({ workoutId }) {
  const { progression, isLoading } = useWorkoutProgression(workoutId)
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <div>
      {progression.exercises.map(exercise => (
        <div key={exercise.exerciseName}>
          <h3>{exercise.exerciseName}</h3>
          <p>Best: {exercise.currentBestSet.weight}kg × {exercise.currentBestSet.nb_rep}</p>
          {exercise.progression && (
            <p>
              Change: {exercise.progression.weightDiff > 0 ? '+' : ''}{exercise.progression.weightDiff}kg,
              {exercise.progression.repsDiff > 0 ? '+' : ''}{exercise.progression.repsDiff} reps
              ({exercise.progression.percentageChange.toFixed(1)}%)
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Direct Utility Functions

```typescript
import { 
  getBestSet, 
  findPreviousBestSet, 
  compareProgression,
  analyzeWorkoutProgression 
} from "@/lib/utils/workout-progression"

// Get best set for a single exercise
const bestSet = getBestSet(exercise)
// Returns: { weight: 85, nb_rep: 6, score: 85 }

// Find previous best set
const previous = findPreviousBestSet("Bench Press", previousWorkouts)
// Returns: { bestSet: {...}, workoutDate: Date, workoutId: 123 }

// Compare two sets
const comparison = compareProgression(currentBest, previousBest)
// Returns: { weightDiff: 5, repsDiff: 0, scoreDiff: 5, percentageChange: 5.88 }

// Analyze entire workout
const workoutAnalysis = analyzeWorkoutProgression(currentWorkout, allWorkouts)
// Returns: { workoutId, workoutDate, exercises: [...] }
```

## API Reference

### Types

```typescript
interface BestSet {
  weight: number        // Weight in kg
  nb_rep: number        // Number of repetitions
  score: number         // weight × nb_rep for the selected set
}

interface ExerciseProgression {
  exerciseName: string
  currentBestSet: BestSet
  previousBestSet: BestSet | null
  progression: {
    weightDiff: number
    repsDiff: number
    scoreDiff: number
    percentageChange: number
  } | null
}

interface WorkoutProgression {
  workoutId: number
  workoutDate: Date
  exercises: ExerciseProgression[]
}
```

### Functions

#### `getBestSet(exercise: WorkoutExercise): BestSet | null`

Identifies the set lifted with the highest weight (breaking ties with the highest rep count).

**Parameters:**

- `exercise`: Exercise containing multiple sets

**Returns:**

- `BestSet` object or `null` if no sets exist

---

#### `findPreviousBestSet(exerciseName: string, previousWorkouts: PastWorkout[])`

Finds the best set for a specific exercise from the most recent previous workout.

**Parameters:**

- `exerciseName`: Name of the exercise to find
- `previousWorkouts`: Array of workouts ordered by date (most recent first)

**Returns:**

- Object with `{ bestSet, workoutDate, workoutId }` or `null`

---

#### `compareProgression(currentBestSet: BestSet, previousBestSet: BestSet)`

Calculates the differences between two best sets.

**Parameters:**

- `currentBestSet`: Best set from current workout
- `previousBestSet`: Best set from previous workout

**Returns:**

- Object with `{ weightDiff, repsDiff, scoreDiff, percentageChange }`

---

#### `analyzeWorkoutProgression(currentWorkout: PastWorkout, allWorkouts: PastWorkout[])`

Analyzes progression for all exercises in a workout.

**Parameters:**

- `currentWorkout`: The workout to analyze
- `allWorkouts`: All user workouts sorted by date

**Returns:**

- `WorkoutProgression` object with exercise-by-exercise analysis

---

#### `formatProgressionText(progression: ExerciseProgression): string`

Creates user-friendly text describing the progression.

**Parameters:**

- `progression`: Exercise progression data

**Returns:**

- Formatted string (e.g., "↑ 5kg heavier, 2 more reps (+6.7%)")

## Components

### `WorkoutProgressionDisplay`
Displays progression information for a workout.

```tsx
<WorkoutProgressionDisplay workoutId={123} />
```

Shows a list of exercises with their progression badges.

### `ExerciseBestSetDisplay`
Shows the best set for an exercise.

```tsx
<ExerciseBestSetDisplay 
  exerciseName="Bench Press"
  sets={[...]}
/>
```

Displays: "Best: 80kg × 10 = 800"

## Examples

### Example 1: First Time Exercise
```
Exercise: Deadlift
Current Best: 100kg × 5 = 500
Previous Best: None
Result: "- New exercise"
```

### Example 2: Improvement
```
Exercise: Squat
Current Best: 120kg × 8 = 960
Previous Best: 110kg × 8 = 880
Result: "↑ 10kg heavier (+9.1%)"
```

### Example 3: Mixed Changes
```
Exercise: Bench Press
Current Best: 90kg × 8 = 720
Previous Best: 90kg × 6 = 540
Result: "↑ 2 more reps (+33.3%)"
```

### Example 4: Decline
```
Exercise: Pull-ups
Current Best: 0kg × 8 = 8
Previous Best: 0kg × 10 = 10
Result: "↓ 2 fewer reps (-20.0%)"
```

## Implementation Details

### Performance
- **Time Complexity**: O(n) where n is the number of previous workouts
- **Space Complexity**: O(1) for each exercise analysis
- **Caching**: Uses SWR cache, no additional API calls needed

### Edge Cases Handled
1. **No previous workouts**: Shows "New exercise"
2. **Exercise name variations**: Case-insensitive comparison
3. **Empty sets**: Returns null, skips analysis
4. **Same workout**: Filters out current workout from comparison
5. **Multiple workouts same day**: Compares with most recent

### Design Decisions

**Why "Best Set" instead of average?**
- Better represents peak performance
- More motivating for users
- Simpler to understand and track

**Why most recent previous workout?**
- More relevant for tracking immediate progress
- Avoids confusion from comparing distant workouts
- Aligns with typical workout tracking patterns

**Why maximum weight?**

- Mirrors how personal records are typically tracked
- Encourages progressive overload on intensity first
- Still captures total work by recording `weight × reps` for the selected set

## Future Enhancements

Potential improvements:

1. **Personal Records**: Track all-time best sets per exercise
2. **Progress Charts**: Visual graphs of progression over time
3. **Goal Setting**: Set targets for specific exercises
4. **Exercise Groups**: Track progression by muscle group
5. **Trend Analysis**: Identify patterns in progression
6. **Volume Tracking**: Compare total workout volume

## Troubleshooting

**Progression not showing?**

- Ensure there's a previous workout with the same exercise
- Check that exercise names match exactly (case-insensitive)
- Verify workout has sets with non-zero values

**Incorrect calculations?**

- Verify set data (weight and reps) are correct
- Check workout date ordering
- Ensure current workout is not being compared with itself
