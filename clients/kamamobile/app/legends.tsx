import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import {
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storyTheme } from "@/components/ui/story-theme";
import { getCharacters, type Character } from "@/lib";

function LegendCard({ character }: { character: Character }) {
  return (
    <Pressable
      onPress={() => router.push(`/character-detail?slug=${character.slug}`)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ImageBackground
        source={character.imageUrl ? { uri: character.imageUrl } : undefined}
        style={styles.cardHero}
        imageStyle={styles.cardHeroImage}
      >
        <View style={styles.cardShade} />
      </ImageBackground>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{character.name}</Text>
        <Text style={styles.cardCopy} numberOfLines={3}>
          {character.description ||
            character.story ||
            character.country ||
            "Open this legend to explore the story, timeline, and linked lessons."}
        </Text>
      </View>
    </Pressable>
  );
}

export default function LegendsScreen() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    getCharacters()
      .then((data) => setCharacters(data))
      .catch(() => setCharacters([]));
  }, []);

  const [featured, ...others] = useMemo(() => characters, [characters]);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={others}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.heroPanel}>
              <Text style={styles.heroEyebrow}>Legends</Text>
              <Text style={styles.heroTitle}>The full character archive</Text>
              <Text style={styles.heroCopy}>
                Browse every legend in one place while the home page stays focused
                on progress, momentum, and what to open next.
              </Text>
            </View>

            {featured ? <LegendCard character={featured} /> : null}

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>More Legends</Text>
              <Text style={styles.sectionCopy}>
                Explore historical figures, unlock paths, and story-linked
                characters across the whole archive.
              </Text>
            </View>
          </View>
        }
        renderItem={({ item }) => <LegendCard character={item} />}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No legends yet</Text>
            <Text style={styles.emptyCopy}>
              Once character data loads, the full archive will appear here.
            </Text>
          </View>
        }
      />
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
    paddingBottom: 40,
    gap: 14,
  },
  headerBlock: {
    gap: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  heroPanel: {
    backgroundColor: storyTheme.plum,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingVertical: 24,
    overflow: "hidden",
  },
  heroEyebrow: {
    color: "#f5d78f",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  heroTitle: {
    color: "#ffffff",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    marginBottom: 10,
  },
  heroCopy: {
    color: "#efe4f1",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },
  card: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  cardHero: {
    height: 210,
    backgroundColor: storyTheme.plumDark,
  },
  cardHeroImage: {
    resizeMode: "cover",
  },
  cardShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.24)",
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  cardTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  cardCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  sectionHeading: {
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  emptyCard: {
    marginTop: 30,
    borderRadius: 24,
    backgroundColor: storyTheme.paperSoft,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    color: storyTheme.ink,
    fontSize: 20,
    fontWeight: "900",
  },
  emptyCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.94,
  },
});
