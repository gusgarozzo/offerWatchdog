import "./global.css";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/ui/navigation/AppNavigator";
import { View, LogBox } from "react-native";
import * as Notifications from "expo-notifications";
import { registerBackgroundFetchAsync } from "./src/infrastructure/services/BackgroundService";
import Constants from "expo-constants";

// Ignore specific noisy warnings in Expo Go
LogBox.ignoreLogs([
  "expo-notifications: Android Push notifications",
  "expo-background-fetch: This library is deprecated",
  "Background Fetch functionality is not available in Expo Go",
]);

// Configure notifications handler (wrapped for safety)
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (e) {
  console.warn("Notification handler could not be set:", e);
}

export default function App() {
  useEffect(() => {
    const init = async () => {
      // Background fetch is only available on physical devices/dev builds
      if (Constants.appOwnership !== "expo") {
        try {
          await registerBackgroundFetchAsync();
        } catch (e) {
          console.log(
            "Background fetch registration failed (expected in Expo Go)",
          );
        }
      }

      // Request permissions
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.warn("Notification permissions not granted");
        }
      } catch (e) {
        // Silently skip if push isn't available
      }
    };

    init();
  }, []);

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <AppNavigator />
        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
};
