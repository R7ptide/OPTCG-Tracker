import { Stack } from "expo-router";
import { TouchableOpacity, Text, View } from "react-native";
import { createContext, useState, useEffect } from "react";
import { initDB } from "../database"; // Import the database initializer!

export const SettingsContext = createContext();

export default function Layout() {
  const [showMissing, setShowMissing] = useState(false);

  // ⚠️ Run the database initialization when the app starts
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
          headerRight: () => (
            <View
              style={{ flexDirection: "row", gap: 15, alignItems: "center" }}
            >
              {/* Only the Show/Hide toggle remains */}
              <TouchableOpacity onPress={() => setShowMissing(!showMissing)}>
                <Text
                  style={{ color: "#4ade80", fontSize: 16, fontWeight: "bold" }}
                >
                  {showMissing ? "Hide Missing" : "Show All"}
                </Text>
              </TouchableOpacity>
            </View>
          ),
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
