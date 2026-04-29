import React from "react";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import type { Character } from "@/lib/api";

const appIcon = require("../../assets/images/icon.png");

export function CharacterShowcaseCard({
  character,
  side = "front",
}: {
  character: Character;
  side?: "front" | "back";
}) {
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

  if (side === "back") {
    return (
      <View style={styles.card}>
        <View style={styles.border} />
        <View style={styles.patternBorder} />
        <Image source={appIcon} style={styles.logo} />
        <View style={styles.bottomFlag}>
          <View style={[styles.flagStripe, { backgroundColor: "#CE1126" }]} />
          <View style={[styles.flagStripe, { backgroundColor: "#FCD116" }]} />
          <View style={[styles.flagStripe, { backgroundColor: "#006B3F" }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.border} />
      <View style={styles.flag}>
        <View style={[styles.flagStripe, { backgroundColor: "#CE1126" }]} />
        <View style={[styles.flagStripe, { backgroundColor: "#FCD116" }]} />
        <View style={[styles.flagStripe, { backgroundColor: "#006B3F" }]} />
      </View>

      <ImageBackground
        source={character.imageUrl ? { uri: character.imageUrl } : undefined}
        style={styles.imageWrap}
        imageStyle={styles.image}
      >
        <View style={styles.imageShade} />
      </ImageBackground>

      <View style={styles.copyBlock}>
        <Text style={styles.name} numberOfLines={1}>
          {character.name.split(" ").slice(0, -1).join(" ") || character.name}
        </Text>
        <Text style={styles.lastname} numberOfLines={1}>
          {character.name.split(" ").slice(-1)[0]}
        </Text>

        <Text style={styles.title} numberOfLines={2}>
          {character.description || "A defining figure in African history"}
        </Text>

        <Text style={styles.desc} numberOfLines={4}>
          {character.story ||
            character.description ||
            "A revolutionary story card in the Kama collection."}
        </Text>
      </View>

      {tags.length > 0 ? (
        <View style={styles.tags}>
          {tags.map((tag, index) => (
            <Text
              key={tag}
              style={[
                styles.tag,
                index === 0
                  ? { color: "#00FF88" }
                  : index === 1
                    ? { color: "#FFD700" }
                    : { color: "#FF3B3B" },
              ]}
              numberOfLines={1}
            >
              {String(tag).replace(/_/g, " ").toUpperCase()}
            </Text>
          ))}
        </View>
      ) : null}

      <Text style={styles.unlock}>UNLOCKED</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 420,
    borderRadius: 20,
    padding: 16,
    justifyContent: "space-between",
    overflow: "hidden",
    backgroundColor: "#0A0A0A",
  },
  border: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#D4AF37",
  },
  patternBorder: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
    borderWidth: 4,
    borderColor: "rgba(212, 175, 55, 0.55)",
    borderRadius: 16,
  },
  flag: {
    width: 40,
    height: 60,
    borderRadius: 6,
    overflow: "hidden",
  },
  flagStripe: {
    flex: 1,
  },
  imageWrap: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#111111",
    justifyContent: "flex-end",
  },
  image: {
    resizeMode: "cover",
  },
  imageShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
  },
  copyBlock: {
    gap: 4,
  },
  name: {
    color: "#FFF",
    fontSize: 18,
    textAlign: "center",
  },
  lastname: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },
  title: {
    color: "#FFD700",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  desc: {
    color: "#CCC",
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  tags: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  tag: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  unlock: {
    color: "#00FF88",
    textAlign: "center",
    fontWeight: "bold",
    marginTop: 8,
  },
  logo: {
    width: 140,
    height: 140,
    alignSelf: "center",
    resizeMode: "contain",
    marginTop: 90,
  },
  bottomFlag: {
    height: 20,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
  },
});
