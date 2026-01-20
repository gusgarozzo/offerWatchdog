import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  StatusBar as RNStatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProductStore } from "../hooks/useProductStore";
import { ProductCard } from "../components/ProductCard";
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Settings as SettingsIcon,
} from "lucide-react-native";
import { ScraperService } from "../../infrastructure/services/ScraperService";

const scraper = new ScraperService();

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { products, addProduct, updateProduct, addHistoryEntry } =
    useProductStore();
  const [isFormExpanded, setIsFormExpanded] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Adjusted padding for safe area
  const topPadding =
    Platform.OS === "android"
      ? (RNStatusBar.currentHeight || 0) + 10
      : insets.top;

  const handleAddProduct = async () => {
    if (!url) return;
    setIsScraping(true);
    try {
      const info = await scraper.scrape(url);

      const newProduct = {
        id: Date.now().toString(),
        url,
        name: name || info.title || "Producto nuevo",
        price: info.price,
        availability: info.availability,
        lastChecked: Date.now(),
        createdAt: Date.now(),
      };

      addProduct(newProduct);
      setUrl("");
      setName("");
      setIsFormExpanded(false);
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setIsScraping(false);
    }
  };

  const handleRefreshAll = async () => {
    setIsRefreshing(true);
    try {
      for (const product of products) {
        const info = await scraper.scrape(product.url);

        if (info.price !== null && info.price !== product.price) {
          addHistoryEntry({
            id: Date.now().toString(),
            productId: product.id,
            timestamp: Date.now(),
            type: "price",
            oldValue: product.price,
            newValue: info.price,
          });
        }

        updateProduct(product.id, {
          price: info.price,
          availability: info.availability,
          lastChecked: Date.now(),
        });
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View
        style={[styles.container, { paddingTop: topPadding }]}
        className="bg-[#f0f4f8]"
      >
        <View
          style={styles.header}
          className="px-6 py-5 flex-row justify-between items-center bg-white border-b border-slate-200"
        >
          <View>
            <Text
              style={styles.headerTitle}
              className="text-primary font-black uppercase tracking-tighter"
            >
              Offer Watchdog
            </Text>
            <Text
              style={styles.headerSubtitle}
              className="text-slate-500 font-medium"
            >
              Panel de Monitoreo
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("Settings")}
            style={styles.iconBtn}
            className="bg-slate-50 border border-slate-200"
          >
            <SettingsIcon color="#475569" size={20} />
          </TouchableOpacity>
        </View>

        <View className="px-6 py-3 bg-white mb-3 shadow-sm border-b border-slate-100">
          <TouchableOpacity
            onPress={() => setIsFormExpanded(!isFormExpanded)}
            style={styles.toggleHeader}
            className="flex-row justify-between items-center py-4"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-xl bg-blue-50 items-center justify-center mr-4">
                <Plus size={20} color="#2563eb" />
              </View>
              <Text
                style={styles.toggleText}
                className="text-slate-700 font-bold"
              >
                Agregar nuevo producto
              </Text>
            </View>
            {isFormExpanded ? (
              <ChevronUp size={20} color="#94a3b8" />
            ) : (
              <ChevronDown size={20} color="#94a3b8" />
            )}
          </TouchableOpacity>

          {isFormExpanded && (
            <View
              style={styles.addForm}
              className="bg-slate-100 p-6 rounded-3xl border border-slate-200 mb-6 shadow-sm"
            >
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 ml-1">
                URL DEL PRODUCTO
              </Text>
              <View
                style={styles.inputWrapper}
                className="bg-white rounded-2xl px-5 mb-4 border border-slate-300"
              >
                <TextInput
                  style={styles.input}
                  placeholder="https://tienda.com/producto..."
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  placeholderTextColor="#cbd5e1"
                  autoCorrect={false}
                />
              </View>
              <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2 ml-1">
                NOMBRE (OPCIONAL)
              </Text>
              <View
                style={styles.inputWrapper}
                className="bg-white rounded-2xl px-5 mb-6 border border-slate-300"
              >
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Monitor Gamer"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#cbd5e1"
                />
              </View>
              <TouchableOpacity
                onPress={handleAddProduct}
                disabled={isScraping || !url}
                style={[
                  styles.addBtn,
                  (!url || isScraping) && styles.disabledBtn,
                ]}
                className="bg-primary h-14 rounded-2xl items-center justify-center shadow-lg shadow-primary/30"
              >
                {isScraping ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-white font-black text-base uppercase tracking-widest">
                    Monitorear
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View className="px-6 flex-1">
          <View className="flex-row justify-between items-center mb-6 pt-4">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-primary mr-2" />
              <Text
                style={styles.countText}
                className="text-slate-800 font-black uppercase tracking-[1.5px]"
              >
                {products.length} PRODUCTO{products.length !== 1 ? "S" : ""}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRefreshAll}
              disabled={isRefreshing}
              style={styles.refreshBtn}
              className="flex-row items-center bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
            >
              {isRefreshing ? (
                <ActivityIndicator
                  size="small"
                  color="#2563eb"
                  className="mr-2"
                />
              ) : (
                <RefreshCw size={12} color="#2563eb" className="mr-2" />
              )}
              <Text className="text-primary font-black text-[9px] tracking-wider uppercase">
                Actualizar
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate("ProductDetail", { productId: item.id })
                }
              />
            )}
            ListEmptyComponent={
              <View
                style={styles.emptyState}
                className="mt-20 items-center justify-center"
              >
                <View className="w-20 h-20 bg-white rounded-[32px] items-center justify-center mb-6 shadow-sm border border-slate-100">
                  <Search size={32} color="#cbd5e1" />
                </View>
                <Text className="text-slate-400 text-center px-10 font-bold leading-6">
                  No hay productos monitoreados.
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  headerTitle: {
    fontSize: 20,
  },
  headerSubtitle: {
    fontSize: 12,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    fontSize: 15,
  },
  inputWrapper: {
    minHeight: 50,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#0f172a",
    paddingVertical: 0,
    fontWeight: "500",
  },
  addBtn: {
    // shadowColor handled via NativeWind
  },
  disabledBtn: {
    opacity: 0.5,
  },
  countText: {
    fontSize: 10,
  },
  refreshBtn: {},
  emptyState: {
    marginTop: 20,
  },
  toggleHeader: {},
  addForm: {
    elevation: 3,
  },
});
