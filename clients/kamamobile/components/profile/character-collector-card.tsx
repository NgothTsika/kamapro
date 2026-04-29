import { MaterialIcons } from "@expo/vector-icons";
import type { Character } from "@/lib/api";
import type { CharacterUnlockState } from "@/lib/character-progress";
import { getRarityColor, storyTheme } from "@/components/ui/story-theme";
import {
  ImageBackground,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export function CharacterCollectorCard({
  character,
  unlockState,
  onPress,
  compact,
}: {
  character: Character;
  unlockState: CharacterUnlockState;
  onPress: () => void;
  compact?: boolean;
}) {
  const rarityColor = getRarityColor(character.rarityLevel);
  const tags = [
    character.personType,
    character.placeType,
    character.eventType,
    character.traditionType,
    character.conceptType,
    character.entityType,
  ]
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && styles.cardCompact,
        !unlockState.isUnlocked && styles.cardLocked,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.frame}>
        <View style={styles.cardHeader}>
          <View style={[styles.rarityBadge, { borderColor: rarityColor }]}>
            <MaterialIcons name="star" size={14} color={rarityColor} />
          </View>
          <View
            style={[
              styles.stateBadge,
              unlockState.isUnlocked
                ? styles.stateBadgeUnlocked
                : styles.stateBadgeLocked,
            ]}
          >
            <MaterialIcons
              name={unlockState.isUnlocked ? "lock-open" : "lock"}
              size={12}
              color={unlockState.isUnlocked ? "#96ff5f" : "#f4d27a"}
            />
            <Text
              style={[
                styles.stateBadgeText,
                unlockState.isUnlocked
                  ? styles.stateBadgeTextUnlocked
                  : styles.stateBadgeTextLocked,
              ]}
            >
              {unlockState.isUnlocked ? "Unlocked" : "Locked"}
            </Text>
          </View>
        </View>

        <View style={styles.portraitShell}>
          <ImageBackground
            source={character.imageUrl ? { uri: character.imageUrl } : undefined}
            style={styles.portrait}
            imageStyle={styles.portraitImage}
          >
            <View style={styles.portraitGlow} />
          </ImageBackground>
        </View>

        <View style={styles.bottomPanel}>
          <Text style={styles.nameSmall} numberOfLines={1}>
            {character.name.split(" ").slice(0, -1).join(" ") || character.name}
          </Text>
          <Text style={styles.nameLarge} numberOfLines={1}>
            {character.name.split(" ").slice(-1)[0]}
          </Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {character.description ||
              character.story ||
              "A historic figure waiting in your collection."}
          </Text>

          {tags.length > 0 ? (
            <View style={styles.tagRow}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{String(tag).toUpperCase()}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <Text style={styles.unlockCopy}>{unlockState.unlockDetail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 244,
    gap: 10,
  },
  cardCompact: {
    width: 214,
  },
  frame: {
    borderRadius: 28,
    padding: 8,
    backgroundColor: "#1c1307",
    borderWidth: 2,
    borderColor: "#dba323",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  cardLocked: {
    opacity: 0.8,
  },
  cardHeader: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    zIndex: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rarityBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stateBadgeUnlocked: {
    backgroundColor: "rgba(18, 28, 10, 0.9)",
  },
  stateBadgeLocked: {
    backgroundColor: "rgba(28, 24, 11, 0.88)",
  },
  stateBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stateBadgeTextUnlocked: {
    color: "#96ff5f",
  },
  stateBadgeTextLocked: {
    color: "#f4d27a",
  },
  portraitShell: {
    height: 280,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#480404",
  },
  portrait: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "#4c0b0b",
  },
  portraitImage: {
    resizeMode: "cover",
  },
  portraitGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(13, 10, 4, 0.24)",
  },
  bottomPanel: {
    marginTop: -58,
    marginHorizontal: 8,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: "rgba(3, 3, 3, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(242, 178, 95, 0.38)",
    gap: 4,
  },
  nameSmall: {
    color: storyTheme.white,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  nameLarge: {
    color: storyTheme.white,
    fontSize: 32,
    lineHeight: 36,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  subtitle: {
    color: "#f7d46f",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: "rgba(242, 178, 95, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(242, 178, 95, 0.28)",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tagText: {
    color: "#f0c968",
    fontSize: 10,
    fontWeight: "900",
  },
  unlockCopy: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});
