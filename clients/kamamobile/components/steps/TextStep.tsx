import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import {
  getParagraphs,
  StoryBadge,
  StoryParagraphs,
  StoryPrimaryButton,
  StoryTitleBlock,
} from "./story-ui";

interface Props {
  content: any;
  onComplete: () => void;
  showAction?: boolean;
  hideBody?: boolean;
}

export function TextStep({
  content,
  onComplete,
  showAction = true,
  hideBody = false,
}: Props) {
  const { t } = useTranslation();
  const paragraphs = getParagraphs(
    content.paragraphs,
    content.body,
    content.details,
  );

  return (
    <View style={styles.container}>
      {content.badge ? <StoryBadge label={content.badge} /> : null}
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? content.kicker ?? content.label}
        title={content.title}
        subtitle={content.subtitle}
      />
      {!hideBody ? <StoryParagraphs paragraphs={paragraphs} /> : null}
      {content.callout ? (
        <View style={styles.callout}>
          <Text style={styles.calloutText}>{content.callout}</Text>
        </View>
      ) : null}
      {showAction ? (
        <StoryPrimaryButton
          label={content.buttonLabel ?? t("story.continue")}
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
  callout: {
    backgroundColor: "#fff8ee",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f3d7ad",
  },
  calloutText: {
    color: "#21314f",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "700",
  },
});
