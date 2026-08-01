import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSaveSync } from "@/hooks/saveSyncContext";

const PARTY_CAPACITY = 6;

function buildSpriteUrl(pokedexId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
}

export default function BoxesScreen() {
  const { snapshot } = useSaveSync();
  const { width } = useWindowDimensions();
  const orderedSaves = useMemo(
    () =>
      [...snapshot.saves].sort(
        (a, b) => (b.modifiedAt ?? 0) - (a.modifiedAt ?? 0),
      ),
    [snapshot.saves],
  );
  const [selectedSaveUri, setSelectedSaveUri] = useState<string | null>(null);
  const resolvedSelectedSaveUri =
    selectedSaveUri &&
    orderedSaves.some((saveFile) => saveFile.uri === selectedSaveUri)
      ? selectedSaveUri
      : (orderedSaves[0]?.uri ?? null);
  const selectedSave =
    orderedSaves.find((saveFile) => saveFile.uri === resolvedSelectedSaveUri) ??
    null;

  const slotSize = width >= 720 ? 56 : 52;
  const partyColumns = 3;
  const boxColumns = 5;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Boxes</Text>
        <Text style={styles.subtitle}>
          Party e caixas do treinador. Slot com pokemon mostra sprite; slot
          vazio fica branco.
        </Text>

        {orderedSaves.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum save carregado para exibir as boxes.
          </Text>
        ) : (
          <View style={styles.dropdownCard}>
            <Text style={styles.dropdownLabel}>Save file</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={resolvedSelectedSaveUri ?? undefined}
                onValueChange={(value) => setSelectedSaveUri(value)}
              >
                {orderedSaves.map((saveFile) => (
                  <Picker.Item
                    key={saveFile.uri}
                    label={saveFile.name}
                    value={saveFile.uri}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {selectedSave ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Party</Text>
              <View
                style={[
                  styles.slotGrid,
                  { width: partyColumns * (slotSize + 8) - 8 },
                ]}
              >
                {Array.from({ length: PARTY_CAPACITY }, (_, index) => {
                  const slot = selectedSave.party[index] ?? null;
                  return (
                    <SlotSquare
                      key={`party-${index}`}
                      pokedexId={slot?.pokedexId ?? null}
                      size={slotSize}
                    />
                  );
                })}
              </View>
            </View>

            {selectedSave.boxes.map((boxSlots, boxIndex) => {
              const isCurrent = selectedSave.currentBoxNumber === boxIndex;
              return (
                <View key={`box-${boxIndex + 1}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Box {boxIndex + 1}
                    {isCurrent ? " (current)" : ""}
                  </Text>
                  <View
                    style={[
                      styles.slotGrid,
                      { width: boxColumns * (slotSize + 8) - 8 },
                    ]}
                  >
                    {boxSlots.map((slot, slotIndex) => (
                      <SlotSquare
                        key={`box-${boxIndex + 1}-${slotIndex + 1}`}
                        pokedexId={slot.pokedexId}
                        size={slotSize}
                      />
                    ))}
                  </View>
                </View>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SlotSquare({
  pokedexId,
  size,
}: {
  pokedexId: number | null;
  size: number;
}) {
  if (!pokedexId) {
    return (
      <View
        style={[
          styles.slot,
          {
            width: size,
            height: size,
            backgroundColor: "#ffffff",
          },
        ]}
      />
    );
  }

  return (
    <View style={[styles.slot, { width: size, height: size }]}>
      <Image
        source={{ uri: buildSpriteUrl(pokedexId) }}
        style={styles.sprite}
        contentFit="contain"
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f6fb",
  },
  content: {
    padding: 16,
    gap: 14,
    alignItems: "center",
    paddingBottom: 24,
  },
  title: {
    width: "100%",
    maxWidth: 1000,
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    width: "100%",
    maxWidth: 1000,
    fontSize: 14,
    color: "#334155",
  },
  dropdownCard: {
    width: "100%",
    maxWidth: 1000,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d9e2ec",
    borderRadius: 14,
    backgroundColor: "#ffffff",
    gap: 8,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    overflow: "hidden",
  },
  section: {
    width: "100%",
    maxWidth: 1000,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slot: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d4dde8",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sprite: {
    width: "100%",
    height: "100%",
  },
  emptyText: {
    width: "100%",
    maxWidth: 1000,
    color: "#334155",
    fontSize: 14,
  },
});
