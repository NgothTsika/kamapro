import { Alert, StyleSheet, Text, View } from "react-native";
import {
  InfoCard,
  PrimaryButton,
  SecondaryButton,
  SettingsScreenShell,
} from "@/components/profile/settings-ui";
import { storyTheme } from "@/components/ui/story-theme";
import { useProfilePreferences } from "@/lib/profile/profile-preferences-context";

function PlanCard({
  title,
  price,
  features,
  active,
  accent,
}: {
  title: string;
  price: string;
  features: string[];
  active: boolean;
  accent: string;
}) {
  return (
    <View
      style={[
        styles.planCard,
        active && { borderColor: accent, backgroundColor: `${accent}12` },
      ]}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={[styles.planPrice, { color: accent }]}>{price}</Text>
      </View>
      {features.map((feature) => (
        <Text key={feature} style={styles.planFeature}>
          • {feature}
        </Text>
      ))}
      {active ? <Text style={styles.activePlanText}>Current plan</Text> : null}
    </View>
  );
}

export default function SubscriptionScreen() {
  const {
    subscriptionTier,
    lastPurchasedAt,
    lastRestoredAt,
    purchasePro,
    restorePurchases,
  } = useProfilePreferences();

  return (
    <SettingsScreenShell
      title="My subscription"
      subtitle="Compare Kama Free and Kama Pro, then upgrade or restore a previous purchase."
    >
      <PlanCard
        title="Kama Free"
        price="$0"
        accent={storyTheme.navy}
        active={subscriptionTier === "free"}
        features={[
          "Core lessons and quizzes",
          "Basic streak tracking",
          "Character progress previews",
        ]}
      />

      <PlanCard
        title="Kama Pro"
        price="$7.99 / month"
        accent={storyTheme.mint}
        active={subscriptionTier === "pro"}
        features={[
          "Unlimited hearts and stronger streak protection",
          "Priority access to new story packs",
          "Premium profile, support, and archive perks",
        ]}
      />

      <InfoCard
        title={subscriptionTier === "pro" ? "You are on Pro" : "You are on Free"}
        copy={
          subscriptionTier === "pro"
            ? `Last purchase ${formatDate(lastPurchasedAt)}`
            : "Upgrade to unlock the Pro learning perks shown above."
        }
        accent={subscriptionTier === "pro" ? "#ebf7ef" : storyTheme.paperSoft}
      />

      {lastRestoredAt ? (
        <InfoCard
          title="Purchases restored"
          copy={`Last restore ${formatDate(lastRestoredAt)}`}
          accent="#eef2f9"
        />
      ) : null}

      <PrimaryButton
        label={subscriptionTier === "pro" ? "Pro is active" : "Purchase Pro"}
        onPress={() => {
          if (subscriptionTier === "pro") {
            Alert.alert("Subscription", "Kama Pro is already active.");
            return;
          }

          void purchasePro().then(() => {
            Alert.alert(
              "Purchase complete",
              "Kama Pro is now active on this device.",
            );
          });
        }}
      />
      <SecondaryButton
        label="Restore purchases"
        onPress={() => {
          void restorePurchases().then((restored) => {
            Alert.alert(
              restored ? "Purchases restored" : "Nothing to restore",
              restored
                ? "Your previous Kama Pro purchase is active again."
                : "No restorable purchase was found on this device yet.",
            );
          });
        }}
      />
    </SettingsScreenShell>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "has not been recorded yet.";
  }

  return new Date(value).toLocaleString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  planCard: {
    borderRadius: 26,
    backgroundColor: storyTheme.white,
    borderWidth: 1,
    borderColor: storyTheme.line,
    padding: 18,
    gap: 10,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  planTitle: {
    color: storyTheme.ink,
    fontSize: 22,
    fontWeight: "900",
  },
  planPrice: {
    fontSize: 16,
    fontWeight: "900",
  },
  planFeature: {
    color: storyTheme.inkSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  activePlanText: {
    color: storyTheme.mint,
    fontSize: 13,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 4,
  },
});
