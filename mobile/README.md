# Offer Watchdog - Mobile App (Expo)

Esta es la versión mobile de **Offer Watchdog**, construida con **React Native (Expo SDK 54)**. Permite monitorear precios y disponibilidad de productos directamente desde tu celular con notificaciones nativas y una interfaz premium.

---

## 🛠️ Tecnologías

- **Framework**: Expo SDK 54 (React Native)
- **Styling**: NativeWind v4 (Tailwind CSS para React Native)
- **State Management**: Zustand
- **Navegación**: React Navigation
- **Networking/Scraping**: `node-html-parser` + `fetch` con Custom User Agents
- **Animaciones**: React Native Reanimated v4 (Nueva Arquitectura)

---

## 📦 Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (versión 18 o superior).
2. **npm** o **yarn**.
3. **Expo Go** (descárgalo en tu celular desde App Store o Play Store para probar).

---

## 🖥️ Instalación y Configuración

1. **Navega a la carpeta mobile**:

   ```bash
   cd mobile
   ```

2. **Instala las dependencias**:

   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo**:
   ```bash
   npx expo start
   ```

---

## 📱 Cómo Alternar y Probar

### Usando Expo Go (Recomendado para pruebas rápidas)

1. Escanea el código QR que aparece en la terminal con la cámara de tu celular (iOS) o desde la app **Expo Go** (Android).
2. **IMPORTANTE**: Debido a que usamos **SDK 54** y **Reanimated 4**, asegúrate de que tu versión de Expo Go esté actualizada. La app está configurada para usar la **Nueva Arquitectura** y **Edge-to-Edge** por defecto.

### Solución de problemas comunes

Si experimentas errores de "Worklets mismatch" o la app se cierra inesperadamente en Expo Go, intenta limpiar el cache:

```bash
npx expo start --clear
```

---

## ⚙️ Características de la Versión Mobile

- **Panel Intuitivo**: Lista de productos con indicadores de tendencia (subida/bajada de precio).
- **Formulario Inteligente**: Sección plegable para agregar productos pegando la URL.
- **Configuración Local**: Cambia el intervalo de verificación directamente desde la app.
- **Scraper Avanzado**: Soporte mejorado para Amazon (vía JSON-LD y selectores específicos) y Mercado Libre.
- **Soporte al Desarrollador**: Enlace directo para "Cafecito" integrado en la configuración.

---

## 📄 Licencia

Este proyecto es software propietario. Queda prohibida la copia, distribución o uso del código fuente sin autorización expresa del autor.
