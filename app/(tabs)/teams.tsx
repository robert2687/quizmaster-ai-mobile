import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import QuizFlow from '../../components/QuizFlow';
import LoadingSpinner from '../../components/LoadingSpinner';

interface TeamCardProps {
  team: any;
  onChallenge: () => void;
}

function TeamCard({ team, onChallenge }: TeamCardProps) {
  return (
    <View style={styles.teamCard}>
      <View style={styles.teamCardHeader}>
        <View>
          <Text style={styles.teamName}>{team.name}</Text>
          <Text style={styles.teamMemberCount}>{team.members?.length || 0} members</Text>
        </View>
        <TouchableOpacity onPress={onChallenge} activeOpacity={0.8} style={styles.challengeButton}>
          <Text style={styles.challengeButtonText}>Challenge</Text>
        </TouchableOpacity>
      </View>
      {team.members && team.members.length > 0 && (
        <View style={styles.membersRow}>
          {team.members.map((m: any) => (
            <View
              key={m.id}
              style={[
                styles.memberChip,
                m.role === 'captain' ? styles.memberChipCaptain : styles.memberChipDefault,
              ]}
            >
              <Text style={[
                styles.memberChipText,
                { color: m.role === 'captain' ? '#fbbf24' : '#94a3b8' },
              ]}>
                {m.role === 'captain' ? '⭐ ' : ''}{m.profile?.name || 'Unknown'}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface CreateTeamFormProps {
  profiles: any[];
  activeProfile: any;
  onCreated: () => void;
}

function CreateTeamForm({ profiles, activeProfile, onCreated }: CreateTeamFormProps) {
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string[]>(activeProfile ? [activeProfile.id] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!name.trim() || !activeProfile) {
      setError('Name and active profile required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createTeam({ name, createdByProfileId: activeProfile.id, memberProfileIds: selected });
      onCreated();
      setName('');
    } catch (e: any) {
      setError(e.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Create Team</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Team name..."
        placeholderTextColor="#64748b"
        returnKeyType="done"
      />
      <View>
        <Text style={styles.membersLabel}>Members</Text>
        <View style={styles.membersGrid}>
          {profiles.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => toggle(p.id)}
              activeOpacity={0.8}
              style={[
                styles.memberPill,
                selected.includes(p.id) ? styles.memberPillActive : styles.memberPillInactive,
              ]}
            >
              <Text style={[
                styles.memberPillText,
                { color: selected.includes(p.id) ? '#c084fc' : '#94a3b8' },
              ]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity
        onPress={handleCreate}
        disabled={loading}
        activeOpacity={0.8}
        style={[styles.createButton, loading && styles.buttonDisabled]}
      >
        <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Create Team'}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ChallengeModalProps {
  team: any;
  allTeams: any[];
  profiles: any[];
  activeProfile: any;
  onClose: () => void;
  onDone: () => void;
}

function ChallengeModal({ team, allTeams, profiles, activeProfile, onClose, onDone }: ChallengeModalProps) {
  const [topic, setTopic] = useState('');
  const [opponent, setOpponent] = useState('');
  const [loading, setLoading] = useState(false);
  const [playingQuiz, setPlayingQuiz] = useState<any>(null);
  const [matchId, setMatchId] = useState('');
  const [error, setError] = useState('');

  const opponentTeams = allTeams.filter((t: any) => t.id !== team.id);

  const handleChallenge = async () => {
    if (!topic.trim() || !opponent) {
      setError('Enter topic and select opponent');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const match = await api.createTeamMatch({
        topic,
        team1Id: team.id,
        team2Id: opponent,
        mode: '2v2',
        questionsPerMatch: 5,
      });
      setMatchId(match.id);
      // Generate quiz for immediate play
      const questions = await api.generateQuiz(topic, 'medium', 5);
      setPlayingQuiz(questions);
    } catch (e: any) {
      setError(e.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const handleMatchComplete = async (score: number) => {
    if (!activeProfile) return;
    try {
      await api.submitTeamMatch(matchId, team.id, score);
      onDone();
    } catch (e: any) {
      setError(e.message || 'Failed to submit result');
      onDone();
    }
  };

  if (playingQuiz) {
    return (
      <Modal visible animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
          <View style={{ flex: 1, padding: 16 }}>
            <QuizFlow
              questions={playingQuiz}
              onQuizComplete={handleMatchComplete}
              quizTopic={topic}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Challenge a Team</Text>
            <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TextInput
            style={styles.input}
            value={topic}
            onChangeText={setTopic}
            placeholder="Quiz topic..."
            placeholderTextColor="#64748b"
            returnKeyType="done"
          />

          {/* Opponent selector */}
          <View>
            <Text style={styles.membersLabel}>Select opponent team</Text>
            {opponentTeams.length === 0 ? (
              <Text style={styles.noOpponentsText}>No other teams available.</Text>
            ) : (
              <View style={styles.membersGrid}>
                {opponentTeams.map((t: any) => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => setOpponent(t.id)}
                    activeOpacity={0.8}
                    style={[
                      styles.memberPill,
                      opponent === t.id ? styles.memberPillActive : styles.memberPillInactive,
                    ]}
                  >
                    <Text style={[
                      styles.memberPillText,
                      { color: opponent === t.id ? '#c084fc' : '#94a3b8' },
                    ]}>
                      {t.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity
            onPress={handleChallenge}
            disabled={!topic.trim() || !opponent || loading}
            activeOpacity={0.8}
            style={[
              styles.createButton,
              (!topic.trim() || !opponent || loading) && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating match...' : 'Start Challenge'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function TeamsScreen() {
  const { profiles, activeProfile } = useApp();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [challenging, setChallenging] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      setTeams(await api.getTeams());
    } catch { }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setTeams(await api.getTeams());
    } catch { }
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
          }
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.screenTitle}>Teams</Text>
              <Text style={styles.screenSubtitle}>Compete together in 2v2 and 3v3 matches</Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowCreate(v => !v)}
              activeOpacity={0.8}
              style={styles.createToggleButton}
            >
              <Text style={styles.createToggleText}>{showCreate ? 'Cancel' : '+ Create'}</Text>
            </TouchableOpacity>
          </View>

          {showCreate && (
            <CreateTeamForm
              profiles={profiles}
              activeProfile={activeProfile}
              onCreated={() => { setShowCreate(false); load(); }}
            />
          )}

          {loading ? (
            <LoadingSpinner />
          ) : teams.length === 0 ? (
            <Text style={styles.emptyText}>No teams yet. Create one to start!</Text>
          ) : (
            <View style={styles.teamsList}>
              {teams.map(t => (
                <TeamCard
                  key={t.id}
                  team={t}
                  onChallenge={() => setChallenging(t)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {challenging && (
        <ChallengeModal
          team={challenging}
          allTeams={teams}
          profiles={profiles}
          activeProfile={activeProfile}
          onClose={() => setChallenging(null)}
          onDone={() => { setChallenging(null); load(); }}
        />
      )}
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
  screenSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  createToggleButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 4,
  },
  createToggleText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  teamsList: {
    gap: 12,
  },
  teamCard: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  teamName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '700',
  },
  teamMemberCount: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  challengeButton: {
    backgroundColor: 'rgba(124,58,237,0.2)',
    borderColor: '#7c3aed',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  challengeButtonText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '600',
  },
  membersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  memberChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  memberChipCaptain: {
    backgroundColor: 'rgba(120,53,15,0.3)',
    borderColor: '#b45309',
  },
  memberChipDefault: {
    backgroundColor: 'rgba(51,65,85,0.3)',
    borderColor: '#475569',
  },
  memberChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  // Form
  formCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  formTitle: {
    color: '#f1f5f9',
    fontSize: 15,
    fontWeight: '700',
  },
  input: {
    backgroundColor: 'rgba(51,65,85,0.6)',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f1f5f9',
    fontSize: 14,
  },
  membersLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  memberPillActive: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderColor: '#7c3aed',
  },
  memberPillInactive: {
    borderColor: '#334155',
  },
  memberPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
    maxWidth: 440,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#f1f5f9',
    fontSize: 17,
    fontWeight: '700',
  },
  closeButton: {
    color: '#64748b',
    fontSize: 20,
    padding: 4,
  },
  noOpponentsText: {
    color: '#64748b',
    fontSize: 13,
    paddingVertical: 8,
  },
});
