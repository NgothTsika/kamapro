import React, { useState } from "react";
import { View, Image, StyleSheet, ActivityIndicator } from "react-native";
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
  mediaUrl?: string;
  onComplete: () => void;
  showAction?: boolean;
  showMedia?: boolean;
}

export function ImageFullStep({
  content,
  mediaUrl,
  onComplete,
  showAction = true,
  showMedia = true,
}: Props) {
  const { t } = useTranslation();
  const [imageLoading, setImageLoading] = useState(true);
  const paragraphs = getParagraphs(content.description, content.body);

  return (
    <View style={styles.container}>
      {showMedia && mediaUrl && (
        <View style={styles.imageWrapper}>
          {imageLoading && (
            <ActivityIndicator
              size="large"
              color="#0066cc"
              style={styles.imageLoader}
            />
          )}
          <Image
            source={{ uri: mediaUrl }}
            style={styles.image}
            onLoadEnd={() => setImageLoading(false)}
          />
        </View>
      )}

      {content.badge ? <StoryBadge label={content.badge} /> : null}
      <StoryTitleBlock
        eyebrow={content.eyebrow ?? content.caption}
        title={content.title}
        subtitle={content.subtitle}
      />
      <StoryParagraphs paragraphs={paragraphs} />
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
  imageWrapper: {
    position: "relative",
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    shadowColor: "#190a20",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 6,
  },
  image: {
    width: "100%",
    height: 320,
  },
  imageLoader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
});
