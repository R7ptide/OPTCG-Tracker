import {
  View,
  Text,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { getAllLeaders, type MasterCardRow } from "../repositories/cards";
import { radius, spacing, typography, type ThemeColors } from "../constants/theme";
import { useSettings } from "../contexts/SettingsContext";
import { cardImageUrl } from "../utils/cards";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (leader: MasterCardRow) => void;
};

export default function LeaderPicker({ visible, onClose, onSelect }: Props) {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [query, setQuery] = useState("");

  const leaders = useMemo(() => (visible ? getAllLeaders() : []), [visible]);

  const results = useMemo(() => {
    if (!query.trim()) return leaders;
    const needle = query.trim().toLowerCase();
    return leaders.filter((leader) =>
      (leader.name ?? "").toLowerCase().includes(needle),
    );
  }, [leaders, query]);

  const handleSelect = (leader: MasterCardRow) => {
    onSelect(leader);
    setQuery("");
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Leader</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.placeholder} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search leader name..."
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons
                name="close-circle"
                size={18}
                color={colors.placeholder}
              />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{
            padding: spacing.sm,
            paddingBottom: spacing.xxl,
          }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.cardSlot}
              onPress={() => handleSelect(item)}
            >
              <Image
                source={{
                  uri: cardImageUrl(item.id),
                }}
                style={styles.cardImage}
                resizeMode="contain"
              />
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No leaders found.</Text>
          }
        />
      </View>
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
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: colors.surface,
      margin: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      color: colors.text,
      paddingVertical: spacing.sm,
      fontSize: typography.sizes.md,
    },
    cardSlot: {
      flex: 1,
      margin: spacing.xs,
      alignItems: "center",
    },
    cardImage: {
      width: "100%",
      aspectRatio: 0.7,
      borderRadius: radius.sm,
    },
    cardName: {
      color: colors.text,
      fontSize: typography.sizes.xs,
      marginTop: spacing.xs,
      textAlign: "center",
    },
    empty: { color: colors.textMuted, textAlign: "center", marginTop: 50 },
  });
