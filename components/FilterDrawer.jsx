import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { FILTER_GROUPS } from "../constants/gameData";
import { colors, radius, spacing, typography } from "../constants/theme";

export default function FilterDrawer({
  isOpen,
  onClose,
  showMissing,
  setShowMissing,
  filters,
  setSearchName,
  toggle,
}) {
  return (
    <Modal visible={isOpen} transparent={true} animationType="fade">
      <View style={styles.drawerOverlay}>
        <TouchableOpacity style={styles.drawerCloseArea} onPress={onClose} />
        <View style={styles.drawerContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.drawerTitle}>Filters</Text>

            <TouchableOpacity
              style={[styles.toggleButton, showMissing && styles.toggleActive]}
              onPress={() => setShowMissing(!showMissing)}
            >
              <Text style={styles.toggleButtonText}>
                {showMissing ? "Missing: SHOWN" : "Missing: HIDDEN"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

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

const styles = StyleSheet.create({
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
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
  toggleButton: {
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleActive: { borderColor: colors.accent },
  toggleButtonText: { color: colors.text, fontWeight: "bold" },
  applyButton: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.sm,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  applyButtonText: {
    color: colors.textInverse,
    fontWeight: "bold",
    fontSize: typography.sizes.lg,
  },
});
