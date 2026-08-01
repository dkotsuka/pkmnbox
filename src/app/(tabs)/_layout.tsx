import { Tabs } from "expo-router";

import { SaveSyncProvider } from "@/hooks/saveSyncContext";

export default function TabLayout() {
  return (
    <SaveSyncProvider>
      <Tabs>
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="about" options={{ title: "About" }} />
        <Tabs.Screen name="settings" options={{ title: "Settings" }} />
      </Tabs>
    </SaveSyncProvider>
  );
}
