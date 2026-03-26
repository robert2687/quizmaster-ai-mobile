import React, { useState } from 'react';
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
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Profile } from '../../types';

const AVATAR_COLORS = ['#6d28d9', '#0f766e', '#b45309', '#b91c1c', '#1d4ed8', '#065f46', '#9333ea', '#c2410c'];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

interface ProfileCardProps {
  profile: Profile;
  active: boolean;
  onSelect: () => void;
}

function ProfileCard({ profile, active, onSelect }: ProfileCardProps) {
  const color = getAvatarColor(profile.name);
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.8}
      style={[styles.profileCard, active ? styles.profileCardActive : styles.profileCardInactive]}
    >
      {active && (
        <View style={styles.activeBadge}>
          <Text style={styles.activeBadgeText}>ACTIVE</Text>
        </View>
      )}
      <View style={[styles.avatar, { backgroundColor: color }]}>
        <Text style={styles.avatarText}>{profile.name[0].toUpperCase()}</Text>
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName} numberOfLines={1}>{profile.name}</Text>
        <Text style={styles.profileDate}>
          {new Date(profile.created_at).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { profiles, activeProfile, setActiveProfile, refreshProfiles } = useApp();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError('');
    try {
      await api.createProfile(name.trim());
      await refreshProfiles();
      setName('');
    } catch (e: any) {
      setError(e.message || 'Failed to create profile');
    } finally {
      setCreating(false);
    }
  };

  const handleSelect = (profile: Profile) => {
    if (activeProfile?.id === profile.id) {
      setActiveProfile(null);
    } else {
      setActiveProfile(profile);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.screenTitle}>Profiles</Text>
            <Text style={styles.screenSubtitle}>
              Select your profile or create a new one to track stats and achievements.
            </Text>
          </View>

          {/* Active profile stats */}
          {activeProfile && (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Active: {activeProfile.name}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>—</Text>
                  <Text style={styles.statLabel}>Wins</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>—</Text>
                  <Text style={styles.statLabel}>Losses</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>—</Text>
                  <Text style={styles.statLabel}>Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>—</Text>
                  <Text style={styles.statLabel}>Trophies</Text>
                </View>
              </View>
            </View>
          )}

          {/* Profile grid */}
          {profiles.length === 0 ? (
            <Text style={styles.emptyText}>No profiles yet — create one below.</Text>
          ) : (
            <View style={styles.profileGrid}>
              {profiles.map(p => (
                <ProfileCard
                  key={p.id}
                  profile={p}
                  active={activeProfile?.id === p.id}
                  onSelect={() => handleSelect(p)}
                />
              ))}
            </View>
          )}

          {/* Create form */}
          <View style={styles.createCard}>
            <Text style={styles.createTitle}>Create New Profile</Text>
            <View style={styles.createRow}>
              <TextInput
                style={styles.createInput}
                value={name}
                onChangeText={setName}
                onSubmitEditing={handleCreate}
                placeholder="Enter a name..."
                placeholderTextColor="#64748b"
                returnKeyType="done"
                maxLength={30}
              />
              <TouchableOpacity
                onPress={handleCreate}
                disabled={!name.trim() || creating}
                activeOpacity={0.8}
                style={[styles.createButton, (!name.trim() || creating) && styles.createButtonDisabled]}
              >
                <Text style={styles.createButtonText}>{creating ? '...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
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
  screenTitle: {
    color: '#f1f5f9',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  screenSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  statsCard: {
    backgroundColor: '#1e293b',
    borderColor: '#7c3aed',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  statsTitle: {
    color: '#a855f7',
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#f1f5f9',
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#334155',
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileCard: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    gap: 10,
    position: 'relative',
  },
  profileCardActive: {
    borderColor: '#7c3aed',
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  profileCardInactive: {
    borderColor: '#334155',
    backgroundColor: '#1e293b',
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 32,
  },
  createCard: {
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  createTitle: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  createRow: {
    flexDirection: 'row',
    gap: 10,
  },
  createInput: {
    flex: 1,
    backgroundColor: 'rgba(51,65,85,0.6)',
    borderColor: '#475569',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f1f5f9',
    fontSize: 14,
  },
  createButton: {
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
  },
});
