import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import CardImage from "./CardImage";
import EffectText from "./EffectText";
import { useMemo } from "react";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  CARD_COLOR_HEX,
  getRarityCode,
  getStatTiles,
  getTraitsLine,
} from "../utils/cardDisplay";
import { useSettings } from "../contexts/SettingsContext";

export type CollectionCard = {
  id: string;
  name: string;
  color: string;
  type: string;
  rarity: string;
  attribute: string;
  traits: string;
  cost: number | null;
  power: number | null;
  counter: number | null;
  // "" when the card has no text (or it was never synced).
  effect: string;
  trigger: string;
  blockNumber: number | null;
  imageUrl: string;
  owned: boolean;
  quantity: number;
  playsetTotal: number;
};

type Props = {
  card: CollectionCard | null;
  onClose: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  quantityLabel?: string;
  // Hides the +/- controls for cards shown for reading only (e.g. a deck's leader).
  readOnly?: boolean;
};

export default function CardModal({
  card,
  onClose,
  onIncrement,
  onDecrement,
  quantityLabel = "Owned",
  readOnly = false,
}: Props) {
  const { colors } = useSettings();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <Modal
      visible={!!card}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        {card && (
          <ScrollView
            style={StyleSheet.absoluteFill}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tapping the empty space around the card closes the modal; the
                inner Pressable swallows taps on the card itself. */}
            <Pressable
              style={[
                styles.scrollTapArea,
                {
                  paddingTop: insets.top + spacing.xxl,
                  paddingBottom: insets.bottom + spacing.xl,
                },
              ]}
              onPress={onClose}
            >
              <Pressable style={styles.modalContent} onPress={() => {}}>
                <CardImage
                  cardId={card.id}
                  fallbackUrl={card.imageUrl}
                  placeholder={
                    card.type === "Leader"
                      ? require("../assets/images/leader-card-back.png")
                      : require("../assets/images/card-back.png")
                  }
                  transition={200}
                  style={styles.modalLargeImage}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
                {!readOnly && (
                  <View style={styles.controlsContainer}>
                    <TouchableOpacity
                      style={styles.circleBtn}
                      onPress={onDecrement}
                    >
                      <Text style={styles.circleBtnText}>-</Text>
                    </TouchableOpacity>
                    <View style={styles.qtyDisplay}>
                      <Text style={styles.qtyValue}>{card.quantity}</Text>
                      <Text style={styles.qtyLabel}>{quantityLabel}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.circleBtn}
                      onPress={onIncrement}
                    >
                      <Text style={styles.circleBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.infoCard}>
                  <View style={styles.typePill}>
                    <Text style={styles.typePillText}>{card.type}</Text>
                  </View>
                  <Text style={styles.infoName}>{card.name}</Text>
                  {getTraitsLine(card.traits) !== "" && (
                    <Text style={styles.infoTraits}>
                      {getTraitsLine(card.traits)}
                    </Text>
                  )}

                  <View style={styles.tileGrid}>
                    {getStatTiles(card).map((tile) => (
                      <View key={tile.label} style={styles.tile}>
                        <Text style={styles.tileLabel}>{tile.label}</Text>
                        <View style={styles.tileValueRow}>
                          {tile.colors?.map((name) => (
                            <View
                              key={name}
                              style={[
                                styles.colorDot,
                                { backgroundColor: CARD_COLOR_HEX[name] },
                              ]}
                            />
                          ))}
                          <Text style={styles.tileValue}>{tile.value}</Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {card.effect !== "" && (
                    <View style={styles.textBlock}>
                      <EffectText text={card.effect} style={styles.bodyText} />
                    </View>
                  )}
                  {card.trigger !== "" && (
                    <View style={styles.textBlock}>
                      <EffectText text={card.trigger} style={styles.bodyText} />
                    </View>
                  )}

                  <View style={styles.infoFooter}>
                    <View style={styles.idPill}>
                      <Text style={styles.idPillText}>{card.id}</Text>
                    </View>
                    <View style={styles.footerRight}>
                      {getRarityCode(card.rarity) !== "" && (
                        <Text style={styles.rarityText}>
                          {getRarityCode(card.rarity)}
                        </Text>
                      )}
                      {card.blockNumber !== null && (
                        <View style={styles.blockBadge}>
                          <Text style={styles.blockBadgeText}>
                            {card.blockNumber}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Price</Text>
                  <Text style={styles.mutedText}>Coming soon</Text>
                </View>
              </Pressable>
            </Pressable>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    scrollContent: { flexGrow: 1 },
    scrollTapArea: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: { width: "85%", alignItems: "center" },
    section: {
      alignSelf: "stretch",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    infoCard: {
      alignSelf: "stretch",
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    typePill: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.textMuted,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    typePillText: {
      color: colors.text,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    infoName: {
      color: colors.text,
      fontSize: typography.sizes.xxl,
      fontWeight: "bold",
      marginTop: spacing.sm,
    },
    infoTraits: {
      color: colors.textMuted,
      fontSize: typography.sizes.sm,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 2,
    },
    tileGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    tile: {
      flexBasis: "48%",
      flexGrow: 1,
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    tileLabel: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: 2,
    },
    tileValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    tileValue: {
      color: colors.text,
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
      flexShrink: 1,
    },
    colorDot: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textBlock: {
      backgroundColor: colors.surfaceAlt,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginTop: spacing.sm,
    },
    infoFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.md,
    },
    idPill: {
      borderWidth: 1,
      borderColor: colors.textMuted,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
    },
    idPillText: {
      color: colors.text,
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
    },
    footerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    rarityText: {
      color: colors.text,
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
    },
    blockBadge: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.text,
      justifyContent: "center",
      alignItems: "center",
    },
    blockBadgeText: {
      color: colors.textInverse,
      fontSize: typography.sizes.md,
      fontWeight: "bold",
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      fontWeight: "bold",
      textTransform: "uppercase",
      marginBottom: spacing.xs,
    },
    bodyText: {
      color: colors.text,
      fontSize: typography.sizes.md,
      lineHeight: 20,
    },
    mutedText: { color: colors.placeholder, fontSize: typography.sizes.md },
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
