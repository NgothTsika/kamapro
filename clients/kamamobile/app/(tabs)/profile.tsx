import { storyTheme } from "@/components/ui/story-theme";
import { useTabBarScroll } from "@/hooks/useTabBarScroll";
import { useAuth } from "@/lib/auth/auth-context";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ProfileStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut, isLoading } = useAuth();
  const { onScroll } = useTabBarScroll();

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Profile</Text>
          <Text style={styles.heroTitle}>{user?.username ?? "Guest"}</Text>
          <Text style={styles.heroCopy}>
            {user?.email ?? "No email connected yet."}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <ProfileStat label="XP" value={user?.xp ?? 0} />
          <ProfileStat label="Streak" value={user?.streak ?? 0} />
          <ProfileStat label="Role" value={user?.role ?? "Learner"} />
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Identity</Text>
          <Text style={styles.sectionTitle}>Your learning passport</Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>{user?.username ?? "Guest"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{user?.email ?? "No email"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>{user?.language ?? "Default"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionEyebrow}>Journey</Text>
          <Text style={styles.sectionTitle}>Keep your momentum going</Text>
          <Text style={styles.sectionCopy}>
            Your profile is now part of the same storybook system as the rest of
            the app, with room for future achievements, saved legends, and progress
            history.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={signOut}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !isLoading && styles.primaryButtonPressed,
            isLoading && styles.primaryButtonDisabled,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Please Wait..." : "Sign Out"}
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
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: storyTheme.line,
    paddingVertical: 16,
    paddingHorizontal: 12,
    gap: 4,
  },
  statValue: {
    color: storyTheme.ink,
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: storyTheme.inkSoft,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 20,
    gap: 10,
  },
  sectionEyebrow: {
    color: storyTheme.amber,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 24,
    fontWeight: "600",
  },
  infoList: {
    gap: 12,
    marginTop: 4,
  },
  infoRow: {
    backgroundColor: storyTheme.white,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: storyTheme.line,
  },
  infoLabel: {
    color: storyTheme.inkSoft,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  infoValue: {
    color: storyTheme.ink,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
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
});
