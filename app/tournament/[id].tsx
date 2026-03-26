import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import QuizFlow from '../../components/QuizFlow';
import LoadingSpinner from '../../components/LoadingSpinner';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    pending:     { bg: 'rgba(120,53,15,0.4)',  text: '#fbbf24', border: '#92400e' },
    in_progress: { bg: 'rgba(30,58,138,0.4)',  text: '#60a5fa', border: '#1e3a8a' },
    completed:   { bg: 'rgba(6,78,59,0.4)',    text: '#34d399', border: '#065f46' },
  };
  const s = map[status] || map.pending;
  return (
    <View style={[styles.statusBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.statusBadgeText, { color: s.text }]}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
}

interface MatchNodeProps {
  match: any;
  participants: any[];
  onPlay?: () => void;
}

function MatchNode({ match, participants, onPlay }: MatchNodeProps) {
  const p1 = participants.find((p: any) => p.id === match.participant1_id);
  const p2 = participants.find((p: any) => p.id === match.participant2_id);
  const r1 = match.results?.find((r: any) => r.profile_id === p1?.profile_id);
  const r2 = match.results?.find((r: any) => r.profile_id === p2?.profile_id);
  const isCompleted = match.status === 'completed';

  const renderPlayer = (participant: any, result: any) => {
    const isWinner = match.winner_participant_id === participant?.id;
    return (
      <View style={[styles.matchPlayer, isWinner && styles.matchPlayerWinner]}>
        <Text style={[styles.matchPlayerName, isWinner && styles.matchPlayerNameWinner]} numberOfLines={1}>
          {isWinner ? '👑 ' : ''}{participant?.profile?.name || 'TBD'}
        </Text>
        <Text style={[styles.matchScore, result ? styles.matchScoreKnown : styles.matchScoreUnknown]}>
          {result?.score ?? '-'}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.matchNode, { borderColor: isCompleted ? '#475569' : '#334155' }]}>
      <View style={styles.matchHeader}>
        <Text style={styles.matchTitle}>Match {match.match_number}</Text>
        {match.status === 'pending' && onPlay && (
          <TouchableOpacity onPress={onPlay} activeOpacity={0.8} style={styles.playMatchButton}>
            <Text style={styles.playMatchButtonText}>▶ Play</Text>
          </TouchableOpacity>
        )}
      </View>
      {renderPlayer(p1, r1)}
      <View style={styles.matchDivider} />
      {renderPlayer(p2, r2)}
    </View>
  );
}

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeProfile } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [playingMatch, setPlayingMatch] = useState<any>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [manualScore, setManualScore] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setData(await api.getTournament(id));
    } catch { }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStart = async () => {
    if (!id) return;
    try {
      await api.startTournament(id);
      await load();
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const handlePlayMatch = (match: any) => {
    if (!data) return;
    const questions = data.tournament?.quiz?.questions
      ?.sort((a: any, b: any) => a.ord - b.ord)
      ?.map((q: any) => ({
        id: q.id,
        question: q.text,
        options: q.answers?.map((a: any) => a.text) || [],
        correctAnswer: q.answers?.find((a: any) => a.is_correct)?.text || '',
      })) || [];
    setQuizQuestions(questions);
    setPlayingMatch(match);
  };

  const handleMatchComplete = async (score: number) => {
    if (!playingMatch || !activeProfile) return;
    try {
      await api.submitMatchResult(playingMatch.id, activeProfile.id, score);
      setPlayingMatch(null);
      await load();
    } catch (e: any) {
      console.error(e.message);
    }
  };

  const handleManualSubmit = async () => {
    if (!playingMatch || !activeProfile) return;
    const score = parseInt(manualScore, 10);
    if (isNaN(score)) return;
    try {
      await api.submitMatchResult(playingMatch.id, activeProfile.id, score);
      setSubmitModalVisible(false);
      setPlayingMatch(null);
      setManualScore('');
      await load();
    } catch (e: any) {
      console.error(e.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading tournament..." />
      </SafeAreaView>
    );
  }

  if (!data?.tournament) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.notFoundText}>Tournament not found.</Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { tournament, participants, matches } = data;

  if (playingMatch && quizQuestions.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.quizContainer}>
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => setPlayingMatch(null)} activeOpacity={0.8}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.quizHeaderTitle}>Tournament — Round {playingMatch.round}</Text>
          </View>
          <QuizFlow
            questions={quizQuestions}
            onQuizComplete={score => handleMatchComplete(score)}
            quizTopic={tournament.quiz?.title || 'Tournament'}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Group matches by round
  const rounds = [...new Set((matches || []).map((m: any) => m.round) as number[])].sort((a, b) => a - b);
  const maxRound = rounds.length > 0 ? Math.max(...rounds) : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        {/* Back nav */}
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
          <Text style={styles.backLink}>← Tournaments</Text>
        </TouchableOpacity>

        {/* Tournament header */}
        <View style={styles.tournamentHeader}>
          <View style={styles.tournamentHeaderLeft}>
            <Text style={styles.tournamentName}>{tournament.name}</Text>
            <Text style={styles.tournamentMeta}>
              {tournament.mode === 'single_elimination' ? '🏆 Single Elimination' : '⚔️ Double Elimination'}
              {'  ·  '}
              {tournament.quiz?.title || '—'}
            </Text>
          </View>
          <View style={styles.tournamentHeaderRight}>
            <StatusBadge status={tournament.status} />
            {tournament.status === 'pending' && (
              <TouchableOpacity onPress={handleStart} activeOpacity={0.8} style={styles.startButton}>
                <Text style={styles.startButtonText}>▶ Start</Text>
              </TouchableOpacity>
            )}
            {tournament.status === 'completed' && (
              <Text style={styles.completedText}>✓ Completed</Text>
            )}
          </View>
        </View>

        {/* Bracket — scrollable horizontally */}
        {rounds.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Bracket</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.bracketContainer}>
                {rounds.map((round: number) => (
                  <View key={round} style={styles.bracketRound}>
                    <Text style={styles.roundLabel}>
                      {round === maxRound ? 'Final' : `Round ${round}`}
                    </Text>
                    {(matches || [])
                      .filter((m: any) => m.round === round)
                      .map((match: any) => (
                        <MatchNode
                          key={match.id}
                          match={match}
                          participants={participants || []}
                          onPlay={
                            tournament.status === 'in_progress' &&
                            match.status === 'pending' &&
                            activeProfile
                              ? () => handlePlayMatch(match)
                              : undefined
                          }
                        />
                      ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Participants */}
        <View style={styles.participantsCard}>
          <Text style={styles.sectionTitle}>Participants</Text>
          <View style={styles.participantsRow}>
            {(participants || []).map((p: any) => (
              <View key={p.id} style={styles.participantChip}>
                <Text style={styles.participantName}>{p.profile?.name || '—'}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Manual score submit modal */}
      <Modal
        visible={submitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSubmitModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Submit Score</Text>
            <TextInput
              style={styles.modalInput}
              value={manualScore}
              onChangeText={setManualScore}
              placeholder="Enter your score..."
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              returnKeyType="done"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={() => setSubmitModalVisible(false)}
                activeOpacity={0.8}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleManualSubmit}
                activeOpacity={0.8}
                style={styles.modalSubmitButton}
              >
                <Text style={styles.modalSubmitText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: 18,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
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
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  tournamentHeaderLeft: {
    flex: 1,
    gap: 4,
  },
  tournamentHeaderRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  tournamentName: {
    color: '#f1f5f9',
    fontSize: 22,
    fontWeight: '800',
  },
  tournamentMeta: {
    color: '#94a3b8',
    fontSize: 13,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  startButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  completedText: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  bracketContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 4,
  },
  bracketRound: {
    gap: 12,
    minWidth: 170,
  },
  roundLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
  },
  matchNode: {
    backgroundColor: 'rgba(30,41,59,0.8)',
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 165,
  },
  matchHeader: {
    backgroundColor: 'rgba(51,65,85,0.6)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  matchTitle: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
  },
  playMatchButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  playMatchButtonText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  matchPlayer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  matchPlayerWinner: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  matchPlayerName: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  matchPlayerNameWinner: {
    color: '#6ee7b7',
    fontWeight: '700',
  },
  matchScore: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'right',
  },
  matchScoreKnown: {
    color: '#f1f5f9',
  },
  matchScoreUnknown: {
    color: '#334155',
  },
  matchDivider: {
    height: 1,
    backgroundColor: '#334155',
  },
  participantsCard: {
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  participantsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantChip: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  participantName: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  notFoundText: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButtonText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    color: '#f1f5f9',
    fontSize: 18,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: 'rgba(51,65,85,0.6)',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f1f5f9',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  modalSubmitButton: {
    flex: 1,
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
