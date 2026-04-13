# CategoryCard Component - Quick Reference

## Props Interface

```typescript
interface CategoryCardProps {
  id: string; // Unique category identifier
  name: string; // Category name/title
  coverImage?: string | null; // URL to cover image (optional)
  lessonCount: number; // Number of lessons in category
  characterCount: number; // Number of characters in category
  totalChapters: number; // Total chapters across all lessons
  onPress: () => void; // Callback when card is pressed
}
```

## Basic Usage

```typescript
import { CategoryCard } from "@/components/CategoryCard";

<CategoryCard
  id="african-leaders-001"
  name="African Leaders"
  coverImage="https://example.com/leaders.jpg"
  lessonCount={15}
  characterCount={12}
  totalChapters={45}
  onPress={() => console.log("Pressed!")}
/>
```

## With Dynamic Data

```typescript
const categories = await getCategories();

{categories.map((category) => (
  <CategoryCard
    key={category.id}
    id={category.id}
    name={category.name}
    coverImage={category.coverImage}
    lessonCount={category.lessonCount}
    characterCount={category.characterCount}
    totalChapters={category.totalChapters}
    onPress={() => navigateToCategory(category.slug)}
  />
))}
```

## In FlatList (Current Implementation)

```typescript
<FlatList
  data={categories}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <View style={{ paddingHorizontal: 16 }}>
      <CategoryCard
        id={item.id}
        name={item.name}
        coverImage={item.coverImage}
        lessonCount={item.lessonCount}
        characterCount={item.characterCount}
        totalChapters={item.totalChapters}
        onPress={() => {
          // Handle navigation or action
        }}
      />
    </View>
  )}
/>
```

## Styling Customization

The component uses theme colors internally:

- Automatically adapts to light/dark mode
- Uses `useColorScheme()` hook for detection
- All colors from `Colors[colorScheme]` constant

To customize colors globally:

1. Edit `constants/theme.ts`
2. Update color definitions
3. Changes automatically apply to all CategoryCards

## Stats Display

The component displays three stats in equal-width columns:

| Icon | Label    | Value          |
| ---- | -------- | -------------- |
| 📚   | Lessons  | lessonCount    |
| 👥   | Heroes   | characterCount |
| 📋   | Chapters | totalChapters  |

## Image Handling

**With Image:**

```
┌──────────────┐
│ [Image]      │  ← 180px height
└──────────────┘
```

**Without Image:**

```
┌──────────────┐
│   📁 Icon    │  ← Placeholder
│  (centered)  │     48x48
└──────────────┘
```

## Button Behavior

- **Label**: "View Category"
- **Color**: Primary theme color (gold)
- **Action**: Calls `onPress()` callback
- **Future**: Can navigate to category detail page

## Theme Integration

```typescript
// Automatically adapts based on device theme
const colorScheme = useColorScheme() ?? "light"; // "light" or "dark"
const colors = Colors[colorScheme];

// Light Mode Colors
- background: "#fff"
- card: "#f5f5f5"
- text: "#1a1a1a"
- primary: "#f8d568"

// Dark Mode Colors
- background: "#151718"
- card: "#1d1510"
- text: "#ECEDEE"
- primary: "#f8d568"
```

## Dimensions

- **Card Width**: Full width minus padding (16px on each side)
- **Image Height**: 180px
- **Corner Radius**: 16px
- **Padding**: 14px internal, 16px external
- **Stats Grid Gaps**: 12px between items
- **Button Height**: 44px (standard touch target)

## Accessibility

- **Pressable**: Full card is pressable
- **Icons**: Descriptive for stat meanings
- **Text Hierarchy**: Title > stats > button
- **Colors**: High contrast maintained across themes

## Performance

- **Lightweight**: Minimal re-renders
- **Image Lazy Loading**: Built-in with Image component
- **Theme Caching**: Uses memoized color constants

## Error Handling

If coverImage URL is invalid:

- Falls back to placeholder icon
- No broken image display
- User experience maintained

## Future Extensions

1. Add loading skeleton
2. Add animations on press
3. Add swipe gestures
4. Add star ratings
5. Add completion percentage indicator
6. Add new badge indicator
7. Add trending indicator
