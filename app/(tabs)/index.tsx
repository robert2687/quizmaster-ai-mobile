import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../services/api';
import { QuizQuestion, Difficulty, QuizState, LeaderboardEntry } from '../../types';
import QuizFlow from '../../components/QuizFlow';
import LoadingSpinner from '../../components/LoadingSpinner';

const LEADERBOARD_KEY = 'qm_local_leaderboard';
const DIFFICULTY_OPTIONS: { value: Difficulty; label: string; color: string; bg: string }[] = [
  { value: 'easy', label: 'Easy', color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { value: 'hard', label: 'Hard', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
];
const QUESTION_COUNTS = [5, 10, 15, 20];
const LANGUAGES = [
  { value: 'en', label: '🇬🇧 EN' },
  { value: 'sk', label: '🇸🇰 SK' },
  { value: 'de', label: '🇩🇪 DE' },
  { value: 'fr', label: '🇫🇷 FR' },
];

export default function HomeScreen() {
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

  const getScoreEmoji = (pct: number) => {
    if (pct === 100) return '🏆';
    if (pct >= 80) return '⭐';
    if (pct >= 60) return '👍';
    if (pct >= 40) return '📚';
    return '💪';
  };

  // GENERATING
  if (quizState === QuizState.GENERATING) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <LoadingSpinner message={`Generating "${topic}" quiz...`} />
        </View>
      </SafeAreaView>
    );
  }

  // IN_PROGRESS
  if (quizState === QuizState.IN_PROGRESS && questions.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.quizContainer}>
          <QuizFlow
            questions={questions}
            onQuizComplete={handleQuizComplete}
            quizTopic={topic}
          />
        </View>
      </SafeAreaView>
    );
  }

  // COMPLETED
  if (quizState === QuizState.COMPLETED) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
          {/* Score card */}
          <View style={styles.resultCard}>
            <Text style={styles.resultEmoji}>{getScoreEmoji(percentage)}</Text>
            <Text style={styles.resultScore}>{finalScore}/{answeredQuestions.length}</Text>
            <Text style={styles.resultPercentage}>{percentage}%</Text>
            <Text style={styles.resultTopic} numberOfLines={1}>{topic}</Text>
            <View style={[styles.difficultyBadge, { backgroundColor: `rgba(124,58,237,0.2)`, borderColor: '#7c3aed' }]}>
              <Text style={styles.difficultyBadgeText}>{difficulty.toUpperCase()}</Text>
            </View>
          </View>

          {/* Answer review */}
          <Text style={styles.sectionTitle}>Answer Review</Text>
          {answeredQuestions.map((q, i) => {
            const correct = q.userAnswer === q.correctAnswer;
            const skipped = q.userAnswer === undefined;
            return (
              <View key={q.id} style={[styles.reviewCard, correct ? styles.reviewCorrect : styles.reviewWrong]}>
                <View style={styles.reviewHeader}>
                  <Text style={[styles.reviewIcon, { color: correct ? '#10b981' : '#ef4444' }]}>
                    {correct ? '✓' : skipped ? '—' : '✗'}
                  </Text>
                  <Text style={styles.reviewQuestion} numberOfLines={3}>Q{i + 1}: {q.question}</Text>
                </View>
                {!correct && (
                  <View style={styles.reviewAnswers}>
                    {q.userAnswer && (
                      <Text style={styles.reviewWrongAnswer}>Your answer: {q.userAnswer}</Text>
                    )}
                    <Text style={styles.reviewCorrectAnswer}>Correct: {q.correctAnswer}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handlePlayAgain}
              activeOpacity={0.8}
              style={styles.playAgainButton}
            >
              <Text style={styles.playAgainButtonText}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                loadLeaderboard();
                setQuizState(QuizState.SHOW_LEADERBOARD);
              }}
              activeOpacity={0.8}
              style={styles.leaderboardButton}
            >
              <Text style={styles.leaderboardButtonText}>View Leaderboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // SHOW_LEADERBOARD
  if (quizState === QuizState.SHOW_LEADERBOARD) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
          <View style={styles.rowBetween}>
            <Text style={styles.screenTitle}>Leaderboard</Text>
            <TouchableOpacity onPress={handlePlayAgain} activeOpacity={0.8}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
          </View>
          {leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>No scores yet. Play a quiz to get started!</Text>
          ) : (
            leaderboard.map((entry, i) => (
              <View key={entry.id} style={styles.lbCard}>
                <View style={styles.lbLeft}>
                  <Text style={styles.lbRank}>#{i + 1}</Text>
                  <View>
                    <Text style={styles.lbTopic} numberOfLines={1}>{entry.topic}</Text>
                    <Text style={styles.lbMeta}>
                      {entry.difficulty} · {new Date(entry.timestamp).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.lbRight}>
                  <Text style={styles.lbScore}>{entry.score}/{entry.totalQuestions}</Text>
                  <Text style={styles.lbPct}>{entry.percentage}%</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ERROR
  if (quizState === QuizState.ERROR) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => setQuizState(QuizState.IDLE)}
            activeOpacity={0.8}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // IDLE — Main form
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo / Header */}
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Text style={styles.logoIconText}>Q</Text>
            </View>
            <View>
              <Text style={styles.logoTitle}>QuizMaster AI</Text>
              <Text style={styles.logoSubtitle}>AI-powered quiz generator</Text>
            </View>
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Topic input */}
            <View>
              <Text style={styles.label}>Quiz Topic</Text>
              <TextInput
                style={styles.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Space Exploration, History, Science..."
                placeholderTextColor="#64748b"
                returnKeyType="done"
              />
            </View>

            {/* Difficulty */}
            <View>
              <Text style={styles.label}>Difficulty</Text>
              <View style={styles.optionRow}>
                {DIFFICULTY_OPTIONS.map(opt => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setDifficulty(opt.value)}
                    activeOpacity={0.8}
                    style={[
                      styles.pill,
                      difficulty === opt.value
                        ? { backgroundColor: opt.bg, borderColor: opt.color }
                        : styles.pillInactive,
                    ]}
                  >
                    <Text style={[
                      styles.pillText,
                      { color: difficulty === opt.value ? opt.color : '#94a3b8' },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Question count */}
            <View>
              <Text style={styles.label}>Questions</Text>
              <View style={styles.optionRow}>
                {QUESTION_COUNTS.map(n => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setNumQuestions(n)}
                    activeOpacity={0.8}
                    style={[
                      styles.pill,
                      numQuestions === n ? styles.pillActive : styles.pillInactive,
                    ]}
                  >
                    <Text style={[
                      styles.pillText,
                      { color: numQuestions === n ? '#a855f7' : '#94a3b8' },
                    ]}>
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Language */}
            <View>
              <Text style={styles.label}>Language</Text>
              <View style={styles.optionRow}>
                {LANGUAGES.map(lang => (
                  <TouchableOpacity
                    key={lang.value}
                    onPress={() => setLanguage(lang.value)}
                    activeOpacity={0.8}
                    style={[
                      styles.pill,
                      language === lang.value ? styles.pillActive : styles.pillInactive,
                    ]}
                  >
                    <Text style={[
                      styles.pillText,
                      { color: language === lang.value ? '#a855f7' : '#94a3b8' },
                    ]}>
                      {lang.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Generate button */}
            <TouchableOpacity
              onPress={handleGenerateQuiz}
              disabled={!topic.trim()}
              activeOpacity={0.8}
              style={[styles.generateButton, !topic.trim() && styles.generateButtonDisabled]}
            >
              <Text style={styles.generateButtonText}>🧠 Generate Quiz</Text>
            </TouchableOpacity>
          </View>

          {/* Quick access leaderboard link */}
          <TouchableOpacity
            onPress={() => {
              loadLeaderboard();
              setQuizState(QuizState.SHOW_LEADERBOARD);
            }}
            activeOpacity={0.8}
            style={styles.lbLinkButton}
          >
            <Text style={styles.lbLinkText}>🏆 View Local Leaderboard</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  quizContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0f172a',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
  },
  logoIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  logoIconText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
  },
  logoTitle: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '800',
  },
  logoSubtitle: {
    color: '#64748b',
    fontSize: 13,
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(51,65,85,0.6)',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f1f5f9',
    fontSize: 15,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  pillActive: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: '#7c3aed',
  },
  pillInactive: {
    backgroundColor: 'transparent',
    borderColor: '#334155',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  generateButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 4,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  lbLinkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  lbLinkText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  // Results
  resultCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  resultEmoji: {
    fontSize: 48,
  },
  resultScore: {
    color: '#f1f5f9',
    fontSize: 40,
    fontWeight: '900',
  },
  resultPercentage: {
    color: '#a855f7',
    fontSize: 20,
    fontWeight: '700',
  },
  resultTopic: {
    color: '#94a3b8',
    fontSize: 14,
  },
  difficultyBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  difficultyBadgeText: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reviewCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  reviewCorrect: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderColor: 'rgba(16,185,129,0.3)',
  },
  reviewWrong: {
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  reviewHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  reviewIcon: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 1,
  },
  reviewQuestion: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    lineHeight: 19,
  },
  reviewAnswers: {
    paddingLeft: 26,
    gap: 2,
  },
  reviewWrongAnswer: {
    color: '#fca5a5',
    fontSize: 12,
  },
  reviewCorrectAnswer: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  playAgainButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  leaderboardButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  leaderboardButtonText: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '600',
  },
  // Leaderboard
  screenTitle: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '800',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backLink: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '600',
  },
  lbCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  lbRank: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 28,
  },
  lbTopic: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  lbMeta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  lbRight: {
    alignItems: 'flex-end',
  },
  lbScore: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '700',
  },
  lbPct: {
    color: '#a855f7',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  // Error
  errorIcon: {
    fontSize: 48,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
