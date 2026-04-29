import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { StoryPrimaryButton, StoryTitleBlock } from "./story-ui";

interface Props {
  content: any;
  onComplete: () => void;
  showAction?: boolean;
}

export function RecapStep({
  content,
  onComplete,
  showAction = true,
}: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? t("story.recap")}
        title={content.title ?? "Witness to Tyranny"}
        subtitle={content.subtitle}
      />

      <View style={styles.pointsList}>
        {content.points?.map((point: string, idx: number) => (
          <View key={idx} style={styles.point}>
            <View style={styles.timeline}>
              <View style={styles.pointBullet}>
                <Text style={styles.bulletText}>{idx + 1}</Text>
              </View>
              {idx < content.points.length - 1 ? (
                <View style={styles.timelineLine} />
              ) : null}
            </View>
            <Text style={styles.pointText}>{point}</Text>
          </View>
        ))}
      </View>
      {showAction ? (
        <StoryPrimaryButton
          label={content.buttonLabel ?? t("story.goToQuiz")}
          onPress={onComplete}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  pointsList: {
    gap: 18,
  },
  point: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  timeline: {
    alignItems: "center",
  },
  pointBullet: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#fff0de",
    borderWidth: 1,
    borderColor: "#f1cf9e",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: "#f1cf9e",
    marginTop: 6,
  },
  bulletText: {
    color: "#d67d37",
    fontSize: 16,
    fontWeight: "900",
  },
  pointText: {
    fontSize: 15,
    color: "#21314f",
    lineHeight: 24,
    flex: 1,
    fontWeight: "600",
  },
});
