// All progress functions are now in /lib/kama-api.ts
// This file is kept for backward compatibility
export { type LessonProgress, type LessonProgressDetail } from "@/lib/kama-api";
export {
  completeLesson,
  updateLessonProgress,
  getInProgressLessons,
} from "@/lib/kama-api";
