import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { storyTheme } from "@/components/ui/story-theme";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getDashboard,
  getInProgressLessons,
  getLessons,
  type DashboardData,
  type LessonProgressDetail,
  type LessonSummary,
} from "@/lib";
import {
  buildMonthCalendar,
  buildWeeklyActivity,
  formatCompactNumber,
  getStreakMessage,
  getWeeklyInsight,
} from "@/lib/profile-insights";

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function StreakScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [inProgressLessons, setInProgressLessons] = useState<
    LessonProgressDetail[]
  >([]);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(() => new Date());
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [modalCalendarDate, setModalCalendarDate] = useState(() => new Date());

  const load = useCallback(
    async (isRefresh?: boolean) => {
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [nextDashboard, progressLessons, allLessons] = await Promise.all([
          getDashboard(token).catch(() => null),
          getInProgressLessons(token).catch(() => [] as LessonProgressDetail[]),
          getLessons().catch(() => [] as LessonSummary[]),
        ]);

        setDashboard(nextDashboard);
        setInProgressLessons(progressLessons);
        setLessons(allLessons);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  const streak = dashboard?.streak?.currentStreak ?? user?.streak ?? 0;
  const longestStreak = dashboard?.streak?.longestStreak ?? streak;
  const freezesRemaining = dashboard?.streak?.freezesRemaining ?? 0;
  const daysUntilLoss = dashboard?.streak?.daysUntilLoss ?? 1;
  const weeklyActivity = useMemo(
    () => buildWeeklyActivity(dashboard),
    [dashboard],
  );
  const calendar = useMemo(
    () => buildMonthCalendar(dashboard, calendarViewDate),
    [calendarViewDate, dashboard],
  );
  const modalCalendar = useMemo(
    () => buildMonthCalendar(dashboard, modalCalendarDate),
    [modalCalendarDate, dashboard],
  );
  const activeDays = weeklyActivity.filter((item) => item.isComplete).length;
  const totalLessons = dashboard?.stats?.totalLessonsCompleted ?? 0;
  const totalQuizzes = dashboard?.stats?.totalQuizzesCompleted ?? 0;
  const totalXp = dashboard?.stats?.totalXpEarned ?? user?.xp ?? 0;
  const continueLesson = inProgressLessons[0]?.lesson ?? null;
  const suggestedLesson = continueLesson ?? lessons[0] ?? null;
  const streakMessage = getStreakMessage(dashboard);
  const weeklyInsight = getWeeklyInsight(dashboard);
  const isCurrentMonth =
    calendarViewDate.getFullYear() === new Date().getFullYear() &&
    calendarViewDate.getMonth() === new Date().getMonth();
  const shiftCalendarMonth = useCallback((offset: number) => {
    setCalendarViewDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }, []);
  const shiftModalCalendarMonth = useCallback((offset: number) => {
    setModalCalendarDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1, 12),
    );
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void load(true);
            }}
            tintColor={storyTheme.mint}
          />
        }
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.topBarButton,
              pressed && styles.pressed,
            ]}
          >
            <MaterialIcons name="arrow-back" size={20} color={storyTheme.ink} />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Streak</Text>
          <View style={styles.heroNumberRow}>
            <View>
              <Text style={styles.heroValue}>{streak}</Text>
              <Text style={styles.heroLabel}>current streak days</Text>
            </View>
            <View style={styles.flameWrap}>
              <MaterialIcons
                name="local-fire-department"
                size={42}
                color="#ff7a3d"
              />
            </View>
          </View>
          <Text style={styles.heroMessage}>{streakMessage}</Text>

          <View style={styles.heroMetricsRow}>
            <MetricCard label="Best run" value={`${longestStreak}d`} />
            <MetricCard label="Freezes" value={`${freezesRemaining}`} />
            <MetricCard label="Safe for" value={`${daysUntilLoss} day`} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={storyTheme.mint} />
            <Text style={styles.loadingText}>
              Refreshing your streak data...
            </Text>
          </View>
        ) : null}

        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Streak Calendar</Text>
            <Text style={styles.sectionCopy}>
              Weekly focus and monthly history live together, so the habit is
              easy to scan without repeating the same calendar twice.
            </Text>
          </View>

          <View style={styles.weekSummaryRow}>
            <Text style={styles.weekSummaryValue}>{activeDays}/7</Text>
            <Text style={styles.weekSummaryLabel}>completed this week</Text>
          </View>

          <View style={styles.weekRow}>
            {weeklyActivity.map((item) => (
              <View key={item.key} style={styles.dayCell}>
                <Text style={styles.dayLabel}>{item.label}</Text>
                <Pressable
                  onPress={() => {
                    setModalCalendarDate(calendarViewDate);
                    setIsCalendarModalOpen(true);
                  }}
                >
                  <View
                    style={[
                      styles.dayCircle,
                      item.isComplete && styles.dayCircleComplete,
                      item.isToday && styles.dayCircleToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayValue,
                        item.isComplete && styles.dayValueComplete,
                      ]}
                    >
                      {item.dayNumber}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What Supports The Streak</Text>
            <Text style={styles.sectionCopy}>{weeklyInsight}</Text>
          </View>

          <View style={styles.statsRow}>
            <MetricCard label="Lessons" value={`${totalLessons}`} />
            <MetricCard label="Quizzes" value={`${totalQuizzes}`} />
            <MetricCard label="XP" value={formatCompactNumber(totalXp)} />
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isCalendarModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCalendarModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalCalendar.monthLabel}</Text>
              <Pressable
                onPress={() => setIsCalendarModalOpen(false)}
                style={({ pressed }) => [
                  styles.modalCloseButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons name="close" size={24} color={storyTheme.ink} />
              </Pressable>
            </View>

            <View style={styles.modalNavRow}>
              <Pressable
                onPress={() => shiftModalCalendarMonth(-1)}
                style={({ pressed }) => [
                  styles.modalNavButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons
                  name="chevron-left"
                  size={24}
                  color={storyTheme.ink}
                />
              </Pressable>
              <Pressable
                onPress={() => shiftModalCalendarMonth(1)}
                style={({ pressed }) => [
                  styles.modalNavButton,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={storyTheme.ink}
                />
              </Pressable>
            </View>

            <View style={styles.calendarHeaderRow}>
              {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
                <Text
                  key={`${label}-${index}`}
                  style={styles.calendarHeaderText}
                >
                  {label}
                </Text>
              ))}
            </View>

            <View style={styles.modalCalendarGrid}>
              {modalCalendar.days.map((day) => (
                <View key={day.key} style={styles.modalCalendarCell}>
                  {day.value ? (
                    <View
                      style={[
                        styles.modalCalendarBubble,
                        day.isComplete && styles.modalCalendarBubbleComplete,
                        day.isToday && styles.modalCalendarBubbleToday,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarValue,
                          day.isComplete && styles.calendarValueComplete,
                        ]}
                      >
                        {day.value}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.modalCalendarBubbleEmpty} />
                  )}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 36,
    gap: 18,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: storyTheme.paperSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: "#dff2ff",
    borderRadius: 30,
    padding: 22,
    gap: 14,
    overflow: "hidden",
  },
  heroEyebrow: {
    color: storyTheme.navy,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroValue: {
    color: "#1670ff",
    fontSize: 58,
    lineHeight: 62,
    fontWeight: "900",
  },
  heroLabel: {
    color: storyTheme.navy,
    fontSize: 15,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  flameWrap: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroMessage: {
    color: storyTheme.ink,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  heroMetricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    padding: 14,
    gap: 4,
  },
  metricValue: {
    color: storyTheme.ink,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "900",
  },
  metricLabel: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  loadingCard: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: storyTheme.inkSoft,
    fontSize: 14,
  },
  panel: {
    backgroundColor: storyTheme.paperSoft,
    borderRadius: 28,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: "#eedfca",
  },
  sectionHeader: {
    gap: 4,
  },
  sectionTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "900",
  },
  sectionCopy: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  weekSummaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  weekSummaryValue: {
    color: storyTheme.plum,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "900",
  },
  weekSummaryLabel: {
    color: storyTheme.inkSoft,
    fontSize: 13,
    fontWeight: "700",
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dayCell: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  dayCircle: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: "#e6d6c0",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleComplete: {
    backgroundColor: "#ffd36d",
    borderColor: "#ffd36d",
  },
  dayCircleToday: {
    borderColor: "#1670ff",
    borderWidth: 2,
  },
  dayValue: {
    color: storyTheme.ink,
    fontSize: 13,
    fontWeight: "800",
  },
  dayValueComplete: {
    color: storyTheme.plumDark,
  },
  calendarTitleRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  calendarControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarExpandButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: storyTheme.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: storyTheme.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6d6c0",
  },
  calendarArrowButtonDisabled: {
    opacity: 0.42,
  },
  calendarMonth: {
    color: storyTheme.plum,
    fontSize: 16,
    fontWeight: "900",
  },
  calendarHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  calendarHeaderText: {
    width: "14.28%",
    textAlign: "center",
    color: storyTheme.inkSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    width: "14.28%",
    alignItems: "center",
    marginBottom: 10,
  },
  calendarBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: storyTheme.white,
  },
  calendarBubbleComplete: {
    backgroundColor: "#ffe58f",
  },
  calendarBubbleToday: {
    borderWidth: 2,
    borderColor: "#ff9c48",
  },
  calendarBubbleEmpty: {
    width: 36,
    height: 36,
  },
  calendarValue: {
    color: storyTheme.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  calendarValueComplete: {
    color: storyTheme.plumDark,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: storyTheme.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 32,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    color: storyTheme.plum,
    fontSize: 22,
    fontWeight: "900",
    flex: 1,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: storyTheme.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6d6c0",
  },
  modalNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 24,
    marginBottom: 20,
  },
  modalNavButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: storyTheme.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e6d6c0",
  },
  modalCalendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  modalCalendarCell: {
    width: "14.28%",
    alignItems: "center",
    marginBottom: 14,
  },
  modalCalendarBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: "#e6d6c0",
  },
  modalCalendarBubbleComplete: {
    backgroundColor: "#ffe58f",
    borderColor: "#ffe58f",
  },
  modalCalendarBubbleToday: {
    borderWidth: 2,
    borderColor: "#ff9c48",
  },
  modalCalendarBubbleEmpty: {
    width: 48,
    height: 48,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  ctaCard: {
    backgroundColor: storyTheme.plum,
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  ctaEyebrow: {
    color: "#f2c873",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  ctaTitle: {
    color: storyTheme.white,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
  },
  ctaCopy: {
    color: "#e7d6ea",
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: storyTheme.white,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: {
    color: storyTheme.plumDark,
    fontSize: 15,
    fontWeight: "900",
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
