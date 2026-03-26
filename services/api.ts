/** Thin fetch wrapper for all /api/* calls — targets the Vercel deployment */
const BASE_URL = 'https://quizmaster-ai.vercel.app';

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Profiles
  getProfiles: () => call<any[]>('GET', '/profiles'),
  createProfile: (name: string, avatar_url?: string) => call<any>('POST', '/profiles', { name, avatar_url }),

  // Quiz generation
  generateQuiz: (topic: string, difficulty: string, numQuestions: number, language: string = 'en') =>
    call<any[]>('POST', '/generate', { topic, difficulty, numQuestions, language }),

  // Tournaments
  getTournaments: () => call<any[]>('GET', '/tournaments'),
  getTournament: (id: string) => call<any>('GET', `/tournaments/${id}`),
  createTournament: (body: any) => call<any>('POST', '/tournaments', body),
  startTournament: (id: string) => call<any>('POST', `/tournaments/${id}`, {}),
  submitMatchResult: (matchId: string, profileId: string, score: number) =>
    call<any>('POST', `/tournaments/matches/${matchId}/submit`, { profileId, score }),

  // Teams
  getTeams: () => call<any[]>('GET', '/teams'),
  getTeam: (id: string) => call<any>('GET', `/teams/${id}`),
  createTeam: (body: any) => call<any>('POST', '/teams', body),
  createTeamMatch: (body: any) => call<any>('POST', `/teams`, body),
  submitTeamMatch: (matchId: string, teamId: string, score: number) =>
    call<any>('POST', `/teams/matches/${matchId}/submit`, { teamId, score }),

  // Sessions
  createSession: (topic: string, hostProfileId: string, numQuestions?: number) =>
    call<any>('POST', '/sessions', { topic, hostProfileId, numQuestions }),
  joinSession: (joinCode: string, profileId: string) =>
    call<any>('POST', '/sessions?action=join', { joinCode, profileId }),
  getSession: (id: string) => call<any>('GET', `/sessions/${id}`),
  startSession: (id: string) => call<any>('POST', `/sessions/${id}?action=start`, {}),
  submitAnswer: (id: string, profileId: string, questionId: string, answerId: string) =>
    call<any>('POST', `/sessions/${id}?action=answer`, { profileId, questionId, answerId }),
  nextQuestion: (id: string) => call<any>('POST', `/sessions/${id}?action=next`, {}),
  endSession: (id: string) => call<any>('POST', `/sessions/${id}?action=end`, {}),
  kickPlayer: (id: string, profileId: string) =>
    call<any>('POST', `/sessions/${id}?action=kick`, { profileId }),

  // Daily
  getDailyToday: () => call<any>('GET', '/daily?action=today'),
  submitDaily: (profileId: string, quizId: string, answers: any[]) =>
    call<any>('POST', '/daily?action=submit', { profileId, quizId, answers }),
  getDailyLeaderboard: (date?: string) =>
    call<any[]>('GET', `/daily?action=leaderboard${date ? `&date=${date}` : ''}`),

  // Achievements
  getAchievements: () => call<any[]>('GET', '/achievements'),
  getProfileAchievements: (profileId: string) =>
    call<any[]>('GET', `/achievements?profileId=${profileId}`),
};
