import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SaveCardsMobile } from "@/components/home/SaveCardsMobile";
import { SaveCardsWeb } from "@/components/home/SaveCardsWeb";
import { useSaveSync } from "@/hooks/saveSyncContext";

export default function HomeScreen() {
  const { snapshot } = useSaveSync();
  const isWeb = Platform.OS === "web";
  const orderedSaves = [...snapshot.saves].sort(
    (a, b) => (b.modifiedAt ?? 0) - (a.modifiedAt ?? 0),
  );
  const lastSyncText = snapshot.lastSyncAt
    ? new Date(snapshot.lastSyncAt).toLocaleString()
    : "never";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={styles.title}>Home</Text>
          <Text style={styles.heroSubtitle}>
            Acompanhamento visual dos saves detectados no diretório selecionado.
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{snapshot.saves.length}</Text>
              <Text style={styles.metricLabel}>Saves</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{snapshot.state}</Text>
              <Text style={styles.metricLabel}>State</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{snapshot.strategy}</Text>
              <Text style={styles.metricLabel}>Strategy</Text>
            </View>
          </View>

          <View style={styles.infoPanel}>
            <Text style={styles.infoLabel}>
              Selected folder:{" "}
              {snapshot.folderRoute ?? snapshot.folderUri ?? "none"}
            </Text>
            <Text style={styles.infoLabel}>Last sync: {lastSyncText}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Saves carregados</Text>
          {orderedSaves.length > 0 ? (
            isWeb ? (
              <SaveCardsWeb saves={orderedSaves} />
            ) : (
              <SaveCardsMobile saves={orderedSaves} />
            )
          ) : (
            <Text style={styles.label}>Nenhum save carregado.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#eef2f7",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 24,
  },
  hero: {
    backgroundColor: "#f7fafc",
    borderWidth: 1,
    borderColor: "#d9e2ec",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475569",
  },
  metricsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metricCard: {
    flexGrow: 1,
    minWidth: 96,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d9e2ec",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  metricLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#64748b",
  },
  infoPanel: {
    backgroundColor: "#eef2f7",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: "#334155",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  label: {
    fontSize: 14,
    color: "#334155",
  },
});
