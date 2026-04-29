import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { StoryPrimaryButton, StoryTitleBlock } from "./story-ui";

interface Props {
  onComplete?: () => void;
  label?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  showAction?: boolean;
  fixed?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  secondaryIconName?: React.ComponentProps<typeof MaterialIcons>["name"];
  secondaryIconOnly?: boolean;
  countdownSeconds?: number | null;
  countdownLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  tertiaryLabel?: string;
  onTertiaryPress?: () => void;
  tertiaryIconName?: React.ComponentProps<typeof MaterialIcons>["name"];
  tertiaryIconOnly?: boolean;
}

export function ContinueButtonStep({
  onComplete,
  label,
  title,
  subtitle,
  body,
  showAction = true,
  fixed = false,
  secondaryLabel,
  onSecondaryPress,
  secondaryIconName = "arrow-back-ios-new",
  secondaryIconOnly = false,
  countdownSeconds,
  countdownLabel,
  loading,
  disabled,
  tertiaryLabel,
  onTertiaryPress,
  tertiaryIconName = "pause",
  tertiaryIconOnly = false,
}: Props) {
  const { t } = useTranslation();
  const resolvedLabel = label ?? t("story.continue");
  const resolvedTitle = title ?? t("story.readyToContinue");
  const resolvedSubtitle = subtitle ?? t("story.nextSceneWaiting");
  const resolvedBody = body ?? t("story.nextBeatBody");
  const resolvedCountdownLabel = countdownLabel ?? t("story.autoContinuing");

  if (fixed) {
    return (
      <View style={styles.fixedShell}>
        {typeof countdownSeconds === "number" ? (
          <Text style={styles.countdownText}>
            {`${resolvedCountdownLabel} in ${countdownSeconds}s`}
          </Text>
        ) : null}

        <View style={styles.fixedActions}>
          {secondaryLabel && onSecondaryPress ? (
            <Pressable
              onPress={onSecondaryPress}
              style={[
                styles.secondaryButton,
                secondaryIconOnly && styles.secondaryIconButton,
              ]}
            >
              {secondaryIconOnly ? (
                <MaterialIcons
                  name={secondaryIconName}
                  size={18}
                  color="#21314f"
                />
              ) : (
                <Text style={styles.secondaryButtonText}>{secondaryLabel}</Text>
              )}
            </Pressable>
          ) : null}
          {tertiaryLabel && onTertiaryPress ? (
            <Pressable
              onPress={onTertiaryPress}
              style={[
                styles.secondaryButton,
                tertiaryIconOnly && styles.secondaryIconButton,
              ]}
            >
              {tertiaryIconOnly ? (
                <MaterialIcons
                  name={tertiaryIconName}
                  size={18}
                  color="#21314f"
                />
              ) : (
                <Text style={styles.secondaryButtonText}>{tertiaryLabel}</Text>
              )}
            </Pressable>
          ) : null}
          <StoryPrimaryButton
            label={resolvedLabel}
            onPress={onComplete ?? (() => {})}
            loading={loading}
            disabled={disabled}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={t("story.next")}
        title={resolvedTitle}
        subtitle={resolvedSubtitle}
      />
      <View style={styles.content}>
        <Text style={styles.text}>{resolvedBody}</Text>
      </View>
      {showAction ? (
        <StoryPrimaryButton
          label={resolvedLabel}
          onPress={onComplete ?? (() => {})}
          loading={loading}
          disabled={disabled}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  content: {
    backgroundColor: "#fff8ee",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#f3d7ad",
  },
  text: {
    fontSize: 15,
    color: "#21314f",
    lineHeight: 24,
    fontWeight: "600",
  },
  fixedShell: {
    gap: 10,
  },
  countdownText: {
    color: "#6e7a90",
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
  fixedActions: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d9cfbe",
    backgroundColor: "#fbf4e7",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  secondaryIconButton: {
    width: 52,
    minWidth: 52,
    paddingHorizontal: 0,
    borderRadius: 26,
  },
  secondaryButtonText: {
    color: "#21314f",
    fontSize: 15,
    fontWeight: "800",
  },
});
