import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Dimensions,
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
  ArrowDownRight,
  ArrowUpRight,
  Activity,
} from "lucide-react-native";
import { LineChart, BarChart } from "react-native-gifted-charts";

const { width: screenWidth } = Dimensions.get("window");

export default function ProductDetailScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { productId } = route.params;
  const { products, history, removeProduct, clearHistory } = useProductStore();

  const product = products.find((p) => p.id === productId);
  const productHistory = history.filter((h) => h.productId === productId);

  if (!product) return null;

  // KPI Calculations
  const currentPrice = Number(product.price || 0);
  const priceHistory = productHistory.filter((h) => h.type === "price");
  const priceValues = priceHistory.map((h) => Number(h.newValue || 0));
  priceValues.push(currentPrice);

  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);

  const lastPriceChange = priceHistory[0];
  const priceDiff = lastPriceChange
    ? Number(lastPriceChange.newValue || 0) -
      Number(lastPriceChange.oldValue || 0)
    : 0;
  const oldVal = lastPriceChange ? Number(lastPriceChange.oldValue || 1) : 1;
  const priceChangePercent = (priceDiff / (oldVal || 1)) * 100;

  // Chart Data Preparation - Guaranteed 2+ points
  const chartData: any[] = [];
  const startValue =
    priceHistory.length > 0
      ? Number(priceHistory[priceHistory.length - 1].oldValue || currentPrice)
      : currentPrice;

  chartData.push({
    value: startValue,
    label: "Inicio",
    dataPointText: `$${startValue.toLocaleString()}`,
  });

  [...priceHistory].reverse().forEach((h) => {
    chartData.push({
      value: Number(h.newValue || 0),
      label: new Date(h.timestamp).toLocaleDateString("es-AR", {
        day: "2-digit",
        month: "short",
      }),
      dataPointText: `$${Number(h.newValue || 0).toLocaleString()}`,
    });
  });

  const lastVal = chartData[chartData.length - 1].value;
  if (currentPrice !== lastVal || chartData.length === 1) {
    chartData.push({
      value: currentPrice,
      label: "Hoy",
      dataPointText: `$${currentPrice.toLocaleString()}`,
    });
  }

  const stockHistory = productHistory.filter((h) => h.type === "availability");
  const stockData = stockHistory.reverse().map((h) => ({
    value: h.newValue === "In stock" ? 1 : 0.2,
    frontColor: h.newValue === "In stock" ? "#22c55e" : "#ef4444",
    label: new Date(h.timestamp).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    }),
  }));

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
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
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
          Monitor de Precio
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
                  $
                  {currentPrice.toLocaleString("es-AR", {
                    minimumFractionDigits: 2,
                  })}
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

          {/* KPI Dashboard */}
          <View className="flex-row flex-wrap justify-between mb-8">
            <View className="w-[48%] bg-white p-5 rounded-3xl border border-slate-100 mb-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <ArrowDownRight size={14} color="#16a34a" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase ml-1">
                  Mínimo
                </Text>
              </View>
              <Text className="text-slate-800 font-bold text-lg">
                ${minPrice.toLocaleString()}
              </Text>
            </View>

            <View className="w-[48%] bg-white p-5 rounded-3xl border border-slate-100 mb-4 shadow-sm">
              <View className="flex-row items-center mb-2">
                <ArrowUpRight size={14} color="#dc2626" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase ml-1">
                  Máximo
                </Text>
              </View>
              <Text className="text-slate-800 font-bold text-lg">
                ${maxPrice.toLocaleString()}
              </Text>
            </View>

            <View className="w-full bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <View className="flex-row justify-between items-center">
                <View>
                  <View className="flex-row items-center mb-1">
                    <Activity size={14} color="#6366f1" />
                    <Text className="text-slate-400 text-[10px] font-bold uppercase ml-1">
                      Variación Reciente
                    </Text>
                  </View>
                  <Text
                    className={`font-black text-xl ${priceDiff < 0 ? "text-green-600" : priceDiff > 0 ? "text-red-600" : "text-slate-600"}`}
                  >
                    {priceDiff !== 0 ? (priceDiff > 0 ? "+" : "") : ""}
                    {priceChangePercent.toFixed(1)}%
                  </Text>
                </View>
                {priceDiff !== 0 && (
                  <View
                    className={`px-3 py-1.5 rounded-full ${priceDiff < 0 ? "bg-green-100" : "bg-red-100"}`}
                  >
                    <Text
                      className={`font-bold text-[10px] ${priceDiff < 0 ? "text-green-700" : "text-red-700"}`}
                    >
                      {priceDiff < 0 ? "Ahorro" : "Aumento"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className="mb-6 flex-row justify-between items-center px-2">
            <View className="flex-row items-center">
              <View className="w-1.5 h-6 bg-primary rounded-full mr-3" />
              <Text
                style={styles.sectionTitle}
                className="text-slate-800 font-bold"
              >
                Evolución de Precio
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

          <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 items-center overflow-hidden min-h-[220px] justify-center">
            {chartData.length > 1 ? (
              <LineChart
                data={chartData}
                height={160}
                width={screenWidth - 100}
                areaChart
                curved
                animateOnDataChange
                isAnimated
                hideDataPoints={false}
                dataPointsColor={priceDiff <= 0 ? "#16a34a" : "#dc2626"}
                color={priceDiff <= 0 ? "#16a34a" : "#dc2626"}
                startFillColor={priceDiff <= 0 ? "#22c55e" : "#ef4444"}
                endFillColor="white"
                startOpacity={0.4}
                endOpacity={0.1}
                initialSpacing={40}
                spacing={screenWidth / (chartData.length + 2)}
                thickness={3}
                yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
                xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 10 }}
                hideRules
                yAxisColor="#f1f5f9"
                xAxisColor="#f1f5f9"
                xAxisThickness={1}
                yAxisThickness={1}
                pointerConfig={{
                  pointerStripHeight: 160,
                  pointerStripColor: "#cbd5e1",
                  pointerStripWidth: 2,
                  pointerColor: "#64748b",
                  radius: 6,
                  pointerLabelComponent: (items: any) => {
                    if (!items || !items.length) return null;
                    return (
                      <View className="bg-slate-800 p-2 rounded-lg -ml-10 -mt-10">
                        <Text className="text-white font-bold text-xs">
                          {items[0].dataPointText}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
            ) : (
              <View className="items-center">
                <Activity size={24} color="#cbd5e1" />
                <Text className="text-slate-400 text-xs font-medium text-center mt-4">
                  Cargando evolución...
                </Text>
              </View>
            )}
          </View>

          {stockData.length > 0 && (
            <>
              <View className="mb-6 flex-row items-center px-2">
                <View className="w-1.5 h-6 bg-slate-400 rounded-full mr-3" />
                <Text
                  style={styles.sectionTitle}
                  className="text-slate-800 font-bold"
                >
                  Historial de Stock
                </Text>
              </View>
              <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8 items-center">
                <BarChart
                  data={stockData}
                  barWidth={22}
                  noOfSections={3}
                  barBorderRadius={4}
                  frontColor="lightgray"
                  yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
                  xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 10 }}
                  hideRules
                  yAxisColor="transparent"
                  xAxisColor="#f1f5f9"
                  maxValue={1}
                />
                <View className="flex-row mt-4 space-x-4">
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                    <Text className="text-[10px] text-slate-500">
                      Con Stock
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    <Text className="text-[10px] text-slate-500">
                      Sin Stock
                    </Text>
                  </View>
                </View>
              </View>
            </>
          )}

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
