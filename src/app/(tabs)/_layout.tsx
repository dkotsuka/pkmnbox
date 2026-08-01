import { Link, Slot, Tabs, usePathname } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SaveSyncProvider } from "@/hooks/saveSyncContext";

export default function TabLayout() {
  if (Platform.OS === "web") {
    return (
      <SaveSyncProvider>
        <WebLayout />
      </SaveSyncProvider>
    );
  }

  return (
    <SaveSyncProvider>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="pokedex" options={{ title: "Pokedex" }} />
        <Tabs.Screen name="about" options={{ title: "About" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
    </SaveSyncProvider>
  );
}

function WebLayout() {
  const pathname = usePathname();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.navbar}>
        <NavItem href="/" label="Home" isActive={pathname === "/"} />
        <NavItem
          href="/pokedex"
          label="Pokedex"
          isActive={pathname.startsWith("/pokedex")}
        />
        <NavItem
          href="/about"
          label="About"
          isActive={pathname.startsWith("/about")}
        />
        <NavItem
          href="/settings"
          label="Settings"
          isActive={pathname.startsWith("/settings")}
        />
      </View>

      <View style={styles.content}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}

function NavItem({
  href,
  label,
  isActive,
}: {
  href: "/" | "/pokedex" | "/about" | "/settings";
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      style={[styles.navItem, isActive && styles.navItemActive]}
    >
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
        {label}
      </Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e2e2",
    backgroundColor: "#ffffff",
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: "#eceff3",
  },
  navLabel: {
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
  navLabelActive: {
    color: "#111111",
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
});
