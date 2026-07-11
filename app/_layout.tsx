import { Stack } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { initDB } from "../database";
import { colors } from "../constants/theme";

type SettingsContextValue = {
  showMissing: boolean;
  setShowMissing: (val: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export const useSettings = (): SettingsContextValue => {
  const ctx = useContext(SettingsContext);
  if (!ctx)
    throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
};

export default function Layout() {
  const [showMissing, setShowMissing] = useState(true);

  useEffect(() => {
    initDB();
  }, []);

  return (
    <SettingsContext.Provider value={{ showMissing, setShowMissing }}>
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

        {/*<Stack.Screen
          name="tournaments"
          options={{
            title: "My Tournaments",
          }}
        />

        <Stack.Screen name="decks" options={{ title: "Deck Builder" }} />*/}

        <Stack.Screen name="settings" options={{ title: "Settings" }} />
      </Stack>
    </SettingsContext.Provider>
  );
}
