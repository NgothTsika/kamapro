import {
  getRandomTopicQuizIds,
  getTopicQuizzes,
  getTopics,
  quickPlayMatch,
  type Topic,
} from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";

export default function GameScreen() {
  const { token } = useAuth();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(
    undefined,
  );
  const [isLoadingPool, setIsLoadingPool] = useState(false);
  const [status, setStatus] = useState("Pick a topic and start 1v1.");

  useEffect(() => {
    getTopics()
      .then((result) => setTopics(result.slice(0, 6)))
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
    const quizIds = allTopicQuizSets.flatMap((quizSet) => quizSet);

    return [...new Set(quizIds)];
  }

  async function startQuickPlay() {
    if (!token) return;
    try {
      setStatus("Finding rival...");
      setIsLoadingPool(true);
      const quizPool = await buildQuizPoolForTopic(selectedTopicId);
      if (quizPool.length === 0) {
        setStatus("No quizzes found for this topic yet.");
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
          ? "Room created. Waiting for challenger."
          : "Match found! Ready to start.",
      );
    } catch {
      setStatus("Could not create a 1v1 match. Check topic quizzes and retry.");
    } finally {
      setIsLoadingPool(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 56,
        paddingHorizontal: 16,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: "700" }}>
        1v1 Battle
      </Text>
      <Text style={{ color: colors.textSecondary, marginTop: 6 }}>
        Paladin-style duel experience with African story themes.
      </Text>

      <Text
        style={{
          color: colors.text,
          marginTop: 22,
          marginBottom: 10,
          fontWeight: "600",
        }}
      >
        Choose Topic
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {topics.map((topic) => {
          const active = selectedTopicId === topic.id;
          return (
            <Pressable
              key={topic.id}
              onPress={() => setSelectedTopicId(topic.id)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active ? colors.primary : colors.card,
              }}
            >
              <Text style={{ color: active ? colors.background : colors.text }}>
                {topic.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={startQuickPlay}
        disabled={isLoadingPool}
        style={{
          marginTop: 22,
          backgroundColor: colors.primary,
          borderRadius: 10,
          alignItems: "center",
          paddingVertical: 12,
        }}
      >
        <Text style={{ color: colors.background, fontWeight: "700" }}>
          {isLoadingPool ? "Building quiz pool..." : "Start 1v1"}
        </Text>
      </Pressable>

      <Text style={{ color: colors.textSecondary, marginTop: 14 }}>
        {status}
      </Text>
    </View>
  );
}
