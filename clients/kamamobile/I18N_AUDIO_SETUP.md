# I18N + Audio System Implementation Guide

## Overview

This guide explains the newly implemented i18n (internationalization) and audio narration system for the Kama app, inspired by Duolingo and Paladin's best practices.

### Features

✅ **Multi-language Support** (English, French with easy expansion)  
✅ **Text-to-Speech Audio** with speech rate and pitch control  
✅ **Automatic Language Detection** from device settings  
✅ **Persistent Language Preferences** (saved to AsyncStorage)  
✅ **Audio Progress Tracking** with visual progress bar  
✅ **Different Quiz UIs** - True/False, Multiple Choice, Image Choice  
✅ **Story Content Paragraphs** - Optimized for reading and listening  
✅ **Settings Panel** - Language and audio configuration

---

## Architecture

### 1. **i18n Configuration** (`lib/i18n/config.ts`)

Initializes i18next with supported languages:

```typescript
// Supported languages
const supportedLanguages = {
  en: { name: "English", nativeName: "English" },
  fr: { name: "Français", nativeName: "Français" },
};
```

**Adding a new language:**
1. Add to `supportedLanguages` object
2. Create translation file: `lib/i18n/locales/xx.json`
3. Add to resources in config

### 2. **Locale Context** (`lib/auth/locale-context.tsx`)

Manages language state and persistence:

```typescript
// Use in any component
const { currentLanguage, setLanguage, isInitialized } = useLocale();

// Change language
await setLanguage("fr");
```

**Features:**
- Auto-detects device language on first load
- Persists selection to AsyncStorage
- Fallback to English if device language not supported

### 3. **Audio Player Hook** (`hooks/useAudioPlayer.ts`)

Handles all TTS (Text-to-Speech) functionality:

```typescript
const {
  playState,      // { isPlaying, isPaused, duration, currentPosition, isSpeaking }
  settings,       // { rate, pitch, enabled }
  error,          // Error message if any
  speak,          // (text: string, onComplete?: () => void) => Promise<void>
  pause,          // () => void
  resume,         // () => void
  stop,           // () => void
  updateSettings, // (settings: Partial<AudioSettings>) => void
  estimateDuration, // (text: string, rate: number) => number
} = useAudioPlayer();
```

**Key Features:**
- Automatic duration estimation (adjusts for speech rate)
- Position tracking with 100ms intervals
- Language-aware TTS (locale mapping)
- Callback on completion
- Error handling

### 4. **Audio Player UI** (`components/ui/AudioPlayer.tsx`)

Bottom sheet component for audio controls:

```typescript
<AudioPlayer
  playState={playState}
  settings={settings}
  onPlay={handlePlay}
  onPause={handlePause}
  onResume={handleResume}
  onStop={handleStop}
  onSettingsChange={handleSettingsChange}
  contentText={fullText}
/>
```

**UI Elements:**
- Play/Pause button
- Progress slider with time display
- Settings button (Speech Rate, Pitch)
- Enable/Disable toggle

### 5. **Story Content Component** (`components/steps/StoryContent.tsx`)

Displays chapter with integrated audio:

```typescript
<StoryContent
  chapter={{
    chapterId: "ch1",
    title: "Chapter Title",
    paragraphs: ["Paragraph 1", "Paragraph 2", ...],
    audioEnabled: true,
  }}
  onChapterComplete={handleNext}
/>
```

**Features:**
- Multi-paragraph support
- Reading progress bar (synced with audio)
- Play/Pause controls
- Settings integration
- Error handling

### 6. **Quiz Component Updates** (`components/steps/QuizStep.tsx`)

Enhanced with different UIs per quiz type:

```typescript
// True/False: Side-by-side buttons
// Multiple Choice: Vertical stack (original)
// Image Choice: 2x2 grid with images

const quizType = content.quizType ?? "multiple_choice";
```

**Quiz Types:**
- `true_false`: Two large buttons side-by-side
- `multiple_choice`: Vertical button stack
- `image_choice`: Image grid (2 columns)

### 7. **Settings Panel** (`components/settings/LanguageAudioSettings.tsx`)

Full settings UI for language and audio:

```typescript
<LanguageAudioSettings
  visible={showSettings}
  onClose={() => setShowSettings(false)}
/>
```

---

## Usage Examples

### Basic Story with Audio

```tsx
import { StoryContent } from "@/components/steps/StoryContent";
import { useTranslation } from "react-i18next";

export function ChapterScreen() {
  const { t } = useTranslation();

  const chapter = {
    chapterId: "ch1",
    title: t("story.chapter") + " 1: Introduction",
    paragraphs: [
      "This is the first paragraph of the story.",
      "This is the second paragraph with more details.",
      "Final thoughts in this chapter.",
    ],
  };

  return (
    <StoryContent
      chapter={chapter}
      onChapterComplete={() => navigation.navigate("next")}
    />
  );
}
```

### Using Audio Player Directly

```tsx
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

export function CustomAudioComponent() {
  const {
    playState,
    settings,
    speak,
    pause,
    resume,
    stop,
    updateSettings,
  } = useAudioPlayer();

  return (
    <AudioPlayer
      playState={playState}
      settings={settings}
      onPlay={(text) => speak(text)}
      onPause={pause}
      onResume={resume}
      onStop={stop}
      onSettingsChange={updateSettings}
      contentText="Your content here"
    />
  );
}
```

### Language Selection

```tsx
import { useLocale } from "@/lib/auth/locale-context";
import { useTranslation } from "react-i18next";

export function SettingsScreen() {
  const { currentLanguage, setLanguage } = useLocale();
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t("settings.language")}</Text>
      <Button
        onPress={() => setLanguage("en")}
        title={currentLanguage === "en" ? "✓ English" : "English"}
      />
      <Button
        onPress={() => setLanguage("fr")}
        title={currentLanguage === "fr" ? "✓ Français" : "Français"}
      />
    </View>
  );
}
```

---

## Translation System

### File Structure

```
lib/i18n/
├── config.ts                 # i18next initialization
└── locales/
    ├── en.json              # English translations
    └── fr.json              # French translations
```

### Adding Translations

Edit `lib/i18n/locales/en.json`:

```json
{
  "common": {
    "close": "Close"
  },
  "story": {
    "chapter": "Chapter",
    "continue": "Continue"
  },
  "audio": {
    "play": "Play",
    "pause": "Pause"
  }
}
```

Use in components:

```tsx
const { t } = useTranslation();
<Text>{t("story.chapter")}</Text>
<Text>{t("audio.play")}</Text>
```

---

## Audio Timing & Synchronization

### How Duration is Estimated

```typescript
// Average speaking rate: 150 words per minute (WPM)
// Formula: (word_count / (150 * speech_rate)) * 60 * 1000 = duration_ms

const estimateDuration = (text: string, rate: number): number => {
  const words = text.split(/\s+/).length;
  const baseRate = 150;
  const adjustedRate = baseRate * rate;
  const minutes = words / adjustedRate;
  return Math.ceil(minutes * 60 * 1000);
};

// Example: 300 words at 1.0x rate = 2 minutes
// Example: 300 words at 2.0x rate = 1 minute
```

### Progress Synchronization

The audio player updates progress every 100ms:

```typescript
updateIntervalRef.current = setInterval(() => {
  setPlayState((prev) => ({
    ...prev,
    currentPosition: prev.currentPosition + 100,
  }));
}, 100);
```

This ensures smooth progress visualization while TTS is playing.

---

## Accessibility Features

1. **Text-to-Speech**: Built-in accessibility for visually impaired users
2. **Adjustable Speech Rate**: From 0.5x (slow) to 2.0x (fast)
3. **Pitch Control**: Adjust voice pitch for clarity
4. **Visual Feedback**: Progress bar, play/pause states
5. **Error Messages**: Clear feedback for audio issues

---

## Best Practices

### ✅ DO

- Use `t()` function for all user-facing text
- Implement fallback text in UI components
- Test audio with different speech rates
- Show progress indicators during playback
- Handle TTS errors gracefully
- Cache language preference

### ❌ DON'T

- Hard-code text strings (non-translatable)
- Ignore device language detection
- Play audio without user action
- Forget cleanup on component unmount
- Assume all platforms support TTS equally

---

## Platform Considerations

### iOS

- TTS works out-of-box
- Speech rate: 0.0-1.0 (normalized)
- Pitch: 0.5-2.0

### Android

- TTS requires initialization
- Speech rate: adjustable
- Pitch: 0.5-2.0
- May require language data download

### Web

- TTS uses Web Speech API (if supported)
- Limited language support
- Browser-dependent behavior

---

## Troubleshooting

### Audio Not Playing

1. Check device audio settings
2. Verify TTS enabled in settings
3. Ensure text is not empty
4. Check console for errors

### Duration Estimation Off

- Adjust base rate (150 WPM) if users complain
- Add manual duration override in content

### Language Not Changing

- Clear AsyncStorage: `await AsyncStorage.removeItem('kama_app_language')`
- Check device language is supported
- Verify locale mapping in `getLocaleForLanguage()`

### Pitch/Rate Not Updating

- Stop current playback before changing settings
- Verify `updateSettings()` called correctly

---

## Future Enhancements

1. **Offline Audio**: Download TTS files for offline use
2. **Custom Voices**: Multiple voice options
3. **Audio Caching**: Store generated audio
4. **Reading Highlights**: Sync highlighting with audio
5. **More Languages**: Expand language support
6. **Audio Quality Levels**: HQ vs LQ option
7. **Background Audio**: Play while switching screens

---

## Dependencies

```json
{
  "i18next": "^23.7.6",
  "react-i18next": "^14.0.0",
  "i18next-react-native-language-detector": "^1.0.2",
  "expo-text-to-speech": "~2.4.1"
}
```

---

## Files Created/Modified

### Created

- `lib/i18n/config.ts` - i18n configuration
- `lib/i18n/locales/en.json` - English translations
- `lib/i18n/locales/fr.json` - French translations
- `lib/auth/locale-context.tsx` - Language state management
- `hooks/useAudioPlayer.ts` - Audio player hook
- `components/ui/AudioPlayer.tsx` - Audio UI component
- `components/steps/StoryContent.tsx` - Story content component
- `components/settings/LanguageAudioSettings.tsx` - Settings UI

### Modified

- `package.json` - Added dependencies
- `app/_layout.tsx` - Added LocaleProvider
- `components/steps/QuizStep.tsx` - Enhanced with different quiz UIs

---

## Support & Documentation

For issues or questions:
1. Check console errors
2. Review component prop types
3. Check translation files
4. Test on target platform
5. Verify TTS permissions

---

**Version**: 1.0.0  
**Last Updated**: 2026-04-27  
**Compatible with**: Expo 54+, React Native 0.81+
