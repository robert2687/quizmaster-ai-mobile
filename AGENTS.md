# QuizMaster AI — Agent Instructions

AI-powered mobile quiz app built with **React Native + Expo SDK 55** (file-based routing via `expo-router`), TypeScript strict mode, and a Vercel-hosted backend. Android-only production target; dark-theme only UI.

---

## Commands

```bash
npm start                  # Start Metro bundler (Expo dev server)
npm run android            # Run on Android device/emulator
npm run build:android      # EAS production build (AAB)
eas build --platform android --profile preview   # APK for internal testing
```

No test runner is configured. TypeScript type checking:

```bash
npx tsc --noEmit
```

---

## Architecture

```text
app/                  # Expo Router screens (file-based routing)
  _layout.tsx         # Root layout: Supabase anon auth init, SafeAreaProvider, AppProvider
  (tabs)/             # Tab group — 7 tabs (Quiz, Tournaments, Teams, Multiplayer, Daily, Achievements, Profile)
  tournament/[id].tsx # Dynamic route for tournament detail
components/           # Shared UI: QuizFlow, TimerBar, LoadingSpinner
context/
  AppContext.tsx       # Global state: profiles list, activeProfile, navigate()
services/
  api.ts              # Thin fetch wrapper → Vercel backend (https://quizmaster-ai.vercel.app/api/*)
  supabase.ts         # Supabase client (anonymous auth only; session via expo-secure-store)
  storage.ts          # AsyncStorage wrapper (safeStorage — never throws)
types.ts              # All shared TypeScript types/interfaces/enums
```

---

## Key Conventions

### API calls

All backend calls go through `services/api.ts`. The base URL is `https://quizmaster-ai.vercel.app`. Add new endpoints to the `api` object — never call `fetch` directly in screens.

### Navigation

Use the `navigate(view, param?)` helper from `useApp()` (maps `AppView` → expo-router routes) OR use `router.push()` from `expo-router` directly. New screens **must** be added as files under `app/`. Cast non-typed routes with `as any`.

### Global state

Access profiles and active profile via `useApp()`. Profile selection is persisted to `AsyncStorage` under `qm_active_profile_id`. Do not duplicate profile state in local component state.

### Styling

- **No styled-components** — use `StyleSheet.create()` only.
- Dark theme is mandatory: background `#0f172a`, primary purple `#7c3aed`, lighter purple `#a855f7`, muted text `#64748b`, borders `#334155`.
- Portrait-only orientation.

### Animations

`react-native-reanimated` is installed (Babel plugin active). For layout-driven animations (width/height) use `useNativeDriver: false`. The `TimerBar` component demonstrates the pattern.

### TypeScript

- Strict mode enabled; no `any` except when casting expo-router paths (known limitation).
- Path alias `@/*` → project root (configured in `tsconfig.json`).
- All shared types/interfaces live in `types.ts`. Add new entities there.

### Storage layers

| Purpose | Library | Key prefix |
| --- | --- | --- |
| Auth session | `expo-secure-store` (via Supabase adapter) | Managed by Supabase |
| Active profile | `AsyncStorage` via `safeStorage` | `qm_` |
| Local leaderboard | `AsyncStorage` directly | `qm_local_leaderboard` |

---

## Supabase Usage

Supabase is used **only for authentication** (anonymous sign-in). All data operations go through the Vercel API, not direct Supabase queries from the client. Do not add `supabase.from(...)` calls in the mobile app.

---

## Build / EAS

- EAS project ID is in `app.json → expo.extra.eas.projectId` (not in `eas.json`).
- Production builds are Android only (`app-bundle`). `autoIncrement: true` in `eas.json` production profile.
- New Architecture is enabled (`newArchEnabled: true` in `app.json`).
- `react-native-reanimated/plugin` must remain the **last** Babel plugin.
