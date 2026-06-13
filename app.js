/**
 * HomeworkMaster - Application Logic (English UI & Belgian Dutch Homework Output)
 * State-driven multi-view dashboard for Flemish Homework Builder
 */

// Default Gemini Models to use as cache/fallback before API fetch
const DEFAULT_MODELS = [
  { name: "gemini-1.5-pro", displayName: "Gemini 1.5 Pro (Flagship - Recommended for complex Math/Languages)", description: "Best for deep understanding, multi-step math, translation, and structured curriculum alignment." },
  { name: "gemini-1.5-flash", displayName: "Gemini 1.5 Flash (Fast)", description: "High-speed model ideal for simple exercises, vocab lists, and quick homework drafts." },
  { name: "gemini-2.0-flash", displayName: "Gemini 2.0 Flash (Latest)", description: "Next-gen fast model with improved reasoning capabilities." },
  { name: "gemini-2.0-pro-exp-02-05", displayName: "Gemini 2.0 Pro Experimental", description: "Google's experimental high-intelligence model for top-tier reasoning." }
];

// Global State
let state = {
  settings: {
    geminiApiKey: "",
    schoolLevel: "primary", // 'primary' or 'secondary'
    geminiModel: "gemini-1.5-pro",
    availableModels: [] // Populated dynamically via fetchModelsFromApi
  },
  activeView: "dashboard", // 'dashboard', 'channels', 'mistakes', 'settings'
  activeChannelId: null,
  activePreviewTab: "opgaven", // 'opgaven' (exercises) or 'oplossingen' (solutions)
  currentSheet: null, // Holds the active generated exercises + answers
  channels: [],
  mistakes: [],
  materials: [] // Temp files for active channel/session
};

// Initial setup data for Demo Mode
const DEMO_CHANNELS = [
  {
    id: "ch-1",
    studentName: "Laura",
    grade: "Primary School - 6th Grade (6e Leerjaar)",
    subject: "Mathematics",
    textbook: "Reken Maar 6!",
    messages: [
      { sender: "assistant", text: "Hello! I am your HomeworkMaster. I have loaded the learning goals for **6th Grade Mathematics (Wiskunde)**. For *Reken Maar 6!*, Block 10 focuses on percentages, equalizing fractions, and volume calculations. Feel free to upload a textbook page/test, or type your instructions below!" },
      { sender: "user", text: "We need to practice Block 10 extra. Especially fractions and percentages." },
      { sender: "assistant", text: "Got it! I can generate 10 to 40 exercises that align with Block 10 of *Reken Maar 6!*. Choose the number of exercises in the wizard below and click 'Generate Sheet', or type 'generate 15 exercises'." }
    ],
    generatedSheets: [
      {
        id: 101,
        title: "Oefenblad: Wiskunde - Breuken & Procenten",
        grade: "Primary School - 6th Grade (6e Leerjaar)",
        subject: "Mathematics",
        textbook: "Reken Maar 6!",
        exercises: [
          { number: 1, question: "Bereken de som en vereenvoudig: <br>\\( \\frac{1}{3} + \\frac{1}{2} = ... \\)", space: true },
          { number: 2, question: "Bereken de som en vereenvoudig: <br>\\( \\frac{3}{4} + \\frac{1}{6} = ... \\)", space: true },
          { number: 3, question: "Hoeveel is 25% van € 200?", space: true },
          { number: 4, question: "Zet de breuk om naar een percentage: <br>\\( \\frac{1}{5} \\) = ... %", space: false },
          { number: 5, question: "Bereken het product: 2,5 &times; 4 = ...", space: true }
        ],
        answers: [
          { number: 1, solution: "Gelijknamig maken op noemer 6: \\( \\frac{2}{6} + \\frac{3}{6} = \\frac{5}{6} \\)" },
          { number: 2, solution: "Gelijknamig maken op noemer 12: \\( \\frac{9}{12} + \\frac{2}{12} = \\frac{11}{12} \\)" },
          { number: 3, solution: "25% van € 200 = \\( \\frac{25}{100} \\times 200 = 50 \\)" },
          { number: 4, solution: "\\( \\frac{1}{5} = \\frac{20}{100} = 20\\% \\)" },
          { number: 5, solution: "2,5 &times; 4 = 10" }
        ]
      }
    ]
  },
  {
    id: "ch-2",
    studentName: "Thomas",
    grade: "Secondary School - 2nd Year (2e Jaar A-Stroom)",
    subject: "Latin",
    textbook: "Pegasus 2",
    messages: [
      { sender: "assistant", text: "Salvete! I have loaded the Latin vocabulary and grammar goals for **Pegasus 2** (Perfectum verb stems, accusativus cum infinitivo). What lessons or chapters would you like to practice today?" }
    ],
    generatedSheets: [
      {
        id: 102,
        title: "Oefenblad: Latijnse Woordenschat",
        grade: "Secondary School - 2nd Year (2e Jaar A-Stroom)",
        subject: "Latin",
        textbook: "Pegasus 2",
        exercises: [
          { number: 1, question: "Geef de Nederlandse betekenis: <b>\"dominus\"</b>", space: false },
          { number: 2, question: "Geef de Nederlandse betekenis: <b>\"puella\"</b>", space: false },
          { number: 3, question: "Geef de Nederlandse betekenis: <b>\"urbs\"</b>", space: false },
          { number: 4, question: "Geef de Nederlandse betekenis: <b>\"miles\"</b>", space: false },
          { number: 5, question: "Geef de Nederlandse betekenis: <b>\"magnus\"</b>", space: false }
        ],
        answers: [
          { number: 1, solution: "meester / heer" },
          { number: 2, solution: "meisje" },
          { number: 3, solution: "stad" },
          { number: 4, solution: "soldaat" },
          { number: 5, solution: "groot" }
        ]
      }
    ]
  }
];

const DEMO_MISTAKES = [
  {
    id: "m-1",
    studentName: "Laura",
    subject: "Mathematics",
    topic: "Gelijknamige Breuken (Equal Fractions)",
    description: "Vergeet de noemer gelijk te maken bij het optellen van breuken (schrijft bijv. 1/3 + 1/2 = 2/5 in plaats van 5/6).",
    date: "2026-05-21",
    status: "active"
  },
  {
    id: "m-2",
    studentName: "Thomas",
    subject: "French",
    topic: "Passé Composé met Être",
    description: "Past het geslacht en getal van het voltooid deelwoord niet aan bij vrouwelijke/meervoudige onderwerpen (vertaalt 'Elle is gekomen' als 'Elle est venu' in plaats van 'venue').",
    date: "2026-05-20",
    status: "active"
  }
];

// Local Storage Helpers
function saveState() {
  localStorage.setItem("homeworkmaster_state", JSON.stringify({
    settings: state.settings,
    channels: state.channels,
    mistakes: state.mistakes
  }));
}

function loadState() {
  const saved = localStorage.getItem("homeworkmaster_state");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.settings = parsed.settings || state.settings;
      state.channels = parsed.channels || [];
      state.mistakes = parsed.mistakes || [];
    } catch (e) {
      console.error("Error loading localStorage state:", e);
    }
  }
  
  // Set defaults if empty
  if (state.channels.length === 0) {
    state.channels = JSON.parse(JSON.stringify(DEMO_CHANNELS));
  } else {
    // Inject the demo sheets if missing from ch-1 / ch-2 to facilitate immediate testing
    state.channels.forEach(ch => {
      if (ch.id === "ch-1" && (!ch.generatedSheets || ch.generatedSheets.length === 0)) {
        const demoCh = DEMO_CHANNELS.find(d => d.id === "ch-1");
        if (demoCh) ch.generatedSheets = JSON.parse(JSON.stringify(demoCh.generatedSheets));
      }
      if (ch.id === "ch-2" && (!ch.generatedSheets || ch.generatedSheets.length === 0)) {
        const demoCh = DEMO_CHANNELS.find(d => d.id === "ch-2");
        if (demoCh) ch.generatedSheets = JSON.parse(JSON.stringify(demoCh.generatedSheets));
      }
    });
  }
  if (state.mistakes.length === 0) {
    state.mistakes = [...DEMO_MISTAKES];
  }
  
  // Fill default models if availableModels is empty
  if (!state.settings.availableModels || state.settings.availableModels.length === 0) {
    state.settings.availableModels = [...DEFAULT_MODELS];
  }
  
  if (state.channels.length > 0 && !state.activeChannelId) {
    state.activeChannelId = state.channels[0].id;
  }
}

// Router & View Controller
function switchView(viewName) {
  state.activeView = viewName;
  
  // Hide all view panels
  document.getElementById("view-dashboard").style.display = "none";
  document.getElementById("view-channels").style.display = "none";
  document.getElementById("view-mistakes").style.display = "none";
  document.getElementById("view-settings").style.display = "none";
  
  // Remove active states from nav rail buttons
  document.querySelectorAll(".rail-btn").forEach(btn => btn.classList.remove("active"));
  
  // Display active view and highlight rail
  if (viewName === "dashboard") {
    document.getElementById("view-dashboard").style.display = "block";
    document.querySelector('[data-view="dashboard"]').classList.add("active");
    document.getElementById("sidebar-channels").classList.add("hidden");
    renderDashboard();
  } else if (viewName === "channels") {
    document.getElementById("view-channels").style.display = "flex";
    document.querySelector('[data-view="channels"]').classList.add("active");
    document.getElementById("sidebar-channels").classList.remove("hidden");
    renderChannelView();
  } else if (viewName === "mistakes") {
    document.getElementById("view-mistakes").style.display = "block";
    document.querySelector('[data-view="mistakes"]').classList.add("active");
    document.getElementById("sidebar-channels").classList.add("hidden");
    renderMistakesView();
  } else if (viewName === "settings") {
    document.getElementById("view-settings").style.display = "block";
    document.querySelector('[data-view="settings"]').classList.add("active");
    document.getElementById("sidebar-channels").classList.add("hidden");
    renderSettingsView();
  }
}

// View Renderer - Dashboard
function renderDashboard() {
  const container = document.getElementById("view-dashboard");
  
  // Calculate stats
  const totalSheets = state.channels.reduce((acc, ch) => acc + (ch.generatedSheets ? ch.generatedSheets.length : 0), 0);
  const activeMistakes = state.mistakes.filter(m => m.status === "active").length;
  
  container.innerHTML = `
    <div class="view-header">
      <h1>HomeworkMaster Dashboard</h1>
      <p>Welcome back! Create, review, and export custom exercises aligned with Belgian educational standards.</p>
    </div>
    
    <div class="dashboard-grid">
      <div class="dashboard-card">
        <span class="card-label">Workspaces & Subjects</span>
        <span class="card-stat">${state.channels.length}</span>
        <p style="font-size: 13px; color: var(--text-secondary);">Active child learning environments</p>
      </div>
      <div class="dashboard-card">
        <span class="card-label">Generated Homework Sheets</span>
        <span class="card-stat">${totalSheets}</span>
        <p style="font-size: 13px; color: var(--text-secondary);">Homework sheets exported</p>
      </div>
      <div class="dashboard-card">
        <span class="card-label">Active Mistakes Logged</span>
        <span class="card-stat" style="color: var(--error);">${activeMistakes}</span>
        <p style="font-size: 13px; color: var(--text-secondary);">Critical topics to remediate</p>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 30px; margin-top: 20px;">
      <div class="dashboard-card" style="min-height: 250px;">
        <h3 style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <span>Recent Workspaces</span>
          <button class="btn btn-secondary" onclick="switchView('channels')" style="padding: 4px 10px; font-size: 11px;">Manage</button>
        </h3>
        <div class="channel-list">
          ${state.channels.map(ch => `
            <div class="channel-item" onclick="selectChannel('${ch.id}')" style="background: rgba(255,255,255,0.02); margin-bottom: 8px;">
              <span class="channel-hash">#</span>
              <div style="flex: 1; min-width: 0;">
                <strong style="color: var(--text-primary); block; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${ch.studentName} - ${ch.subject}</strong>
                <div style="font-size: 11px; color: var(--text-muted);">${ch.grade}</div>
              </div>
              <span class="channel-tag tag-${ch.subject.toLowerCase()}">${ch.subject}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="dashboard-card" style="min-height: 250px;">
        <h3 style="margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between;">
          <span>Urgent Remediations</span>
          <button class="btn btn-secondary" onclick="switchView('mistakes')" style="padding: 4px 10px; font-size: 11px;">Mistakes Log</button>
        </h3>
        <div>
          ${state.mistakes.filter(m => m.status === "active").slice(0, 3).map(m => `
            <div style="padding: 10px; border-radius: var(--radius-sm); border: 1px solid rgba(239,68,68,0.15); background: rgba(239,68,68,0.02); margin-bottom: 10px;">
              <div style="display:flex; justify-content:space-between; margin-bottom: 4px;">
                <strong style="font-size: 12px; color: var(--text-primary);">${m.studentName} - ${m.topic}</strong>
                <span style="font-size: 10px; color: var(--error); font-weight:700;">${m.subject}</span>
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${m.description}
              </div>
              <button class="btn btn-secondary" onclick="remediateMistake('${m.id}')" style="margin-top: 8px; width: 100%; padding: 4px; font-size: 10px; border-color: rgba(239,68,68,0.2);">
                Generate Remediation Sheet
              </button>
            </div>
          `).join('')}
          ${state.mistakes.filter(m => m.status === "active").length === 0 ? `
            <p style="color: var(--text-muted); text-align: center; margin-top: 40px; font-size: 13px;">Awesome! No active learning mistakes to remediate.</p>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Render Secondary Sidebar list of channels
function renderChannelsList() {
  const container = document.getElementById("sidebar-channels-list");
  
  if (state.channels.length === 0) {
    container.innerHTML = `<p style="padding: 10px; font-size:12px; color: var(--text-muted);">No workspaces. Click '+' to open one!</p>`;
    return;
  }
  
  container.innerHTML = state.channels.map(ch => {
    const isActive = ch.id === state.activeChannelId;
    const subjectClass = ch.subject.toLowerCase().replace(/\s+/g, '-');
    
    return `
      <div class="channel-item ${isActive ? 'active' : ''}" onclick="selectChannel('${ch.id}')" style="position: relative; padding-right: 28px;">
        <span class="channel-hash">#</span>
        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;" title="${ch.studentName} - ${ch.subject}">
          ${ch.studentName} - ${ch.subject}
        </span>
        <span class="channel-tag tag-${subjectClass}">${ch.subject}</span>
        <span class="channel-delete" onclick="deleteChannel('${ch.id}', event)" style="position: absolute; right: 8px; cursor: pointer; color: var(--text-muted); font-size: 14px; display: none; width: 16px; height: 16px; align-items: center; justify-content: center; border-radius: 50%;">&times;</span>
      </div>
    `;
  }).join('');
}

// Delete channel workspace
function deleteChannel(channelId, event) {
  if (event) {
    event.stopPropagation();
  }
  
  const channel = state.channels.find(ch => ch.id === channelId);
  if (!channel) return;
  
  if (confirm(`Are you sure you want to delete the workspace "${channel.studentName} - ${channel.subject}"? This will permanently delete all its chat history and sheets.`)) {
    state.channels = state.channels.filter(ch => ch.id !== channelId);
    
    if (state.activeChannelId === channelId) {
      if (state.channels.length > 0) {
        state.activeChannelId = state.channels[0].id;
      } else {
        state.activeChannelId = null;
      }
    }
    
    saveState();
    renderChannelsList();
    renderChannelView();
    renderDashboard();
  }
}
window.deleteChannel = deleteChannel;

// Select a channel and render its contents
function selectChannel(channelId) {
  state.activeChannelId = channelId;
  saveState();
  switchView("channels");
  renderChannelView();
  renderChannelsList();
}

// Select sheet function
function selectSheetForPreview(sheetId) {
  const channel = state.channels.find(ch => ch.id === state.activeChannelId);
  if (!channel || !channel.generatedSheets) return;
  const sheet = channel.generatedSheets.find(s => s.id === parseInt(sheetId));
  if (sheet) {
    state.currentSheet = sheet;
    renderPreview();
  }
}
window.selectSheetForPreview = selectSheetForPreview;

// Render active channel chat & preview
function renderChannelView() {
  const channel = state.channels.find(ch => ch.id === state.activeChannelId);
  if (!channel) {
    document.getElementById("workspace-header-container").innerHTML = `<h2>Select a Workspace</h2>`;
    document.getElementById("chat-messages").innerHTML = `<p>Please select a workspace on the left panel.</p>`;
    return;
  }
  
  // Align current active preview sheet to channel data
  if (channel.generatedSheets && channel.generatedSheets.length > 0) {
    const hasCurrentSheet = channel.generatedSheets.some(s => s.id === (state.currentSheet ? state.currentSheet.id : null));
    if (!hasCurrentSheet) {
      state.currentSheet = channel.generatedSheets[channel.generatedSheets.length - 1];
    }
  } else {
    state.currentSheet = null;
  }

  // Create sheet selector dropdown HTML
  let sheetSelectorHtml = "";
  if (channel.generatedSheets && channel.generatedSheets.length > 0) {
    sheetSelectorHtml = `
      <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
        <label for="sheet-select" style="font-size: 12px; color: var(--text-secondary); font-weight: 500;">Sheet:</label>
        <select id="sheet-select" class="form-input" style="height: 30px; font-size: 12px; padding: 0 8px; width: 160px; background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.1); margin-bottom: 0;" onchange="selectSheetForPreview(this.value)">
          ${channel.generatedSheets.map((s, idx) => `
            <option value="${s.id}" ${state.currentSheet && state.currentSheet.id === s.id ? 'selected' : ''}>
              Set #${s.id} - ${s.title.substring(0, 15)}...
            </option>
          `).reverse().join('')}
        </select>
      </div>
    `;
  }
  
  // Header
  document.getElementById("workspace-header-container").innerHTML = `
    <div class="workspace-header-title" style="display: flex; align-items: center; width: 100%; gap: 10px;">
      <h2># ${channel.studentName} - ${channel.subject}</h2>
      <span class="grade-badge">${channel.grade}</span>
      ${channel.textbook ? `<span class="grade-badge">${channel.textbook}</span>` : ""}
      ${sheetSelectorHtml}
    </div>
  `;
  
  // Chat Messages
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = channel.messages.map(msg => `
    <div class="message-bubble message-${msg.sender}">
      <div class="message-sender">${msg.sender === "user" ? "Parent" : "HomeworkMaster"}</div>
      <div>${formatMarkdownText(msg.text)}</div>
    </div>
  `).join('');
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Render Uploaded Materials
  renderMaterialsBar();
  
  // Config parameters text/values
  document.getElementById("param-grade").value = channel.grade;
  document.getElementById("param-subject").value = channel.subject;
  document.getElementById("param-textbook").value = channel.textbook || "";
  
  // If there's an active sheet in this channel, render preview. Otherwise, show instructions.
  if (channel.generatedSheets && channel.generatedSheets.length > 0) {
    state.currentSheet = channel.generatedSheets[channel.generatedSheets.length - 1];
    renderPreview();
  } else {
    state.currentSheet = null;
    document.getElementById("preview-sheet-area").innerHTML = `
      <div style="text-align: center; padding-top: 80px; color: var(--text-secondary);">
        <div style="font-size: 48px; margin-bottom: 20px; filter: grayscale(1);">📝</div>
        <h3>No Homework Sheet Generated</h3>
        <p style="margin-top: 8px; font-size:13px; max-width: 320px; margin-left:auto; margin-right:auto; color: var(--text-muted);">
          Use the wizard parameters at the bottom-left to generate a Belgian standard homework sheet via local generator or Gemini AI.
        </p>
      </div>
    `;
  }
}

// Render Materials bar (temp file pills)
function renderMaterialsBar() {
  const bar = document.getElementById("materials-bar-container");
  if (state.materials.length === 0) {
    bar.innerHTML = "";
    bar.style.display = "none";
    return;
  }
  
  bar.style.display = "flex";
  bar.innerHTML = state.materials.map((file, idx) => `
    <div class="material-pill">
      <span>📄 ${file.name} (${Math.round(file.size / 1024)} KB)</span>
      <span class="material-remove" onclick="removeMaterial(${idx})">&times;</span>
    </div>
  `).join('');
}

// Add uploaded file to materials
function handleFileUpload(e) {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Read text file for indexing
    const reader = new FileReader();
    reader.onload = function(evt) {
      state.materials.push({
        name: file.name,
        size: file.size,
        content: evt.target.result
      });
      sendMessage(`Uploaded contextual material: **${file.name}**`, true);
      simulateAssistantReply(`I have successfully parsed and indexed **${file.name}**. I will use this learning context when generating exercises!`);
      renderMaterialsBar();
    };
    reader.readAsText(file);
  }
}

function removeMaterial(index) {
  state.materials.splice(index, 1);
  renderMaterialsBar();
}

// Chat Sending
function handleChatSubmit() {
  const textarea = document.getElementById("chat-input-text");
  const text = textarea.value.trim();
  if (!text) return;
  
  textarea.value = "";
  sendMessage(text, true);
  
  // Trigger appropriate reaction
  processChatCommand(text);
}

function sendMessage(text, isUser = true) {
  const channel = state.channels.find(ch => ch.id === state.activeChannelId);
  if (!channel) return;
  
  channel.messages.push({
    sender: isUser ? "user" : "assistant",
    text: text
  });
  
  saveState();
  renderChannelView();
}

function simulateAssistantReply(replyText) {
  setTimeout(() => {
    sendMessage(replyText, false);
  }, 1000);
}

// Helper to get the next unique sheet sequence number
function getNextSheetNumber() {
  let maxId = 100;
  state.channels.forEach(ch => {
    if (ch.generatedSheets) {
      ch.generatedSheets.forEach(sheet => {
        if (sheet.id && typeof sheet.id === 'number') {
          if (sheet.id > maxId) {
            maxId = sheet.id;
          }
        }
      });
    }
  });
  return maxId + 1;
}

// Find a sheet across all channels by its sequence ID
function findSheetById(sheetId) {
  for (let ch of state.channels) {
    if (ch.generatedSheets) {
      const sheet = ch.generatedSheets.find(s => s.id === sheetId);
      if (sheet) {
        return { channel: ch, sheet: sheet };
      }
    }
  }
  return null;
}

// Intercept chat inputs to check for natural language mistake logging
function checkForMistakeReporting(text) {
  const lowerText = text.toLowerCase();
  
  // 1. Check if this is a mistake deletion/removal request
  const isDeletion = lowerText.includes("remove") || lowerText.includes("delete") || lowerText.includes("clear") || lowerText.includes("schrap") || lowerText.includes("verwijder") || lowerText.includes("wissen");
  
  if (isDeletion) {
    // Check if clearing all mistakes for active channel
    if ((lowerText.includes("all") || lowerText.includes("alle")) && (lowerText.includes("mistake") || lowerText.includes("fout"))) {
      const channel = state.channels.find(ch => ch.id === state.activeChannelId);
      if (channel) {
        const initialCount = state.mistakes.length;
        state.mistakes = state.mistakes.filter(m => m.studentName.toLowerCase() !== channel.studentName.toLowerCase());
        if (state.mistakes.length < initialCount) {
          saveState();
          if (state.activeView === "mistakes") renderMistakesView();
          renderDashboard();
          simulateAssistantReply(`I have cleared all logged mistakes for **${channel.studentName}**.`);
          return true;
        }
      }
    }
    
    // Otherwise, check for specific set and exercises to delete
    const setMatch = lowerText.match(/(?:set|sheet|oefenblad|reeks|reeksnr|setnr)\s*#?\s*(\d+)/i);
    if (setMatch) {
      const sheetId = parseInt(setMatch[1]);
      const result = findSheetById(sheetId);
      if (result) {
        const { channel, sheet } = result;
        const textWithoutSet = lowerText.replace(setMatch[0], "");
        const digitMatches = textWithoutSet.match(/\b\d+\b/g);
        
        if (digitMatches && digitMatches.length > 0) {
          const removedNumbers = [];
          digitMatches.forEach(numStr => {
            const num = parseInt(numStr);
            const targetTopicSegment = `Set #${sheetId} Q${num}`;
            const initialLength = state.mistakes.length;
            
            state.mistakes = state.mistakes.filter(m => 
              !(m.studentName.toLowerCase() === channel.studentName.toLowerCase() && 
                m.topic.toLowerCase().includes(targetTopicSegment.toLowerCase()))
            );
            
            if (state.mistakes.length < initialLength) {
              removedNumbers.push(num);
            }
          });
          
          if (removedNumbers.length > 0) {
            saveState();
            if (state.activeView === "mistakes") renderMistakesView();
            renderDashboard();
            simulateAssistantReply(`I have removed the logged mistake(s) for **${channel.studentName}** on **Set #${sheetId}** in exercise(s): **${removedNumbers.join(', ')}**.`);
            return true;
          }
        }
      }
    }
  }

  // 2. Otherwise, check for mistake logging request
  const setMatch = lowerText.match(/(?:set|sheet|oefenblad|reeks|reeksnr|setnr)\s*#?\s*(\d+)/i);
  if (!setMatch) return false;
  
  const sheetId = parseInt(setMatch[1]);
  const result = findSheetById(sheetId);
  if (!result) {
    simulateAssistantReply(`I detected a reference to **Set #${sheetId}**, but I couldn't find a worksheet with that ID in any workspace. Please verify the set number.`);
    return true; // Command intercepted
  }
  
  const { channel, sheet } = result;
  
  // Remove the set match token to avoid parsing the set ID as an exercise number
  const textWithoutSet = lowerText.replace(setMatch[0], "");
  
  // Extract all digit tokens as candidate exercise numbers
  const digitMatches = textWithoutSet.match(/\b\d+\b/g);
  if (!digitMatches || digitMatches.length === 0) {
    simulateAssistantReply(`I recognized that you are referring to **Set #${sheetId}** (${sheet.subject} for ${channel.studentName}), but I couldn't find any exercise numbers in your message. Please specify which exercises had mistakes (e.g., "exercises 1, 3").`);
    return true;
  }
  
  const exerciseNumbers = [];
  const invalidNumbers = [];
  const totalExercises = sheet.exercises.length;
  
  digitMatches.forEach(numStr => {
    const num = parseInt(numStr);
    if (num >= 1 && num <= totalExercises) {
      if (!exerciseNumbers.includes(num)) {
        exerciseNumbers.push(num);
      }
    } else {
      // Avoid tracking years/dates like 2026 as invalid numbers
      if (num < 100 && num !== sheetId) {
        invalidNumbers.push(num);
      }
    }
  });
  
  if (exerciseNumbers.length === 0) {
    simulateAssistantReply(`I recognized that you are referring to **Set #${sheetId}** (${sheet.subject} for ${channel.studentName}), but the numbers you mentioned do not correspond to any exercises on this sheet (range: 1-${totalExercises}).`);
    return true;
  }
  
  // Try to find a custom explanation/instruction in the text (e.g. text after because/forgot/reasons)
  let customExplanation = "";
  const explanationKeywords = ["because", "since", "want", "omdat", "vergat", "forgot", "focus", "oefen", "practice", "practise", "wrote", "schreef", "instead of", "in plaats van", "reede", "uitleg", ":", "-", ";"];
  let splitIndex = -1;
  
  explanationKeywords.forEach(keyword => {
    const idx = lowerText.indexOf(keyword);
    if (idx !== -1 && (splitIndex === -1 || idx < splitIndex)) {
      splitIndex = idx;
    }
  });
  
  if (splitIndex !== -1) {
    customExplanation = text.substring(splitIndex).trim();
    // Clean leading punctuation
    customExplanation = customExplanation.replace(/^[:\-;\s]+/, "").trim();
  }
  
  // Save mistakes to state
  const loggedMistakes = [];
  exerciseNumbers.forEach(num => {
    const exercise = sheet.exercises.find(ex => ex.number === num);
    const answer = sheet.answers.find(ans => ans.number === num);
    
    const cleanQuestion = exercise ? exercise.question.replace(/<[^>]*>/g, '').trim() : `Exercise ${num}`;
    const cleanSolution = answer ? answer.solution.replace(/<[^>]*>/g, '').trim() : '';
    
    let description = `Exercise ${num}: "${cleanQuestion}" -> Expected: "${cleanSolution}"`;
    if (customExplanation) {
      description += `<br><br><strong>Parent Note / Guidance:</strong> "${customExplanation}"`;
    }
    
    const newMistake = {
      id: "m-" + Date.now() + "-" + num,
      studentName: channel.studentName,
      subject: channel.subject,
      topic: `${sheet.subject} (Set #${sheetId} Q${num})`,
      description: description,
      date: new Date().toISOString().split('T')[0],
      status: "active"
    };
    
    state.mistakes.push(newMistake);
    loggedMistakes.push(num);
  });
  
  saveState();
  
  // Update view rendering if showing mistakes or dashboard
  if (state.activeView === "mistakes") {
    renderMistakesView();
  }
  renderDashboard();
  
  const listStr = loggedMistakes.sort((a,b)=>a-b).join(", ");
  let replyText = `I have logged mistakes for **${channel.studentName}** on **Set #${sheetId}** (${sheet.subject}) in exercise(s): **${listStr}**. These are now added to the **Mistakes Log** for remediation.`;
  if (customExplanation) {
    replyText += `<br><em>Guidance captured: "${customExplanation}"</em>`;
  }
  if (invalidNumbers.length > 0) {
    replyText += ` (Note: numbers ${invalidNumbers.join(', ')} were ignored because they are outside the exercise range of 1-${totalExercises}.)`;
  }
  
  simulateAssistantReply(replyText);
  return true;
}

// Check uploaded file for child mistakes and log them
function triggerUploadMistakeAnalysis(text) {
  const channel = state.channels.find(ch => ch.id === state.activeChannelId);
  if (!channel) return false;
  
  if (state.materials.length === 0) {
    simulateAssistantReply("You requested an analysis, but there are no uploaded files in this channel. Please upload a student worksheet or answer file first!");
    return true;
  }
  
  const fileToAnalyze = state.materials[state.materials.length - 1]; // Analyze the latest uploaded file
  
  sendMessage(`Analyzing student worksheet **${fileToAnalyze.name}** for mistakes...`, false);
  
  const hasApiKey = !!state.settings.geminiApiKey;
  
  if (hasApiKey) {
    // 1. Call Gemini to perform structured comparative analysis
    const apiKey = state.settings.geminiApiKey;
    const selectedModel = (state.settings.geminiModel || "gemini-1.5-pro").replace(/^models\//, "");
    
    // Prepare worksheet reference details if available
    let worksheetRefContext = "";
    if (state.currentSheet) {
      worksheetRefContext = `
Here is the reference worksheet (Set #${state.currentSheet.id}):
Title: ${state.currentSheet.title}
Subject: ${state.currentSheet.subject}
Grade: ${state.currentSheet.grade}

Original Exercises & Questions:
${JSON.stringify(state.currentSheet.exercises)}

Model Answers & Solutions:
${JSON.stringify(state.currentSheet.answers)}
      `;
    }
    
    const systemInstruction = `You are HuiswerkMeester educational assistant. You evaluate student answers and identify their mistakes to log them in the Mistakes Log.
Analyze the student answers text (which might include HTML markup or style markers like 'yellow', '<mark>', style='background-color: yellow' indicating errors, or textual feedback like 'wrong' or '[fout]').
Compare the student answers to the reference worksheet questions and solutions if provided.

For each incorrect answer:
1. Explain exactly what the student got wrong by giving examples (e.g., "Student wrote X, expected Y because...").
2. Identify the specific mathematical/linguistic concept.

You MUST answer in pure JSON with this EXACT structure (do NOT wrap in \`\`\`json markdown blocks):
{
  "analysisSummary": "A direct, helpful summary in English explaining what overall mistakes were found and how the child did (e.g. 'Laura made 2 errors in fraction additions...'). Use examples to explain.",
  "mistakes": [
    {
      "topic": "Topic Name (in Belgian Dutch or English)",
      "description": "Pedagogical explanation of the mistake with student answer example (in English UI, but with Dutch example text if helpful)",
      "exerciseNumber": 1 // Number of the exercise if it maps to the current worksheet, otherwise null
    }
  ]
}`;

    const userPrompt = `Please analyze this student answer sheet file content for mistakes.
Student Name: ${channel.studentName}
Subject: ${channel.subject}
Grade: ${channel.grade}

${worksheetRefContext}

Student Answers Text to Analyze:
---
${fileToAnalyze.content}
---

Find where mistakes were made (look for yellow highlights, marked incorrect sections, or mismatch with solutions). Identify the topics and write a clear explanation with examples of what was done incorrectly. Return the JSON structure.`;

    fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: userPrompt }]
        }],
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    })
    .then(res => {
      if (!res.ok) throw new Error("API Error: " + res.status);
      return res.json();
    })
    .then(data => {
      try {
        const textResponse = data.candidates[0].content.parts[0].text.trim();
        const parsed = JSON.parse(textResponse);
        
        // Log mistakes
        const loggedTopics = [];
        if (parsed.mistakes && parsed.mistakes.length > 0) {
          parsed.mistakes.forEach(m => {
            const newMistake = {
              id: "m-" + Date.now() + "-" + Math.floor(Math.random()*1000),
              studentName: channel.studentName,
              subject: channel.subject,
              topic: m.topic,
              description: m.description,
              date: new Date().toISOString().split('T')[0],
              status: "active"
            };
            state.mistakes.push(newMistake);
            loggedTopics.push(m.topic);
          });
          saveState();
          
          if (state.activeView === "mistakes") {
            renderMistakesView();
          }
          renderDashboard();
        }
        
        let replyHtml = `${parsed.analysisSummary}`;
        if (loggedTopics.length > 0) {
          replyHtml += `<br><br><strong>Logged the following to the Mistakes Log:</strong><ul>` + 
            loggedTopics.map(t => `<li>${t}</li>`).join('') + `</ul>`;
        } else {
          replyHtml += `<br><br>No new mistakes were logged.`;
        }
        
        sendMessage(replyHtml, false);
      } catch (e) {
        console.error("Failed to parse analysis JSON", e);
        throw new Error("Invalid response format from Gemini.");
      }
    })
    .catch(err => {
      console.error("Analysis API failed, falling back offline:", err);
      runOfflineAnalysis(fileToAnalyze, channel);
    });
  } else {
    // 2. Local offline parsing fallback
    runOfflineAnalysis(fileToAnalyze, channel);
  }
  
  return true;
}

// Local offline mistake scanner
function runOfflineAnalysis(fileToAnalyze, channel) {
  const mistakes = [];
  const lines = fileToAnalyze.content.split('\n');
  
  lines.forEach((line, idx) => {
    const lowerLine = line.toLowerCase();
    let isMistake = false;
    let explanation = "";
    
    // Check for highlight markers
    if (lowerLine.includes("yellow") || lowerLine.includes("background-color") || lowerLine.includes("<mark>") || lowerLine.includes("== ")) {
      isMistake = true;
      explanation = "Yellow Highlighted mistake: " + line.replace(/<[^>]*>/g, '').trim();
    } else if (lowerLine.includes("wrong") || lowerLine.includes("fout") || lowerLine.includes("incorrect") || lowerLine.includes("[f]")) {
      isMistake = true;
      explanation = "Marked incorrect: " + line.trim();
    }
    
    if (isMistake) {
      // Try to extract exercise number
      let exNum = null;
      const numMatch = line.match(/(?:oefening|exercise|q|v)\s*(\d+)/i);
      if (numMatch) {
        exNum = parseInt(numMatch[1]);
      }
      
      const topicName = exNum && state.currentSheet ? `${state.currentSheet.subject} - Q${exNum}` : `${channel.subject} - Upload Line ${idx + 1}`;
      
      mistakes.push({
        topic: topicName,
        description: explanation,
        exerciseNumber: exNum
      });
    }
  });
  
  if (mistakes.length > 0) {
    mistakes.forEach(m => {
      const newMistake = {
        id: "m-" + Date.now() + "-" + Math.floor(Math.random()*1000),
        studentName: channel.studentName,
        subject: channel.subject,
        topic: m.topic,
        description: m.description,
        date: new Date().toISOString().split('T')[0],
        status: "active"
      };
      state.mistakes.push(newMistake);
    });
    saveState();
    
    if (state.activeView === "mistakes") {
      renderMistakesView();
    }
    renderDashboard();
    
    simulateAssistantReply(`Offline analysis of **${fileToAnalyze.name}** complete! I scanned the text and identified **${mistakes.length}** marked errors (highlighted or tagged). These have been automatically logged in the Mistakes Log.`);
  } else {
    simulateAssistantReply(`Offline analysis of **${fileToAnalyze.name}** complete. I couldn't find any explicit yellow highlights or 'wrong'/'fout' markers in the text. Please ensure mistakes are marked (e.g. highlighted in yellow HTML or tagged with '[fout]') so HuiswerkMeester can log them!`);
  }
}

// Simple text commands processing
function processChatCommand(text) {
  // 1. First, check if the parent is reporting mistakes on a worksheet (Set #ID)
  if (checkForMistakeReporting(text)) {
    return;
  }
  
  // 2. Second, check if parent is asking to evaluate/analyze uploaded homework files
  const lower = text.toLowerCase();
  const isAnalysisRequest = lower.includes("analyze") || lower.includes("check") || lower.includes("evaluate") || lower.includes("mistake") || lower.includes("fout") || lower.includes("wrong") || lower.includes("yellow") || lower.includes("highlight") || lower.includes("mark") || lower.includes("geel") || lower.includes("nakijken") || lower.includes("verbeteren");
  if (isAnalysisRequest && state.materials.length > 0) {
    if (triggerUploadMistakeAnalysis(text)) {
      return;
    }
  }

  if (lower.includes("generate") || lower.includes("exercise") || lower.includes("make") || lower.includes("oefening") || lower.includes("huiswerk")) {
    let count = 10;
    const match = lower.match(/\b\d+\b/);
    if (match) {
      count = parseInt(match[0]);
    }
    
    setTimeout(() => {
      triggerHomeworkGeneration(count);
    }, 800);
  } else {
    if (state.settings.geminiApiKey) {
      callGeminiForChat(text);
    } else {
      simulateAssistantReply("I hear you! To receive dynamic AI responses, please enter your **Gemini API Key** in the settings panel (bottom left rail). In the meantime, you can generate exercises instantly using the local generator wizard below!");
    }
  }
}

// Render Preview Area (Right Panel)
function renderPreview() {
  const container = document.getElementById("preview-sheet-area");
  if (!state.currentSheet) return;
  
  const tab = state.activePreviewTab; // 'opgaven' or 'oplossingen'
  
  let content = "";
  
  if (tab === "opgaven") {
    content = `
      <div class="doc-sheet">
        <div class="doc-title">${state.currentSheet.title} (Set #${state.currentSheet.id || ''})</div>
        <div class="doc-metadata">
          <span>Set ID: <strong>#${state.currentSheet.id || 'N/A'}</strong></span>
          <span>Subject: <strong>${state.currentSheet.subject}</strong></span>
          <span>Grade: <strong>${state.currentSheet.grade}</strong></span>
          ${state.currentSheet.textbook ? `<span>Method: <strong>${state.currentSheet.textbook}</strong></span>` : ""}
        </div>
        
        <div class="doc-questions-list">
          ${state.currentSheet.exercises.map(ex => `
            <div class="doc-question">
              <span class="doc-question-num">${ex.number}.</span>
              <span>${ex.question}</span>
              ${ex.space ? `<div class="doc-answer-space"></div>` : `<div style="height: 12px;"></div>`}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    content = `
      <div class="doc-sheet">
        <div class="doc-title">${state.currentSheet.title} - Oplossingen (Set #${state.currentSheet.id || ''})</div>
        <div class="doc-metadata">
          <span>Set ID: <strong>#${state.currentSheet.id || 'N/A'}</strong></span>
          <span>Subject: <strong>${state.currentSheet.subject}</strong></span>
          <span>Grade: <strong>${state.currentSheet.grade}</strong></span>
        </div>
        
        <div class="doc-questions-list">
          ${state.currentSheet.answers.map(ans => `
            <div class="doc-question">
              <span class="doc-question-num">${ans.number}.</span>
              <strong style="color: var(--text-secondary);">Oplossing:</strong>
              <div class="doc-answer-guide">${ans.solution}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  container.innerHTML = content;
  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([container]).catch(err => console.error("MathJax typesetting failed:", err));
  }
}

function switchPreviewTab(tab) {
  state.activePreviewTab = tab;
  
  document.querySelectorAll(".preview-tab").forEach(btn => btn.classList.remove("active"));
  if (tab === "opgaven") {
    document.getElementById("tab-opgaven").classList.add("active");
  } else {
    document.getElementById("tab-oplossingen").classList.add("active");
  }
  
  renderPreview();
}

// --- CORE GENERATION SYSTEM ---

// Trigger Generation from UI Panel
function triggerManualGeneration() {
  const countInput = document.getElementById("param-count");
  const count = parseInt(countInput.value) || 10;
  triggerHomeworkGeneration(count);
}

function triggerHomeworkGeneration(count) {
  const channel = state.channels.find(ch => ch.id === state.activeChannelId);
  if (!channel) return;
  
  // Show Loading Spinner on preview
  const previewArea = document.getElementById("preview-sheet-area");
  previewArea.innerHTML = `
    <div class="skeleton-loader" style="padding: 40px;">
      <div class="skeleton-line skeleton-title"></div>
      <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div class="skeleton-line" style="width: 100px;"></div>
        <div class="skeleton-line" style="width: 150px;"></div>
      </div>
      <div class="skeleton-line skeleton-text-1"></div>
      <div class="skeleton-line skeleton-text-2"></div>
      <div class="skeleton-line skeleton-text-3"></div>
      <div class="skeleton-line skeleton-text-4"></div>
      
      <div style="text-align: center; margin-top: 50px; color: var(--text-secondary);">
        <div class="info-banner" style="display: inline-flex; justify-content: center; width: auto; margin: 0 auto;">
          <span class="info-banner-icon">🔄</span>
          <span>HomeworkMaster AI is researching goals and generating ${count} Belgian Dutch exercises...</span>
        </div>
      </div>
    </div>
  `;
  
  const grade = channel.grade;
  const subject = channel.subject;
  const textbook = channel.textbook || "";
  
  // Add user prompt details if materials exist
  let uploadContext = "";
  if (state.materials.length > 0) {
    uploadContext = "Geüploade leermaterialen context:\n" + state.materials.map(m => m.content).join("\n");
  }
  
  // Check if we have active mistakes to remediate
  const studentMistakes = state.mistakes.filter(m => m.studentName === channel.studentName && m.subject === subject && m.status === "active");
  let mistakeContext = "";
  if (studentMistakes.length > 0) {
    mistakeContext = "BELANGRIJK: De leerling maakt momenteer fouten bij de volgende onderwerpen. Pas de moeilijkheidsgraad aan en voeg specifieke remediëringstaken toe:\n" + 
      studentMistakes.map(m => `- ${m.topic}: ${m.description}`).join("\n");
  }
  
  // Call Gemini if Key is set, else local fallback
  if (state.settings.geminiApiKey) {
    callGeminiToGenerate(channel, count, grade, subject, textbook, uploadContext, mistakeContext);
  } else {
    // Simulated offline generation wait time
    setTimeout(() => {
      const generated = generateLocalExercises(subject, grade, textbook, count, studentMistakes);
      
      // Save Sheet to channel
      if (!channel.generatedSheets) channel.generatedSheets = [];
      channel.generatedSheets.push(generated);
      state.currentSheet = generated;
      
      // Add assistant message
      sendMessage(`I have generated a new homework sheet (Set #${generated.id}) with **${count}** exercises for **${subject}** (${grade})! You can preview the exercises and answers on the right.`, false);
      
      saveState();
      renderChannelView();
    }, 1500);
  }
}

// Call Gemini API for exercise generation
function callGeminiToGenerate(channel, count, grade, subject, textbook, uploadContext, mistakeContext) {
  const apiKey = state.settings.geminiApiKey;
  
  const systemInstruction = `You are an experienced educational assistant in Flanders (Belgium). You create customized homework sheets that align exactly with the Flemish curriculum standards (the "Eindtermen").
The application UI and interaction is in English, but the generated worksheet outputs (the title, the exercise texts, the instructions, the answer sheets, and model solutions) MUST be in native Belgian Dutch using Flemish school standards and terminology (e.g. "lagere school", "middelbaar", "leerjaar", "blok", "cijferen", "hoofdrekenen", "staartdelingen", "dt-fouten").

Generate ${count} exercises based on the subject (${subject}), the grade/level (${grade}) and the textbook/method (${textbook}) if provided.
If uploaded materials are included in the prompt, adapt the exercises to align with that context.
If student learning mistakes are provided, make sure to generate exercises targeting those exact weak points, explaining how to correct them in the solutions section.

OUTPUT FORMAT: You MUST answer in pure JSON with EXACTLY this structure, without markdown code-blocks around it (do NOT wrap with \`\`\`json or \`\`\`):
{
  "title": "Titel van het huiswerkblad (in Belgian Dutch)",
  "grade": "Niveau",
  "subject": "Vak",
  "textbook": "Methode",
  "exercises": [
    { "number": 1, "question": "De vraagstelling (in Belgian Dutch)", "space": true }
  ],
  "answers": [
    { "number": 1, "solution": "De gedetailleerde uitwerking en het modelantwoord (in Belgian Dutch)" }
  ]
}
Set "space" to true if the child needs visual writing space in a document (such as for math operations, equations, or writing essays). Set to false for short vocab translations or multiple-choice questions.`;

  const userPrompt = `Please generate ${count} homework exercises.
Subject: ${subject}
School Level / Grade: ${grade}
Method / Book: ${textbook}

${mistakeContext ? "\n" + mistakeContext : ""}
${uploadContext ? "\n" + uploadContext : ""}

Design a pedagogically structured, engaging, and varied exercise sheet. Ensure all exercises and solutions are written in Belgian Dutch, matching Flanders school terms.`;

  // Strip models/ prefix to keep URL clean
  const selectedModel = (state.settings.geminiModel || "gemini-1.5-pro").replace(/^models\//, "");
  
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: userPrompt }]
      }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("API Error: " + res.status + " " + res.statusText);
    return res.json();
  })
  .then(data => {
    try {
      const textResponse = data.candidates[0].content.parts[0].text.trim();
      const parsed = JSON.parse(textResponse);
      
      // Save Sheet to channel
      if (!channel.generatedSheets) channel.generatedSheets = [];
      parsed.id = getNextSheetNumber();
      channel.generatedSheets.push(parsed);
      state.currentSheet = parsed;
      
      sendMessage(`Success! Gemini AI generated a custom homework sheet (Set #${parsed.id}) with **${parsed.exercises.length}** exercises. You can inspect it in the preview panel.`, false);
      saveState();
      renderChannelView();
    } catch (e) {
      console.error("JSON parsing of Gemini response failed", e);
      throw new Error("Invalid JSON format received from the AI.");
    }
  })
  .catch(err => {
    console.error("Gemini Generation Error:", err);
    
    // Auto-fallback
    const generated = generateLocalExercises(subject, grade, textbook, count, state.mistakes.filter(m => m.studentName === channel.studentName && m.subject === subject));
    sendMessage(`Failed to generate homework via Gemini: ${err.message}. Switching to local offline generator to prepare your homework sheet (Set #${generated.id})!`, false);
    if (!channel.generatedSheets) channel.generatedSheets = [];
    channel.generatedSheets.push(generated);
    state.currentSheet = generated;
    saveState();
    renderChannelView();
  });
}

// Call Gemini for general chat support
function callGeminiForChat(text) {
  const apiKey = state.settings.geminiApiKey;
  const channel = state.channels.find(ch => ch.id === state.activeChannelId);
  if (!channel) return;
  
  const systemInstruction = `You are HomeworkMaster, a helpful AI tutor assistant for parents in Flanders (Belgium).
The application UI and chat is in English. You communicate in friendly, practical English.
However, when talking about exercises or Belgian curriculum, keep school vocabulary relevant.
You are helping the student ${channel.studentName} who is in ${channel.grade} studying ${channel.subject}.`;

  const selectedModel = (state.settings.geminiModel || "gemini-1.5-pro").replace(/^models\//, "");
  
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: text }]
      }],
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      }
    })
  })
  .then(res => {
    if (!res.ok) throw new Error("API Error: " + res.status);
    return res.json();
  })
  .then(data => {
    const textResponse = data.candidates[0].content.parts[0].text;
    sendMessage(textResponse, false);
  })
  .catch(err => {
    console.error(err);
    simulateAssistantReply("Sorry, I am experiencing issues communicating with the Gemini AI service. Check your API key in settings.");
  });
}

// --- LOCAL STATIC EXERCISE GENERATOR (Belgian Dutch Content, High Fidelity Fallback) ---
function generateLocalExercises(subject, grade, textbook, count, activeMistakes) {
  const title = `Oefenblad: ${subject}`;
  const exercises = [];
  const answers = [];
  
  const subjLower = subject.toLowerCase();
  
  // Math Generator (Wiskunde)
  if (subjLower === "mathematics" || subjLower === "wiskunde") {
    const isPrimary = grade.toLowerCase().includes("primary") || grade.toLowerCase().includes("lagere");
    
    // Check if we should remediate equal fractions mistake
    const hasFractionMistake = activeMistakes.some(m => m.topic.toLowerCase().includes("breuk") || m.topic.toLowerCase().includes("noemer") || m.topic.toLowerCase().includes("fraction"));
    
    for (let i = 1; i <= count; i++) {
      if (hasFractionMistake && i <= Math.ceil(count / 2)) {
        // Remediate fraction addition
        const n1 = Math.floor(Math.random() * 4) + 1;
        const d1 = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
        const n2 = Math.floor(Math.random() * 4) + 1;
        const d2 = [2, 3, 4, 5][Math.floor(Math.random() * 4)];
        
        // Calculate LCD
        const lcd = (d1 * d2) / gcd(d1, d2);
        const lcd_n1 = n1 * (lcd / d1);
        const lcd_n2 = n2 * (lcd / d2);
        const sum_num = lcd_n1 + lcd_n2;
        
        exercises.push({
          number: i,
          question: `Bereken de som van deze breuken en vereenvoudig het resultaat: <br><b style="font-size:16px;">\\( \\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}} = ... \\)</b>`,
          space: true
        });
        
        answers.push({
          number: i,
          solution: `Stap 1: Maak de noemers gelijknamig (de kleinste gemene veelvoud van ${d1} en ${d2} is ${lcd}). <br>
                     Stap 2: Pas de tellers aan: \\( \\frac{${n1}}{${d1}} = \\frac{${lcd_n1}}{${lcd}} \\) en \\( \\frac{${n2}}{${d2}} = \\frac{${lcd_n2}}{${lcd}} \\). <br>
                     Stap 3: Tel de tellers op: \\( \\frac{${lcd_n1}}{${lcd}} + \\frac{${lcd_n2}}{${lcd}} = \\frac{${sum_num}}{${lcd}} \\). <br>
                     Eindantwoord: <strong>\\( \\frac{${sum_num}}{${lcd}} \\)</strong>`
        });
      } else if (isPrimary) {
        // Primary school wiskunde
        const select = Math.random();
        if (select < 0.33) {
          // Decimals multiplying (cijferen)
          const factor1 = (Math.random() * 10).toFixed(1);
          const factor2 = (Math.floor(Math.random() * 8) + 2);
          const result = (factor1 * factor2).toFixed(2);
          exercises.push({
            number: i,
            question: `Bereken het product door te cijferen of te splitsen: <b>${factor1} &times; ${factor2} = ...</b>`,
            space: true
          });
          answers.push({
            number: i,
            solution: `${factor1} &times; ${factor2} = <strong>${result}</strong>. (Splitsing: ${Math.floor(factor1)} &times; ${factor2} = ${Math.floor(factor1)*factor2} plus ${(factor1 % 1).toFixed(1)} &times; ${factor2} = ${((factor1 % 1)*factor2).toFixed(1)})`
          });
        } else if (select < 0.66) {
          // Percentages
          const percents = [10, 20, 25, 50, 75];
          const pct = percents[Math.floor(Math.random() * percents.length)];
          const base = [100, 200, 250, 500, 1000, 80][Math.floor(Math.random() * 6)];
          const res = (pct / 100) * base;
          exercises.push({
            number: i,
            question: `Bereken het percentage: <b>${pct}% van € ${base} = ...</b>`,
            space: true
          });
          answers.push({
            number: i,
            solution: `${pct}% van € ${base} = (${base} / 100) &times; ${pct} = <strong>€ ${res}</strong>.`
          });
        } else {
          // Fraction to percent conversions
          const fracN = 1;
          const fracD = [2, 4, 5, 10, 20, 50][Math.floor(Math.random() * 6)];
          const pctVal = (fracN / fracD) * 100;
          exercises.push({
            number: i,
            question: `Zet deze breuk om naar een percentage en een decimaal getal: <b>\\( \\frac{${fracN}}{${fracD}} \\) = ... % = ...</b>`,
            space: false
          });
          answers.push({
            number: i,
            solution: `\\( \\frac{${fracN}}{${fracD}} \\) = <strong>${pctVal}%</strong> = <strong>${(fracN/fracD).toFixed(2)}</strong>.`
          });
        }
      } else {
        // Secondary school algebra
        const select = Math.random();
        if (select < 0.5) {
          // First degree equation
          const a = Math.floor(Math.random() * 8) + 2;
          const b = Math.floor(Math.random() * 15) + 1;
          const c = Math.floor(Math.random() * 25) + 20;
          const ansX = ((c - b) / a).toFixed(2);
          exercises.push({
            number: i,
            question: `Los de vergelijking op en vind x: <b>${a}x + ${b} = ${c}</b>`,
            space: true
          });
          answers.push({
            number: i,
            solution: `${a}x = ${c} - ${b} => ${a}x = ${c-b} => x = <strong>${ansX}</strong>`
          });
        } else {
          // Powers and scientific notation
          const num = [300000, 4500000, 12000, 890000000][Math.floor(Math.random() * 4)];
          const log = Math.floor(Math.log10(num));
          const base = (num / Math.pow(10, log)).toFixed(2);
          exercises.push({
            number: i,
            question: `Schrijf het getal <b>${num}</b> in de wetenschappelijke notatie (machten van 10).`,
            space: false
          });
          answers.push({
            number: i,
            solution: `${num} = <strong>${base} &times; 10<sup>${log}</sup></strong>`
          });
        }
      }
    }
  }
  // French Generator (Frans)
  else if (subjLower === "french" || subjLower === "frans") {
    const vocabFlemish = ["boek", "school", "lopen", "spreken", "huis", "werk", "moeder", "vader", "vriend", "eten"];
    const vocabFrench = ["le livre", "l'école", "courir", "parler", "la maison", "le travail", "la mère", "le père", "l'ami", "manger"];
    
    for (let i = 1; i <= count; i++) {
      const idx = Math.floor(Math.random() * vocabFlemish.length);
      exercises.push({
        number: i,
        question: `Vertaal het woord naar het Frans (vergeet het lidwoord niet!): <b>"${vocabFlemish[idx]}"</b>`,
        space: false
      });
      answers.push({
        number: i,
        solution: `Vertaling: <strong>${vocabFrench[idx]}</strong>`
      });
    }
  }
  // Latin Generator (Latijn)
  else if (subjLower === "latin" || subjLower === "latijn") {
    const vocabLatin = ["amare", "videre", "dominus", "puella", "urbs", "miles", "facere", "magnus", "bonus", "ire"];
    const vocabDutch = ["beminnen / houden van", "zien", "meester / heer", "meisje", "stad", "soldaat", "doen / maken", "groot", "goed", "gaan"];
    
    for (let i = 1; i <= count; i++) {
      const idx = Math.floor(Math.random() * vocabLatin.length);
      exercises.push({
        number: i,
        question: `Geef de Nederlandse betekenis van het Latijnse woord of werkwoord: <b>"${vocabLatin[idx]}"</b>`,
        space: false
      });
      answers.push({
        number: i,
        solution: `Vertaling: <strong>${vocabDutch[idx]}</strong>`
      });
    }
  }
  // Default Generic Generator
  else {
    for (let i = 1; i <= count; i++) {
      exercises.push({
        number: i,
        question: `Dit is een oefenvraag over ${subject} voor ${grade}. Oefening ${i}.`,
        space: true
      });
      answers.push({
        number: i,
        solution: `Dit is de modeloplossing voor vraag ${i}.`
      });
    }
  }
  
  return {
    id: getNextSheetNumber(),
    title: title,
    grade: grade,
    subject: subject,
    textbook: textbook,
    exercises: exercises,
    answers: answers
  };
}

function gcd(a, b) {
  return !b ? a : gcd(b, a % b);
}

// --- MISTAKES LOG MANAGEMENT ---
function renderMistakesView() {
  const container = document.getElementById("view-mistakes");
  
  container.innerHTML = `
    <div class="view-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h1>Mistakes & Remediation Log</h1>
        <p>Log mistakes made by children in tests or homework to automatically generate targeted remediation worksheets.</p>
      </div>
      <button class="btn btn-primary" onclick="openNewMistakeModal()">+ Add Mistake</button>
    </div>
    
    <div class="mistakes-grid">
      ${state.mistakes.map(m => `
        <div class="mistake-card" style="border-left: 4px solid ${m.status === 'active' ? 'var(--error)' : 'var(--success)'};">
          <div class="mistake-header">
            <span class="mistake-student">${m.studentName}</span>
            <span class="mistake-subject tag-${m.subject.toLowerCase().replace(/\s+/g, '-')}" style="font-size:9px; padding: 2px 6px; border-radius: 10px; background: rgba(255,255,255,0.05); color: var(--text-primary);">
              ${m.subject}
            </span>
          </div>
          <strong style="font-size: 13.5px; margin-bottom: 6px; color: var(--text-primary);">${m.topic}</strong>
          <div class="mistake-desc">${m.description}</div>
          
          <div class="mistake-meta">
            <span class="mistake-date">Logged: ${m.date}</span>
            <div style="display: flex; gap: 8px;">
              ${m.status === "active" ? `
                <button class="btn btn-flemish" onclick="remediateMistake('${m.id}')" style="padding: 4px 8px; font-size: 10.5px;">
                  Remediate
                </button>
                <button class="btn btn-secondary" onclick="toggleMistakeStatus('${m.id}')" style="padding: 4px 8px; font-size: 10.5px; color: var(--success);">
                  Resolved
                </button>
              ` : `
                <span style="color: var(--success); font-size: 11px; font-weight:700; display:flex; align-items:center; gap:4px;">
                  ✓ Resolved
                </span>
                <button class="btn btn-secondary" onclick="toggleMistakeStatus('${m.id}')" style="padding: 4px 8px; font-size: 10.5px; color: var(--error);">
                  Reopen
                </button>
              `}
              <button class="btn btn-danger" onclick="deleteMistake('${m.id}')" style="padding: 4px 6px; font-size: 10.5px;">
                &times;
              </button>
            </div>
          </div>
        </div>
      `).join('')}
      ${state.mistakes.length === 0 ? `
        <div style="grid-column: span 3; text-align: center; padding: 60px; color: var(--text-secondary);">
          <span style="font-size: 40px;">🎉</span>
          <h3 style="margin-top: 10px;">No mistakes logged</h3>
          <p style="font-size:12px; color:var(--text-muted);">Great job! Add mistakes here whenever a child struggles with a topic to focus extra practice on it.</p>
        </div>
      ` : ''}
    </div>
  `;
}

function openNewMistakeModal() {
  document.getElementById("modal-new-mistake").classList.add("active");
}

function closeNewMistakeModal() {
  document.getElementById("modal-new-mistake").classList.remove("active");
}

function handleAddMistakeSubmit(e) {
  e.preventDefault();
  
  const student = document.getElementById("mistake-form-student").value.trim();
  let subject = document.getElementById("mistake-form-subject").value;
  if (subject === "Other") {
    subject = document.getElementById("mistake-form-custom-subject").value.trim() || "Custom Subject";
  }
  const topic = document.getElementById("mistake-form-topic").value.trim();
  const desc = document.getElementById("mistake-form-desc").value.trim();
  
  if (!student || !topic || !desc) {
    alert("Please fill in all required fields!");
    return;
  }
  
  const newMistake = {
    id: "m-" + Date.now(),
    studentName: student,
    subject: subject,
    topic: topic,
    description: desc,
    date: new Date().toISOString().split('T')[0],
    status: "active"
  };
  
  state.mistakes.push(newMistake);
  saveState();
  closeNewMistakeModal();
  renderMistakesView();
  
  // Check if we need to notify active channel
  const matchedChannel = state.channels.find(ch => ch.studentName.toLowerCase() === student.toLowerCase() && ch.subject.toLowerCase() === subject.toLowerCase());
  if (matchedChannel) {
    matchedChannel.messages.push({
      sender: "assistant",
      text: `I have registered a new learning mistake for **${student}** regarding **${topic}**. I will design future exercises to address this topic specifically.`
    });
    saveState();
  }
}

function toggleMistakeStatus(id) {
  const m = state.mistakes.find(x => x.id === id);
  if (m) {
    m.status = m.status === "active" ? "resolved" : "active";
    saveState();
    renderMistakesView();
    renderDashboard();
  }
}

function deleteMistake(id) {
  if (confirm("Are you sure you want to delete this logged mistake?")) {
    state.mistakes = state.mistakes.filter(x => x.id !== id);
    saveState();
    renderMistakesView();
    renderDashboard();
  }
}

function remediateMistake(id) {
  const m = state.mistakes.find(x => x.id === id);
  if (!m) return;
  
  // Find or create channel for this student and subject
  let channel = state.channels.find(ch => ch.studentName.toLowerCase() === m.studentName.toLowerCase() && ch.subject.toLowerCase() === m.subject.toLowerCase());
  
  if (!channel) {
    const defaultGrade = m.studentName === "Thomas" ? "Secondary School - 2nd Year" : "Primary School - 6th Grade";
    channel = {
      id: "ch-" + Date.now(),
      studentName: m.studentName,
      grade: defaultGrade,
      subject: m.subject,
      textbook: "",
      messages: [
        { sender: "assistant", text: `Welcome! This workspace was automatically created to target and remediate the mistake made by **${m.studentName}** regarding **${m.topic}**.` }
      ],
      generatedSheets: []
    };
    state.channels.push(channel);
  }
  
  state.activeChannelId = channel.id;
  saveState();
  switchView("channels");
  renderChannelsList();
  
  // Send a user prompt trigger to chat
  sendMessage(`Generate remediation sheet for the mistake: "${m.description}"`, true);
  
  // Trigger generation focusing on this mistake
  setTimeout(() => {
    triggerHomeworkGeneration(10);
  }, 500);
}

// --- SETTINGS VIEW ---
function renderSettingsView() {
  const container = document.getElementById("view-settings");
  
  const models = state.settings.availableModels || DEFAULT_MODELS;
  const currentModel = state.settings.geminiModel || "gemini-1.5-pro";
  
  const isModelInList = models.some(m => m.name === currentModel);
  const isCustomModel = !isModelInList && currentModel !== "custom" && currentModel;

  container.innerHTML = `
    <div class="view-header">
      <h1>Settings</h1>
      <p>Configure the AI connection, model parameters, and preferences.</p>
    </div>
    
    <div class="dashboard-card" style="max-width: 600px; margin-bottom: 24px;">
      <h3 style="margin-bottom: 16px; display:flex; align-items:center; gap: 8px;">
        <span>🔑 Gemini API & Model Settings</span>
      </h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.5;">
        HomeworkMaster utilizes Google's **Gemini** models to perform curriculum research and write tailored exercise worksheets. Your API key is stored securely in your own browser's local storage and is never sent to external servers.
      </p>
      
      <div class="form-group" style="margin-bottom: 16px;">
        <label class="form-label" for="settings-api-key">Gemini API Key</label>
        <input type="password" id="settings-api-key" class="form-input" placeholder="AIzaSy..." value="${state.settings.geminiApiKey || ''}" style="font-family: monospace;">
      </div>

      <div class="form-group" style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <label class="form-label" for="settings-model" style="margin-bottom: 0;">Gemini AI Model</label>
          <button id="btn-fetch-models" class="btn btn-secondary" onclick="fetchModelsFromApi()" style="padding: 2px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px; height: auto; background: rgba(255,255,255,0.03);">
            <span id="fetch-models-spinner" class="spinner" style="display: none; width: 10px; height: 10px; margin-right: 4px;"></span>
            🔄 Fetch Available Models
          </button>
        </div>
        <select id="settings-model" class="form-input" onchange="toggleCustomModelInput(this.value)">
          ${models.map(m => `
            <option value="${m.name}" ${currentModel === m.name ? 'selected' : ''} title="${m.description || ''}">
              ${m.displayName} (${m.name})
            </option>
          `).join('')}
          <option value="custom" ${isCustomModel ? 'selected' : ''}>
            Custom model... (Enter ID manually)
          </option>
        </select>
      </div>

      <div class="form-group" id="custom-model-group" style="margin-bottom: 16px; display: ${isCustomModel ? 'block' : 'none'};">
        <label class="form-label" for="settings-custom-model">Custom Model ID</label>
        <input type="text" id="settings-custom-model" class="form-input" placeholder="e.g. gemini-2.0-flash-thinking-exp" value="${isCustomModel ? currentModel : ''}">
      </div>
      
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <button class="btn btn-primary" onclick="saveApiKey()">Save Settings</button>
        <a href="https://aistudio.google.com/" target="_blank" style="font-size: 12px; color: var(--primary); text-decoration: none; font-weight: 500;">Get a free API Key ↗</a>
      </div>
    </div>

    <div class="dashboard-card" style="max-width: 600px;">
      <h3>Publishing on GitHub</h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-top: 8px; line-height: 1.5;">
        Want to host this application online for free? Since it is a static web app, you can host it using <strong>GitHub Pages</strong>. Read the <code>README.md</code> file in your project directory for quick step-by-step instructions.
      </p>
    </div>
  `;
}

function toggleCustomModelInput(val) {
  const group = document.getElementById("custom-model-group");
  if (val === "custom") {
    group.style.display = "block";
    document.getElementById("settings-custom-model").focus();
  } else {
    group.style.display = "none";
    document.getElementById("settings-custom-model").value = val;
  }
}
window.toggleCustomModelInput = toggleCustomModelInput;

function saveApiKey() {
  const keyInput = document.getElementById("settings-api-key");
  const modelSelect = document.getElementById("settings-model");
  const customModelInput = document.getElementById("settings-custom-model");
  
  state.settings.geminiApiKey = keyInput.value.trim();
  if (modelSelect.value === "custom") {
    state.settings.geminiModel = customModelInput.value.trim() || "gemini-1.5-pro";
  } else {
    state.settings.geminiModel = modelSelect.value;
  }
  
  saveState();
  alert("Gemini settings successfully saved!");
  renderSettingsView();
}
window.saveApiKey = saveApiKey;

// Dynamic model fetching from Google's API
function fetchModelsFromApi() {
  const apiKey = state.settings.geminiApiKey || (document.getElementById("settings-api-key") ? document.getElementById("settings-api-key").value.trim() : "");
  if (!apiKey) {
    alert("Please enter your Gemini API Key in the field above before fetching available models!");
    return;
  }
  
  const button = document.getElementById("btn-fetch-models");
  const spinner = document.getElementById("fetch-models-spinner");
  if (button) button.disabled = true;
  if (spinner) spinner.style.display = "inline-block";
  
  fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
    .then(res => {
      if (!res.ok) {
        throw new Error("HTTP Error " + res.status + ": " + res.statusText);
      }
      return res.json();
    })
    .then(data => {
      if (data && data.models) {
        const filtered = data.models
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"))
          .filter(m => m.name && m.name.startsWith("models/gemini-"))
          .map(m => {
            const shortName = m.name.replace(/^models\//, "");
            return {
              name: shortName,
              displayName: m.displayName || shortName,
              description: m.description || ""
            };
          });
          
        if (filtered.length > 0) {
          state.settings.availableModels = filtered;
          saveState();
          alert(`Successfully fetched and loaded ${filtered.length} available Gemini models from the API!`);
        } else {
          alert("No Gemini text generation models were returned by the API.");
        }
      } else {
        alert("Unexpected response format from Google's models endpoint.");
      }
    })
    .catch(err => {
      console.error("Error fetching models:", err);
      alert("Failed to fetch models from the Gemini API. Please make sure your API key is correct and you have internet access.\n\nError: " + err.message);
    })
    .finally(() => {
      if (button) button.disabled = false;
      if (spinner) spinner.style.display = "none";
      renderSettingsView();
    });
}
window.fetchModelsFromApi = fetchModelsFromApi;

// --- NEW WORKSPACE CHANNEL MODAL ---
function openNewChannelModal() {
  document.getElementById("modal-new-channel").classList.add("active");
}

function closeNewChannelModal() {
  document.getElementById("modal-new-channel").classList.remove("active");
  
  // Reset form custom subject toggle
  document.getElementById("custom-subject-group").style.display = "none";
  document.getElementById("new-channel-form").reset();
}

function toggleCustomSubjectInput(val) {
  const group = document.getElementById("custom-subject-group");
  if (val === "Other") {
    group.style.display = "block";
    document.getElementById("channel-form-custom-subject").focus();
  } else {
    group.style.display = "none";
  }
}
window.toggleCustomSubjectInput = toggleCustomSubjectInput;

function toggleCustomSubjectMistakeInput(val) {
  const group = document.getElementById("custom-subject-mistake-group");
  if (val === "Other") {
    group.style.display = "block";
    document.getElementById("mistake-form-custom-subject").focus();
  } else {
    group.style.display = "none";
  }
}
window.toggleCustomSubjectMistakeInput = toggleCustomSubjectMistakeInput;

function handleAddChannelSubmit(e) {
  e.preventDefault();
  
  const student = document.getElementById("channel-form-student").value.trim();
  const levelSelect = document.getElementById("channel-form-level").value;
  const gradeDetail = document.getElementById("channel-form-grade").value.trim();
  let subject = document.getElementById("channel-form-subject").value;
  
  if (subject === "Other") {
    subject = document.getElementById("channel-form-custom-subject").value.trim() || "Custom Subject";
  }
  
  const textbook = document.getElementById("channel-form-textbook").value.trim();
  
  if (!student || !gradeDetail) {
    alert("Please fill in all required fields!");
    return;
  }
  
  const gradeLabel = `${levelSelect === 'primary' ? 'Primary School' : 'Secondary School'} - ${gradeDetail}`;
  
  const newChannel = {
    id: "ch-" + Date.now(),
    studentName: student,
    grade: gradeLabel,
    subject: subject,
    textbook: textbook,
    messages: [
      { sender: "assistant", text: `Hello! I have created this workspace for **${student}** (${gradeLabel}). We are practicing **${subject}** ${textbook ? `using method *${textbook}*` : ''}. Ask me to generate exercises whenever you are ready!` }
    ],
    generatedSheets: []
  };
  
  state.channels.push(newChannel);
  state.activeChannelId = newChannel.id;
  
  saveState();
  closeNewChannelModal();
  switchView("channels");
  renderChannelsList();
  renderChannelView();
}

// --- EXPORT & PRINT ENGINE ---

function generateExportHTML() {
  if (!state.currentSheet) return "";

  const isMath = state.currentSheet.subject.toLowerCase().includes("math") || state.currentSheet.subject.toLowerCase().includes("wiskunde");
  const mathjaxScript = isMath ? `
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${state.currentSheet.title} (Set #${state.currentSheet.id || ''})</title>
  ${mathjaxScript}
  <style>
    body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #111; padding: 20px; }
    h1 { color: #1e3a8a; font-size: 24px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-top: 0; }
    h2 { color: #1e3a8a; font-size: 18px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .meta { font-size: 13px; color: #555; margin-bottom: 25px; background: #f3f4f6; padding: 10px 15px; border-radius: 6px; }
    .question { margin-bottom: 25px; page-break-inside: avoid; font-size: 15px; }
    .question-num { font-weight: bold; color: #2563eb; }
    .answer-line { border-bottom: 1px dotted #888; height: 35px; margin-top: 15px; width: 100%; }
    .solution-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 12px; margin-top: 8px; border-radius: 0 6px 6px 0; font-size: 14.5px; }
    @media print {
      body { padding: 0; }
      .meta { background: none; border: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <h1>${state.currentSheet.title} (Set #${state.currentSheet.id || ''})</h1>
  <div class="meta">
    <strong>Set Referentie:</strong> #${state.currentSheet.id || 'N/A'} &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Vak:</strong> ${state.currentSheet.subject} &nbsp;&nbsp;|&nbsp;&nbsp;
    <strong>Niveau:</strong> ${state.currentSheet.grade} &nbsp;&nbsp;|&nbsp;&nbsp;
    ${state.currentSheet.textbook ? `<strong>Methode:</strong> ${state.currentSheet.textbook} &nbsp;&nbsp;|&nbsp;&nbsp;` : ""}
    <strong>Datum:</strong> ${new Date().toLocaleDateString('nl-BE')}
  </div>
  
  <h2>WERKBLAD (Voor het kind)</h2>
  <ol style="padding-left: 20px;">
    ${state.currentSheet.exercises.map(ex => `
      <li class="question">
        <div>${ex.question}</div>
        ${ex.space ? '<div class="answer-line"></div><div class="answer-line"></div>' : ''}
      </li>
    `).join('')}
  </ol>
  
  <div style="page-break-before: always;"></div>
  
  <h2>ANTWOORDSLEUTEL (Voor de ouder)</h2>
  <ol style="padding-left: 20px;">
    ${state.currentSheet.answers.map(ans => `
      <li class="question">
        <div><strong>Vraag ${ans.number}</strong></div>
        <div class="solution-box">${ans.solution}</div>
      </li>
    `).join('')}
  </ol>
</body>
</html>`;
}

function copyToClipboard() {
  if (!state.currentSheet) {
    alert("There is no generated homework sheet to export.");
    return;
  }
  const html = generateExportHTML();
  const blob = new Blob([html], { type: 'text/html' });
  const data = [new ClipboardItem({ 'text/html': blob })];
  
  navigator.clipboard.write(data).then(() => {
    alert("Copied! The formatted exercises and answers have been copied to your clipboard.\n\nYou can paste (Ctrl+V) directly into Google Docs or Microsoft Word with all layout styling preserved!");
  }).catch(err => {
    console.error("Clipboard copy failed", err);
    downloadWorksheet();
  });
}

function downloadWorksheet() {
  if (!state.currentSheet) {
    alert("There is no generated homework sheet to download.");
    return;
  }
  const html = generateExportHTML();
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.currentSheet.title.replace(/\s+/g, '_')}_huiswerk.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printWorksheet() {
  if (!state.currentSheet) {
    alert("There is no generated homework sheet to print.");
    return;
  }
  
  const html = generateExportHTML();
  
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);
  
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  
  // Wait a short buffer for MathJax compilation inside iframe
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 1200);
}

// Markdown parser helper for chat bubbles
function formatMarkdownText(text) {
  if (!text) return "";
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\"/g, '<strong>$1</strong>'); // Error tolerance
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Code block
  html = html.replace(/\`(.*?)\`/g, '<code>$1</code>');
  // Paragraphs / Newlines
  html = html.replace(/\n/g, '<br>');
  
  return html;
}

// Event Bindings on DOM Load
document.addEventListener("DOMContentLoaded", () => {
  loadState();
  
  // Set default view
  switchView("dashboard");
  
  // Bind sidebar nav clicks
  document.querySelectorAll(".rail-btn[data-view]").forEach(btn => {
    btn.addEventListener("click", () => {
      switchView(btn.getAttribute("data-view"));
    });
  });
  
  // New channel submit
  const channelForm = document.getElementById("new-channel-form");
  if (channelForm) {
    channelForm.addEventListener("submit", handleAddChannelSubmit);
  }
  
  // New mistake submit
  const mistakeForm = document.getElementById("new-mistake-form");
  if (mistakeForm) {
    mistakeForm.addEventListener("submit", handleAddMistakeSubmit);
  }
  
  // Enter key press in chat textarea
  const chatInput = document.getElementById("chat-input-text");
  if (chatInput) {
    chatInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleChatSubmit();
      }
    });
  }
  
  // File upload input change
  const fileInput = document.getElementById("file-upload");
  if (fileInput) {
    fileInput.addEventListener("change", handleFileUpload);
  }
  
  // Initial channels rail draw
  renderChannelsList();
});
