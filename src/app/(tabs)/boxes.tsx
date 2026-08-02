import { Picker } from "@react-native-picker/picker";
import { Image } from "expo-image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSaveSync } from "@/hooks/saveSyncContext";
import type { PokemonStorageSlot } from "@/utils/saveParser";

const PARTY_CAPACITY = 6;

interface PokemonTooltipInfo {
  name: string;
  stats: {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
  };
}

type PokemonGrade = "A" | "B" | "C" | "D" | "E" | "F";

function buildSpriteUrl(pokedexId: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokedexId}.png`;
}

function evaluatePokemonGrade(slot: PokemonStorageSlot): PokemonGrade {
  const ivs = slot.ivs;

  if (!ivs) {
    return "F";
  }

  const ivTotal = ivs.hp + ivs.attack + ivs.defense + ivs.speed + ivs.special;
  const potentialScore = ivTotal / 75;

  if (potentialScore >= 0.85) {
    return "A";
  }
  if (potentialScore >= 0.72) {
    return "B";
  }
  if (potentialScore >= 0.59) {
    return "C";
  }
  if (potentialScore >= 0.46) {
    return "D";
  }
  if (potentialScore >= 0.32) {
    return "E";
  }

  return "F";
}

function gradeBadgeStyle(grade: PokemonGrade) {
  switch (grade) {
    case "A":
      return { backgroundColor: "#16a34a", color: "#f0fdf4" };
    case "B":
      return { backgroundColor: "#65a30d", color: "#f7fee7" };
    case "C":
      return { backgroundColor: "#ca8a04", color: "#fefce8" };
    case "D":
      return { backgroundColor: "#ea580c", color: "#fff7ed" };
    case "E":
      return { backgroundColor: "#dc2626", color: "#fef2f2" };
    case "F":
      return { backgroundColor: "#7f1d1d", color: "#fef2f2" };
  }
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
  const [pokemonInfoById, setPokemonInfoById] = useState<
    Record<number, PokemonTooltipInfo>
  >({});
  const [failedInfoIds, setFailedInfoIds] = useState<Record<number, true>>({});
  const pendingInfoIdsRef = useRef<Set<number>>(new Set<number>());

  useEffect(() => {
    const uniqueIds = new Set<number>();

    for (const slot of selectedSave?.party ?? []) {
      if (slot.pokedexId) {
        uniqueIds.add(slot.pokedexId);
      }
    }

    for (const box of selectedSave?.boxes ?? []) {
      for (const slot of box) {
        if (slot.pokedexId) {
          uniqueIds.add(slot.pokedexId);
        }
      }
    }

    const idsToLoad = [...uniqueIds].filter(
      (id) => !pokemonInfoById[id] && !pendingInfoIdsRef.current.has(id),
    );
    if (idsToLoad.length === 0) {
      return;
    }

    let isCancelled = false;

    for (const id of idsToLoad) {
      pendingInfoIdsRef.current.add(id);
    }

    void Promise.all(
      idsToLoad.map(async (id) => {
        try {
          const response = await fetch(
            `https://pokeapi.co/api/v2/pokemon/${id}`,
          );
          if (!response.ok) {
            return;
          }

          const data = (await response.json()) as {
            name?: string;
            stats?: {
              base_stat: number;
              stat?: { name?: string };
            }[];
          };

          const statMap: Record<string, number> = {};
          for (const statEntry of data.stats ?? []) {
            const statName = statEntry.stat?.name;
            if (!statName) {
              continue;
            }

            statMap[statName] = statEntry.base_stat;
          }

          const prettyName = (data.name ?? `pokemon-${id}`)
            .replace(/-/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());

          if (isCancelled) {
            return;
          }

          setPokemonInfoById((current) => ({
            ...current,
            [id]: {
              name: prettyName,
              stats: {
                hp: statMap.hp ?? 0,
                attack: statMap.attack ?? 0,
                defense: statMap.defense ?? 0,
                specialAttack: statMap["special-attack"] ?? 0,
                specialDefense: statMap["special-defense"] ?? 0,
                speed: statMap.speed ?? 0,
              },
            },
          }));
          setFailedInfoIds((current) => {
            if (!current[id]) {
              return current;
            }

            const next = { ...current };
            delete next[id];
            return next;
          });
        } catch {
          if (isCancelled) {
            return;
          }

          setFailedInfoIds((current) => ({ ...current, [id]: true }));
        } finally {
          pendingInfoIdsRef.current.delete(id);
        }
      }),
    );

    return () => {
      isCancelled = true;
    };
  }, [selectedSave, pokemonInfoById]);

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
                      slot={slot}
                      info={
                        slot?.pokedexId
                          ? pokemonInfoById[slot.pokedexId]
                          : undefined
                      }
                      isInfoUnavailable={
                        !!(slot?.pokedexId && failedInfoIds[slot.pokedexId])
                      }
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
                        slot={slot}
                        info={
                          slot.pokedexId
                            ? pokemonInfoById[slot.pokedexId]
                            : undefined
                        }
                        isInfoUnavailable={
                          !!(slot.pokedexId && failedInfoIds[slot.pokedexId])
                        }
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
  slot,
  info,
  isInfoUnavailable,
  size,
}: {
  slot: PokemonStorageSlot | null;
  info?: PokemonTooltipInfo;
  isInfoUnavailable: boolean;
  size: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const pokedexId = slot?.pokedexId ?? null;
  const grade = slot && pokedexId ? evaluatePokemonGrade(slot) : null;

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
    <View style={[styles.slotWrapper, { width: size, height: size }]}>
      <Pressable
        style={[styles.slot, { width: size, height: size }]}
        onHoverIn={Platform.OS === "web" ? () => setIsHovered(true) : undefined}
        onHoverOut={
          Platform.OS === "web" ? () => setIsHovered(false) : undefined
        }
      >
        <Image
          source={{ uri: buildSpriteUrl(pokedexId) }}
          style={styles.sprite}
          contentFit="contain"
          cachePolicy="memory-disk"
        />

        {grade ? (
          <View
            style={[
              styles.gradeBadge,
              { backgroundColor: gradeBadgeStyle(grade).backgroundColor },
            ]}
          >
            <Text
              style={[
                styles.gradeText,
                { color: gradeBadgeStyle(grade).color },
              ]}
            >
              {grade}
            </Text>
          </View>
        ) : null}
      </Pressable>

      {Platform.OS === "web" && isHovered ? (
        <View pointerEvents="none" style={styles.tooltip}>
          <Text style={styles.tooltipTitle}>
            {info?.name ?? `Pokemon ${pokedexId}`}
          </Text>
          {info ? (
            <>
              <Text style={styles.tooltipLine}>HP: {info.stats.hp}</Text>
              <Text style={styles.tooltipLine}>ATK: {info.stats.attack}</Text>
              <Text style={styles.tooltipLine}>DEF: {info.stats.defense}</Text>
              <Text style={styles.tooltipLine}>
                SpA: {info.stats.specialAttack}
              </Text>
              <Text style={styles.tooltipLine}>
                SpD: {info.stats.specialDefense}
              </Text>
              <Text style={styles.tooltipLine}>SPE: {info.stats.speed}</Text>
            </>
          ) : isInfoUnavailable ? (
            <Text style={styles.tooltipLine}>Stats indisponiveis</Text>
          ) : (
            <Text style={styles.tooltipLine}>Carregando stats...</Text>
          )}
        </View>
      ) : null}
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
  slotWrapper: {
    position: "relative",
    overflow: "visible",
  },
  slot: {
    position: "relative",
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
  gradeBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f8fafc",
  },
  gradeText: {
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 11,
  },
  tooltip: {
    position: "absolute",
    left: 0,
    bottom: "100%",
    marginBottom: 6,
    minWidth: 132,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#334155",
    zIndex: 50,
  },
  tooltipTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  tooltipLine: {
    color: "#e2e8f0",
    fontSize: 11,
    lineHeight: 15,
  },
  emptyText: {
    width: "100%",
    maxWidth: 1000,
    color: "#334155",
    fontSize: 14,
  },
});
