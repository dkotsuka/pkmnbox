import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSaveSync } from "@/hooks/saveSyncContext";

const TOTAL_POKEMON = 151;
const WEB_SEEN_SPRITE_STYLE = { filter: "grayscale(100%)" } as const;

function buildSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export default function PokedexScreen() {
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
  const dexById = useMemo(() => {
    const map = new Map<number, { isSeen: boolean; isOwned: boolean }>();
    for (const status of selectedSave?.pokedexStatuses ?? []) {
      map.set(status.id, { isSeen: status.isSeen, isOwned: status.isOwned });
    }
    return map;
  }, [selectedSave]);

  const columnCount = Math.max(4, Math.min(10, Math.floor(width / 82)));
  const iconSize = Platform.OS === "web" ? 56 : 52;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pokedex</Text>
        <Text style={styles.subtitle}>
          Capturado: colorido, visto: preto e branco, desconhecido:
          interrogação.
        </Text>

        {orderedSaves.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum save carregado para exibir a Pokedex.
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
          <View style={[styles.grid, { maxWidth: columnCount * 74 }]}>
            {Array.from({ length: TOTAL_POKEMON }, (_, index) => {
              const pokemonId = index + 1;
              const status = dexById.get(pokemonId);
              const isOwned = status?.isOwned ?? false;
              const isSeen = status?.isSeen ?? false;

              if (!isOwned && !isSeen) {
                return (
                  <View key={pokemonId} style={styles.unknownIconContainer}>
                    <Text style={styles.unknownIcon}>?</Text>
                  </View>
                );
              }

              return (
                <Image
                  key={pokemonId}
                  source={{ uri: buildSpriteUrl(pokemonId) }}
                  style={[
                    styles.sprite,
                    { width: iconSize, height: iconSize },
                    isSeen && !isOwned && styles.seenSpriteBackground,
                    isSeen &&
                      !isOwned &&
                      (Platform.OS === "web"
                        ? (WEB_SEEN_SPRITE_STYLE as never)
                        : styles.seenSprite),
                  ]}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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
    maxWidth: 900,
    fontSize: 28,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    width: "100%",
    maxWidth: 900,
    fontSize: 14,
    color: "#334155",
  },
  dropdownCard: {
    width: "100%",
    maxWidth: 900,
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
  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sprite: {
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  seenSprite: {
    tintColor: "#9ba6b2",
  },
  seenSpriteBackground: {
    backgroundColor: "#e8edf3",
  },
  unknownIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dbe6f2",
    borderWidth: 1,
    borderColor: "#c0d1e4",
  },
  unknownIcon: {
    fontSize: 26,
    fontWeight: "800",
    color: "#5b6b81",
    lineHeight: 28,
  },
  emptyText: {
    width: "100%",
    maxWidth: 900,
    color: "#334155",
    fontSize: 14,
  },
});
