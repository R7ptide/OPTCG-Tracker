import { Stack } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { initDB } from "../database";
import { darkColors, lightColors } from "../constants/theme";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { GameDataProvider } from "../contexts/GameDataContext";
import { SettingsContext } from "../contexts/SettingsContext";
import { getSetting, setSetting } from "../repositories/settings";

const SHOW_MISSING_KEY = "showMissing";
const LIGHT_MODE_KEY = "isLightMode";

type PersistedSettings = { showMissing: boolean; isLightMode: boolean };

const DEFAULT_SETTINGS: PersistedSettings = {
  showMissing: true,
  isLightMode: false,
};

function LayoutContent() {
  const [settings, setSettings] = useState<PersistedSettings>(DEFAULT_SETTINGS);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<Error | null>(null);

  const { showMissing, isLightMode } = settings;
  const colors = isLightMode ? lightColors : darkColors;

  const setShowMissing = (val: boolean) => {
    setSettings((prev) => ({ ...prev, showMissing: val }));
    setSetting(SHOW_MISSING_KEY, String(val));
  };

  const toggleLightMode = () => {
    setSettings((prev) => {
      const next = { ...prev, isLightMode: !prev.isLightMode };
      setSetting(LIGHT_MODE_KEY, String(next.isLightMode));
      return next;
    });
  };

  const contextValue = useMemo(
    () => ({
      showMissing,
      setShowMissing,
      isLightMode,
      toggleLightMode,
      colors,
    }),
    [showMissing, isLightMode, colors],
  );

  useEffect(() => {
    try {
      initDB();
      const storedShowMissing = getSetting(SHOW_MISSING_KEY);
      const storedLightMode = getSetting(LIGHT_MODE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time DB hydration on mount, not derived render state
      setSettings({
        showMissing:
          storedShowMissing !== null
            ? storedShowMissing === "true"
            : DEFAULT_SETTINGS.showMissing,
        isLightMode:
          storedLightMode !== null
            ? storedLightMode === "true"
            : DEFAULT_SETTINGS.isLightMode,
      });
      setDbReady(true);
    } catch (err) {
      setDbError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  if (dbError) throw dbError;

  if (!dbReady) {
    return (
      <View style={[styles.splash, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <GameDataProvider>
      <SettingsContext.Provider value={contextValue}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.nav },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              title: "R7-Pose",
            }}
          />
          <Stack.Screen
            name="collection/index"
            options={{
              title: "My Collection",
            }}
          />
          <Stack.Screen
            name="collection/starters"
            options={{ title: "Starter Decks" }}
          />
          <Stack.Screen
            name="collection/[set_id]"
            options={{ title: "Set Details" }}
          />
          <Stack.Screen
            name="collection/search"
            options={{ title: "Search Cards" }}
          />
          <Stack.Screen
            name="tournaments/index"
            options={{
              title: "My Tournaments",
            }}
          />
          <Stack.Screen
            name="tournaments/new"
            options={{ title: "New Tournament" }}
          />
          <Stack.Screen
            name="tournaments/[id]"
            options={{ title: "Tournament" }}
          />
          <Stack.Screen
            name="tournaments/stats"
            options={{ title: "Statistics" }}
          />
          <Stack.Screen
            name="tournaments/search"
            options={{ title: "Search Tournaments" }}
          />

          {/*<Stack.Screen name="decks" options={{ title: "Deck Builder" }} />*/}

          <Stack.Screen
            name="settings/settings"
            options={{ title: "Settings" }}
          />
          <Stack.Screen
            name="settings/whats-new"
            options={{ title: "What's New?" }}
          />
        </Stack>
      </SettingsContext.Provider>
    </GameDataProvider>
  );
}

export default function Layout() {
  return (
    <ErrorBoundary>
      <LayoutContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
