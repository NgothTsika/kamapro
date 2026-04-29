import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SettingsScreenShell } from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import { useAuth } from "@/lib/auth/auth-context";
import { getDashboard, type DashboardData } from "@/lib";
import { buildDerivedBadges } from "@/lib/profile-insights";

export default function AchievementsScreen() {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setDashboard(null);
      return;
    }

    const nextDashboard = await getDashboard(token).catch(() => null);
    setDashboard(nextDashboard);
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const badges = useMemo(() => buildDerivedBadges(dashboard), [dashboard]);
  const unlockedCount = badges.filter((badge) => badge.unlocked).length;

  return (
    <SettingsScreenShell
      title="Achievements"
      subtitle="A full view of every earned and in-progress milestone."
    >
      <View style={styles.summaryCard}>
        <Text style={styles.summaryValue}>
          {unlockedCount}/{badges.length}
        </Text>
        <Text style={styles.summaryCopy}>achievements unlocked</Text>
      </View>

      <View style={styles.list}>
        {badges.map((badge) => (
          <View
            key={badge.id}
            style={[
              styles.card,
              !badge.unlocked && styles.cardLocked,
              { borderColor: `${badge.accent}28` },
            ]}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: badge.unlocked
                    ? `${badge.accent}18`
                    : "#f1ece2",
                },
              ]}
            >
              <MaterialIcons
                name={badge.icon as keyof typeof MaterialIcons.glyphMap}
                size={20}
                color={badge.unlocked ? badge.accent : storyTheme.inkSoft}
              />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{badge.title}</Text>
              <Text style={styles.cardCopy}>{badge.detail}</Text>
            </View>
            <Text
              style={[
                styles.stateText,
                badge.unlocked ? styles.stateTextUnlocked : styles.stateTextLocked,
              ]}
            >
              {badge.unlocked ? "Unlocked" : "In progress"}
            </Text>
          </View>
        ))}
      </View>
    </SettingsScreenShell>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 26,
    backgroundColor: storyTheme.navy,
    padding: 20,
    gap: 6,
  },
  summaryValue: {
    color: storyTheme.white,
    fontSize: 34,
    fontWeight: "900",
  },
  summaryCopy: {
    color: "#d6e0f0",
    fontSize: 14,
    lineHeight: 21,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 24,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLocked: {
    opacity: 0.78,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: storyTheme.ink,
    fontSize: 16,
    fontWeight: "800",
  },
  cardCopy: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  stateText: {
    fontSize: 12,
    fontWeight: "900",
  },
  stateTextUnlocked: {
    color: "#2d8d48",
  },
  stateTextLocked: {
    color: storyTheme.inkSoft,
  },
});
