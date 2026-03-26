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
import { Achievement, AchievementCategory } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

const CATEGORY_META: Record<string, { label: string; emoji: string; borderColor: string; textColor: string; bgColor: string }> = {
  progression:  { label: 'Progression', emoji: '🏃', borderColor: '#0ea5e9', textColor: '#38bdf8', bgColor: 'rgba(14,165,233,0.15)' },
  skill:        { label: 'Skill',        emoji: '⚡', borderColor: '#eab308', textColor: '#facc15', bgColor: 'rgba(234,179,8,0.15)' },
  streaks:      { label: 'Streaks',      emoji: '🔥', borderColor: '#f97316', textColor: '#fb923c', bgColor: 'rgba(249,115,22,0.15)' },
  streak:       { label: 'Streaks',      emoji: '🔥', borderColor: '#f97316', textColor: '#fb923c', bgColor: 'rgba(249,115,22,0.15)' },
  competitive:  { label: 'Competitive',  emoji: '🏆', borderColor: '#a855f7', textColor: '#c084fc', bgColor: 'rgba(168,85,247,0.15)' },
  explorer:     { label: 'Explorer',     emoji: '🔭', borderColor: '#14b8a6', textColor: '#2dd4bf', bgColor: 'rgba(20,184,166,0.15)' },
  special:      { label: 'Special',      emoji: '🎉', borderColor: '#ec4899', textColor: '#f472b6', bgColor: 'rgba(236,72,153,0.15)' },
};

const CATEGORIES = ['all', 'progression', 'skill', 'streak', 'competitive', 'explorer', 'special'];

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
}

function AchievementBadge({ achievement, unlocked, unlockedAt }: AchievementBadgeProps) {
  const meta = CATEGORY_META[achievement.category] || CATEGORY_META.special;

  return (
    <View style={[styles.achievementCard, unlocked ? styles.achievementUnlocked : styles.achievementLocked]}>
      <View style={[styles.achievementIcon, { borderColor: unlocked ? meta.borderColor : '#334155', backgroundColor: unlocked ? meta.bgColor : 'rgba(30,41,59,0.4)' }]}>
        <Text style={styles.achievementIconText}>
          {unlocked ? (achievement.icon || meta.emoji) : '🔒'}
        </Text>
      </View>
      <View style={styles.achievementContent}>
        <View style={styles.achievementTitleRow}>
          <Text style={[styles.achievementName, !unlocked && styles.textDim]}>{achievement.name}</Text>
          <View style={[styles.categoryBadge, { borderColor: unlocked ? meta.borderColor : '#334155', backgroundColor: unlocked ? meta.bgColor : 'transparent' }]}>
            <Text style={[styles.categoryBadgeText, { color: unlocked ? meta.textColor : '#64748b' }]}>
              {meta.label}
            </Text>
          </View>
        </View>
        <Text style={[styles.achievementDesc, !unlocked && styles.textDim]} numberOfLines={2}>
          {achievement.description}
        </Text>
        {unlocked && unlockedAt && (
          <Text style={styles.unlockedAt}>
            Unlocked {new Date(unlockedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Text style={styles.achievementPoints}>{achievement.points}pt</Text>
    </View>
  );
}

export default function AchievementsScreen() {
  const { activeProfile } = useApp();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [profileAchievements, setProfileAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [all, unlocked] = await Promise.all([
          api.getAchievements(),
          activeProfile ? api.getProfileAchievements(activeProfile.id) : Promise.resolve([]),
        ]);
        setAchievements(all);
        setProfileAchievements(unlocked);
      } catch { }
      finally { setLoading(false); }
    };
    load();
  }, [activeProfile?.id]);

  const unlockedIds = new Set(profileAchievements.map((pa: any) => pa.achievement_id));
  const totalPoints = profileAchievements.reduce((sum: number, pa: any) => sum + (pa.achievement?.points || 0), 0);

  const filtered = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  const sortedFiltered = [...filtered].sort((a, b) => {
    const au = unlockedIds.has(a.id) ? 0 : 1;
    const bu = unlockedIds.has(b.id) ? 0 : 1;
    return au - bu || b.points - a.points;
  });

  const unlockedCount = filtered.filter(a => unlockedIds.has(a.id)).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner message="Loading achievements..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.screenTitle}>Achievements</Text>
            <Text style={styles.screenSubtitle}>
              {activeProfile
                ? `${unlockedIds.size}/${achievements.length} unlocked · ${totalPoints} points`
                : 'Select a profile to see your achievements'}
            </Text>
          </View>
          {activeProfile && (
            <View style={styles.totalPoints}>
              <Text style={styles.totalPointsValue}>{totalPoints}</Text>
              <Text style={styles.totalPointsLabel}>pts</Text>
            </View>
          )}
        </View>

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsContainer}
        >
          {CATEGORIES.map(cat => {
            const meta = cat === 'all' ? null : CATEGORY_META[cat];
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.8}
                style={[styles.chip, activeCategory === cat ? styles.chipActive : styles.chipInactive]}
              >
                <Text style={[styles.chipText, activeCategory === cat ? styles.chipTextActive : styles.chipTextInactive]}>
                  {cat === 'all' ? '✨ All' : `${meta?.emoji} ${meta?.label}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.countText}>{unlockedCount}/{filtered.length} in this category</Text>

        {/* Achievements list */}
        <View style={styles.achievementsList}>
          {sortedFiltered.map(a => {
            const pa = profileAchievements.find((pa: any) => pa.achievement_id === a.id);
            return (
              <AchievementBadge
                key={a.id}
                achievement={a}
                unlocked={unlockedIds.has(a.id)}
                unlockedAt={pa?.unlocked_at}
              />
            );
          })}
          {sortedFiltered.length === 0 && (
            <Text style={styles.emptyText}>No achievements in this category.</Text>
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
    gap: 14,
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
  totalPoints: {
    alignItems: 'flex-end',
  },
  totalPointsValue: {
    color: '#f59e0b',
    fontSize: 28,
    fontWeight: '800',
  },
  totalPointsLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: -2,
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  chipInactive: {
    borderColor: '#334155',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#fff',
  },
  chipTextInactive: {
    color: '#94a3b8',
  },
  countText: {
    color: '#64748b',
    fontSize: 12,
  },
  achievementsList: {
    gap: 10,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  achievementUnlocked: {
    backgroundColor: 'rgba(30,41,59,0.7)',
    borderColor: '#334155',
  },
  achievementLocked: {
    backgroundColor: 'rgba(15,23,42,0.4)',
    borderColor: 'rgba(51,65,85,0.4)',
    opacity: 0.6,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  achievementIconText: {
    fontSize: 20,
  },
  achievementContent: {
    flex: 1,
    gap: 4,
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  achievementName: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  achievementDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 17,
  },
  unlockedAt: {
    color: '#64748b',
    fontSize: 10,
  },
  achievementPoints: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
  textDim: {
    opacity: 0.6,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 14,
  },
});
