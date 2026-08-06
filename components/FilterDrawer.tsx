import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { useMemo } from "react";
import { FILTER_GROUPS, type FilterKey } from "../constants/gameData";
import { radius, spacing, typography, type ThemeColors } from "../constants/theme";
import { useSettings } from "../contexts/SettingsContext";
import type { Filters } from "../hooks/useFilters";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setSearchName: (val: string) => void;
  toggle: (key: FilterKey, value: string) => void;
};

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  setSearchName,
  toggle,
}: Props) {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Modal visible={isOpen} transparent={true} animationType="fade">
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={styles.drawerCloseArea} onPress={onClose} />
        <View style={styles.drawerContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.drawerTitle}>Filters</Text>

            <Text style={styles.filterLabel}>Card Name</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="e.g. Zoro"
              placeholderTextColor={colors.placeholder}
              value={filters.searchName}
              onChangeText={setSearchName}
            />

            {FILTER_GROUPS.map(({ key, label, options }) => (
              <View key={key}>
                <Text style={styles.filterLabel}>{label}</Text>
                <View style={styles.chipRow}>
                  {options.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.chip,
                        filters[key].includes(opt) && styles.chipActive,
                      ]}
                      onPress={() => toggle(key, opt)}
                    >
                      <Text style={styles.chipText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.applyButton} onPress={onClose}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  drawerOverlay: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.overlaySoft,
  },
  drawerCloseArea: { flex: 1 },
  drawerContent: {
    width: "80%",
    backgroundColor: colors.nav,
    padding: spacing.lg,
    paddingTop: 60,
    borderLeftWidth: 1,
    borderColor: colors.border,
  },
  drawerTitle: {
    color: colors.text,
    fontSize: typography.sizes.xxl,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.surfaceAlt,
    color: colors.text,
    padding: 12,
    borderRadius: radius.sm,
    marginBottom: spacing.lg,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceAlt,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primaryBorder },
  chipText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: typography.sizes.xs,
  },
  applyButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  applyButtonText: {
    color: colors.text,
    fontWeight: "bold",
    fontSize: typography.sizes.lg,
  },
});
