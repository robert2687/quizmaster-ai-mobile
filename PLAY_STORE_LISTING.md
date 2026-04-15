# QuizMaster AI — Google Play Store Listing

## App Details

| Field | Value |
| ------- | ------- |
| **App Name** | QuizMaster AI |
| **Package** | com.quizmaster.ai |
| **Category** | Education / Trivia & Word Games |
| **Content Rating** | Everyone (PEGI 3 / Everyone) |
| **Pricing** | Free |
| **In-App Purchases** | None |
| **Min Android Version** | Android 8.0 (API 26) |

---

## Short Description (80 chars max)

```text
Generate AI quizzes on any topic and compete with friends in real time.
```

---

## Full Description (4000 chars max)

```text
QuizMaster AI transforms any topic into an engaging quiz in seconds, powered by Google's Gemini AI. Challenge yourself, compete with friends, and climb the leaderboards.

🧠 AI QUIZ GENERATOR
Type any topic — history, science, movies, sports, programming — and instantly get a custom multiple-choice quiz. Choose from Easy, Medium, or Hard difficulty, and pick 5 to 20 questions. Quizzes are generated in English, Slovak, German, or French.

📅 DAILY CHALLENGE
A new AI-generated quiz every day. Complete it to build your streak, earn achievement points, and compete for the top spot on the daily leaderboard. Miss a day and your streak resets — so keep coming back!

🌐 LIVE MULTIPLAYER
Host a game room and share a 6-character code with friends. Players join from anywhere and compete on the same quiz in real time. Watch live scores update as everyone answers, then see the final ranking when time's up.

🏆 TOURNAMENTS
Create single or double-elimination tournaments. Invite players, generate the bracket, and battle through rounds until a champion is crowned. Tournament results feed directly into your competitive stats.

🤝 TEAM BATTLES
Form a team, recruit members, and challenge rival teams to quiz matches. Track your team's win/loss record and dominate the team leaderboards.

🎖️ ACHIEVEMENTS
Unlock 18 achievements across 6 categories: Progression, Skill, Streaks, Competitive, Explorer, and Special. Stack achievement points to show off your dedication.

👤 PROFILES
Create multiple profiles on one device — perfect for family or friend groups sharing a phone. Switch profiles instantly to track separate stats, streaks, and achievements for each player.

⏱️ 20-SECOND TIMER
Every question has a 20-second countdown. Answer fast to keep the pressure on — time up means no points!

No account required. No ads. No paywalls. Just pure quiz fun.
```

---

## Keywords / Tags

quiz, trivia, AI quiz, quiz generator, multiplayer quiz, daily challenge, tournament, brain game, knowledge test, Gemini AI, education, learning game

---

## Screenshots Needed (Phone — 1080x1920 or 1284x2778)

Capture these screens in the app:

1. **Home/Quiz Screen** — Topic input with "Generate Quiz" button, dark theme
2. **Quiz In Progress** — Question with 4 answer options and timer bar
3. **Quiz Results** — Score card showing correct/wrong answers
4. **Daily Challenge** — Today's challenge card with streak badge and leaderboard
5. **Multiplayer Lobby** — 6-char join code prominently displayed
6. **Multiplayer Playing** — Question + live scoreboard overlay
7. **Achievements** — Achievement badges grid, some locked/unlocked
8. **Tournaments** — Bracket view with match cards

---

## Content Rating Questionnaire (IARC)

- Violence: None
- Sexual content: None
- Profanity: None
- Controlled substances: None
- User-generated content: No
- Location sharing: No
- Personal data collection: Anonymous usage only (no email, no name required)
- Ads: None
- In-app purchases: None

### Result

PEGI 3 / Everyone

---

## Privacy Policy (Required for Play Store)

Host your privacy policy at a public URL before submitting. Key points:

- Anonymous Supabase auth (no PII collected)
- Quiz topics entered by users are sent to Google Gemini API
- No data sold to third parties
- Profile names stored in Supabase (user-chosen pseudonyms)

---

## Release Notes (What's New — v1.0.0)

```text
🎉 Initial release!

• AI-powered quiz generator on any topic
• Daily challenges with streak tracking  
• Live multiplayer with real-time scores
• Single & double elimination tournaments
• Team battles and leaderboards
• 18 achievements across 6 categories
• Multiple profiles on one device
• 4 languages: English, Slovak, German, French
```

---

## Build & Submit Commands

### 1. Create `.env` with your credentials

```bash
cp .env.example .env
# Edit .env and fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### 2. Install dependencies

```bash
cd quizmaster-ai-mobile
npm install
```

### 3. Preview build (APK for testing on a real device)

```bash
npm run build:android:preview
```

### 4. Production build (AAB for Play Store)

```bash
npm run build:android:production
```

### 5. Submit to Play Store

First, create a Google Play service-account key in the Google Play Console
(Setup → API access → Create service account) and save it as `google-play-key.json`
in the project root. This file is listed in `.gitignore` and must **never** be committed.

```bash
npm run submit:android:production
```

---

### Pre-submission checklist

- [ ] `.env` created locally with Supabase credentials
- [ ] EAS account created at expo.dev and `app.json -> expo.extra.eas.projectId` set to your EAS project ID
- [ ] Google Play Console account ($25 one-time fee)
- [ ] App signed with production keystore (EAS manages this automatically)
- [ ] `google-play-key.json` placed in project root (not committed)
- [ ] Privacy policy hosted at a public URL (see `PRIVACY_POLICY.md`)
- [ ] Privacy policy URL entered in Play Console (App content → Privacy policy)
- [ ] At least 2 phone screenshots uploaded (recommended: 8 screens listed above)
- [ ] Feature graphic (1024 × 500 px) uploaded to Play Console
- [ ] Content rating questionnaire completed in Play Console
- [ ] App tested internally on a real Android device (API 26+)
- [ ] All 7 tabs tested end-to-end
- [ ] Daily challenge tested with a real Supabase daily quiz entry
- [ ] Release notes added to Play Console under the production release
