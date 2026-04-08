import { getCharacters, getDashboard, getTopics, type Character, type Topic } from "@/lib/api";
import { useAuth } from "@/lib/auth/auth-context";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";

export default function HomeScreen() {
  const { token, user } = useAuth();
  const [hearts, setHearts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    async function load() {
      if (!token) return;
      const [dashboard, topicItems, characterItems] = await Promise.all([
        getDashboard(token),
        getTopics(),
        getCharacters(),
      ]);
      setHearts(dashboard.hearts.hearts);
      setStreak(dashboard.streak.currentStreak);
      setTopics(topicItems.slice(0, 8));
      setCharacters(characterItems.slice(0, 8));
    }

    load().catch(() => {
      // Keep home resilient while API is still evolving.
    });
  }, [token]);

  const headerName = useMemo(() => user?.username ?? "Explorer", [user?.username]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0e0a06",
        paddingTop: 56,
        paddingHorizontal: 16,
        gap: 14,
      }}
    >
      <View style={{ gap: 6 }}>
        <Text style={{ color: "#f8d568", fontWeight: "700" }}>Kama Mobile</Text>
        <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
          Hello, {headerName}
        </Text>
        <Text style={{ color: "#d8c3a5" }}>Wisdom of African legends lives here.</Text>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "#5a1f1f",
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#7a2d2d",
          }}
        >
          <Text style={{ color: "#ffdede" }}>Hearts</Text>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
            ❤️ {hearts}
          </Text>
        </View>
        <View
          style={{
            flex: 1,
            backgroundColor: "#4a2b05",
            padding: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#7a4a12",
          }}
        >
          <Text style={{ color: "#f4ddbe" }}>Streak</Text>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "700" }}>
            🔥 {streak}
          </Text>
        </View>
      </View>

      <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Legendary Characters</Text>
      <FlatList
        data={characters}
        horizontal
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#1d1510",
              borderRadius: 12,
              padding: 12,
              marginRight: 10,
              width: 190,
              borderWidth: 1,
              borderColor: "#3a2b1f",
            }}
          >
            <Text style={{ color: "#f8d568", fontSize: 12 }}>Hero</Text>
            <Text style={{ color: "white", fontWeight: "700", marginTop: 2 }}>
              {item.name}
            </Text>
            <Text style={{ color: "#d0c2b0", marginTop: 4 }} numberOfLines={2}>
              {item.description || "African story hero"}
            </Text>
            <Text style={{ color: "#8f7f6a", marginTop: 8, fontSize: 12 }}>
              {item.rarityLevel ?? "common"} legend
            </Text>
          </View>
        )}
      />

      <Text style={{ color: "white", fontSize: 18, fontWeight: "700", marginTop: 4 }}>Categories / Topics</Text>
      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#17110c",
              padding: 12,
              borderRadius: 10,
              marginBottom: 8,
              borderLeftWidth: 3,
              borderLeftColor: "#f8d568",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>{item.name}</Text>
            {item.description ? (
              <Text style={{ color: "#d0c2b0", marginTop: 4 }}>{item.description}</Text>
            ) : (
              <Text style={{ color: "#907f69", marginTop: 4 }}>
                Explore stories, places, and inventions from Africa.
              </Text>
            )}
          </View>
        )}
      />
    </View>
  );
}
