# CategoryCard Component - Visual Structure

## Component Layout

```
┌─────────────────────────────────────┐
│    ╔═════════════════════════════╗  │
│    ║                             ║  │
│    ║    Cover Image (180px)      ║  │
│    ║   or Placeholder Icon       ║  │
│    ║                             ║  │
│    ╚═════════════════════════════╝  │
├─────────────────────────────────────┤
│  ⭐ Category                        │
│  📚 African Leaders                 │
│                                     │
│  ┌──────────┬──────────┬──────────┐ │
│  │    📚    │    👥    │    📋    │ │
│  │          │          │          │ │
│  │    15    │    12    │    45    │ │
│  │ Lessons  │  Heroes  │ Chapters │ │
│  └──────────┴──────────┴──────────┘ │
│                                     │
│  ┌─────────────────────────────────┐│
│  │   View Category (Button)        ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

## Home Page Structure

```
┌─────────────────────────────────────┐
│  📖 Home Page                       │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────┬───────────────┐│
│  │ Hello, Explorer │ ❤️ 5  🔥 12  ││
│  └─────────────────┴───────────────┘│
│  Wisdom of African legends...       │
│                                     │
│  Explore Categories                 │
│  ─────────────────────────────────  │
│                                     │
│  ┌─────────────────────────────────┐│
│  │     Category Card 1             ││
│  ├─────────────────────────────────┤│
│  │  [Cover Image]                  ││
│  │  🏷️ African Leaders              ││
│  │  ┌─────┬─────┬─────┐            ││
│  │  │ 15  │ 12  │ 45  │            ││
│  │  └─────┴─────┴─────┘            ││
│  │  [View Category]                ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │     Category Card 2             ││
│  │      ...                        ││
│  └─────────────────────────────────┘│
│                                     │
│  ┌─────────────────────────────────┐│
│  │     Category Card 3             ││
│  │      ...                        ││
│  └─────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

## Theme Colors Used

### Card Colors

- **Background**: `colors.card`
- **Border**: `colors.border`
- **Text**: `colors.text`

### Stats Section

- **Background**: `colors.surface`
- **Icon Color**: `colors.primary`
- **Text**: `colors.text`
- **Label**: `colors.textMuted`

### Button

- **Background**: `colors.primary` (gold/yellow)
- **Text**: `colors.background` (dark/light depending on mode)

## Responsive Behavior

- **Full Width**: Card stretches to container width minus padding
- **Image Height**: Fixed 180px for consistency
- **Stats Grid**: 3 equal columns with gap
- **Padding**: 14px internal, 16px external

## Animation Ready

- Pressable component ready for press effects
- Can add onPress handlers for navigation or actions
