import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

interface TimerBarProps {
  secondsLeft: number;
  totalSeconds: number;
  percentage: number;
}

export default function TimerBar({ secondsLeft, totalSeconds, percentage }: TimerBarProps) {
  const widthAnim = useRef(new Animated.Value(percentage)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percentage,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const isUrgent = secondsLeft <= 5;
  const barColor = isUrgent ? '#ef4444' : secondsLeft <= 10 ? '#f59e0b' : '#7c3aed';
  const textColor = isUrgent ? '#ef4444' : secondsLeft <= 10 ? '#f59e0b' : '#a855f7';

  return (
    <View style={styles.container}>
      <View style={styles.barBackground}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: widthAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={[styles.timerText, { color: textColor }]}>
        {secondsLeft}s
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'right',
  },
});
