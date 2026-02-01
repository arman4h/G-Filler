const dataList = document.getElementById("dataList");
const formSection = document.getElementById("formSection");
const addDataBtn = document.getElementById("addDataBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const autoFillBtn = document.getElementById("autoFillBtn");
const fieldNameInput = document.getElementById("fieldName");
const fieldValueInput = document.getElementById("fieldValue");
const fieldTagsInput = document.getElementById("fieldTags");
const itemCount = document.getElementById("itemCount");
const seeAllBtn = document.getElementById("seeAllBtn");
const themeToggle = document.getElementById("themeToggle");
const toast = document.getElementById("toast");
const confirmOverlay = document.getElementById("confirmOverlay");
const confirmMessage = document.getElementById("confirmMessage");
const confirmYes = document.getElementById("confirmYes");
const confirmNo = document.getElementById("confirmNo");

let editingIndex = null;
const MAX_VISIBLE_ITEMS = 4;
let toastTimeout = null;

// Toast notification function
function showToast(message, duration = 2000) {
  toast.textContent = message;
  toast.classList.add("show");

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// Custom confirm dialog
function showConfirm(message) {
  return new Promise((resolve) => {
    confirmMessage.textContent = message;
    confirmOverlay.classList.add("show");

    function handleYes() {
      confirmOverlay.classList.remove("show");
      confirmYes.removeEventListener("click", handleYes);
      confirmNo.removeEventListener("click", handleNo);
      confirmOverlay.removeEventListener("click", handleOverlayClick);
      document.removeEventListener("keydown", handleKeyDown);
      resolve(true);
    }

    function handleNo() {
      confirmOverlay.classList.remove("show");
      confirmYes.removeEventListener("click", handleYes);
      confirmNo.removeEventListener("click", handleNo);
      confirmOverlay.removeEventListener("click", handleOverlayClick);
      document.removeEventListener("keydown", handleKeyDown);
      resolve(false);
    }

    function handleOverlayClick(event) {
      if (event.target === confirmOverlay) {
        handleNo();
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        handleNo();
      }
    }

    confirmYes.addEventListener("click", handleYes);
    confirmNo.addEventListener("click", handleNo);
    confirmOverlay.addEventListener("click", handleOverlayClick);
    document.addEventListener("keydown", handleKeyDown);
  });
}

// Migrate data from sync to local storage if needed
function migrateStorage() {
  // First check if data exists in local storage
  chrome.storage.local.get("rules", localData => {
    if (localData.rules && localData.rules.length > 0) {
      loadRules();
      return;
    }

    // If local is empty, check sync storage
    chrome.storage.sync.get("rules", syncData => {
      if (syncData.rules && syncData.rules.length > 0) {
        chrome.storage.local.set({ rules: syncData.rules }, () => {
          loadRules();
        });
      } else {
        loadRules();
      }
    });
  });
}

// Load and display rules
function loadRules() {
  chrome.storage.local.get("rules", data => {
    const rules = data.rules || [];
    renderDataList(rules);
  });
}

// Render data list
function renderDataList(rules) {
  dataList.innerHTML = "";
  itemCount.textContent = `${rules.length} ${rules.length === 1 ? "item" : "items"}`;

  const visibleRules = rules.slice(0, MAX_VISIBLE_ITEMS);
  
  visibleRules.forEach((rule, index) => {
    
    const item = document.createElement("div");
    item.className = "data-item";
    item.innerHTML = `
      <div class="data-item-content">
        <div class="data-item-label">${rule.fieldName || 'NAME'}</div>
        <div class="data-item-value">${rule.value}</div>
      </div>
      <div class="data-item-actions">
        <button class="icon-btn edit-btn" data-index="${index}" title="Edit"><span class="material-icons-outlined">edit</span></button>
        <button class="icon-btn delete-btn" data-index="${index}" title="Delete"><span class="material-icons-outlined">delete</span></button>
      </div>
    `;
    dataList.appendChild(item);
  });
  
  // Show "See all data" link if more than MAX_VISIBLE_ITEMS
  if (rules.length > MAX_VISIBLE_ITEMS) {
    seeAllBtn.classList.remove("hidden");
  } else {
    seeAllBtn.classList.add("hidden");
  }
  
  // Add event listeners to edit/delete buttons
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'));
      editRule(index);
    };
  });
  
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index'));
      deleteRule(index);
    };
  });
}

// Show form for adding/editing
function showForm(index = null) {
  chrome.storage.local.get("rules", data => {
    const rules = data.rules || [];
    
    if (index !== null) {
      const rule = rules[index];
      fieldNameInput.value = rule.fieldName || "";
      fieldValueInput.value = rule.value || "";
      fieldTagsInput.value = (rule.tags || []).join(", ");
      editingIndex = index;
      saveBtn.textContent = "Update";
    } else {
      fieldNameInput.value = "";
      fieldValueInput.value = "";
      fieldTagsInput.value = "";
      editingIndex = null;
      saveBtn.textContent = "Save";
    }
    
    formSection.classList.remove("hidden");
    formSection.classList.add("active");
    fieldNameInput.focus();
  });
}

// Hide form
function hideForm() {
  formSection.classList.add("hidden");
  formSection.classList.remove("active");
  editingIndex = null;
}

// Save rule
function saveRule() {
  const fieldName = fieldNameInput.value.trim();
  const value = fieldValueInput.value.trim();
  const tags = fieldTagsInput.value
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
  
  if (!fieldName || !value || !tags.length) {
    showToast("Please fill all fields");
    return;
  }
  
  chrome.storage.local.get("rules", data => {
    let rules = data.rules || [];
    
    if (editingIndex !== null) {
      rules[editingIndex] = { fieldName, value, tags };
    } else {
      rules.push({ fieldName, value, tags });
    }
    
    // Save to both local and sync storage
    chrome.storage.local.set({ rules }, () => {
      chrome.storage.sync.set({ rules }, () => {
        showToast(editingIndex !== null ? "Rule updated ✅" : "Rule added ✅");
        hideForm();
        loadRules();
      });
    });
  });
}

// Edit rule
function editRule(index) {
  showForm(index);
}

// Delete rule
async function deleteRule(index) {
  const confirmed = await showConfirm("Delete this rule?");
  if (!confirmed) return;
  
  chrome.storage.local.get("rules", data => {
    let rules = data.rules || [];
    rules.splice(index, 1);
    
    // Save to both local and sync to ensure complete deletion
    chrome.storage.local.set({ rules }, () => {
      chrome.storage.sync.set({ rules }, () => {
        showToast("Rule deleted ✅");
        loadRules();
      });
    });
  });
}

// Auto fill form
function autoFill() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;
    
    chrome.tabs.sendMessage(tabId, { type: "RUN_AUTOFILL" }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script not loaded, inject it
        chrome.scripting.executeScript(
          { target: { tabId }, files: ["content.js"] },
          () => {
            setTimeout(() => {
              chrome.tabs.sendMessage(tabId, { type: "RUN_AUTOFILL" });
            }, 500);
          }
        );
      }
    });
  });
}

// Event listeners
addDataBtn.onclick = () => showForm();
saveBtn.onclick = saveRule;
cancelBtn.onclick = hideForm;
autoFillBtn.onclick = autoFill;

seeAllBtn.onclick = () => {
  chrome.storage.local.get("rules", data => {
    const rules = data.rules || [];
    showToast(`Total ${rules.length} data items stored`);
  });
};

// Theme toggle
const lightIcon = document.getElementById("lightIcon");
const darkIcon = document.getElementById("darkIcon");

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  lightIcon.classList.toggle("hidden");
  lightIcon.classList.toggle("block");
  darkIcon.classList.toggle("hidden");
  darkIcon.classList.toggle("block");
};

// Load rules on open
migrateStorage();
