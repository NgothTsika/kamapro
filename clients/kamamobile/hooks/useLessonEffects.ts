// import { useCallback, useEffect, useRef } from "react";
// import { Audio } from "expo-av";
// import * as Haptics from "expo-haptics";
// import { useAudioPreferences } from "@/lib/audio/audio-preferences-context";

// type EffectKind =
//   | "continue"
//   | "quiz"
//   | "success"
//   | "pause"
//   | "correct"
//   | "incorrect"
//   | "complete";

// const SAMPLE_RATE = 22050;
// const BASE64_ALPHABET =
//   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// function toBase64(binary: string) {
//   let output = "";

//   for (let index = 0; index < binary.length; index += 3) {
//     const chunk =
//       (binary.charCodeAt(index) << 16) |
//       ((binary.charCodeAt(index + 1) || 0) << 8) |
//       (binary.charCodeAt(index + 2) || 0);

//     output += BASE64_ALPHABET[(chunk >> 18) & 63];
//     output += BASE64_ALPHABET[(chunk >> 12) & 63];
//     output +=
//       index + 1 < binary.length ? BASE64_ALPHABET[(chunk >> 6) & 63] : "=";
//     output += index + 2 < binary.length ? BASE64_ALPHABET[chunk & 63] : "=";
//   }

//   return output;
// }

// function createToneUri(frequency: number, durationMs: number, volume = 0.32) {
//   const sampleCount = Math.max(
//     1,
//     Math.floor((SAMPLE_RATE * durationMs) / 1000),
//   );
//   const pcm = new Int16Array(sampleCount);

//   for (let index = 0; index < sampleCount; index += 1) {
//     const envelope = 1 - index / sampleCount;
//     const sample =
//       Math.sin((2 * Math.PI * frequency * index) / SAMPLE_RATE) *
//       32767 *
//       volume *
//       envelope;
//     pcm[index] = sample;
//   }

//   const dataSize = pcm.length * 2;
//   const buffer = new ArrayBuffer(44 + dataSize);
//   const view = new DataView(buffer);

//   function writeString(offset: number, value: string) {
//     for (let i = 0; i < value.length; i += 1) {
//       view.setUint8(offset + i, value.charCodeAt(i));
//     }
//   }

//   writeString(0, "RIFF");
//   view.setUint32(4, 36 + dataSize, true);
//   writeString(8, "WAVE");
//   writeString(12, "fmt ");
//   view.setUint32(16, 16, true);
//   view.setUint16(20, 1, true);
//   view.setUint16(22, 1, true);
//   view.setUint32(24, SAMPLE_RATE, true);
//   view.setUint32(28, SAMPLE_RATE * 2, true);
//   view.setUint16(32, 2, true);
//   view.setUint16(34, 16, true);
//   writeString(36, "data");
//   view.setUint32(40, dataSize, true);

//   let byteOffset = 44;
//   for (let index = 0; index < pcm.length; index += 1) {
//     view.setInt16(byteOffset, pcm[index], true);
//     byteOffset += 2;
//   }

//   const bytes = new Uint8Array(buffer);
//   let binary = "";
//   for (let index = 0; index < bytes.length; index += 1) {
//     binary += String.fromCharCode(bytes[index]);
//   }

//   return `data:audio/wav;base64,${toBase64(binary)}`;
// }

// const EFFECT_URIS: Record<EffectKind, string> = {
//   continue: createToneUri(620, 120, 0.22),
//   pause: createToneUri(280, 140, 0.18),
//   quiz: createToneUri(820, 180, 0.22),
//   success: createToneUri(980, 260, 0.24),
//   correct: createToneUri(1040, 200, 0.26),
//   incorrect: createToneUri(220, 240, 0.2),
//   complete: createToneUri(1100, 300, 0.28),
// };

// export function useLessonEffects() {
//   const soundRef = useRef<Audio.Sound | null>(null);
//   const { preferences } = useAudioPreferences();

//   useEffect(() => {
//     void Audio.setAudioModeAsync({
//       playsInSilentModeIOS: true,
//       staysActiveInBackground: false,
//     }).catch(() => undefined);

//     return () => {
//       void soundRef.current?.unloadAsync();
//       soundRef.current = null;
//     };
//   }, []);

//   const playEffect = useCallback(
//     async (kind: EffectKind) => {
//       try {
//         await soundRef.current?.unloadAsync();
//         const { sound } = await Audio.Sound.createAsync(
//           { uri: EFFECT_URIS[kind] },
//           {
//             shouldPlay: true,
//             volume: Math.max(0, Math.min(preferences.soundEffectsVolume, 1)),
//           },
//         );
//         soundRef.current = sound;
//       } catch {
//         // Audio support is device-dependent, so failing silently keeps flow stable.
//       }

//       const haptic =
//         kind === "success"
//           ? Haptics.NotificationFeedbackType.Success
//           : Haptics.NotificationFeedbackType.Warning;

//       await Haptics.notificationAsync(haptic).catch(() => undefined);
//     },
//     [preferences.soundEffectsVolume],
//   );

//   return { playEffect };
// }
