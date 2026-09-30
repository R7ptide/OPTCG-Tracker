import { forwardRef } from "react";
import { View, Text, StyleSheet, Image as RNImage } from "react-native";
import { Image } from "expo-image";
import { resolveCardImage } from "../utils/cards";
import { radius, type ThemeColors } from "../constants/theme";

export type ExportCard = {
  id: string;
  imageUrl: string | null;
  quantity: number;
};

type Props = {
  deckName: string;
  leaderName: string | null;
  cards: ExportCard[];
  colors: ThemeColors;
};

const CANVAS_WIDTH = 1080;
const COLUMNS = 5;
const CELL_GAP = 16;
const CELL_WIDTH =
  (CANVAS_WIDTH - 48 * 2 - CELL_GAP * (COLUMNS - 1)) / COLUMNS;

const DeckExportView = forwardRef<View, Props>(
  ({ deckName, leaderName, cards, colors }, ref) => {
    const styles = createStyles(colors);

    return (
      <View ref={ref} collapsable={false} style={styles.canvas}>
        <View style={styles.header}>
          <RNImage
            source={require("../assets/images/icon.png")}
            style={styles.appIcon}
          />
          <View style={styles.headerText}>
            <Text style={styles.appName}>R7-Pose</Text>
            <Text style={styles.deckName} numberOfLines={1}>
              {deckName}
            </Text>
            {leaderName && (
              <Text style={styles.leaderName} numberOfLines={1}>
                {leaderName}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.grid}>
          {cards.map((card) => (
            <View key={card.id} style={styles.cardSlot}>
              <Image
                source={{ uri: resolveCardImage(card.id, card.imageUrl) }}
                style={styles.cardImage}
                contentFit="contain"
              />
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>x{card.quantity}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  },
);

DeckExportView.displayName = "DeckExportView";

export default DeckExportView;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    canvas: {
      width: CANVAS_WIDTH,
      backgroundColor: colors.bg,
      padding: 48,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginBottom: 32,
    },
    appIcon: { width: 56, height: 56, borderRadius: 12 },
    headerText: { flex: 1 },
    appName: {
      color: colors.textMuted,
      fontSize: 18,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    deckName: {
      color: colors.text,
      fontSize: 32,
      fontWeight: "bold",
    },
    leaderName: {
      color: colors.textMuted,
      fontSize: 20,
      marginTop: 2,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: CELL_GAP,
    },
    cardSlot: {
      width: CELL_WIDTH,
      aspectRatio: 0.7,
      borderRadius: radius.sm,
    },
    cardImage: { width: "100%", height: "100%", borderRadius: radius.sm },
    qtyBadge: {
      position: "absolute",
      bottom: 6,
      right: 6,
      backgroundColor: colors.overlayBadge,
      borderRadius: radius.sm,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    qtyText: { color: colors.text, fontSize: 16, fontWeight: "bold" },
  });
