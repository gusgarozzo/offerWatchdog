import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProductStore } from "../hooks/useProductStore";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronLeft,
  Trash2,
  ExternalLink,
  Calendar,
  AlertCircle,
} from "lucide-react-native";

export default function ProductDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const { products, history, removeProduct, clearHistory } = useProductStore();

  const product = products.find((p) => p.id === productId);
  const productHistory = history.filter((h) => h.productId === productId);

  if (!product) return null;

  const handleDelete = () => {
    Alert.alert(
      "Eliminar producto",
      "¿Estás seguro de que deseas dejar de monitorear este producto?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            removeProduct(productId);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const handleOpenUrl = () => {
    Linking.openURL(product.url);
  };

  const isInStock = product.availability === "In stock";

  return (
    <View
      style={[styles.container, { paddingTop: insets.top }]}
      className="bg-[#f8fafc]"
    >
      <View
        style={styles.header}
        className="px-6 py-4 flex-row justify-between items-center bg-white border-b border-slate-100 shadow-sm"
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-100"
        >
          <ChevronLeft color="#1e293b" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} className="text-slate-800 font-bold">
          Detalle
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          className="w-10 h-10 items-center justify-center rounded-xl bg-red-50 border border-red-100"
        >
          <Trash2 color="#ef4444" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="px-6 py-8">
          <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-6">
            <Text style={styles.name} className="text-slate-800 font-bold mb-4">
              {product.name || "Sin nombre"}
            </Text>

            <View className="flex-row items-center justify-between">
              <View>
                <Text
                  style={styles.priceLabel}
                  className="text-slate-400 font-bold mb-1 tracking-wider"
                >
                  PRECIO ACTUAL
                </Text>
                <Text style={styles.price} className="text-primary font-bold">
                  {product.price
                    ? `$${product.price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                    : "N/D"}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isInStock ? "#dcfce7" : "#fee2e2" },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isInStock ? "#166534" : "#991b1b" },
                  ]}
                >
                  {product.availability || "Desconocido"}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleOpenUrl}
            style={styles.actionBtn}
            className="bg-primary p-5 rounded-2xl flex-row items-center justify-center shadow-lg shadow-primary/30 mb-8"
          >
            <ExternalLink size={20} color="white" />
            <Text className="text-white font-bold text-base ml-3">
              Ver en la tienda
            </Text>
          </TouchableOpacity>

          <View className="mb-6 flex-row justify-between items-center px-2">
            <View className="flex-row items-center">
              <View className="w-1.5 h-6 bg-primary rounded-full mr-3" />
              <Text
                style={styles.sectionTitle}
                className="text-slate-800 font-bold"
              >
                Historial de cambios
              </Text>
            </View>
            {productHistory.length > 0 && (
              <TouchableOpacity
                onPress={() => clearHistory(productId)}
                className="bg-white px-3 py-1.5 rounded-lg border border-slate-200"
              >
                <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  Limpiar
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {productHistory.length > 0 ? (
            <View
              style={styles.historyContainer}
              className="bg-white rounded-[28px] border border-slate-100 shadow-sm overflow-hidden mb-8"
            >
              {productHistory.map((item, index) => (
                <View
                  key={item.id}
                  style={[
                    styles.historyItem,
                    index !== productHistory.length - 1 && styles.borderBottom,
                  ]}
                  className="p-5 flex-row items-center"
                >
                  <View
                    className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${
                      item.type === "price"
                        ? Number(item.newValue) < Number(item.oldValue)
                          ? "bg-green-50 border border-green-100"
                          : "bg-red-50 border border-red-100"
                        : "bg-blue-50 border border-blue-100"
                    }`}
                  >
                    {item.type === "price" ? (
                      Number(item.newValue) < Number(item.oldValue) ? (
                        <TrendingDown size={20} color="#16a34a" />
                      ) : (
                        <TrendingUp size={20} color="#dc2626" />
                      )
                    ) : (
                      <AlertCircle size={20} color="#2563eb" />
                    )}
                  </View>

                  <View className="flex-1">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        {new Date(item.timestamp).toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "short",
                        })}{" "}
                        •{" "}
                        {new Date(item.timestamp).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <View className="bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                        <Text className="text-[8px] text-slate-500 font-bold uppercase">
                          {item.type === "price" ? "Precio" : "Stock"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center">
                      <Text className="text-slate-400 text-xs line-through">
                        {typeof item.oldValue === "number"
                          ? `$${item.oldValue.toLocaleString()}`
                          : item.oldValue}
                      </Text>
                      <View className="w-4 h-[1px] bg-slate-200 mx-2" />
                      <Text className="text-slate-800 font-bold text-sm">
                        {typeof item.newValue === "number"
                          ? `$${item.newValue.toLocaleString()}`
                          : item.newValue}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-white border border-dashed border-slate-300 rounded-[28px] p-12 items-center mb-8">
              <View className="w-12 h-12 bg-slate-50 rounded-full items-center justify-center mb-4">
                <Clock size={24} color="#cbd5e1" />
              </View>
              <Text className="text-slate-400 text-xs font-medium text-center">
                Aún no hay cambios registrados.{"\n"}La app te notificará cuando
                detecte uno.
              </Text>
            </View>
          )}

          <View className="bg-slate-200/50 rounded-[28px] p-6 mb-10">
            <View className="flex-row items-center mb-4">
              <Calendar size={14} color="#64748b" />
              <Text className="ml-2 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                INFORMACIÓN TÉCNICA
              </Text>
            </View>
            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-slate-500 text-[11px]">
                  ID de seguimiento
                </Text>
                <Text className="text-slate-800 text-[11px] font-mono">
                  {product.id.slice(0, 8)}...
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-slate-500 text-[11px]">
                  Fecha de registro
                </Text>
                <Text className="text-slate-800 text-[11px]">
                  {new Date(product.createdAt).toLocaleString("es-AR")}
                </Text>
              </View>
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
  header: {},
  headerTitle: {
    fontSize: 16,
  },
  name: {
    fontSize: 22,
    lineHeight: 30,
  },
  priceLabel: {
    fontSize: 9,
  },
  price: {
    fontSize: 26,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  actionBtn: {},
  sectionTitle: {
    fontSize: 18,
  },
  historyContainer: {},
  historyItem: {},
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
});
