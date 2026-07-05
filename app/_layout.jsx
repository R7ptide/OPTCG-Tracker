import { Stack } from "expo-router";
import { createContext, useState, useEffect } from "react";
import { initDB } from "../database";

export const SettingsContext = createContext();

export default function Layout() {
  const [showMissing, setShowMissing] = useState(false);

  useEffect(() => {
    initDB();
  }, []);

  return (
    <SettingsContext.Provider value={{ showMissing, setShowMissing }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#1a1a1a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "One Piece Vault" }} />
        <Stack.Screen
          name="collection/index"
          options={{ title: "Collections" }}
        />
        <Stack.Screen
          name="collection/starters"
          options={{ title: "Starter Decks" }}
        />
        <Stack.Screen
          name="collection/[set_id]"
          options={{ title: "Set Details" }}
        />
      </Stack>
    </SettingsContext.Provider>
  );
}
