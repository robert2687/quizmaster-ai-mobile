import React, { useEffect, useState } from 'react';
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
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

function StatusBadge({ status }: { status: string }) {
  const styles_map: Record<string, { bg: string; text: string; border: string }> = {
    pending:     { bg: 'rgba(120,53,15,0.4)',  text: '#fbbf24', border: '#92400e' },
    in_progress: { bg: 'rgba(30,58,138,0.4)',  text: '#60a5fa', border: '#1e3a8a' },
    completed:   { bg: 'rgba(6,78,59,0.4)',    text: '#34d399', border: '#065f46' },
  };
  const s = styles_map[status] || styles_map.pending;
  return (
    <View style={[badge_styles.badge, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[badge_styles.text, { color: s.text }]}>
        {status.replace('_', ' ').toUpperCase()}
      </Text>
    </View>
  );
}

const badge_styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

interface CreateTournamentFormProps {
  profiles: any[];
  activeProfile: any;
  onCreated: () => void;
  onCancel: () => void;
}

function CreateTournamentForm({ profiles, activeProfile, onCreated, onCancel }: CreateTournamentFormProps) {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<'single_elimination' | 'double_elimination'>('single_elimination');
  const [selected, setSelected] = useState<string[]>(activeProfile ? [activeProfile.id] : []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleCreate = async () => {
    if (!name.trim() || !topic.trim() || selected.length < 2) {
      setError('Name, topic, and at least 2 participants required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.createTournament({ name, topic, mode, participantProfileIds: selected });
      onCreated();
    } catch (e: any) {
      setError(e.message || 'Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>Create Tournament</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Tournament name..."
        placeholderTextColor="#64748b"
        returnKeyType="next"
      />
      <TextInput
        style={styles.input}
        value={topic}
        onChangeText={setTopic}
        placeholder="Quiz topic (e.g. World History)..."
        placeholderTextColor="#64748b"
        returnKeyType="done"
      />

      {/* Mode selector */}
      <View style={styles.modeRow}>
        {(['single_elimination', 'double_elimination'] as const).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => setMode(m)}
            activeOpacity={0.8}
            style={[styles.modePill, mode === m ? styles.modePillActive : styles.modePillInactive]}
          >
            <Text style={[styles.modePillText, { color: mode === m ? '#fff' : '#94a3b8' }]}>
              {m === 'single_elimination' ? '🏆 Single' : '⚔️ Double'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Participants */}
      <View>
        <Text style={styles.participantLabel}>
          Select participants ({selected.length} selected)
        </Text>
        <View style={styles.participantsGrid}>
          {profiles.map(p => (
            <TouchableOpacity
              key={p.id}
              onPress={() => toggle(p.id)}
              activeOpacity={0.8}
              style={[
                styles.participantPill,
                selected.includes(p.id) ? styles.participantPillActive : styles.participantPillInactive,
              ]}
            >
              <Text style={[
                styles.participantPillText,
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
        <Text style={styles.createButtonText}>
          {loading ? 'Generating quiz...' : 'Create Tournament'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TournamentsScreen() {
  const { profiles, activeProfile } = useApp();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setTournaments(await api.getTournaments());
    } catch { }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setTournaments(await api.getTournaments());
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
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.screenTitle}>Tournaments</Text>
              <Text style={styles.screenSubtitle}>Bracket-based head-to-head competitions</Text>
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
            <CreateTournamentForm
              profiles={profiles}
              activeProfile={activeProfile}
              onCreated={() => { setShowCreate(false); load(); }}
              onCancel={() => setShowCreate(false)}
            />
          )}

          {loading ? (
            <LoadingSpinner />
          ) : tournaments.length === 0 ? (
            <Text style={styles.emptyText}>No tournaments yet. Create one above!</Text>
          ) : (
            <View style={styles.tournamentList}>
              {tournaments.map(t => (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => router.push(`/tournament/${t.id}` as any)}
                  activeOpacity={0.8}
                  style={styles.tournamentCard}
                >
                  <View style={styles.tournamentCardHeader}>
                    <Text style={styles.tournamentName} numberOfLines={1}>{t.name}</Text>
                    <StatusBadge status={t.status} />
                  </View>
                  <Text style={styles.tournamentMeta}>
                    {t.mode === 'single_elimination' ? '🏆 Single Elimination' : '⚔️ Double Elimination'}
                    {'  ·  '}
                    {t.quiz?.title || 'Custom quiz'}
                  </Text>
                  <Text style={styles.tournamentCreator}>
                    Created by{' '}
                    <Text style={styles.tournamentCreatorName}>{t.created_by?.name || '—'}</Text>
                    {'  ·  '}
                    {new Date(t.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  tournamentList: {
    gap: 12,
  },
  tournamentCard: {
    backgroundColor: 'rgba(30,41,59,0.6)',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },
  tournamentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  tournamentName: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  tournamentMeta: {
    color: '#94a3b8',
    fontSize: 12,
  },
  tournamentCreator: {
    color: '#64748b',
    fontSize: 11,
  },
  tournamentCreatorName: {
    color: '#94a3b8',
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
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  modePillActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  modePillInactive: {
    borderColor: '#334155',
  },
  modePillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  participantLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  participantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  participantPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  participantPillActive: {
    backgroundColor: 'rgba(124,58,237,0.3)',
    borderColor: '#7c3aed',
  },
  participantPillInactive: {
    borderColor: '#334155',
  },
  participantPillText: {
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
});
