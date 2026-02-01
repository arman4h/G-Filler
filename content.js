function showPageToast(message) {
  const existingToast = document.getElementById("gfiller-toast");
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement("div");
  toast.id = "gfiller-toast";
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.right = "20px";
  toast.style.zIndex = "99999";
  toast.style.background = "#111827";
  toast.style.color = "#ffffff";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "10px";
  toast.style.fontSize = "13px";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 10px 25px rgba(0, 0, 0, 0.3)";
  toast.style.maxWidth = "260px";
  toast.style.textAlign = "center";
  toast.style.transition = "opacity 0.3s ease";
  toast.style.opacity = "0";

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function runAutoFill() {
  chrome.storage.local.get("rules", data => {
    const rules = data.rules || [];

    if (!rules.length) {
      showPageToast("No autofill rules found");
      return;
    }

    const questions = document.querySelectorAll('div[role="listitem"]');

    questions.forEach(q => {
      const questionText = q.innerText.toLowerCase();
      const input = q.querySelector("input[type='text'], input[type='email'], textarea");

      if (!input || input.value) return;

      rules.forEach(rule => {
        rule.tags.forEach(tag => {
          if (questionText.includes(tag)) {
            input.value = rule.value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
          }
        });
      });
    });

    showPageToast("Form auto-filled 🎉");
  });
}

// Expose to popup
window.runAutoFill = runAutoFill;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "RUN_AUTOFILL") runAutoFill();
});
