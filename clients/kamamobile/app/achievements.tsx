import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SettingsScreenShell } from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import { useAuth } from "@/lib/auth/auth-context";
import {
  type Achievement,
  getAchievementsCatalog,
  getEarnedAchievements,
} from "@/lib";

const fallbackBadgeIcon = require("@/assets/KamaGame/Black/android/playstore-icon.png");

type BadgeItem = Achievement & {
  unlocked: boolean;
  earnedAt?: string | null;
};

function getRequirementText(badge: Achievement) {
  const parts = [];
  if (badge.xpRequired) parts.push(`${badge.xpRequired} XP`);
  if (badge.streakRequired) parts.push(`${badge.streakRequired} day streak`);
  return parts.length > 0 ? parts.join(" + ") : "Special milestone";
}

function BadgeIcon({
  icon,
  unlocked,
  size = 56,
}: {
  icon?: string | null;
  unlocked: boolean;
  size?: number;
}) {
  const remoteIcon = icon?.startsWith("http") ? icon : null;
  const iconName =
    icon && !remoteIcon ? (icon as keyof typeof MaterialIcons.glyphMap) : null;

  return (
    <View
      style={[
        styles.badgeIconFrame,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: unlocked ? "#1188ff" : "#d6d8db",
        },
      ]}
    >
      {remoteIcon ? (
        <Image source={{ uri: remoteIcon }} style={styles.badgeImage} />
      ) : iconName && MaterialIcons.glyphMap[iconName] ? (
        <MaterialIcons
          name={iconName}
          size={Math.round(size * 0.48)}
          color={storyTheme.white}
        />
      ) : (
        <Image source={fallbackBadgeIcon} style={styles.badgeImage} />
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const { token } = useAuth();
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catalog, earned] = await Promise.all([
        getAchievementsCatalog().catch(() => [] as Achievement[]),
        token
          ? getEarnedAchievements(token).catch(() => [])
          : Promise.resolve([]),
      ]);
      const earnedById = new Map(
        earned.map((item) => [item.achievement.id, item]),
      );

      setBadges(
        catalog.map((badge) => {
          const earnedBadge = earnedById.get(badge.id);
          return {
            ...badge,
            unlocked: Boolean(earnedBadge),
            earnedAt: earnedBadge?.earnedAt ?? null,
          };
        }),
      );
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

  const unlockedCount = useMemo(
    () => badges.filter((badge) => badge.unlocked).length,
    [badges],
  );
  const featuredBadges = badges.slice(0, 6);
  const weeklyBadges = badges.slice(6);

  return (
    <SettingsScreenShell
      title="Badges"
      subtitle="Achievements earned from the Kama database."
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>
          {unlockedCount}/{badges.length}
        </Text>
        <Text style={styles.summaryCopy}>badges unlocked</Text>
      </View>

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color="#1188ff" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured</Text>
        <View style={styles.badgeGrid}>
          {featuredBadges.map((badge) => (
            <Pressable
              key={badge.id}
              onPress={() => setSelectedBadge(badge)}
              style={({ pressed }) => [
                styles.badgeCard,
                !badge.unlocked && styles.badgeCardLocked,
                pressed && styles.pressed,
              ]}
            >
              <BadgeIcon icon={badge.icon} unlocked={badge.unlocked} />
              <Text style={styles.badgeTitle} numberOfLines={2}>
                {badge.name}
              </Text>
              {!badge.unlocked ? <View style={styles.lockOverlay} /> : null}
            </Pressable>
          ))}
        </View>
      </View>

      {weeklyBadges.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Achievement</Text>
          <View style={styles.badgeGrid}>
            {weeklyBadges.map((badge, index) => (
              <Pressable
                key={badge.id}
                onPress={() => setSelectedBadge(badge)}
                style={({ pressed }) => [
                  styles.badgeCard,
                  !badge.unlocked && styles.badgeCardLocked,
                  pressed && styles.pressed,
                ]}
              >
                <BadgeIcon icon={badge.icon} unlocked={badge.unlocked} />
                <Text style={styles.badgeTitle} numberOfLines={2}>
                  {badge.name}
                </Text>
                <View style={styles.badgeRank}>
                  <Text style={styles.badgeRankText}>{index + 1}</Text>
                </View>
                {!badge.unlocked ? <View style={styles.lockOverlay} /> : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {!loading && badges.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No badges in the database yet</Text>
          <Text style={styles.emptyCopy}>
            Once achievements are created in admin, they will appear here.
          </Text>
        </View>
      ) : null}

      <Modal
        visible={Boolean(selectedBadge)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.detailPanel}>
            <Pressable
              onPress={() => setSelectedBadge(null)}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <MaterialIcons name="close" size={22} color={storyTheme.white} />
            </Pressable>

            {selectedBadge ? (
              <View style={styles.detailCard}>
                <BadgeIcon
                  icon={selectedBadge.icon}
                  unlocked={selectedBadge.unlocked}
                  size={120}
                />
                <Text style={styles.detailTitle}>{selectedBadge.name}</Text>
                <Text style={styles.detailCopy}>
                  {selectedBadge.description}
                </Text>
                <View style={styles.detailRequirement}>
                  <Text style={styles.detailRequirementText}>
                    {selectedBadge.unlocked
                      ? "Unlocked"
                      : getRequirementText(selectedBadge)}
                  </Text>
                </View>
              </View>
            ) : null}

            <Pressable
              onPress={() => setSelectedBadge(null)}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 26,
    backgroundColor: "#1188ff",
    padding: 20,
    gap: 6,
  },
  summaryValue: {
    color: storyTheme.white,
    fontSize: 34,
    fontWeight: "900",
  },
  summaryCopy: {
    color: "#dcecff",
    fontSize: 14,
    lineHeight: 21,
  },
  loadingCard: {
    borderRadius: 18,
    backgroundColor: storyTheme.white,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    fontWeight: "700",
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 15,
    fontWeight: "900",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    width: "30.8%",
    minHeight: 126,
    borderRadius: 14,
    backgroundColor: storyTheme.white,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 9,
    overflow: "hidden",
  },
  badgeCardLocked: {
    opacity: 0.72,
  },
  badgeIconFrame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.7)",
  },
  badgeImage: {
    width: "76%",
    height: "76%",
    resizeMode: "contain",
  },
  badgeTitle: {
    color: storyTheme.ink,
    fontSize: 12,
    lineHeight: 15,
    fontWeight: "900",
    textAlign: "center",
  },
  badgeRank: {
    position: "absolute",
    right: 9,
    top: 48,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#45bf5a",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRankText: {
    color: storyTheme.white,
    fontSize: 11,
    fontWeight: "900",
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  emptyCard: {
    borderRadius: 22,
    backgroundColor: storyTheme.white,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    color: storyTheme.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  emptyCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#1188ff",
  },
  detailPanel: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 58,
    paddingBottom: 28,
    justifyContent: "space-between",
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  detailCard: {
    alignSelf: "center",
    width: "86%",
    borderRadius: 24,
    backgroundColor: storyTheme.white,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 16,
  },
  detailTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    fontWeight: "900",
    textAlign: "center",
  },
  detailCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    fontWeight: "600",
  },
  detailRequirement: {
    borderRadius: 999,
    backgroundColor: "#eef6ff",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  detailRequirementText: {
    color: "#1188ff",
    fontSize: 12,
    fontWeight: "900",
  },
  continueButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: storyTheme.white,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: "#1188ff",
    fontSize: 15,
    fontWeight: "900",
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.98 }],
  },
});
