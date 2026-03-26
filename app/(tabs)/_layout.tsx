import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#334155',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#a855f7',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color }) => <Ionicons name="brain" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tournaments"
        options={{
          title: 'Tournaments',
          tabBarIcon: ({ color }) => <Ionicons name="trophy" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="multiplayer"
        options={{
          title: 'Multiplayer',
          tabBarIcon: ({ color }) => <Ionicons name="globe" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="daily"
        options={{
          title: 'Daily',
          tabBarIcon: ({ color }) => <Ionicons name="calendar" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ color }) => <Ionicons name="ribbon" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
