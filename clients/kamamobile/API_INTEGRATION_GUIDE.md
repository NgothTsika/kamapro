# Category API Integration Guide

## Type Definition

```typescript
// lib/api/types.ts
export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  icon?: string | null;
  lessonCount: number;
  characterCount: number;
  totalChapters: number;
};
```

## API Function

```typescript
// lib/api/content.ts
export async function getCategories(language?: string): Promise<Category[]> {
  const query = language ? `?language=${encodeURIComponent(language)}` : "";
  const response = await apiRequest<{ categories: Category[] }>(
    `/content/categories${query}`,
  );
  return response.categories;
}
```

## Usage in Home Screen

```typescript
// app/(tabs)/home.tsx
import { getCategories, type Category } from "@/lib/api";

export default function HomeScreen() {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const categoryItems = await getCategories();
        setCategories(categoryItems);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }

    load();
  }, []);

  // Render categories using FlatList
  return (
    <SafeAreaView>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <CategoryCard
            id={item.id}
            name={item.name}
            coverImage={item.coverImage}
            lessonCount={item.lessonCount}
            characterCount={item.characterCount}
            totalChapters={item.totalChapters}
            onPress={() => {/* handle navigation */}}
          />
        )}
      />
    </SafeAreaView>
  );
}
```

## Backend Endpoint Expected Response

```json
{
  "categories": [
    {
      "id": "cat_123",
      "name": "African Leaders",
      "slug": "african-leaders",
      "description": "Stories of great African leaders and their achievements",
      "coverImage": "https://cdn.example.com/african-leaders.jpg",
      "icon": "crown",
      "lessonCount": 15,
      "characterCount": 12,
      "totalChapters": 45
    },
    {
      "id": "cat_124",
      "name": "Scientific Discoveries",
      "slug": "scientific-discoveries",
      "description": "African contributions to science and technology",
      "coverImage": "https://cdn.example.com/science.jpg",
      "icon": "microscope",
      "lessonCount": 10,
      "characterCount": 8,
      "totalChapters": 32
    }
  ]
}
```

## Localization Support

The `getCategories()` function supports language localization:

```typescript
// English
const categories = await getCategories("en");

// French
const categories = await getCategories("fr");

// Spanish
const categories = await getCategories("es");
```

## Error Handling

```typescript
useEffect(() => {
  async function load() {
    try {
      const categoryItems = await getCategories();
      setCategories(categoryItems);
    } catch (error) {
      console.error("Failed to load categories:", error);
      // Optionally show user-friendly error message
      setCategories([]);
    }
  }

  load();
}, []);
```

## Computed Stats

The API returns pre-calculated stats:

- **lessonCount**: Total lessons in the category
- **characterCount**: Total unique characters mentioned in category lessons
- **totalChapters**: Sum of all chapters from all lessons in the category

These are already computed on the backend and ready to display.

## Future Enhancements

1. **Caching**: Cache categories list locally
2. **Sorting**: Sort by lessonCount, characterCount, name, etc.
3. **Filtering**: Filter by difficulty level, completion status, etc.
4. **Search**: Full-text search across categories
5. **Favorites**: Save favorite categories
6. **Progress**: Show completion percentage per category
7. **Recommendations**: ML-based category recommendations based on user activity
