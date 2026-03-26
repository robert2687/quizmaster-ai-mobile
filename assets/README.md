# QuizMaster AI — Asset Requirements

This directory contains placeholder references for the app icon and splash screen assets
required by Expo for building the Android APK/AAB.

## Required Files

### icon.png
- **Dimensions**: 1024 × 1024 px
- **Format**: PNG with transparency
- **Design**: Purple circle (#7c3aed) background with a bold white "Q" letter centered.
  The "Q" should use a heavy/black font weight (e.g. 600–800pt). Optionally add a subtle
  brain/quiz motif. Outer circle should have slight gradient from #7c3aed to #4f46e5.
- **Used for**: iOS icon, Play Store listing icon

### adaptive-icon.png
- **Dimensions**: 1024 × 1024 px
- **Format**: PNG with transparency (foreground layer only)
- **Background color**: #7c3aed (set in app.json android.adaptiveIcon.backgroundColor)
- **Design**: White "Q" lettermark centered on transparent background. The system will
  composite this over the purple background and apply the safe zone mask.
- **Used for**: Android adaptive icon (API 26+)

### splash.png
- **Dimensions**: 1284 × 2778 px (iPhone 14 Pro Max resolution — safe for all screens)
- **Format**: PNG
- **Background**: #0f172a (dark navy)
- **Design**:
  - Centered "QuizMaster AI" text in purple (#a855f7), bold, approx 48–56pt
  - Below the text: small subtitle "AI-powered quiz generator" in slate-400 (#94a3b8)
  - Above text: the Q logo icon at approx 120×120px
  - Background is solid #0f172a — no gradients needed as it matches backgroundColor in app.json
- **Used for**: Splash screen during app launch

## Generation Notes

To generate these assets you can use:
1. **Figma** — Design at 1024×1024, export as PNG
2. **Adobe Illustrator / Sketch** — Vector export
3. **Android Asset Studio** — For adaptive icons: https://romannurik.github.io/AndroidAssetStudio/
4. **makeappicon.com** — Resize from a single large PNG to all required sizes

After placing the actual PNG files here, run `expo doctor` to confirm they are valid.
