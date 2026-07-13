import { Stack } from "expo-router";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { initDB } from "../database";
import { darkColors, lightColors, type ThemeColors } from "../constants/theme";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { getSetting, setSetting } from "../repositories/settings";

const SHOW_MISSING_KEY = "showMissing";
const LIGHT_MODE_KEY = "isLightMode";

type SettingsContextValue = {
  showMissing: boolean;
  setShowMissing: (val: boolean) => void;
  isLightMode: boolean;
  toggleLightMode: () => void;
  colors: ThemeColors;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
};

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

        {/*<Stack.Screen name="decks" options={{ title: "Deck Builder" }} />*/}

        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </SettingsContext.Provider>
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
