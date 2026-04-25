import { storyTheme } from "@/components/ui/story-theme";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getCharacterCollection,
  getCharacterCollections,
  getCharacters,
  getDashboard,
  type Character,
  type CharacterCollection,
} from "@/lib";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type HomeCard =
  | { type: "spotlight"; character: Character }
  | { type: "collection"; collection: CharacterCollection }
  | { type: "legend"; character: Character }
  | { type: "empty" };

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CharacterFeature({
  title,
  subtitle,
  character,
  onPress,
}: {
  title: string;
  subtitle: string;
  character: Character;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
      <ImageBackground
        source={character.imageUrl ? { uri: character.imageUrl } : undefined}
        style={styles.featureCard}
        imageStyle={styles.featureCardImage}
      >
        <View style={styles.featureShade} />
        <View style={styles.featureBadge}>
          <Text style={styles.featureBadgeText}>{title}</Text>
        </View>
        <View style={styles.featureFooter}>
          <Text style={styles.featureTitle}>{character.name}</Text>
          <Text style={styles.featureSubtitle}>{subtitle}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  );
}

function CollectionPanel({
  collection,
  onCharacterPress,
}: {
  collection: CharacterCollection;
  onCharacterPress: (slug: string) => void;
}) {
  return (
    <View style={styles.collectionPanel}>
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionEyebrow}>Collection</Text>
        <Text style={styles.collectionTitle}>{collection.name}</Text>
        {collection.description ? (
          <Text style={styles.collectionCopy}>{collection.description}</Text>
        ) : null}
      </View>

      {collection.characters && collection.characters.length > 0 ? (
        <FlatList
          data={collection.characters.slice(0, 6)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.collectionCharacters}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onCharacterPress(item.slug)}
              style={({ pressed }) => [styles.characterMiniCard, pressed && styles.pressed]}
            >
              <ImageBackground
                source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                style={styles.characterMiniImage}
                imageStyle={styles.characterMiniImageStyle}
              >
                <View style={styles.characterMiniShade} />
              </ImageBackground>
              <Text style={styles.characterMiniName} numberOfLines={1}>
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.emptyInline}>
          <Text style={styles.emptyInlineText}>No characters in this collection yet.</Text>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { onScroll } = useTabBarScroll();
  const { token, user } = useAuth();
  const [hearts, setHearts] = useState(0);
  const [streak, setStreak] = useState(0);
  const [collections, setCollections] = useState<CharacterCollection[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      try {
        const dashboard = await getDashboard(token);
        setHearts(dashboard.hearts.hearts);
        setStreak(dashboard.streak.currentStreak);
      } catch {
        setHearts(0);
        setStreak(0);
      }

      try {
        const allCollections = await getCharacterCollections();
        const sortedCollections = allCollections.sort((a, b) => a.order - b.order);
        const hydratedCollections = await Promise.all(
          sortedCollections.slice(0, 4).map(async (collection) => {
            try {
              return await getCharacterCollection(collection.id);
            } catch {
              return collection;
            }
          }),
        );
        setCollections(hydratedCollections);
      } catch {
        setCollections([]);
      }

      try {
        const allCharacters = await getCharacters();
        setCharacters(allCharacters);
      } catch {
        setCharacters([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const cards = useMemo<HomeCard[]>(() => {
    if (!characters.length && !collections.length) return [{ type: "empty" }];

    const nextCards: HomeCard[] = [];
    if (characters[0]) nextCards.push({ type: "spotlight", character: characters[0] });
    if (collections[0]) nextCards.push({ type: "collection", collection: collections[0] });
    if (characters[1]) nextCards.push({ type: "legend", character: characters[1] });
    if (collections[1]) nextCards.push({ type: "collection", collection: collections[1] });
    if (collections[2]) nextCards.push({ type: "collection", collection: collections[2] });
    return nextCards;
  }, [characters, collections]);

  const featuredCharacters = characters.slice(0, 5);

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={cards}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <View style={styles.heroPanel}>
              <Text style={styles.heroEyebrow}>Home</Text>
              <Text style={styles.heroTitle}>
                Welcome back, {user?.username ?? "Explorer"}
              </Text>
              <Text style={styles.heroCopy}>
                Follow legendary figures, continue your lesson journey, and keep your
                streak alive one story at a time.
              </Text>

              <View style={styles.statsRow}>
                <StatPill label="Hearts" value={hearts} />
                <StatPill label="Streak" value={streak} />
                <StatPill label="Legends" value={characters.length} />
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={storyTheme.mint} />
                <Text style={styles.loadingText}>Loading your world...</Text>
              </View>
            ) : null}

            {featuredCharacters.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Quick picks</Text>
                <Text style={styles.sectionCopy}>
                  The next legends and collections worth opening right now.
                </Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => {
          if (item.type === "empty") {
            return (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No stories yet</Text>
                <Text style={styles.emptyCopy}>
                  Once your characters and collections load, they’ll appear here as
                  cinematic cards.
                </Text>
              </View>
            );
          }

          if (item.type === "spotlight") {
            return (
              <CharacterFeature
                title="Spotlight"
                subtitle="A legend to meet next"
                character={item.character}
                onPress={() => router.push(`/character-detail?slug=${item.character.slug}`)}
              />
            );
          }

          if (item.type === "legend") {
            return (
              <CharacterFeature
                title="Rising Legend"
                subtitle="Fresh from the archive"
                character={item.character}
                onPress={() => router.push(`/character-detail?slug=${item.character.slug}`)}
              />
            );
          }

          return (
            <CollectionPanel
              collection={item.collection}
              onCharacterPress={(slug) => router.push(`/character-detail?slug=${slug}`)}
            />
          );
        }}
        ListFooterComponent={
          featuredCharacters.length > 0 ? (
            <View style={styles.footerPanel}>
              <Text style={styles.footerTitle}>Character Vault</Text>
              <FlatList
                data={featuredCharacters}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.vaultList}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => router.push(`/character-detail?slug=${item.slug}`)}
                    style={({ pressed }) => [styles.vaultCard, pressed && styles.pressed]}
                  >
                    <ImageBackground
                      source={item.imageUrl ? { uri: item.imageUrl } : undefined}
                      style={styles.vaultImage}
                      imageStyle={styles.vaultImageStyle}
                    >
                      <View style={styles.vaultShade} />
                    </ImageBackground>
                    <Text style={styles.vaultName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          ) : null
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
    paddingBottom: 36,
    gap: 16,
  },
  headerBlock: {
    gap: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  heroPanel: {
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
    textTransform: "uppercase",
    letterSpacing: 1.2,
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  statPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  statValue: {
    color: storyTheme.white,
    fontSize: 22,
    fontWeight: "900",
  },
  statLabel: {
    color: "#eaddef",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 2,
  },
  loadingCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    fontWeight: "700",
  },
  sectionHeader: {
    gap: 4,
    paddingTop: 4,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 23,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  featureCard: {
    height: 280,
    borderRadius: 28,
    overflow: "hidden",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: storyTheme.plumDark,
  },
  featureCardImage: {
    resizeMode: "cover",
  },
  featureShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.34)",
  },
  featureBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  featureBadgeText: {
    color: storyTheme.amber,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  featureFooter: {
    backgroundColor: storyTheme.paper,
    borderRadius: 22,
    padding: 16,
    gap: 4,
  },
  featureTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  featureSubtitle: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    fontWeight: "700",
  },
  collectionPanel: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingVertical: 18,
  },
  collectionHeader: {
    paddingHorizontal: 18,
    gap: 6,
    marginBottom: 14,
  },
  collectionEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  collectionTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  collectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  collectionCharacters: {
    paddingHorizontal: 18,
    gap: 12,
  },
  characterMiniCard: {
    width: 132,
    gap: 10,
  },
  characterMiniImage: {
    height: 150,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: storyTheme.plumDark,
  },
  characterMiniImageStyle: {
    resizeMode: "cover",
  },
  characterMiniShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.22)",
  },
  characterMiniName: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyInline: {
    marginHorizontal: 18,
    backgroundColor: storyTheme.blush,
    borderRadius: 18,
    padding: 16,
  },
  emptyInlineText: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    fontWeight: "700",
  },
  footerPanel: {
    gap: 12,
    paddingTop: 6,
  },
  footerTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  vaultList: {
    gap: 12,
  },
  vaultCard: {
    width: 122,
    gap: 8,
  },
  vaultImage: {
    height: 134,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: storyTheme.plumDark,
  },
  vaultImageStyle: {
    resizeMode: "cover",
  },
  vaultShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(31, 5, 28, 0.22)",
  },
  vaultName: {
    color: storyTheme.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyState: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
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
