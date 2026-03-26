// ─── Existing Quiz types ───────────────────────────────────────────────────
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export enum QuizState {
  IDLE = 'idle',
  GENERATING = 'generating',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  ERROR = 'error',
  SHOW_LEADERBOARD = 'show_leaderboard',
}

export interface LeaderboardEntry {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: number;
  difficulty: Difficulty;
}

// ─── Core DB entities ──────────────────────────────────────────────────────
export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  question_count: number;
  is_daily: boolean;
  daily_date: string | null;
  created_at: string;
}

export interface DBQuestion {
  id: string;
  quiz_id: string;
  text: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false';
  ord: number;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question_id: string;
  text: string;
  is_correct: boolean;
}

// ─── Profile Stats ─────────────────────────────────────────────────────────
export interface ProfileStats {
  profile_id: string;
  total_wins: number;
  total_losses: number;
  current_win_streak: number;
  best_win_streak: number;
  tournaments_won: number;
  matches_played: number;
  daily_current_streak: number;
  daily_best_streak: number;
  last_daily_date: string | null;
}

// ─── Tournaments ───────────────────────────────────────────────────────────
export type TournamentMode = 'single_elimination' | 'double_elimination';
export type TournamentStatus = 'pending' | 'in_progress' | 'completed';
export type MatchStatus = 'pending' | 'in_progress' | 'completed';

export interface Tournament {
  id: string;
  name: string;
  quiz_id: string;
  mode: TournamentMode;
  status: TournamentStatus;
  created_by_profile_id: string;
  created_at: string;
  updated_at: string;
  quiz?: Quiz;
  created_by?: Profile;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  profile_id: string;
  seed: number | null;
  profile?: Profile;
}

export interface TournamentMatch {
  id: string;
  tournament_id: string;
  round: number;
  match_number: number;
  participant1_id: string | null;
  participant2_id: string | null;
  winner_participant_id: string | null;
  bracket_side: 'winners' | 'losers' | 'grand_final';
  status: MatchStatus;
  created_at: string;
  participant1?: TournamentParticipant;
  participant2?: TournamentParticipant;
  winner?: TournamentParticipant;
  results?: TournamentMatchResult[];
}

export interface TournamentMatchResult {
  id: string;
  match_id: string;
  profile_id: string;
  score: number;
  completed_at: string;
  profile?: Profile;
}

// ─── Teams ─────────────────────────────────────────────────────────────────
export type TeamMatchMode = '2v2' | '3v3' | 'custom';
export type TeamMatchStatus = 'pending' | 'in_progress' | 'completed';

export interface Team {
  id: string;
  name: string;
  created_by_profile_id: string;
  created_at: string;
  members?: TeamMember[];
  stats?: TeamStats;
}

export interface TeamMember {
  id: string;
  team_id: string;
  profile_id: string;
  role: 'member' | 'captain';
  joined_at: string;
  profile?: Profile;
}

export interface TeamStats {
  wins: number;
  losses: number;
  matches_played: number;
}

export interface TeamMatch {
  id: string;
  quiz_id: string;
  team1_id: string;
  team2_id: string;
  mode: TeamMatchMode;
  status: TeamMatchStatus;
  created_at: string;
  team1?: Team;
  team2?: Team;
  results?: TeamMatchResult[];
  quiz?: Quiz;
}

export interface TeamMatchResult {
  id: string;
  team_match_id: string;
  team_id: string;
  score: number;
  completed_at: string;
}

// ─── Sessions (Online Multiplayer) ─────────────────────────────────────────
export type SessionStatus = 'lobby' | 'in_progress' | 'finished';

export interface Session {
  id: string;
  quiz_id: string;
  host_profile_id: string;
  join_code: string;
  status: SessionStatus;
  current_question_index: number;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  quiz?: Quiz;
  players?: SessionPlayer[];
}

export interface SessionPlayer {
  id: string;
  session_id: string;
  profile_id: string;
  is_host: boolean;
  connected: boolean;
  joined_at: string;
  disconnected_at: string | null;
  profile?: Profile;
  score?: number;
}

export interface SessionAnswer {
  id: string;
  session_id: string;
  profile_id: string;
  question_id: string;
  answer_id: string | null;
  is_correct: boolean;
  answered_at: string;
}

// ─── Daily Challenges ──────────────────────────────────────────────────────
export interface DailyChallengeResult {
  id: string;
  quiz_id: string;
  profile_id: string;
  score: number;
  completed_at: string;
  streak_after_completion: number;
  profile?: Profile;
}

// ─── Achievements ──────────────────────────────────────────────────────────
export type AchievementCategory = 'streak' | 'skill' | 'special' | 'progression' | 'competitive' | 'explorer';

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AchievementCategory;
  icon: string | null;
  points: number;
  created_at: string;
}

export interface ProfileAchievement {
  id: string;
  profile_id: string;
  achievement_id: string;
  unlocked_at: string;
  meta: Record<string, unknown> | null;
  achievement?: Achievement;
}

// ─── UI state helpers ──────────────────────────────────────────────────────
export type AppView =
  | 'home'
  | 'profiles'
  | 'tournaments'
  | 'tournament-detail'
  | 'teams'
  | 'team-detail'
  | 'multiplayer'
  | 'session-lobby'
  | 'session-game'
  | 'daily'
  | 'achievements';
