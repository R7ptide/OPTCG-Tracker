import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../app/_layout";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../constants/theme";
import { useGameData } from "../contexts/GameDataContext";

type FormatPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (format: string) => void;
};

export default function FormatPicker({
  visible,
  onClose,
  onSelect,
}: FormatPickerProps) {
  const { mainSets, extraBoosters } = useGameData();
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFormats = useMemo(() => {
    const predefinedFormats = [
      "Legacy",
      ...[...mainSets].reverse(),
      ...[...extraBoosters].reverse(),
    ];

    const query = searchQuery.toLowerCase().trim();
    if (!query) return predefinedFormats;
    return predefinedFormats.filter((f) => f.toLowerCase().includes(query));
  }, [mainSets, extraBoosters, searchQuery]);

  const handleSelect = (format: string) => {
    onSelect(format);
    setSearchQuery("");
  };

  const handleClose = () => {
    onClose();
    setSearchQuery("");
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Format</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search or type format..."
            placeholderTextColor={colors.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>

        <FlatList
          data={filteredFormats}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.option}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.optionText}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      color: colors.text,
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
    },
    closeButton: { padding: spacing.xs },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: colors.surface,
      margin: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      fontSize: typography.sizes.md,
      paddingVertical: spacing.md,
    },
    list: { paddingBottom: spacing.xxl },
    option: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionText: {
      color: colors.text,
      fontSize: typography.sizes.md,
    },
    customOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: "rgba(59, 130, 246, 0.1)",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    customOptionText: {
      color: colors.primary,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
  });
