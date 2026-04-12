import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { SessionPlayer } from '../../types';
import QuizFlow from '../../components/QuizFlow';
import LoadingSpinner from '../../components/LoadingSpinner';

type Mode = 'menu' | 'host-setup' | 'join-input' | 'lobby' | 'playing' | 'results';

const PlayerAvatar = React.memo(function PlayerAvatar({ player }: { player: SessionPlayer }) {
  return (
    <View style={[styles.playerAvatarContainer, !player.connected && { opacity: 0.4 }]}>
      <View style={[styles.playerAvatar, player.is_host && styles.playerAvatarHost]}>
        <Text style={styles.playerAvatarText}>
          {player.profile?.name?.[0]?.toUpperCase() || '?'}
        </Text>
      </View>
      <Text style={styles.playerName} numberOfLines={1}>
        {player.profile?.name || 'Unknown'}
      </Text>
      {player.is_host && <Text style={styles.hostBadge}>HOST</Text>}
    </View>
  );
});

interface ScoreBoardProps {
  players: any[];
  currentProfileId?: string;
}

const ScoreBoard = React.memo(function ScoreBoard({ players, currentProfileId }: ScoreBoardProps) {
  const sorted = [...(players || [])].sort((a, b) => (b.score || 0) - (a.score || 0));
  return (
    <View style={styles.scoreBoard}>
      <Text style={styles.scoreBoardTitle}>LIVE SCORES</Text>
      {sorted.map((p, i) => (
        <View
          key={p.id}
          style={[styles.scoreRow, p.profile_id === currentProfileId && styles.scoreRowMe]}
        >
          <Text style={[styles.scoreRank, p.profile_id === currentProfileId && styles.scoreRankMe]}>
            {i + 1}. {p.profile?.name || 'Player'}
          </Text>
          <Text style={[styles.scoreVal, p.profile_id === currentProfileId && styles.scoreValMe]}>
            {p.score || 0}
          </Text>
        </View>
      ))}
    </View>
  );
});

export default function MultiplayerScreen() {
  const { activeProfile } = useApp();
  const [mode, setMode] = useState<Mode>('menu');
  const [topic, setTopic] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const modeRef = useRef<Mode>('menu');

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  const refreshSession = useCallback(async (sessionId: string) => {
    try {
      const data = await api.getSession(sessionId);
      setSession(data);
      if (data.status === 'in_progress' && modeRef.current === 'lobby') {
        const qs = (data.quiz?.questions || [])
          .sort((a: any, b: any) => a.ord - b.ord)
          .map((q: any) => ({
            id: q.id,
            question: q.text,
            options: q.answers?.map((a: any) => a.text) || [],
            correctAnswer: q.answers?.find((a: any) => a.is_correct)?.text || '',
            answers: q.answers,
          }));
        setQuizQuestions(qs);
        setMode('playing');
      }
      if (data.status === 'finished') {
        setResults(data.players || []);
        setMode('results');
        channelRef.current?.unsubscribe();
      }
    } catch { }
  }, []);

  // Supabase Realtime subscription — instant updates instead of polling
  useEffect(() => {
    if (session?.id && (mode === 'lobby' || mode === 'playing')) {
      channelRef.current?.unsubscribe();
      const channel = supabase
        .channel(`session:${session.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${session.id}`,
        }, () => refreshSession(session.id))
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'session_players',
          filter: `session_id=eq.${session.id}`,
        }, () => refreshSession(session.id))
        .subscribe();
      channelRef.current = channel;
      return () => { channel.unsubscribe(); };
    }
  }, [session?.id, mode, refreshSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      channelRef.current?.unsubscribe();
    };
  }, []);

  const handleHost = async () => {
    if (!activeProfile) { setError('Select a profile first'); return; }
    if (!topic.trim()) { setError('Enter a topic'); return; }
    setLoading(true);
    setError('');
    try {
      const s = await api.createSession(topic, activeProfile.id, 10);
      const full = await api.getSession(s.id);
      setSession(full);
      setMode('lobby');
    } catch (e: any) {
      setError(e.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!activeProfile) { setError('Select a profile first'); return; }
    if (joinCode.length !== 6) { setError('Enter a valid 6-character code'); return; }
    setLoading(true);
    setError('');
    try {
      const s = await api.joinSession(joinCode.toUpperCase(), activeProfile.id);
      const full = await api.getSession(s.id);
      setSession(full);
      setMode('lobby');
    } catch (e: any) {
      setError(e.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await api.startSession(session.id);
      const full = await api.getSession(session.id);
      const qs = (full.quiz?.questions || [])
        .sort((a: any, b: any) => a.ord - b.ord)
        .map((q: any) => ({
          id: q.id,
          question: q.text,
          options: q.answers?.map((a: any) => a.text) || [],
          correctAnswer: q.answers?.find((a: any) => a.is_correct)?.text || '',
          answers: q.answers,
        }));
      setQuizQuestions(qs);
      setSession(full);
      setMode('playing');
    } catch (e: any) {
      setError(e.message || 'Failed to start game');
    }
  };

  const handleAnswer = async (questionId: string, answer: string, q: any) => {
    if (!activeProfile || !session) return;
    const matchingAnswer = (q as any).answers?.find((a: any) => a.text === answer);
    if (matchingAnswer) {
      try {
        await api.submitAnswer(session.id, activeProfile.id, questionId, matchingAnswer.id);
      } catch { }
    }
  };

  const handleQuizComplete = async (score: number, answered: any[]) => {
    if (!session || !activeProfile) return;
    const isHost = session.players?.find((p: any) => p.profile_id === activeProfile.id)?.is_host;
    if (isHost) {
      try {
        const res = await api.endSession(session.id);
        setResults(res.leaderboard || []);
      } catch { }
    }
    setMode('results');
    channelRef.current?.unsubscribe();
  };

  const reset = () => {
    channelRef.current?.unsubscribe();
    setMode('menu');
    setSession(null);
    setTopic('');
    setJoinCode('');
    setQuizQuestions([]);
    setResults([]);
    setError('');
  };

  // ── MENU
  if (mode === 'menu') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
          <View>
            <Text style={styles.screenTitle}>Multiplayer</Text>
            <Text style={styles.screenSubtitle}>Play live with friends using a join code</Text>
          </View>
          {!activeProfile && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>⚠ Select a profile first.</Text>
            </View>
          )}
          <View style={styles.menuCards}>
            <TouchableOpacity
              onPress={() => setMode('host-setup')}
              activeOpacity={0.8}
              style={styles.menuCard}
            >
              <Text style={styles.menuCardIcon}>🖥️</Text>
              <Text style={styles.menuCardTitle}>Host Game</Text>
              <Text style={styles.menuCardSubtitle}>Create a room and share a code</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('join-input')}
              activeOpacity={0.8}
              style={styles.menuCard}
            >
              <Text style={styles.menuCardIcon}>🔗</Text>
              <Text style={styles.menuCardTitle}>Join Game</Text>
              <Text style={styles.menuCardSubtitle}>Enter a code to join a room</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── HOST SETUP
  if (mode === 'host-setup') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => setMode('menu')} activeOpacity={0.8}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Host a Game</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TextInput
              style={styles.input}
              value={topic}
              onChangeText={setTopic}
              placeholder="Quiz topic (e.g. Space Exploration)..."
              placeholderTextColor="#64748b"
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleHost}
              disabled={loading || !topic.trim()}
              activeOpacity={0.8}
              style={[styles.primaryButton, (loading || !topic.trim()) && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Generating quiz...' : 'Create Room'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── JOIN INPUT
  if (mode === 'join-input') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => setMode('menu')} activeOpacity={0.8}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Join a Game</Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TextInput
              style={styles.joinCodeInput}
              value={joinCode}
              onChangeText={text => setJoinCode(text.toUpperCase().slice(0, 6))}
              placeholder="XXXXXX"
              placeholderTextColor="#334155"
              autoCapitalize="characters"
              maxLength={6}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleJoin}
              disabled={loading || joinCode.length !== 6}
              activeOpacity={0.8}
              style={[styles.joinButton, (loading || joinCode.length !== 6) && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Joining...' : 'Join Room'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // ── LOBBY
  if (mode === 'lobby' && session) {
    const isHost = session.players?.find((p: any) => p.profile_id === activeProfile?.id)?.is_host;
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {/* Join code */}
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Share this code with friends:</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{session.join_code}</Text>
            </View>
          </View>

          {/* Players */}
          <View style={styles.playersCard}>
            <Text style={styles.playersTitle}>
              Players in lobby ({session.players?.length || 0})
            </Text>
            <View style={styles.playersGrid}>
              {(session.players || []).map((p: any) => (
                <View key={p.id} style={styles.playerItem}>
                  <PlayerAvatar player={p} />
                  {isHost && !p.is_host && (
                    <TouchableOpacity
                      onPress={() => api.kickPlayer(session.id, p.profile_id)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.kickText}>Kick</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.topicLabel}>
            Topic: <Text style={styles.topicValue}>{session.quiz?.title || '—'}</Text>
          </Text>

          {isHost ? (
            <TouchableOpacity onPress={handleStart} activeOpacity={0.8} style={styles.startButton}>
              <Text style={styles.primaryButtonText}>▶ Start Game</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.waitingText}>Waiting for host to start...</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PLAYING
  if (mode === 'playing' && quizQuestions.length > 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.playingContainer}>
          <ScoreBoard players={session?.players || []} currentProfileId={activeProfile?.id} />
          <QuizFlow
            questions={quizQuestions}
            quizTopic={session?.quiz?.title || 'Multiplayer Quiz'}
            onQuizComplete={handleQuizComplete}
            onAnswer={(qId, answer, q) => handleAnswer(qId, answer, q)}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── RESULTS
  if (mode === 'results') {
    const displayResults = results.length > 0
      ? results
      : (session?.players || []).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.gameOverTitle}>Game Over!</Text>
          <View style={styles.resultsCard}>
            {displayResults.map((r: any, i: number) => (
              <View
                key={r.profileId || r.profile_id || i}
                style={[styles.resultRow, i === 0 && styles.resultRowFirst]}
              >
                <Text style={styles.resultName}>
                  {i === 0 ? '👑 ' : `${i + 1}. `}
                  {r.profile?.name || r.profileId || 'Player'}
                </Text>
                <Text style={styles.resultScore}>{r.score || 0} pts</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={reset} activeOpacity={0.8} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Back to Menu</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LoadingSpinner />
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
  playingContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
    backgroundColor: '#0f172a',
  },
  screenTitle: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '800',
  },
  screenSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '700',
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
  menuCards: {
    flexDirection: 'row',
    gap: 12,
  },
  menuCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  menuCardIcon: {
    fontSize: 36,
  },
  menuCardTitle: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  menuCardSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    textAlign: 'center',
  },
  backLink: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(51,65,85,0.6)',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#f1f5f9',
    fontSize: 15,
  },
  joinCodeInput: {
    backgroundColor: 'rgba(51,65,85,0.6)',
    borderColor: '#475569',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 18,
    color: '#f1f5f9',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
  },
  primaryButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  // Lobby
  codeContainer: {
    alignItems: 'center',
    gap: 10,
  },
  codeLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  codeBox: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(168,85,247,0.6)',
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  codeText: {
    color: '#c084fc',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 6,
  },
  playersCard: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  playersTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  playersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  playerItem: {
    alignItems: 'center',
    gap: 4,
  },
  playerAvatarContainer: {
    alignItems: 'center',
    gap: 4,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarHost: {
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  playerAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  playerName: {
    color: '#94a3b8',
    fontSize: 10,
    maxWidth: 60,
    textAlign: 'center',
  },
  hostBadge: {
    color: '#f59e0b',
    fontSize: 8,
    fontWeight: '700',
  },
  kickText: {
    color: '#ef4444',
    fontSize: 9,
    fontWeight: '600',
  },
  topicLabel: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
  topicValue: {
    color: '#f1f5f9',
  },
  waitingText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 12,
  },
  // Scoreboard
  scoreBoard: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderColor: 'rgba(51,65,85,0.5)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 6,
  },
  scoreBoardTitle: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreRowMe: {},
  scoreRank: {
    color: '#94a3b8',
    fontSize: 12,
  },
  scoreRankMe: {
    color: '#c084fc',
    fontWeight: '700',
  },
  scoreVal: {
    color: '#94a3b8',
    fontSize: 12,
  },
  scoreValMe: {
    color: '#c084fc',
    fontWeight: '700',
  },
  // Results
  gameOverTitle: {
    color: '#f1f5f9',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  resultsCard: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resultRowFirst: {
    backgroundColor: 'rgba(146,64,14,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  resultName: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  resultScore: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
  },
});
