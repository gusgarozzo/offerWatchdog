import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProductStore } from "../hooks/useProductStore";
import {
  ChevronLeft,
  Coffee,
  Info,
  Bell,
  Globe,
  Trash2,
} from "lucide-react-native";
import * as Notifications from "expo-notifications";

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { clearProducts } = useProductStore();

  const handleDonate = () => {
    Linking.openURL("https://cafecito.app/gusdev");
  };

  const handleTestNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "¡Prueba de Oferta!",
          body: "Este es un ejemplo de cómo verás las alertas de precio.",
          data: { productId: "test" },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // trigger immediately
      });
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar la notificación de prueba.");
    }
  };

  const handleResetData = () => {
    Alert.alert(
      "Borrar todo",
      "¿Estás seguro de que deseas eliminar todos los productos monitoreados?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar todo",
          style: "destructive",
          onPress: () => {
            clearProducts();
            navigation.goBack();
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
          className="w-10 h-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100"
        >
          <ChevronLeft color="#1e293b" size={20} />
        </TouchableOpacity>
        <Text
          style={styles.headerTitle}
          className="ml-4 text-slate-800 font-bold"
        >
          Configuración
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 py-8">
          <View className="flex-row items-center mb-5 px-1">
            <View className="w-1.5 h-5 bg-primary rounded-full mr-3" />
            <Text className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              INTERVALO DE MONITOREO
            </Text>
          </View>

          <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-10 p-6">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center mr-4">
                <Bell size={20} color="#2563eb" />
              </View>
              <View>
                <Text className="text-slate-700 font-bold">1 hora (Fijo)</Text>
                <Text className="text-primary font-medium text-xs">
                  Intervalo óptimo activo
                </Text>
              </View>
            </View>
            <Text className="text-slate-500 text-xs leading-5">
              Para garantizar la eficiencia de la batería y la confiabilidad del
              servicio, el intervalo de monitoreo automático está fijado en una
              hora. Puedes realizar hasta 5 verificaciones manuales por hora
              desde el panel principal.
            </Text>
          </View>

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
                Versión 1.0.0 (Expo SDK 54)
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
