importScripts("libs/localForage/dist/localforage.min.js");

console.log("background.js: Service Worker mínimo cargado.");

chrome.runtime.onInstalled.addListener(() => {
  console.log(
    "background.js: Extensión instalada/actualizada. Service Worker mínimo."
  );
  chrome.alarms.create("checkProducts", {
    delayInMinutes: 1,
    periodInMinutes: 60, // Comprobar cada 60 minutos
  });
});

// Placeholder para la lógica de monitoreo de precios
// chrome.alarms.create('checkProducts', {
//   delayInMinutes: 1,
//   periodInMinutes: 60 // Comprobar cada 60 minutos
// });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkProducts") {
    console.log("Verificando productos...");
    await checkAllProducts();
  }
});

// Add listener for scripting errors, only if chrome.scripting API is available
/*
if (chrome.scripting && chrome.scripting.onExecuteScript) {
  chrome.scripting.onExecuteScript.addListener((details) => {
    if (details.error) {
      console.error(
        `background.js: Error de ejecución de script en tabId ${details.tabId} para frameId ${details.frameId}: ${details.error}`
      );
    }
  });
} else {
  console.warn(
    "background.js: chrome.scripting.onExecuteScript no disponible al inicializar. Los errores de script no se registrarán globalmente."
  );
}
*/

// --- Función que se inyectará en la página web para extraer la información ---
async function extractProductInfoInPage() {
  let price = null;
  let title = null;
  let availability = null;

  console.log(
    "content.js: --- Inicio de performProductCheckAndExtract (injected) ---"
  );

  // Selectores para el precio, ordenados por probabilidad de éxito (priorizando Schema.org)
  const priceSelectors = [
    '[itemprop="price"]',
    'meta[property="og:price:amount"]',
    'meta[itemprop="price"]',
    '[class*="price"]:not(body)',
    '[id*="price"]',
    ".product-price",
    ".price",
    ".current-price",
    ".item-price",
    "span.andes-money-amount", // Mercado Libre
    ".price-box__final-price",
    ".ui-pdp-price__second-line .ui-pdp-price__part",
  ];

  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      let rawPrice = element.content || element.textContent || "";
      console.log(
        `content.js: Probando selector de precio: ${selector}, Texto encontrado: ${rawPrice}`
      );
      let cleanedPrice = rawPrice.replace(/[^0-9.,]/g, "");
      console.log(`content.js: Precio limpio (sin símbolos): ${cleanedPrice}`);

      if (cleanedPrice.includes(".") && cleanedPrice.includes(",")) {
        cleanedPrice = cleanedPrice.replace(/\./g, "");
        cleanedPrice = cleanedPrice.replace(/,/g, ".");
      } else if (cleanedPrice.includes(",")) {
        cleanedPrice = cleanedPrice.replace(/,/g, ".");
      }
      console.log(
        `content.js: Precio estandarizado (con punto decimal): ${cleanedPrice}`
      );

      const parsedPrice = parseFloat(cleanedPrice);
      if (!isNaN(parsedPrice)) {
        price = parsedPrice;
        console.log(`content.js: Precio extraído: ${price}`);
        break;
      }
    }
  }

  // 1. Explicit availability selectors/keywords
  const checkExplicitAvailability = () => {
    const selectors = [
      '[itemprop="availability"]',
      'meta[property="og:availability"]',
      '[class*="stock"]',
      '[id*="stock"]',
      ".stock-status",
      ".availability",
      ".in-stock",
      ".out-of-stock",
      '[data-stock-status="in-stock"]',
      '[data-stock-status="out-of-stock"]',
      ".product-form__inventory",
      ".inventory-status",
      ".product-add-to-cart__text",
      ".ui-pdp-buybox__quantity",
      ".ui-pdp-action-modal__info--available",
      ".ui-pdp-action-modal__info--out-of-stock",
      ".andes-tooltip__box--availability-in-stock",
      ".andes-tooltip__box--availability-out-of-stock",
      ".stock-message",
      ".stock__available",
      ".stock__unavailable",
      ".product-options__stock-status",
      ".product-add-form__stock",
      ".sold-out-badge",
      ".preorder-badge",
    ];

    const inStockKeywords = [
      "in stock",
      "disponible",
      "en stock",
      "stock disponible",
      "hay stock",
      "últimas unidades",
      "unidades disponibles",
      "comprar",
      "agregar al carrito",
      "disponibilidad inmediata",
      "envío en 24h",
      "en tienda",
      "en línea",
      "stock en sucursal",
      "entrega inmediata",
      "available",
      "add to cart",
      "buy now",
      "in-stock",
      "low stock",
      "on sale",
    ];
    const outOfStockKeywords = [
      "out of stock",
      "agotado",
      "sin stock",
      "no disponible",
      "sold out",
      "temporalmente sin stock",
      "no hay stock",
      "pausada",
      "publicación pausada",
      "no se puede comprar",
      "backorder",
      "preorder",
      "coming soon",
      "unavailable",
      "currently unavailable",
      "out-of-stock",
      "agotados",
      "no en stock",
      "no tenemos más stock",
      "uy! no tenemos más stock",
      "no hay más stock",
      "no hay unidades disponibles",
      "producto sin stock",
      "sin existencias",
      "no queda stock",
    ];

    // --- Detección prioritaria de botones deshabilitados con texto de sin stock ---
    const potentialBuyButtons = document.querySelectorAll(
      'button, a[role="button"], input[type="submit"], [data-testid*="add-to-cart"], [class*="add-to-cart"], [class*="buy-button"], .andes-button--loud'
    );
    for (const button of potentialBuyButtons) {
      const buttonText = (button.value || button.textContent || "")
        .trim()
        .toLowerCase();
      const buttonClasses = button.className
        ? button.className.toLowerCase()
        : "";
      if (
        (button.disabled ||
          button.hasAttribute("disabled") ||
          buttonClasses.includes("nostock")) &&
        outOfStockKeywords.some((keyword) => buttonText.includes(keyword))
      ) {
        return "Out of stock";
      }
    }
    // --- Fin de la detección prioritaria ---

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = (element.content || element.textContent || "")
          .trim()
          .toLowerCase();
        if (inStockKeywords.some((keyword) => text.includes(keyword))) {
          return "In stock";
        }
        if (outOfStockKeywords.some((keyword) => text.includes(keyword))) {
          return "Out of stock";
        }
      }
    }

    const bodyText = document.body.textContent.toLowerCase();
    if (inStockKeywords.some((keyword) => bodyText.includes(keyword))) {
      return "In stock";
    }
    if (outOfStockKeywords.some((keyword) => bodyText.includes(keyword))) {
      return "Out of stock";
    }
    return null;
  };

  availability = checkExplicitAvailability();

  // 2. Infer from buy buttons if not already determined
  if (availability === null) {
    const buyButtonKeywords = [
      "agregar al carrito",
      "comprar",
      "añadir a la cesta",
      "add to cart",
      "buy now",
      "comprar ahora",
      "proceder al pago",
      "finalizar compra",
      "checkout",
      "buy",
    ];
    const potentialBuyButtons = document.querySelectorAll(
      'button, a[role="button"], input[type="submit"], [data-testid*="add-to-cart"], [class*="add-to-cart"], [class*="buy-button"], .andes-button--loud'
    );

    let foundActiveBuyButton = false;
    for (const button of potentialBuyButtons) {
      const buttonText = (button.value || button.textContent || "")
        .trim()
        .toLowerCase();
      if (buyButtonKeywords.some((keyword) => buttonText.includes(keyword))) {
        if (
          !button.disabled &&
          !button.classList.contains("disabled") &&
          !button.hasAttribute("disabled") &&
          button.offsetParent !== null
        ) {
          foundActiveBuyButton = true;
          break;
        }
      }
    }
    if (foundActiveBuyButton) {
      availability = "In stock";
    } else {
      availability = "Out of stock";
    }
  }

  // --- Title Extraction ---
  const titleElement =
    document.querySelector('meta[property="og:title"]') ||
    document.querySelector("h1") ||
    document.querySelector(".ui-pdp-title") || // Mercado Libre
    document.querySelector('[itemprop="name"]') ||
    document.querySelector('[data-name="product-name"]');
  if (titleElement) {
    title = titleElement.content || titleElement.textContent.trim();
    console.log(`content.js: Título extraído: ${title}`);
  }

  console.log("content.js: --- Fin de extracción de información ---");
  console.log(
    `content.js: Resultado final: Precio: ${price}, Título: ${title}, Disponibilidad: ${availability}`
  );
  return { price, title, availability };
}

// --- MutationObserver logic to wait for dynamic content ---
const observeDOMChanges = (timeout = 20000) => {
  return new Promise((resolve) => {
    let observer = null;
    const startTime = Date.now();

    const checkElements = () => {
      const productContainer = document.querySelector(
        ".ui-pdp-container, .product-main-info, .product-detail, .product-layout, .main-content, #product-details, .product-page-content",
        ".product-info-main"
      );
      const priceElement = document.querySelector(
        '[itemprop="price"], span.andes-money-amount, div.product-price, .price-box__final-price, .current-price'
      );
      const availabilityElement = document.querySelector(
        '[itemprop="availability"], meta[property="og:availability"], .stock-status, .availability, .in-stock, .out-of-stock, .ui-pdp-buybox__quantity, .andes-tooltip__box--availability-in-stock, .stock-message'
      );
      const buyButton = document.querySelector(
        'button[data-testid*="add-to-cart"], button[class*="add-to-cart"], button[class*="buy"], .andes-button--loud, .buy-button, .add-to-cart-button'
      );

      if (
        productContainer ||
        priceElement ||
        availabilityElement ||
        buyButton
      ) {
        console.log(
          "content.js: MutationObserver: Contenedor de producto o elementos clave detectados."
        );
        return true;
      }
      return false;
    };

    if (checkElements()) {
      resolve(true);
      return;
    }

    observer = new MutationObserver((mutations, obs) => {
      if (checkElements()) {
        obs.disconnect();
        resolve(true);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    setTimeout(() => {
      console.warn(
        "content.js: MutationObserver: Tiempo de espera agotado. No se encontraron elementos clave."
      );
      if (observer) observer.disconnect();
      resolve(false);
    }, timeout);
  });
};

// Lógica principal de background.js
const checkProduct = async (product, allProducts, index) => {
  let tabId;
  let tabCreated = false;
  try {
    const newTab = await chrome.tabs.create({
      url: product.url,
      active: false,
    });
    tabId = newTab.id;
    tabCreated = true;

    await new Promise((resolve) => {
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }, 20000);

      const listener = (tabIdUpdated, changeInfo) => {
        if (tabIdUpdated === tabId && changeInfo.status === "complete") {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeout);
            chrome.tabs.onUpdated.removeListener(listener);
            resolve();
          }
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractProductInfoInPage,
    });

    const productInfo = result && result.result;

    if (productInfo) {
      const { price, title, availability } = productInfo;
      let notificationMessage = null;
      let oldPrice = product.price;
      let oldAvailability = product.availability;

      if (price !== null && price !== product.price) {
        oldPrice = product.price;
        product.price = price;
        notificationMessage = `${
          title || product.name || product.url
        } ha cambiado de precio: de ${
          oldPrice ? `$${oldPrice.toFixed(2)}` : "desconocido"
        } a $${price.toFixed(2)}`;
        if (oldPrice !== null && oldPrice !== undefined) {
          registrarCambioHistorial(product, "precio", oldPrice, price);
        }
      }

      if (availability && availability !== product.availability) {
        oldAvailability = product.availability;
        product.availability = availability;
        if (notificationMessage) {
          notificationMessage += ` y su disponibilidad cambió de ${
            oldAvailability || "desconocido"
          } a ${availability}`;
        } else {
          notificationMessage = `${
            title || product.name || product.url
          } ha cambiado de disponibilidad: de ${
            oldAvailability || "desconocido"
          } a ${availability}`;
        }
        if (oldAvailability !== null && oldAvailability !== undefined) {
          registrarCambioHistorial(
            product,
            "disponibilidad",
            oldAvailability,
            availability
          );
        }
      }

      if (title && !product.name) {
        product.name = title;
      }

      product.lastChecked = Date.now();

      // Guardar el producto actualizado en el array y en storage
      if (Array.isArray(allProducts) && typeof index === "number") {
        allProducts[index] = { ...product };
        await chrome.storage.sync.set({ products: allProducts });
      }

      if (notificationMessage) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "images/icon48.png",
          title: "Cambio en Producto Detectado",
          message: notificationMessage,
          priority: 2,
        });
      }
    } else {
      console.warn("No se pudo extraer información del producto:", product.url);
    }
  } catch (error) {
    product.lastChecked = Date.now();
    console.error("Error al verificar producto:", product.url, error);
  } finally {
    if (tabCreated && tabId !== undefined) {
      await chrome.tabs.remove(tabId);
    }
  }
};

const checkAllProducts = async () => {
  let { products } = await chrome.storage.sync.get("products");
  products = products || [];

  // Ejecutar verificación y guardar cada producto actualizado
  const checkPromises = products.map((product, idx) =>
    checkProduct(product, products, idx)
  );
  await Promise.all(checkPromises);
  // Ya se guardan los productos dentro de checkProduct
};

// --- INICIO: Listener unificado de mensajes ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkAllProductsNow") {
    checkAllProducts().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  if (message.action === "abrirHistorial") {
    const idx = message.idx;
    const url = chrome.runtime.getURL(`historial.html?idx=${idx}`);
    if (historialWindows[idx] && historialWindows[idx].id) {
      chrome.windows.update(
        historialWindows[idx].id,
        { focused: true },
        () => {}
      );
      return;
    }
    chrome.windows.create(
      {
        url,
        type: "popup",
        width: 400,
        height: 500,
        focused: true,
      },
      (win) => {
        historialWindows[idx] = { id: win.id };
        chrome.windows.onRemoved.addListener(function removedListener(
          closedId
        ) {
          if (closedId === win.id) {
            delete historialWindows[idx];
            chrome.windows.onRemoved.removeListener(removedListener);
          }
        });
      }
    );
  }
});
// --- FIN: Listener unificado de mensajes ---

// --- INICIO: Funciones de historial con localForage ---
function registrarCambioHistorial(product, cambio, valorAnterior, valorNuevo) {
  if (typeof localforage === "undefined") {
    console.warn("localforage no está disponible en background.js");
    return;
  }
  const entry = {
    productUrl: product.url,
    timestamp: Date.now(),
    cambio,
    valorAnterior,
    valorNuevo,
  };
  const key = `historial_${product.url}`;
  localforage.getItem(key).then((historial) => {
    historial = historial || [];
    historial.unshift(entry); // más reciente primero
    return localforage.setItem(key, historial);
  });
}
// --- FIN: Funciones de historial con localForage ---

// --- INICIO: Gestión de ventanas de historial ---
const historialWindows = {};
