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
      ".ui-pdp-buybox__quantity", // Mercado Libre
      ".ui-pdp-action-modal__info--available", // Mercado Libre
      ".ui-pdp-action-modal__info--out-of-stock", // Mercado Libre
      ".andes-tooltip__box--availability-in-stock", // Mercado Libre
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
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = (element.content || element.textContent || "")
          .trim()
          .toLowerCase();
        console.log(
          `content.js: Probando selector de disponibilidad: ${selector}, Texto encontrado: ${text}`
        );
        if (inStockKeywords.some((keyword) => text.includes(keyword))) {
          console.log(`content.js: Disponibilidad explícita: In stock`);
          return "In stock";
        }
        if (outOfStockKeywords.some((keyword) => text.includes(keyword))) {
          console.log(`content.js: Disponibilidad explícita: Out of stock`);
          return "Out of stock";
        }
      }
    }

    const bodyText = document.body.textContent.toLowerCase();
    console.log("content.js: Buscando palabras clave en el texto del cuerpo.");
    if (inStockKeywords.some((keyword) => bodyText.includes(keyword))) {
      console.log(`content.js: Disponibilidad implícita (body): In stock`);
      return "In stock";
    }
    if (outOfStockKeywords.some((keyword) => bodyText.includes(keyword))) {
      console.log(`content.js: Disponibilidad implícita (body): Out of stock`);
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
      const buttonText = button.textContent.trim().toLowerCase();
      console.log(
        `content.js: Probando botón de compra: ${button.outerHTML.substring(
          0,
          50
        )}... Texto: ${buttonText}`
      );
      if (buyButtonKeywords.some((keyword) => buttonText.includes(keyword))) {
        if (
          !button.disabled &&
          !button.classList.contains("disabled") &&
          !button.hasAttribute("disabled") &&
          button.offsetParent !== null
        ) {
          foundActiveBuyButton = true;
          console.log(`content.js: Botón de compra activo encontrado.`);
          break;
        }
      }
    }
    if (foundActiveBuyButton) {
      availability = "In stock";
    } else {
      availability = "Out of stock";
      console.log(
        `content.js: No se encontró botón de compra activo o indicador explícito, asumiendo: Out of stock.`
      );
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
const checkProduct = async (product) => {
  try {
    let tabId;
    const existingTabs = await chrome.tabs.query({ url: product.url });
    let tabFound = false;

    if (existingTabs.length > 0) {
      tabId = existingTabs[0].id;
      await chrome.tabs.update(tabId, { active: false });
      tabFound = true;
      console.log(
        `background.js: Usando pestaña existente para ${product.url}, tabId: ${tabId}`
      );
    } else {
      const newTab = await chrome.tabs.create({
        url: product.url,
        active: false,
      });
      tabId = newTab.id;
      console.log(
        `background.js: Creando nueva pestaña para ${product.url}, tabId: ${tabId}`
      );
    }

    // Wait for the tab to be fully loaded
    await new Promise((resolve) => {
      const listener = (tabIdUpdated, changeInfo, tab) => {
        if (tabIdUpdated === tabId && changeInfo.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          console.log(`background.js: Pestaña ${tabId} cargada completamente.`);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    console.log(
      `background.js: Intentando ejecutar función de extracción en tabId: ${tabId}`
    );
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: extractProductInfoInPage, // Ejecutar la función directamente
    });
    console.log(
      `background.js: Función de extracción ejecutada con éxito en tabId: ${tabId}`
    );

    const productInfo = result && result.result;

    if (productInfo) {
      const { price, title, availability } = productInfo;
      let notificationMessage = null;
      console.log(
        `background.js: Información recibida para ${product.url}: Precio: ${price}, Disponibilidad: ${availability}`
      );

      // Check for price change
      if (price !== null && price !== product.price) {
        const oldPrice = product.price;
        product.price = price;
        notificationMessage = `${
          title || product.name || product.url
        } ha cambiado de precio: de ${
          oldPrice ? `$${oldPrice.toFixed(2)}` : "desconocido"
        } a $${price.toFixed(2)}`;
        console.log(
          `Precio actualizado para ${
            title || product.name || product.url
          }: de ${oldPrice} a ${price}`
        );
      }

      // Check for availability change
      if (availability && availability !== product.availability) {
        const oldAvailability = product.availability;
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
        console.log(
          `Disponibilidad actualizada para ${
            title || product.name || product.url
          }: de ${oldAvailability} a ${availability}`
        );
      }

      // Update product name if not set initially and title is available
      if (title && !product.name) {
        product.name = title;
      }

      product.lastChecked = Date.now();

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
      console.warn(
        `background.js: No se recibió información del producto para ${product.url}.`
      );
    }
    // Only remove the tab if it was created by the extension for checking
    if (!tabFound && tabId !== undefined) {
      console.log(
        `background.js: Cerrando pestaña creada para verificación: ${tabId}`
      );
      await chrome.tabs.remove(tabId);
    }
  } catch (error) {
    console.error(`background.js: Error al verificar ${product.url}:`, error);
    // Update lastChecked even if there was an error, to avoid re-checking too soon
    product.lastChecked = Date.now();
  }
};

const checkAllProducts = async () => {
  let { products } = await chrome.storage.sync.get("products");
  products = products || [];

  // Create an array of promises for each product check
  const checkPromises = products.map((product) => checkProduct(product));

  // Wait for all product checks to complete concurrently
  await Promise.all(checkPromises);

  // Save any updates to lastChecked or names that might have occurred without a price change
  await chrome.storage.sync.set({ products });
};
