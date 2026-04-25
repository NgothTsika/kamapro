import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";

interface Props {
  mediaUrl: string;
  label?: string;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

export function NarrationPlayerButton({
  mediaUrl,
  label = "Play narration",
  onPlaybackStart,
  onPlaybackEnd,
}: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  async function togglePlayback() {
    try {
      setLoading(true);

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: true },
        );

        soundRef.current = sound;
        setPlaying(true);
        onPlaybackStart?.();

        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;

          setPlaying(status.isPlaying);

          if (status.didJustFinish) {
            setPlaying(false);
            onPlaybackEnd?.();
          }
        });

        return;
      }

      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
        return;
      }

      const durationMillis = status.durationMillis ?? 0;
      if (durationMillis > 0 && status.positionMillis >= durationMillis) {
        await soundRef.current.setPositionAsync(0);
      }

      await soundRef.current.playAsync();
      setPlaying(true);
      onPlaybackStart?.();
    } catch (err) {
      console.error("Failed to play narration:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Pressable style={styles.button} onPress={() => void togglePlayback()}>
      {loading ? (
        <ActivityIndicator color="#21314f" />
      ) : (
        <>
          <MaterialIcons
            name={playing ? "pause-circle-filled" : "play-circle-filled"}
            size={24}
            color="#21314f"
          />
          <Text style={styles.text}>{playing ? "Pause narration" : label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#cfe0f7",
    backgroundColor: "#eef5ff",
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  text: {
    color: "#21314f",
    fontSize: 14,
    fontWeight: "800",
  },
});
