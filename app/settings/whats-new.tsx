import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useMemo } from "react";
import Constants from "expo-constants";
import { useSettings } from "../../contexts/SettingsContext";
import {
  radius,
  spacing,
  typography,
  type ThemeColors,
} from "../../constants/theme";
import { CHANGELOG, ROADMAP, splitReleases } from "../../constants/changelog";

export default function WhatsNewScreen() {
  const { colors } = useSettings();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const appVersion = Constants.expoConfig?.version || "1.0.0";

  const { current, previous } = useMemo(
    () => splitReleases(appVersion, CHANGELOG),
    [appVersion],
  );

  const renderFeatureRow = (
    itemText: string,
    index: number,
    isNext: boolean,
  ) => {
    const [title, ...descParts] = itemText.split(":");
    const description = descParts.join(":").trim();

    return (
      <View
        key={index}
        style={isNext ? styles.roadmapItem : styles.featureCard}
      >
        <View style={styles.textContainer}>
          <Text style={styles.featureTitle}>{title.trim()}</Text>
          {description ? (
            <Text style={isNext ? styles.roadmapDesc : styles.featureDesc}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{"What's New"}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>v{appVersion}</Text>
        </View>
      </View>

      {current && current.items.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Added</Text>
          {current.items.map((item, index) =>
            renderFeatureRow(item, index, false),
          )}
        </View>
      )}

      {ROADMAP.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{"What's Next"}</Text>
          {ROADMAP.map((item, index) => renderFeatureRow(item, index, true))}
        </View>
      )}

      {previous.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previous Versions</Text>
          {previous.map((release) => (
            <View key={release.version} style={styles.section}>
              <View style={styles.releaseHeader}>
                <Text style={styles.releaseVersion}>v{release.version}</Text>
                <Text style={styles.releaseDate}>{release.date}</Text>
              </View>
              {release.items.map((item, index) =>
                renderFeatureRow(item, index, false),
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, gap: spacing.xl },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    title: {
      fontSize: typography.sizes.xxl,
      fontWeight: "bold",
      color: colors.text,
    },
    badge: {
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.pill,
    },
    badgeText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: typography.sizes.sm,
    },
    section: { gap: spacing.md },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: "bold",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    releaseHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: spacing.sm,
    },
    releaseVersion: {
      fontSize: typography.sizes.xl,
      fontWeight: "bold",
      color: colors.text,
    },
    releaseDate: {
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
    },
    textContainer: { flex: 1 },
    featureCard: {
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    featureTitle: {
      fontSize: typography.sizes.md,
      fontWeight: "bold",
      color: colors.text,
    },
    featureDesc: {
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    roadmapItem: {
      backgroundColor: colors.surfaceAlt,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    roadmapDesc: {
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      marginTop: 2,
    },
  });
