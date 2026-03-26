import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import QuizFlow from '../../components/QuizFlow';
import LoadingSpinner from '../../components/LoadingSpinner';
import { QuizQuestion } from '../../types';

function StreakBadge({ streak }: { streak: number }) {
  const color = streak >= 30 ? '#facc15' : streak >= 7 ? '#34d399' : streak >= 3 ? '#fb923c' : '#94a3b8';
  return (
    <View style={styles.streakBadge}>
      <Text style={[styles.streakText, { color }]}>
        🔥 {streak} day streak
      </Text>
    </View>
  );
}

export default function DailyScreen() {
  const { activeProfile } = useApp();
  const [daily, setDaily] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [d, lb] = await Promise.all([api.getDailyToday(), api.getDailyLeaderboard(today)]);
      setDaily(d);
      setLeaderboard(lb);
    } catch (e: any) {
      setError(e.message || 'Failed to load daily challenge');
    } finally {
      setLoading(false);
    }
  };

  const quizQuestions: QuizQuestion[] = (daily?.questions || []).map((q: any) => ({
    id: q.id,
    question: q.text,
    options: q.answers?.map((a: any) => a.text) || [],
    correctAnswer: q.answers?.find((a: any) => a.is_correct)?.text || '',
    _answers: q.answers,
  }));

  const alreadyPlayed = leaderboard.some((r: any) => r.profile_id === activeProfile?.id);

  const handleComplete = async (score: number, answered: any[]) => {
    if (!activeProfile || !daily) return;
    setSubmitting(true);
    try {
      const submittedAnswers = answered.map((q: any) => {
        const matchingAnswer = q._answers?.find((a: any) => a.text === q.userAnswer);
        return { questionId: q.id, answerId: matchingAnswer?.id || '' };
      });
      const res = await api.submitDaily(activeProfile.id, daily.quizId, submittedAnswers);
      setResult(res);
      setPlaying(false);
      const lb = await api.getDailyLeaderboard(today);
      setLeaderboard(lb);
    } catch (e: any) {
      setResult({ score, total: 10, streak: 1, rank: '-', note: 'Already submitted today' });
      setPlaying(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading daily challenge..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={load} activeOpacity={0.8} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (playing && quizQuestions.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.quizContainer}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => setPlaying(false)} activeOpacity={0.8}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.quizHeaderTitle}>📅 Daily — {daily?.topic}</Text>
          </View>
          <QuizFlow
            questions={quizQuestions}
            onQuizComplete={handleComplete}
            quizTopic={`Daily: ${daily?.topic}`}
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentStreak = result?.streak
    || (leaderboard.find((r: any) => r.profile_id === activeProfile?.id)?.streak_after_completion || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Daily Challenge</Text>
            <Text style={styles.screenDate}>
              {today} · Topic: <Text style={styles.topicHighlight}>{daily?.topic || '—'}</Text>
            </Text>
          </View>
          {activeProfile && <StreakBadge streak={currentStreak} />}
        </View>

        {/* Result card */}
        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultScore}>{result.score}/{result.total || 10}</Text>
            <Text style={styles.resultSubtext}>
              Rank #{result.rank} today · {result.streak} day streak 🔥
            </Text>
            {result.newAchievements?.length > 0 && (
              <View style={styles.achievementRow}>
                {result.newAchievements.map((a: any) => (
                  <View key={a.id} style={styles.achievementChip}>
                    <Text style={styles.achievementChipText}>
                      {a.icon} {a.name} unlocked!
                    </Text>
                  </View>
                ))}
              </View>
            )}
            {result.note && <Text style={styles.noteText}>{result.note}</Text>}
          </View>
        )}

        {/* Play button area */}
        {!activeProfile ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningText}>⚠ Select a profile to play the daily challenge.</Text>
          </View>
        ) : alreadyPlayed && !result ? (
          <View style={styles.alreadyPlayedCard}>
            <Text style={styles.alreadyPlayedText}>
              ✓ You already completed today's challenge. See your rank below.
            </Text>
          </View>
        ) : !result && (
          <TouchableOpacity
            onPress={() => setPlaying(true)}
            activeOpacity={0.8}
            style={styles.playButton}
          >
            <Text style={styles.playButtonText}>📅 Start Today's Challenge</Text>
          </TouchableOpacity>
        )}

        {/* Leaderboard */}
        <View style={styles.lbCard}>
          <Text style={styles.lbTitle}>Today's Leaderboard</Text>
          {leaderboard.length === 0 ? (
            <Text style={styles.emptyText}>No completions yet today. Be the first!</Text>
          ) : (
            <View style={styles.lbList}>
              {leaderboard.map((entry: any, i: number) => {
                const isMe = entry.profile_id === activeProfile?.id;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null;
                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.lbRow,
                      isMe ? styles.lbRowMe : (i < 3 ? styles.lbRowTop : null),
                    ]}
                  >
                    <View style={styles.lbRowLeft}>
                      <Text style={styles.lbMedal}>{medal || `${i + 1}.`}</Text>
                      <Text style={styles.lbName}>{entry.profile?.name || 'Unknown'}</Text>
                      {entry.streak_after_completion >= 3 && (
                        <Text style={styles.streakInline}>🔥 {entry.streak_after_completion}</Text>
                      )}
                    </View>
                    <Text style={styles.lbScore}>{entry.score}/10</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
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
    gap: 16,
    padding: 24,
  },
  quizContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#0f172a',
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  quizHeaderTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '600',
  },
  backLink: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  screenTitle: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '800',
  },
  screenDate: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  topicHighlight: {
    color: '#c084fc',
    fontWeight: '600',
  },
  streakBadge: {
    justifyContent: 'center',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
  },
  resultCard: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderColor: 'rgba(52,211,153,0.3)',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  resultScore: {
    color: '#6ee7b7',
    fontSize: 36,
    fontWeight: '900',
  },
  resultSubtext: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  achievementRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  achievementChip: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: '#7c3aed',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  achievementChipText: {
    color: '#c084fc',
    fontSize: 11,
  },
  noteText: {
    color: '#64748b',
    fontSize: 12,
  },
  warningCard: {
    backgroundColor: 'rgba(146,64,14,0.3)',
    borderColor: '#b45309',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  warningText: {
    color: '#fbbf24',
    fontSize: 13,
  },
  alreadyPlayedCard: {
    backgroundColor: 'rgba(30,41,59,0.4)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  alreadyPlayedText: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  playButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  lbCard: {
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  lbTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  lbList: {
    gap: 8,
  },
  lbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  lbRowMe: {
    backgroundColor: 'rgba(124,58,237,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.4)',
  },
  lbRowTop: {
    backgroundColor: 'rgba(51,65,85,0.3)',
  },
  lbRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lbMedal: {
    fontSize: 16,
    minWidth: 28,
  },
  lbName: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  streakInline: {
    color: '#fb923c',
    fontSize: 12,
  },
  lbScore: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 15,
    textAlign: 'center',
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
    fontSize: 14,
  },
});
