import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storyTheme } from "@/components/ui/story-theme";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import { getRoadmap, type RoadmapLevel } from "@/lib";

const fallbackSymbols = ["akan", "sankofa", "dwennimmen", "nyame dua"];

function RoadmapNode({
  level,
  index,
}: {
  level: RoadmapLevel;
  index: number;
}) {
  const alignRight = index % 2 === 1;
  const color = level.color || ["#2f6f4e", "#8b4d2f", "#265d73"][index % 3];
  const firstLesson = level.lessons[0];

  return (
    <View style={[styles.nodeRow, alignRight && styles.nodeRowRight]}>
      <View style={[styles.pathLine, { backgroundColor: `${color}55` }]} />
      <Pressable
        onPress={() => {
          if (firstLesson) {
            router.push({
              pathname: "/lesson/[slug]",
              params: {
                slug: firstLesson.slug,
                lessonTitle: firstLesson.title,
                lessonCoverImage: firstLesson.coverImage ?? undefined,
              },
            });
          }
        }}
        style={({ pressed }) => [
          styles.nodeCard,
          { borderColor: `${color}88` },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.symbolDisc, { backgroundColor: color }]}>
          <MaterialCommunityIcons
            name={index === 0 ? "seed" : "rhombus-split"}
            size={28}
            color={storyTheme.white}
          />
        </View>
        <View style={styles.nodeBody}>
          <Text style={styles.symbolLabel}>
            {level.symbol || fallbackSymbols[index % fallbackSymbols.length]}
          </Text>
          <Text style={styles.nodeTitle}>{level.title}</Text>
          {level.description ? (
            <Text style={styles.nodeCopy} numberOfLines={2}>
              {level.description}
            </Text>
          ) : null}
          <View style={styles.lessonCountPill}>
            <Text style={styles.lessonCountText}>
              {level.lessons.length} lessons
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export default function MapScreen() {
  const { onScroll } = useTabBarScroll();
  const [levels, setLevels] = useState<RoadmapLevel[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setLevels(await getRoadmap());
    } catch {
      setLevels([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Learning Map</Text>
          <Text style={styles.heroTitle}>Follow the cultural path</Text>
          <Text style={styles.heroCopy}>
            Move through ordered levels, each marked with an African symbol and
            a focused set of story lessons.
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={storyTheme.mint} />
            <Text style={styles.loadingText}>Loading roadmap...</Text>
          </View>
        ) : null}

        {!loading && levels.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No roadmap yet</Text>
            <Text style={styles.emptyCopy}>
              Create levels in the web admin to publish the learning path here.
            </Text>
          </View>
        ) : (
          <View style={styles.mapPath}>
            {levels.map((level, index) => (
              <RoadmapNode key={level.id} level={level} index={index} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: storyTheme.paper,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 42,
    gap: 22,
  },
  hero: {
    backgroundColor: storyTheme.navy,
    borderRadius: 28,
    padding: 22,
    gap: 8,
  },
  heroEyebrow: {
    color: "#f5d78f",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: storyTheme.white,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  heroCopy: {
    color: "#e7eef7",
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
  },
  loadingCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: storyTheme.inkSoft,
    fontWeight: "700",
  },
  mapPath: {
    gap: 18,
    paddingBottom: 16,
  },
  nodeRow: {
    alignItems: "flex-start",
    minHeight: 156,
  },
  nodeRowRight: {
    alignItems: "flex-end",
  },
  pathLine: {
    position: "absolute",
    top: -16,
    bottom: -16,
    left: "50%",
    width: 5,
    borderRadius: 999,
  },
  nodeCard: {
    width: "86%",
    flexDirection: "row",
    gap: 14,
    borderRadius: 28,
    borderWidth: 2,
    backgroundColor: storyTheme.paperSoft,
    padding: 16,
  },
  symbolDisc: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeBody: {
    flex: 1,
    gap: 6,
  },
  symbolLabel: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  nodeTitle: {
    color: storyTheme.ink,
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "900",
  },
  nodeCopy: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "600",
  },
  lessonCountPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#fff4dd",
    borderWidth: 1,
    borderColor: "#f5d7a5",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  lessonCountText: {
    color: "#bf7430",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  emptyCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 22,
    gap: 8,
  },
  emptyTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  emptyCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.82,
  },
});
