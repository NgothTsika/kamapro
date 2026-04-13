# Home Page - Part 1: Categories Section

## Overview

Built the first part of the home page with a header section and category cards displaying all available categories with relevant information.

## Components Created

### 1. **CategoryCard Component**

- **Location**: `components/CategoryCard.tsx`
- **Features**:
  - Displays category cover image (or placeholder if not available)
  - Shows category name as title
  - Stats grid with 3 columns:
    - **Lessons**: Number of lessons in category (📚 icon)
    - **Heroes/Characters**: Number of characters in category (👥 icon)
    - **Chapters**: Total chapters across all lessons (📋 icon)
  - "View Category" button (primary color)
  - Fully themed with light/dark mode support
  - Reusable and responsive

### 2. **API Integration**

- **New Type**: `Category` in `lib/api/types.ts`
  - Includes: id, name, slug, description, coverImage, icon
  - Stats: lessonCount, characterCount, totalChapters

- **New Function**: `getCategories()` in `lib/api/content.ts`
  - Fetches all categories from `/content/categories` endpoint
  - Supports language parameter for localization

### 3. **Home Page Updates**

- **Location**: `app/(tabs)/home.tsx`
- **Layout Structure**:
  ```
  SafeAreaView
  ├── FlatList (scrollable categories)
  │   ├── ListHeaderComponent (sticky header)
  │   │   ├── Greeting with username
  │   │   ├── Hearts & Streak display
  │   │   ├── Tagline
  │   │   └── "Explore Categories" title
  │   ├── renderItem (CategoryCard for each category)
  │   └── ListFooterComponent (spacing)
  ```

## Features

✅ **Responsive Design**

- Adapts to different screen sizes
- Proper padding and spacing

✅ **Theme Support**

- Fully integrated with light/dark mode system
- Uses color constants from theme

✅ **Data Fetching**

- Fetches categories on component mount
- Error-resilient (graceful fallback)
- Combines with dashboard, topics, and characters data

✅ **User Experience**

- Header shows user greeting with hearts and streak
- Large, clear category cards with visual hierarchy
- Icon indicators for quick stat recognition
- Pressable cards for future navigation

## Usage

```tsx
// The CategoryCard is automatically used in the home page
// To use it elsewhere:
import { CategoryCard } from "@/components/CategoryCard";

<CategoryCard
  id="category-id"
  name="African Leaders"
  coverImage="https://..."
  lessonCount={15}
  characterCount={12}
  totalChapters={45}
  onPress={() => {
    /* handle navigation */
  }}
/>;
```

## Next Steps

- Create category detail page (`/category/[slug]`)
- Add filtering/sorting options
- Implement category search
- Add favorite/bookmark functionality
- Create category-specific lesson recommendations
