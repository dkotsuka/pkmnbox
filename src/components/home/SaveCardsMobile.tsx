import { StyleSheet, Text, View } from "react-native";

import type { DetectedSaveFile } from "@/utils/saveSyncService";

interface SaveCardsMobileProps {
  saves: DetectedSaveFile[];
}

export function SaveCardsMobile({ saves }: SaveCardsMobileProps) {
  return (
    <View style={styles.mobileCardsList}>
      {saves.map((saveFile) => {
        const hasPlayTime =
          saveFile.playTimeHours != null && saveFile.playTimeMinutes != null;
        const moneyText =
          saveFile.money != null
            ? saveFile.money.toLocaleString("en-US")
            : "unknown";
        const playTimeText = hasPlayTime
          ? `${saveFile.playTimeHours}h ${String(saveFile.playTimeMinutes).padStart(2, "0")}m`
          : "unknown";
        const seenText = saveFile.seenCount ?? "unknown";
        const ownedText = saveFile.ownedCount ?? "unknown";

        return (
          <View
            key={saveFile.uri}
            style={[styles.saveCard, styles.saveCardMobile]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{saveFile.name}</Text>
                {saveFile.generationLabel ? (
                  <View style={styles.generationChip}>
                    <Text style={styles.generationChipText}>
                      {saveFile.generationLabel}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardMeta}>
                {saveFile.modifiedAt
                  ? new Date(saveFile.modifiedAt).toLocaleString()
                  : "unknown"}
              </Text>
            </View>

            <View style={styles.metaGroup}>
              <Text style={styles.metaLine}>
                Trainer: {saveFile.trainerName ?? "unknown"}
              </Text>
              <Text style={styles.metaLine}>
                Rival: {saveFile.rivalName ?? "unknown"}
              </Text>
              <Text style={styles.metaLine}>
                ID: {saveFile.trainerId ?? "unknown"} · Badges:{" "}
                {saveFile.badgeCount ?? "unknown"}/8
              </Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>{moneyText}</Text>
                <Text style={styles.metricLabel}>Money</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>{seenText}</Text>
                <Text style={styles.metricLabel}>Vistos</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>{ownedText}</Text>
                <Text style={styles.metricLabel}>Capturados</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>{playTimeText}</Text>
                <Text style={styles.metricLabel}>Play time</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mobileCardsList: {
    gap: 10,
  },
  saveCard: {
    borderWidth: 1,
    borderColor: "#d7e0ea",
    borderRadius: 16,
    padding: 14,
    gap: 12,
    backgroundColor: "#f8fbff",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  saveCardMobile: {
    width: "100%",
  },
  cardHeader: {
    gap: 2,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5edf5",
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  generationChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#dbeafe",
    borderWidth: 1,
    borderColor: "#93c5fd",
  },
  generationChipText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "#1d4ed8",
  },
  cardMeta: {
    fontSize: 12,
    color: "#64748b",
  },
  metaGroup: {
    gap: 4,
  },
  metaLine: {
    fontSize: 14,
    color: "#334155",
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metricPill: {
    minWidth: 104,
    flexGrow: 1,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  metricLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#64748b",
  },
  label: {
    fontSize: 14,
  },
});
