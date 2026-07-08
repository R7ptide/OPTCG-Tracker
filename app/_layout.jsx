import { Stack, router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { initDB } from "../database";
import { colors } from "../constants/theme";

const SettingsContext = createContext(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
};

const SettingsHeaderButton = () => (
  <TouchableOpacity
    onPress={() => router.push("/settings")}
    style={{ paddingRight: 10 }}
  >
    <Ionicons name="settings-outline" size={24} color={colors.text} />
  </TouchableOpacity>
);

export default function Layout() {
  const [showMissing, setShowMissing] = useState(false);

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
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "R7-Pose",
            headerRight: SettingsHeaderButton,
          }}
        />
        <Stack.Screen
          name="collection/index"
          options={{
            title: "Collections",
            headerRight: SettingsHeaderButton,
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
      </Stack>
    </SettingsContext.Provider>
  );
}
