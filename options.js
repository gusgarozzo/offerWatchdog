document.addEventListener("DOMContentLoaded", () => {
  const intervalInput = document.getElementById("intervalInput");
  const optionsForm = document.getElementById("optionsForm");
  const optionsStatus = document.getElementById("optionsStatus");

  // Cargar el valor actual al abrir la página
  chrome.storage.sync.get({ checkInterval: 60 }, (data) => {
    intervalInput.value = data.checkInterval;
  });

  // Guardar el nuevo valor y notificar a background.js
  optionsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newInterval = parseInt(intervalInput.value, 10);
    if (isNaN(newInterval) || newInterval < 1 || newInterval > 1440) {
      optionsStatus.textContent =
        "Por favor, ingresa un valor válido (1-1440).";
      optionsStatus.style.color = "var(--danger)";
      return;
    }
    chrome.storage.sync.set({ checkInterval: newInterval }, () => {
      chrome.runtime.sendMessage(
        { action: "updateCheckInterval", value: newInterval },
        (response) => {
          if (response && response.success) {
            optionsStatus.textContent = "Intervalo actualizado correctamente.";
            optionsStatus.style.color = "var(--primary)";
          } else {
            optionsStatus.textContent = "Error al actualizar el intervalo.";
            optionsStatus.style.color = "var(--danger)";
          }
        }
      );
    });
  });
});
