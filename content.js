function runAutoFill() {
  chrome.storage.local.get("rules", data => {
    const rules = data.rules || [];

    if (!rules.length) {
      alert("No autofill rules found");
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

    alert("Form auto-filled 🎉");
  });
}

// Expose to popup
window.runAutoFill = runAutoFill;

chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "RUN_AUTOFILL") runAutoFill();
});
