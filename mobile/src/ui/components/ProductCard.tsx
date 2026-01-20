import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Product } from "../../core/entities/Product";
import { Clock, Package, History, ChevronRight } from "lucide-react-native";

interface ProductCardProps {
  product: Product;
  onPress: () => void;
}

export const ProductCard = ({ product, onPress }: ProductCardProps) => {
  const formattedPrice = product.price
    ? `$${product.price.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
    : "Precio no disponible";

  const lastCheckedDate = product.lastChecked
    ? new Date(product.lastChecked).toLocaleString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    : "Nunca";

  const isInStock = product.availability === "In stock";

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.card}
      activeOpacity={0.8}
      className="bg-white rounded-[24px] mb-4 border border-slate-100 flex-row overflow-hidden"
    >
      <View
        style={styles.imageContainer}
        className="bg-slate-50 items-center justify-center border-r border-slate-50"
      >
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.image} />
        ) : (
          <View className="bg-primary/5 w-12 h-12 rounded-xl items-center justify-center">
            <Package size={24} color="#2563eb" />
          </View>
        )}
      </View>

      <View style={styles.infoContainer} className="flex-1 p-5">
        <View className="flex-row justify-between items-start mb-1">
          <Text
            numberOfLines={1}
            style={styles.name}
            className="flex-1 font-bold text-slate-800"
          >
            {product.name || "Sin nombre"}
          </Text>
          <ChevronRight size={16} color="#cbd5e1" />
        </View>

        <Text
          numberOfLines={1}
          style={styles.url}
          className="text-slate-400 mb-3"
        >
          {product.url}
        </Text>

        <View className="flex-row items-center justify-between">
          <Text style={styles.price} className="text-primary font-black">
            {formattedPrice}
          </Text>
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

        <View className="flex-row items-center mt-4 pt-3 border-t border-slate-50">
          <Clock size={10} color="#94a3b8" />
          <Text
            style={styles.footerText}
            className="text-slate-400 ml-1.5 font-medium"
          >
            Verificado {lastCheckedDate}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    elevation: 4,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  imageContainer: {
    width: 95,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  infoContainer: {
    minHeight: 120,
  },
  name: {
    fontSize: 16,
    letterSpacing: -0.2,
  },
  url: {
    fontSize: 10,
    letterSpacing: 0,
  },
  price: {
    fontSize: 18,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footerText: {
    fontSize: 9,
  },
});
