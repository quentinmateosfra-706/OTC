import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { colors, spacing, radius, typography } from '@/constants/theme';
import { formatDuration } from '@/utils/time.formatter';

interface Props {
  rank: number;
  displayName: string;
  categoryCode: string;
  durationSeconds: number;
  score: number;
  isCurrentUser: boolean;
  isNewRecord: boolean;
}

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderboardEntry({
  rank,
  displayName,
  categoryCode,
  durationSeconds,
  score,
  isCurrentUser,
  isNewRecord,
}: Props) {
  const medal = MEDALS[rank];

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlighted]}>
      <View style={styles.rankCol}>
        {medal ? (
          <AppText variant="heading" style={styles.medal}>{medal}</AppText>
        ) : (
          <AppText variant="body" color={colors.textSecondary} style={styles.rankNum}>
            {rank}
          </AppText>
        )}
      </View>

      <View style={styles.nameCol}>
        <AppText variant="body" color={colors.textPrimary} numberOfLines={1}>
          {displayName}
        </AppText>
        <View style={styles.badgeRow}>
          <View style={styles.catBadge}>
            <AppText variant="caption" color={colors.textMuted}>{categoryCode}</AppText>
          </View>
          {isNewRecord && (
            <View style={styles.prBadge}>
              <AppText variant="caption" color={colors.black} style={styles.prText}>PR</AppText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.rightCol}>
        <AppText variant="body" color={colors.textPrimary} style={styles.time}>
          {formatDuration(durationSeconds)}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {score} pts
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  rowHighlighted: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: radius.sm,
    marginHorizontal: spacing.xs,
    backgroundColor: colors.surfaceElevated,
  },
  rankCol: {
    width: 40,
    alignItems: 'center',
  },
  rankNum: {
    ...typography.body,
  },
  medal: {
    fontSize: 20,
  },
  nameCol: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: spacing.xs,
  },
  catBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  prBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  prText: {
    fontWeight: 'bold',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  time: {
    fontVariant: ['tabular-nums'],
  },
});
