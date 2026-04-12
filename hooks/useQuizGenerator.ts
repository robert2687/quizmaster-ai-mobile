import { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { QuizQuestion, Difficulty, QuizState, LeaderboardEntry } from '../types';

const LEADERBOARD_KEY = 'qm_local_leaderboard';

export function useQuizGenerator() {
  const [quizState, setQuizState] = useState<QuizState>(QuizState.IDLE);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [language, setLanguage] = useState('en');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>([]);
  const [finalScore, setFinalScore] = useState(0);
  const [error, setError] = useState('');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const loadLeaderboard = async () => {
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
      if (raw) setLeaderboard(JSON.parse(raw));
    } catch { }
  };

  const saveToLeaderboard = async (score: number, total: number) => {
    try {
      const raw = await AsyncStorage.getItem(LEADERBOARD_KEY);
      const existing: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
      const entry: LeaderboardEntry = {
        id: Date.now().toString(),
        topic,
        score,
        totalQuestions: total,
        percentage: Math.round((score / total) * 100),
        timestamp: Date.now(),
        difficulty,
      };
      const updated = [entry, ...existing].slice(0, 20);
      await AsyncStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
      setLeaderboard(updated);
    } catch { }
  };

  const handleGenerateQuiz = async () => {
    if (!topic.trim()) return;
    setQuizState(QuizState.GENERATING);
    setError('');
    try {
      const generated = await api.generateQuiz(topic.trim(), difficulty, numQuestions, language);
      setQuestions(generated);
      setQuizState(QuizState.IN_PROGRESS);
    } catch (e: any) {
      setError(e.message || 'Failed to generate quiz');
      setQuizState(QuizState.ERROR);
    }
  };

  const handleQuizComplete = async (score: number, answered: QuizQuestion[]) => {
    setFinalScore(score);
    setAnsweredQuestions(answered);
    await saveToLeaderboard(score, answered.length);
    setQuizState(QuizState.COMPLETED);
  };

  const handlePlayAgain = () => {
    setQuizState(QuizState.IDLE);
    setTopic('');
    setQuestions([]);
    setAnsweredQuestions([]);
    setFinalScore(0);
  };

  const percentage = answeredQuestions.length > 0
    ? Math.round((finalScore / answeredQuestions.length) * 100)
    : 0;

  return {
    quizState,
    setQuizState,
    topic,
    setTopic,
    difficulty,
    setDifficulty,
    numQuestions,
    setNumQuestions,
    language,
    setLanguage,
    questions,
    answeredQuestions,
    finalScore,
    error,
    leaderboard,
    loadLeaderboard,
    handleGenerateQuiz,
    handleQuizComplete,
    handlePlayAgain,
    percentage,
  };
}
