// historial.js

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const idx = parseInt(params.get("idx"), 10);
  const titleDiv = document.getElementById("historialTitle");
  const list = document.getElementById("historialList");
  const emptyDiv = document.getElementById("historialEmpty");

  // Obtener el producto
  const { products } = await chrome.storage.sync.get("products");
  const product = products && products[idx];

  if (!product) {
    titleDiv.textContent = "Producto no encontrado";
    emptyDiv.style.display = "block";
    return;
  }

  titleDiv.textContent = `Historial de: ${product.name || "Sin nombre"}`;

  // Cargar historial real desde localForage
  const key = `historial_${product.url}`;
  localforage.getItem(key).then((historial) => {
    if (!historial || historial.length === 0) {
      emptyDiv.style.display = "block";
      list.innerHTML = "";
      return;
    }
    emptyDiv.style.display = "none";
    list.innerHTML = "";
    historial.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "historial-item";
      const fecha = new Date(entry.timestamp).toLocaleString();
      li.innerHTML = `
        <div class="historial-tipo ${entry.cambio}">${
        entry.cambio === "precio" ? "Precio" : "Stock"
      }</div>
        <span class="historial-fecha">${fecha}</span>
        <div class="historial-cambio">
          <span style='color:#888'>De:</span> <span class="de">${
            entry.valorAnterior
          }</span> <span style='color:#888'>a</span> <span class="a">${
        entry.valorNuevo
      }</span>
        </div>
      `;
      list.appendChild(li);
    });
  });
});
