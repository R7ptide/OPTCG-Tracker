import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
} from "react-native";
import { colors, radius, spacing, typography } from "../constants/theme";

export default function CardModal({ card, onClose, onIncrement, onDecrement }) {
  return (
    <Modal visible={!!card} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        {card && (
          <View style={styles.modalContent}>
            <Image
              source={{ uri: card.imageUrl }}
              style={styles.modalLargeImage}
              resizeMode="contain"
            />
            <View style={styles.controlsContainer}>
              <TouchableOpacity style={styles.circleBtn} onPress={onDecrement}>
                <Text style={styles.circleBtnText}>-</Text>
              </TouchableOpacity>
              <View style={styles.qtyDisplay}>
                <Text style={styles.qtyValue}>{card.quantity}</Text>
                <Text style={styles.qtyLabel}>Owned</Text>
              </View>
              <TouchableOpacity style={styles.circleBtn} onPress={onIncrement}>
                <Text style={styles.circleBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "85%", alignItems: "center" },
  modalLargeImage: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 50,
    gap: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  circleBtnText: {
    color: colors.text,
    fontSize: typography.sizes.display,
    fontWeight: "bold",
    lineHeight: 35,
  },
  qtyDisplay: { alignItems: "center", width: 60 },
  qtyValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
  },
  qtyLabel: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
});
