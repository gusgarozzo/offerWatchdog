import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProductStore } from "../hooks/useProductStore";
import {
  ChevronLeft,
  Coffee,
  Info,
  RefreshCw,
  Bell,
  Trash2,
  Globe,
  CreditCard,
  Clock,
} from "lucide-react-native";
import * as Notifications from "expo-notifications";
import { SubscriptionService } from "../../core/services/SubscriptionService";

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const {
    clearProducts,
    userPlan,
    checkInterval,
    setCheckInterval,
    syncSubscription,
  } = useProductStore();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleDonate = () => {
    Linking.openURL("https://cafecito.app/gusdev");
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncSubscription();
      Alert.alert(
        "Sincronización",
        "Tu plan ha sido actualizado desde la tienda.",
      );
    } catch (error) {
      Alert.alert("Error", "No se pudo sincronizar con la tienda.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "¡Prueba exitosa! 🚀",
        body: "Las notificaciones de Offer Watchdog están funcionando.",
      },
      trigger: null,
    });
  };

  const handleResetData = () => {
    Alert.alert(
      "Borrar todo",
      "¿Estás seguro de que quieres borrar todos los productos y el historial? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: () => {
            clearProducts();
            Alert.alert("Éxito", "Todos los datos han sido borrados.");
          },
        },
      ],
    );
  };

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      className="bg-[#f8fafc]"
    >
      <View
        style={styles.header}
        className="px-6 py-4 flex-row items-center bg-white border-b border-slate-100 shadow-sm"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4 w-10 h-10 items-center justify-center rounded-full bg-slate-50"
        >
          <ChevronLeft size={24} color="#64748b" />
        </TouchableOpacity>
        <Text className="text-slate-800 text-xl font-black uppercase tracking-tight">
          Ajustes
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 py-8">
          {/* SUBSCRIPTION PLAN */}
          <View className="flex-row items-center mb-5 px-1">
            <View className="w-1.5 h-5 bg-amber-500 rounded-full mr-3" />
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              TU PLAN
            </Text>
          </View>

          <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-10 p-6">
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center">
                <View
                  className={`w-12 h-12 rounded-2xl ${userPlan === "FREE" ? "bg-slate-100" : "bg-amber-100"} items-center justify-center mr-4`}
                >
                  <CreditCard
                    size={24}
                    color={userPlan === "FREE" ? "#64748b" : "#d97706"}
                  />
                </View>
                <View>
                  <Text className="text-slate-800 font-black uppercase text-base">
                    {userPlan}
                  </Text>
                  <Text className="text-slate-400 text-xs text-balance">
                    Sincronizado vía App Store
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleSync}
                disabled={isSyncing}
                className="bg-slate-50 px-3 py-2 rounded-xl flex-row items-center"
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#64748b" />
                ) : (
                  <>
                    <RefreshCw size={14} color="#64748b" className="mr-2" />
                    <Text className="text-slate-500 font-bold text-[10px] uppercase">
                      Sincronizar
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View className="bg-slate-50 rounded-2xl p-4">
              <Text className="text-slate-500 text-[11px] font-bold uppercase mb-2">
                Límites activos
              </Text>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-600 text-xs">Productos max.</Text>
                <Text className="text-slate-900 font-bold text-xs">
                  {SubscriptionService.getLimits(userPlan).maxProducts}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-slate-600 text-xs">
                  Actualizaciones auto.
                </Text>
                <Text className="text-slate-900 font-bold text-xs">
                  Cada{" "}
                  {
                    SubscriptionService.getLimits(userPlan, checkInterval)
                      .autoCheckIntervalHours
                  }
                  h
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-600 text-xs">
                  Actualizaciones manuales
                </Text>
                <Text className="text-slate-900 font-bold text-xs">
                  {SubscriptionService.getLimits(userPlan).manualChecksPerHour}
                  /hora
                </Text>
              </View>
            </View>

            {userPlan === "FREE" && (
              <TouchableOpacity
                className="mt-6 bg-amber-500 py-4 rounded-2xl items-center shadow-lg shadow-amber-500/30"
                onPress={() =>
                  Alert.alert("Premium", "Redirigiendo a la App Store...")
                }
              >
                <Text className="text-white font-black uppercase tracking-widest text-xs">
                  Pasar a Premium
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* PREMIUM CONFIGURATION */}
          {userPlan === "PREMIUM" && (
            <>
              <View className="flex-row items-center mb-5 px-1">
                <View className="w-1.5 h-5 bg-blue-500 rounded-full mr-3" />
                <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                  FRECUENCIA DE MONITOREO
                </Text>
              </View>

              <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-10 p-2">
                {[1, 3, 6].map((h) => (
                  <TouchableOpacity
                    key={h}
                    onPress={() => setCheckInterval(h)}
                    className={`flex-row items-center justify-between px-6 py-4 rounded-[20px] ${checkInterval === h ? "bg-blue-50" : ""}`}
                  >
                    <View className="flex-row items-center">
                      <Clock
                        size={16}
                        color={checkInterval === h ? "#2563eb" : "#94a3b8"}
                        className="mr-3"
                      />
                      <Text
                        className={`font-bold ${checkInterval === h ? "text-blue-700" : "text-slate-600"}`}
                      >
                        Cada {h} Hora{h > 1 ? "s" : ""}
                      </Text>
                    </View>
                    {checkInterval === h && (
                      <View className="w-2 h-2 rounded-full bg-blue-600" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <View className="flex-row items-center mb-5 px-1">
            <View className="w-1.5 h-5 bg-blue-400 rounded-full mr-3" />
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              PRUEBAS Y ACCIONES
            </Text>
          </View>

          <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-10">
            <TouchableOpacity
              onPress={handleTestNotification}
              style={styles.borderBottom}
              className="flex-row items-center px-6 py-5"
            >
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-4">
                <Bell size={20} color="#2563eb" />
              </View>
              <View>
                <Text className="text-slate-700 font-bold">
                  Enviar notificación de prueba
                </Text>
                <Text className="text-slate-400 text-xs">
                  Comprueba cómo se ven las alertas
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleResetData}
              className="flex-row items-center px-6 py-5"
            >
              <View className="w-10 h-10 rounded-xl bg-red-50 items-center justify-center mr-4">
                <Trash2 size={20} color="#ef4444" />
              </View>
              <View>
                <Text className="text-red-600 font-bold">
                  Eliminar todos los datos
                </Text>
                <Text className="text-slate-400 text-xs text-red-300">
                  Borra todos los productos y el historial
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center mb-5 px-1">
            <View className="w-1.5 h-5 bg-orange-400 rounded-full mr-3" />
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              APOYO AL DESARROLLADOR
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleDonate}
            style={styles.donateCard}
            className="bg-primary p-6 rounded-[32px] flex-row items-center shadow-xl shadow-primary/30 mb-10"
          >
            <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center">
              <Coffee color="white" size={28} />
            </View>
            <View className="ml-5 flex-1">
              <Text className="text-white font-bold text-lg">
                Invitame un cafecito
              </Text>
              <Text className="text-white/80 text-xs mt-1">
                Ayudá a mantener el proyecto vivo
              </Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row items-center mb-5 px-1">
            <View className="w-1.5 h-5 bg-slate-300 rounded-full mr-3" />
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              INFORMACIÓN
            </Text>
          </View>

          <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-7 mb-10">
            <View className="flex-row items-center mb-5">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-4">
                <Info size={16} color="#94a3b8" />
              </View>
              <Text className="text-slate-600 font-medium">
                Versión 1.1.0 (Freemium Update)
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-lg bg-slate-50 items-center justify-center mr-4">
                <Globe size={16} color="#94a3b8" />
              </View>
              <Text className="text-slate-600 font-medium">
                Offer Watchdog Mobile App
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 18,
  },
  intervalOption: {
    paddingVertical: 18,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  donateCard: {
    // shadowColor handled via NativeWind
  },
});
