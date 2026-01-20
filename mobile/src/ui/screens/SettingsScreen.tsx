import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProductStore } from "../hooks/useProductStore";
import { ChevronLeft, Coffee, Info, Clock, Globe } from "lucide-react-native";

const INTERVALS = [
  { label: "1 minuto", value: 1 },
  { label: "5 minutos", value: 5 },
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "12 horas", value: 720 },
  { label: "24 horas", value: 1440 },
];

export default function SettingsScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { checkInterval, setCheckInterval } = useProductStore();

  const handleDonate = () => {
    Linking.openURL("https://cafecito.app/gusdev");
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

          <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-10">
            {INTERVALS.map((interval, index) => (
              <TouchableOpacity
                key={interval.value}
                onPress={() => setCheckInterval(interval.value)}
                style={[
                  styles.intervalOption,
                  index !== INTERVALS.length - 1 && styles.borderBottom,
                ]}
                className="flex-row items-center justify-between px-6 py-4.5"
              >
                <Text
                  className={`${checkInterval === interval.value ? "text-primary font-bold" : "text-slate-600"}`}
                >
                  {interval.label}
                </Text>
                {checkInterval === interval.value && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" />
                )}
              </TouchableOpacity>
            ))}
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

          <View className="bg-white rounded-[28px] border border-slate-100 shadow-sm p-7">
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
