import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { ThemeProvider, useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';
import { StatusBar } from 'expo-status-bar';
import { migrateHistory } from '../services/history';

function Statusbar() {
  const { mode } = useTheme();
  return <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
}

function MainTabs() {
  const { colors } = useTheme();

  useEffect(() => {
    migrateHistory().catch(() => {});
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <Icon name="scan-line" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="generate"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus-circle" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Icon name="clock" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen name="result" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Statusbar />
      <MainTabs />
    </ThemeProvider>
  );
}
