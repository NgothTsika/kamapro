import type { LessonChapter } from "@/lib";
import { useCallback, useRef } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  View,
} from "react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_W - 48;

export function ChapterCarousel({
  lessonTitle,
  lessonContent,
  chapters,
  chapterIndex,
  onChapterChange,
}: {
  lessonTitle: string;
  lessonContent?: string | null;
  chapters: LessonChapter[];
  chapterIndex: number;
  onChapterChange: (index: number) => void;
}) {
  const listRef = useRef<FlatList>(null);

  const items =
    chapters.length > 0
      ? chapters.map((c) => ({
          id: c.id,
          title: c.title,
          body: c.content || "",
        }))
      : [
          {
            id: "__main__",
            title: lessonTitle,
            body: lessonContent || "",
          },
        ];

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const idx = Math.round(x / (CARD_WIDTH + 16));
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      if (clamped !== chapterIndex) onChapterChange(clamped);
    },
    [chapterIndex, items.length, onChapterChange],
  );

  return (
    <View style={{ marginVertical: 8 }}>
      <FlatList
        ref={listRef}
        horizontal
        data={items}
        keyExtractor={(it) => it.id}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        snapToAlignment="start"
        contentContainerStyle={{ paddingVertical: 8, paddingRight: 24 }}
        onMomentumScrollEnd={onScroll}
        getItemLayout={(_, index) => ({
          length: CARD_WIDTH + 16,
          offset: (CARD_WIDTH + 16) * index,
          index,
        })}
        onScrollToIndexFailed={() => {
          /* noop */
        }}
        renderItem={({ item }) => (
          <View
            style={{
              width: CARD_WIDTH,
              marginRight: 16,
              backgroundColor: "#1b140e",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#3b2a1a",
              padding: 16,
              minHeight: 220,
            }}
          >
            <Text style={{ color: "#f8d568", fontSize: 12, fontWeight: "600" }}>
              Chapter
            </Text>
            <Text
              style={{
                color: "white",
                fontSize: 20,
                fontWeight: "700",
                marginTop: 4,
              }}
            >
              {item.title}
            </Text>
            <Text
              style={{ color: "#e5d9ca", marginTop: 10, lineHeight: 24 }}
              numberOfLines={12}
            >
              {item.body || lessonContent || "Story continues…"}
            </Text>
          </View>
        )}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
          marginTop: 12,
        }}
      >
        {items.map((item, i) => (
          <Pressable
            key={item.id}
            onPress={() => {
              onChapterChange(i);
              listRef.current?.scrollToIndex({ index: i, animated: true });
            }}
          >
            <View
              style={{
                width: i === chapterIndex ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === chapterIndex ? "#f8d568" : "#4a3a2a",
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
