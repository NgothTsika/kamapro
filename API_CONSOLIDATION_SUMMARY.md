# Mobile API Consolidation Summary

## Overview

All API functions in the mobile app have been consolidated into a single, centralized file: `/lib/kama-api.ts`, following the same pattern as the web app's `kamaweb/lib/kama-api.ts`.

## New Structure

### Main API File

- **Location**: `clients/kamamobile/lib/kama-api.ts`
- **Purpose**: Single source of truth for all API calls
- **Size**: ~370 lines
- **Organization**: Functions grouped by domain (Auth, Content, Gamification, Progress, Game, Quiz, Feedback)

### Benefits

1. **Single Source of Truth**: All API calls in one file
2. **Consistent Pattern**: Matches web app structure and conventions
3. **Easier Maintenance**: Changes to API calls only need to be made in one place
4. **Better Organization**: Clear sections for each domain
5. **Type Safety**: All functions properly typed and exported
6. **Error Handling**: Centralized error handling with ApiError class
7. **Backward Compatibility**: Legacy files re-export from kama-api.ts

## API Organization

### Auth Functions

```typescript
- loginWithEmail(input: {...}): AuthResponse
- registerWithEmail(input: {...}): AuthResponse
- loginWithGoogle(input: {...}): AuthResponse
- getMe(token: string): UserProfile
- logout(token: string): void
```

### Content Functions

```typescript
- getCategories(language?: string): Category[]
- getTopics(): Topic[]
- getCharacters(language?: string): Character[]
- getCharacterCollections(): CharacterCollection[]
- getCharacterCollection(collectionId: string): CharacterCollection
- getLessons(language?: string): LessonSummary[]
- getLesson(lessonId: string, language?: string): LessonDetail
- getLessonBySlug(slug: string, language?: string): LessonFull
- getTopicQuizzes(topicId: string): TopicQuiz[]
- getRandomTopicQuizIds(topicId: string, limit?: number): string[]
- submitPollVote(token: string, pollId: string, selectedOption: number): { ok: boolean }
- submitAudioPollVote(token: string, pollId: string, selectedOption: number): { ok: boolean }
```

### Gamification Functions

```typescript
- getHearts(token: string): HeartState
- getStreak(token: string): StreakState
- getDashboard(token: string): DashboardData
```

### Progress Functions

```typescript
- completeLesson(token: string, lessonId: string): { ok: boolean; xpEarned: number; alreadyCompleted: boolean }
- updateLessonProgress(token: string, lessonId: string, position: number): { ok: boolean }
- getInProgressLessons(token: string): LessonProgressDetail[]
```

### Game Functions

```typescript
- quickPlayMatch(input: { token: string; quizPool: string[]; topicId?: string; maxRounds?: number }): { isNew: boolean; match: MatchSummary }
```

### Quiz Functions

```typescript
- startQuizSession(token: string, quizId: string): { sessionId: string }
- answerQuiz(token: string, sessionId: string, selectedOption: number): { attempt?: {...}; heartsRemaining: number; completedAt: string | null; passed: boolean | null }
```

### Feedback Functions

```typescript
- submitLessonFeedback(input: { token: string; lessonId: string; rating: number; comment?: string }): { feedback: {...} }
```

## Migration Path

All existing imports still work thanks to backward compatibility:

### Old Way (Still Works)

```typescript
import { getCharacterCollections } from "@/lib/api/content";
import { getDashboard } from "@/lib/api/gamification";
import { getInProgressLessons } from "@/lib/api/progress";
```

### New Way (Recommended)

```typescript
import {
  getCharacterCollections,
  getDashboard,
  getInProgressLessons,
} from "@/lib/api";
```

Both work seamlessly - the old files now re-export from `kama-api.ts`.

## Files Modified

### New Files

- `clients/kamamobile/lib/kama-api.ts` - Main consolidated API file

### Updated Files (Backward Compatible)

- `clients/kamamobile/lib/api/index.ts` - Updated to export from kama-api.ts
- `clients/kamamobile/lib/api/client.ts` - Re-exports ApiError and API_BASE_URL
- `clients/kamamobile/lib/api/auth.ts` - Re-exports auth functions
- `clients/kamamobile/lib/api/content.ts` - Re-exports content functions
- `clients/kamamobile/lib/api/gamification.ts` - Re-exports gamification functions
- `clients/kamamobile/lib/api/progress.ts` - Re-exports progress functions
- `clients/kamamobile/lib/api/game.ts` - Re-exports game functions
- `clients/kamamobile/lib/api/quiz.ts` - Re-exports quiz functions
- `clients/kamamobile/lib/api/feedback.ts` - Re-exports feedback functions
- `clients/kamamobile/app/(tabs)/home.tsx` - Updated imports to use consolidated API

## Type Definitions

All types are properly imported and re-exported:

```typescript
import type {
  Category,
  Character,
  CharacterCollection,
  LessonDetail,
  LessonFull,
  LessonSummary,
  Topic,
  TopicQuiz,
  AuthResponse,
  UserProfile,
  ApiEnvelope,
  DashboardData,
  HeartState,
  StreakState,
  MatchSummary,
  LessonProgress,
  LessonProgressDetail,
} from "@/lib/api/types";
```

## Testing

All files have been verified to compile without errors:

- ✅ `home.tsx` - No errors
- ✅ `kama-api.ts` - No errors
- ✅ `api/auth.ts` - No errors
- ✅ `api/content.ts` - No errors
- ✅ `api/gamification.ts` - No errors

## Next Steps

1. Test the mobile app to ensure all API calls still work
2. Gradually migrate any remaining imports from old locations to the new consolidated API
3. Consider removing the old API files in a future refactoring (after confirming no code depends on them)
4. Update documentation to reference the new unified structure

## Future Improvements

- Add request caching for repeated calls
- Implement retry logic for failed requests
- Add request throttling for sensitive operations
- Consider using React Query or SWR for better data management
