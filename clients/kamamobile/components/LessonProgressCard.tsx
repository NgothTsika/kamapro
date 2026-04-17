import React from "react";
import {
  View,
  Text,
  Pressable,
  ImageBackground,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";

interface LessonProgressCardProps {
  id: string;
  title: string;
  coverImage?: string | null;
  progress: number; // 0-100
  xpReward?: number;
  colorScheme: "light" | "dark";
  onPress?: () => void;
}

export function LessonProgressCard({
  id,
  title,
  coverImage,
  progress,
  xpReward,
  colorScheme,
  onPress,
}: LessonProgressCardProps) {
  const colors = Colors[colorScheme];

  const getProgressColor = (progressValue: number) => {
    if (progressValue < 33) return "#ef4444"; // red
    if (progressValue < 66) return "#f59e0b"; // amber
    return "#10b981"; // emerald
  };

  return (
    <Pressable
      style={{
        width: 160,
        borderRadius: 12,
        overflow: "hidden",
      }}
      onPress={onPress}
    >
      <ImageBackground
        source={{
          uri: coverImage || "https://via.placeholder.com/160x180",
        }}
        style={{
          width: "100%",
          height: 180,
          justifyContent: "space-between",
          padding: 12,
        }}
        imageStyle={{ opacity: 0.7 }}
      >
        {/* Background overlay */}
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
          }}
        />

        {/* Top section - Title */}
        <View style={{ zIndex: 1 }}>
          <Text
            style={{
              color: "white",
              fontSize: 12,
              fontWeight: "700",
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>

        {/* Bottom section - Progress info */}
        <View style={{ zIndex: 1, gap: 8 }}>
          {/* XP Badge */}
          {xpReward && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                alignSelf: "flex-start",
              }}
            >
              <MaterialCommunityIcons name="star" color="#fbbf24" size={14} />
              <Text
                style={{
                  color: "white",
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                +{xpReward} XP
              </Text>
            </View>
          )}

          {/* Progress Bar */}
          <View style={{ gap: 4 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 11,
                  fontWeight: "600",
                }}
              >
                Progress
              </Text>
              <Text
                style={{
                  color: getProgressColor(progress),
                  fontSize: 11,
                  fontWeight: "700",
                }}
              >
                {progress}%
              </Text>
            </View>
            <View
              style={{
                height: 6,
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  backgroundColor: getProgressColor(progress),
                }}
              />
            </View>
          </View>

          {/* Continue Button */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: getProgressColor(progress),
              paddingHorizontal: 8,
              paddingVertical: 6,
              borderRadius: 6,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 12,
                fontWeight: "700",
                flex: 1,
              }}
            >
              Continue
            </Text>
            <MaterialCommunityIcons
              name="arrow-right"
              color="white"
              size={14}
            />
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  );
}
