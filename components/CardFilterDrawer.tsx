import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useMemo } from "react";
import { radius, spacing, typography, type ThemeColors } from "../constants/theme";
import { useSettings } from "../contexts/SettingsContext";

export type CardFilterGroup = {
  key: string;
  label: string;
  options: readonly string[];
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  groups: readonly CardFilterGroup[];
  isActive: (key: string, option: string) => boolean;
  onToggle: (key: string, option: string) => void;
};

export default function CardFilterDrawer({
  isOpen,
  onClose,
  groups,
  isActive,
  onToggle,
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

            {groups.map(({ key, label, options }) => (
              <View key={key}>
                <Text style={styles.filterLabel}>{label}</Text>
                <View style={styles.chipRow}>
                  {options.map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[
                        styles.chip,
                        isActive(key, opt) && styles.chipActive,
                      ]}
                      onPress={() => onToggle(key, opt)}
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
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primaryBorder,
    },
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
