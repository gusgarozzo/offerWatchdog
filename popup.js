document.addEventListener("DOMContentLoaded", () => {
  const productUrlInput = document.getElementById("productUrl");
  const productNameInput = document.getElementById("productName");
  const useCurrentPageBtn = document.getElementById("useCurrentPage");
  const addProductBtn = document.getElementById("addProduct");
  const productsListDiv = document.getElementById("productsList");
  const productCountSpan = document.getElementById("productCount");
  const emptyStateDiv = document.getElementById("emptyState");
  const statusDiv = document.getElementById("status");
  const verifyingOverlay = document.getElementById("verifying-overlay");
  const toggleBtn = document.getElementById("toggleAddForm");
  const addForm = document.getElementById("addForm");
  const arrow = document.getElementById("toggleArrow");

  toggleBtn.addEventListener("click", () => {
    const expanded = addForm.classList.toggle("expanded");
    addForm.classList.toggle("collapsed", !expanded);
    arrow.textContent = expanded ? "▲" : "▼";
  });

  // Load existing products
  const loadProducts = async () => {
    const { products } = await chrome.storage.sync.get("products");
    const storedProducts = products || [];
    renderProducts(storedProducts);
  };

  // Render products to the UI
  const renderProducts = (products) => {
    productsListDiv.innerHTML = "";
    if (products.length === 0) {
      emptyStateDiv.style.display = "block";
      productCountSpan.textContent = "0 productos";
      return;
    }

    emptyStateDiv.style.display = "none";
    productCountSpan.textContent = `${products.length} producto${
      products.length !== 1 ? "s" : ""
    }`;

    products.forEach((product, index) => {
      const productItem = document.createElement("div");
      productItem.className = "product-item";
      const lastCheckedDate = product.lastChecked
        ? new Date(product.lastChecked).toLocaleString()
        : "Nunca";
      productItem.innerHTML = `
        <div class="product-info">
          <div class="product-name">${product.name || "Sin nombre"}</div>
          <a href="${product.url}" target="_blank" class="product-url">${
        product.url
      }</a>
          <div class="product-price">${
            product.price
              ? `Precio: $${product.price.toLocaleString("es-AR", {
                  minimumFractionDigits: 2,
                })}`
              : "Precio no disponible"
          }</div>
          <div class="product-last-checked">Última verificación: ${lastCheckedDate}</div>
          <div class="product-availability">Disponibilidad: ${
            product.availability || "Desconocida"
          }</div>
        </div>
        <button class="remove-btn" data-index="${index}">Eliminar</button>
      `;
      productsListDiv.appendChild(productItem);
    });

    document.querySelectorAll(".remove-btn").forEach((button) => {
      button.addEventListener("click", handleRemoveProduct);
    });
  };

  // Show status message
  const showStatus = (message, type) => {
    statusDiv.textContent = message;
    statusDiv.className = `status show ${type}`;
    setTimeout(() => {
      statusDiv.className = "status";
    }, 3000);
  };

  // Use current page URL
  useCurrentPageBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab && tab.url) {
      productUrlInput.value = tab.url;
      showStatus("URL de la página actual cargada", "success");
    } else {
      showStatus("No se pudo obtener la URL de la página actual", "error");
    }
  });

  // Mostrar spinner de verificación
  const setVerifying = (verifying) => {
    if (verifying) {
      verifyingOverlay.classList.remove("hidden");
      addProductBtn.disabled = true;
      useCurrentPageBtn.disabled = true;
    } else {
      verifyingOverlay.classList.add("hidden");
      addProductBtn.disabled = false;
      useCurrentPageBtn.disabled = false;
    }
  };

  // Add product
  addProductBtn.addEventListener("click", async () => {
    const url = productUrlInput.value.trim();
    const name = productNameInput.value.trim();

    if (!url) {
      showStatus("Por favor, ingresa una URL de producto", "error");
      return;
    }

    if (!/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(url)) {
      showStatus("Por favor, ingresa una URL válida", "error");
      return;
    }

    let { products } = await chrome.storage.sync.get("products");
    products = products || [];

    products.push({ url, name, price: null, lastChecked: Date.now() });
    await chrome.storage.sync.set({ products });
    renderProducts(products);
    productUrlInput.value = "";
    productNameInput.value = "";
    showStatus("Producto agregado correctamente", "success");

    // Mostrar spinner y pedir verificación inmediata
    setVerifying(true);
    chrome.runtime.sendMessage(
      { action: "checkAllProductsNow" },
      (response) => {
        setVerifying(false);
        loadProducts();
        if (response && response.success) {
          showStatus("Verificación completada", "success");
        } else {
          showStatus("Error al verificar productos", "error");
        }
      }
    );
  });

  // Remove product
  const handleRemoveProduct = async (event) => {
    const index = parseInt(event.target.dataset.index);
    let { products } = await chrome.storage.sync.get("products");
    products = products || [];
    products.splice(index, 1);
    await chrome.storage.sync.set({ products });
    renderProducts(products);
    showStatus("Producto eliminado", "success");
  };

  loadProducts();

  // --- Modal de configuración ---
  const openOptionsBtn = document.getElementById("openOptionsBtn");
  const configModal = document.getElementById("configModal");
  const closeConfigModal = document.getElementById("closeConfigModal");
  const configForm = document.getElementById("configForm");
  const intervalInput = document.getElementById("intervalInput");
  const configStatus = document.getElementById("configStatus");

  // Mostrar el modal
  openOptionsBtn.addEventListener("click", () => {
    configModal.classList.remove("hidden");
    configStatus.textContent = "";
    chrome.storage.sync.get({ checkInterval: 60 }, (data) => {
      intervalInput.value = data.checkInterval;
    });
  });

  // Cerrar el modal con la X
  closeConfigModal.addEventListener("click", () => {
    configModal.classList.add("hidden");
  });

  // Cerrar el modal haciendo clic fuera de la ventana
  configModal.addEventListener("click", (e) => {
    if (e.target === configModal) {
      configModal.classList.add("hidden");
    }
  });

  // Guardar el nuevo intervalo
  configForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newInterval = parseInt(intervalInput.value, 10);
    if (isNaN(newInterval) || newInterval < 1 || newInterval > 1440) {
      configStatus.textContent = "Por favor, ingresa un valor válido (1-1440).";
      configStatus.style.color = "var(--danger)";
      return;
    }
    chrome.storage.sync.set({ checkInterval: newInterval }, () => {
      chrome.runtime.sendMessage(
        { action: "updateCheckInterval", value: newInterval },
        (response) => {
          if (response && response.success) {
            configStatus.textContent = "Intervalo actualizado correctamente.";
            configStatus.style.color = "var(--primary)";
            setTimeout(() => {
              configModal.classList.add("hidden");
            }, 350);
          } else {
            configStatus.textContent = "Error al actualizar el intervalo.";
            configStatus.style.color = "var(--danger)";
          }
        }
      );
    });
  });
});
