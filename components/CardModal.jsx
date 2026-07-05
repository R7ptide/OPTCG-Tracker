import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
} from "react-native";

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
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: { width: "85%", alignItems: "center" },
  modalLargeImage: {
    width: "100%",
    aspectRatio: 0.7,
    borderRadius: 15,
    marginBottom: 30,
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 50,
    gap: 30,
    borderWidth: 1,
    borderColor: "#333",
  },
  circleBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6b21a8",
    justifyContent: "center",
    alignItems: "center",
  },
  circleBtnText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
    lineHeight: 35,
  },
  qtyDisplay: { alignItems: "center", width: 60 },
  qtyValue: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  qtyLabel: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
});
