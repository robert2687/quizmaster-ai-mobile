# Privacy Policy — QuizMaster AI

**Effective date:** 2025-01-01  
**Last updated:** 2025-01-01

QuizMaster AI ("we", "our", or "the app") is a free mobile application that lets users generate AI-powered quizzes and compete in multiplayer sessions. This Privacy Policy explains what data we collect, how we use it, and your rights.

---

## 1. Information We Collect

### 1.1 Information You Provide
- **Profile name** — A display name you choose when creating a profile. This is stored in our database and visible to other players in multiplayer and tournament screens.
- **Quiz topics** — Text you enter when generating a quiz. This is sent to Google's Gemini API to produce questions and is not stored beyond the session.

### 1.2 Information Collected Automatically
- **Anonymous session identifier** — On first launch the app creates an anonymous Supabase Auth session. No email address, phone number, or real name is required.
- **Quiz and game results** — Scores, streaks, and achievement progress are stored in our Supabase database linked to your anonymous session ID, so leaderboards and stats persist across app restarts.
- **Device information** — Expo may collect basic crash and performance diagnostics (device type, OS version, app version). See [Expo's privacy policy](https://expo.dev/privacy) for details.

### 1.3 Information We Do NOT Collect
- Real name, email address, or phone number
- Precise location data
- Photos, contacts, or microphone data
- Payment information (the app is free with no in-app purchases)

---

## 2. How We Use Your Information

| Purpose | Data used |
|---|---|
| Render leaderboards and profiles | Profile name, scores |
| Generate AI quizzes | Quiz topic text (forwarded to Gemini API) |
| Track daily streaks and achievements | Anonymous session ID, quiz results |
| Host multiplayer and tournament sessions | Profile name, scores, anonymous session ID |
| Diagnose crashes | Device/OS info via Expo diagnostics |

---

## 3. Third-Party Services

The app relies on the following third-party services:

| Service | Purpose | Privacy policy |
|---|---|---|
| **Supabase** | Database and anonymous authentication | https://supabase.com/privacy |
| **Google Gemini API** | AI quiz generation | https://policies.google.com/privacy |
| **Expo / EAS** | App build and diagnostics | https://expo.dev/privacy |

Quiz topic text that you type is transmitted to Google Gemini to generate questions. Do not enter personal, sensitive, or confidential information as a quiz topic.

---

## 4. Data Retention

- Profile names and scores are retained as long as your anonymous session exists.
- You can delete your profile inside the app. Deleting all profiles permanently removes your data from our database.
- Anonymous session tokens expire after one year if unused.

---

## 5. Data Security

All data is transmitted over HTTPS. We use Supabase Row-Level Security (RLS) policies to ensure users can only read and write their own records. We do not store quiz topics beyond the API call.

---

## 6. Children's Privacy

QuizMaster AI is rated **Everyone / PEGI 3** and does not knowingly collect personal information from children under 13. Because no account registration is required and no personal information is collected, the app is safe for all ages.

---

## 7. Your Rights

- **Access** — You can view all data associated with your profile inside the app.
- **Deletion** — Delete your profiles from the Profile screen. This removes all associated scores, streaks, and achievements from our servers.
- **Portability** — Contact us if you need an export of your data.

---

## 8. Changes to This Policy

We may update this policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. Continued use of the app after changes are posted constitutes acceptance of the new policy.

---

## 9. Contact

If you have any questions about this Privacy Policy, please contact us at:

**Email:** privacy@quizmaster.ai  
*(Replace with your actual contact email before publishing.)*
