import { storyTheme } from "@/components/ui/story-theme";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import {
  getRandomTopicQuizIds,
  getTopicQuizzes,
  getTopics,
  quickPlayMatch,
  type Topic,
} from "@/lib";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function GameScreen() {
  const { token } = useAuth();
  const { onScroll } = useTabBarScroll();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>();
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [status, setStatus] = useState("Choose your arena and begin the duel.");

  useEffect(() => {
    getTopics()
      .then((result) => setTopics(result.slice(0, 8)))
      .catch(() => setTopics([]));
  }, []);

  async function buildQuizPoolForTopic(topicId?: string) {
    if (topicId) {
      const randomQuizIds = await getRandomTopicQuizIds(topicId, 15);
      if (randomQuizIds.length > 0) return [...new Set(randomQuizIds)];

      const quizzes = await getTopicQuizzes(topicId);
      return [...new Set(quizzes.map((quiz) => quiz.id))];
    }

    const allTopicQuizSets = await Promise.all(
      topics.slice(0, 8).map((topic) => getRandomTopicQuizIds(topic.id, 8)),
    );
    return [...new Set(allTopicQuizSets.flatMap((quizSet) => quizSet))];
  }

  async function startQuickPlay() {
    if (!token) return;

    try {
      setStatus("Building your quiz pool...");
      setIsLoadingPool(true);
      const quizPool = await buildQuizPoolForTopic(selectedTopicId);
      if (quizPool.length === 0) {
        setStatus("This arena does not have enough quiz material yet.");
        return;
      }

      const result = await quickPlayMatch({
        token,
        topicId: selectedTopicId,
        quizPool,
        maxRounds: Math.min(5, quizPool.length),
      });

      setStatus(
        result.isNew
          ? "Battle room opened. Waiting for a challenger."
          : "Opponent found. Your duel is ready.",
      );
    } catch {
      setStatus("Could not create the duel. Please try again.");
    } finally {
      setIsLoadingPool(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Game</Text>
          <Text style={styles.heroTitle}>Enter the 1v1 arena</Text>
          <Text style={styles.heroCopy}>
            Pick a theme, build a quiz pool, and challenge another player in a
            fast story-driven match.
          </Text>
        </View>

        <View style={styles.modeCard}>
          <Text style={styles.cardEyebrow}>Quick play</Text>
          <Text style={styles.cardTitle}>Choose your battleground</Text>
          <Text style={styles.cardCopy}>
            Start with a topic you know or let the app build a mixed pool from
            several worlds.
          </Text>

          <View style={styles.topicWrap}>
            <Pressable
              onPress={() => setSelectedTopicId(undefined)}
              style={({ pressed }) => [
                styles.topicPill,
                selectedTopicId === undefined && styles.topicPillActive,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.topicText,
                  selectedTopicId === undefined && styles.topicTextActive,
                ]}
              >
                Mixed Arena
              </Text>
            </Pressable>

            {topics.map((topic) => {
              const active = selectedTopicId === topic.id;
              return (
                <Pressable
                  key={topic.id}
                  onPress={() => setSelectedTopicId(topic.id)}
                  style={({ pressed }) => [
                    styles.topicPill,
                    active && styles.topicPillActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.topicText, active && styles.topicTextActive]}>
                    {topic.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Arena status</Text>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={startQuickPlay}
          disabled={isLoadingPool}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isLoadingPool && styles.primaryButtonPressed,
            isLoadingPool && styles.primaryButtonDisabled,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isLoadingPool ? "Preparing Duel..." : "Start 1v1"}
          </Text>
        </Pressable>
      </View>
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
    paddingBottom: 120,
    gap: 16,
  },
  hero: {
    backgroundColor: storyTheme.plum,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    gap: 10,
  },
  heroEyebrow: {
    color: "#f3d58f",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: storyTheme.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
  },
  heroCopy: {
    color: "#efe4f1",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  modeCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    gap: 12,
  },
  cardEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  cardCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  topicWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },
  topicPill: {
    backgroundColor: storyTheme.white,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  topicPillActive: {
    backgroundColor: storyTheme.navy,
    borderColor: storyTheme.navy,
  },
  topicText: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  topicTextActive: {
    color: storyTheme.white,
  },
  statusCard: {
    backgroundColor: "#fff4dd",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1d6ac",
    padding: 18,
    gap: 8,
  },
  statusLabel: {
    color: "#b8773f",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statusText: {
    color: storyTheme.ink,
    fontSize: 16,
    lineHeight: 25,
    fontWeight: "700",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: storyTheme.paper,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: storyTheme.navy,
    borderRadius: 20,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonPressed: {
    backgroundColor: storyTheme.navyPressed,
  },
  primaryButtonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: storyTheme.white,
    fontSize: 18,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.94,
  },
});
