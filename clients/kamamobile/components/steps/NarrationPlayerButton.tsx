import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { normalizeRemoteMediaUrl } from "@/lib/media-url";

interface Props {
  mediaUrl: string;
  label?: string;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
  autoPlay?: boolean;
  playbackVolume?: number;
  playbackRate?: number;
  autoPlayDelayMs?: number;
  pauseSignal?: number;
  resumeSignal?: number;
  stopSignal?: number;
}

export function NarrationPlayerButton({
  mediaUrl,
  label = "Play narration",
  onPlaybackStart,
  onPlaybackEnd,
  autoPlay = false,
  playbackVolume = 1,
  playbackRate = 1,
  autoPlayDelayMs = 0,
  pauseSignal = 0,
  resumeSignal = 0,
  stopSignal = 0,
}: Props) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const autoPlayedRef = useRef(false);
  const sourceUrl = normalizeRemoteMediaUrl(mediaUrl) ?? mediaUrl;
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const togglePlayback = useCallback(async () => {
    try {
      setLoading(true);

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri: sourceUrl },
          {
            shouldPlay: true,
            volume: playbackVolume,
            rate: playbackRate,
            shouldCorrectPitch: true,
          },
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

      await soundRef.current.setVolumeAsync(playbackVolume);
      await soundRef.current.setRateAsync(playbackRate, true);
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
  }, [onPlaybackEnd, onPlaybackStart, playbackRate, playbackVolume, sourceUrl]);

  useEffect(() => {
    return () => {
      void soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, []);

  useEffect(() => {
    autoPlayedRef.current = false;
    void soundRef.current?.unloadAsync();
    soundRef.current = null;
    setPlaying(false);
  }, [mediaUrl]);

  useEffect(() => {
    if (!autoPlay || autoPlayedRef.current) return;
    autoPlayedRef.current = true;
    const timeout = setTimeout(() => {
      void togglePlayback();
    }, autoPlayDelayMs);

    return () => clearTimeout(timeout);
  }, [autoPlay, autoPlayDelayMs, mediaUrl, togglePlayback]);

  useEffect(() => {
    if (pauseSignal === 0) return;

    void soundRef.current?.pauseAsync().then(() => {
      setPlaying(false);
    });
  }, [pauseSignal]);

  useEffect(() => {
    void soundRef.current
      ?.setVolumeAsync(Math.max(0, Math.min(playbackVolume, 1)))
      .catch(() => undefined);
  }, [playbackVolume]);

  useEffect(() => {
    void soundRef.current
      ?.setRateAsync(Math.max(0.5, Math.min(playbackRate, 2)), true)
      .catch(() => undefined);
  }, [playbackRate]);

  useEffect(() => {
    if (resumeSignal === 0) return;

    void (async () => {
      if (!soundRef.current) {
        await togglePlayback();
        return;
      }

      await soundRef.current.setVolumeAsync(playbackVolume);
      await soundRef.current.setRateAsync(playbackRate, true);
      await soundRef.current.playAsync();
      setPlaying(true);
      onPlaybackStart?.();
    })();
  }, [
    onPlaybackStart,
    playbackRate,
    playbackVolume,
    resumeSignal,
    togglePlayback,
  ]);

  useEffect(() => {
    if (stopSignal === 0) return;

    void soundRef.current?.stopAsync().then(() => {
      setPlaying(false);
      onPlaybackEnd?.();
    });
  }, [onPlaybackEnd, stopSignal]);

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
