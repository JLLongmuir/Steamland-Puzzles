const SITE_CONFIG = {
  siteTitle: "Steam Vault Puzzle Rooms",
  puzzles: {
    cipher: {
      id: "cipher",
      title: "Room 1",
      navTitle: "Room 1",
      navHint: "Cipher",
      markerLabel: "Read window",
      targetWord: "MASTER",
      ringLabels: ["Letter Ring", "Number Ring", "Rule Ring"],
      ringClasses: ["outer", "middle", "inner"],
      letters: [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"],
      numbers: [..."0123456789"],
      runes: ["☾", "⚔", "☼", "☠"],
      offsets: [0, 0, 0],
      diameters: [404, 292, 204],
      textRadii: [190, 132, 88],
      encryptedTokens: [
        { outer: "P", number: "3", rune: "☾" },
        { outer: "Z", number: "0", rune: "☼" },
        { outer: "N", number: "5", rune: "⚔" },
        { outer: "Q", number: "3", rune: "⚔" },
        { outer: "V", number: "0", rune: "☼" },
        { outer: "I", number: "0", rune: "☼" }
      ],
      ruleLegend: [
        { symbol: "☾", text: "Shift left" },
        { symbol: "⚔", text: "Shift right" },
        { symbol: "☼", text: "Atbash, then right" },
        { symbol: "☠", text: "Atbash, then left" }
      ]
    },
    wordle: {
      id: "wordle",
      title: "Room 2",
      navTitle: "Room 2",
      navHint: "Terminal",
      answer: "FREAK",
      maxGuesses: 6,
      allowedGuesses: [
        "FREAK",
        "GHOST",
        "GRAVE",
        "DWARF",
        "RAVEN",
        "SWORD",
        "SPELL",
        "QUEST",
        "CRYPT",
        "WRAITH",
        "SHARD",
        "ELVEN",
        "DRAKE"
      ],
      hardModeDictionary: false
    },
    memory: {
      id: "memory",
      title: "Room 3",
      navTitle: "Room 3",
      navHint: "Tiles",
      size: 4,
      pairs: [
        { id: "dragon", symbol: "🐉" },
        { id: "potion", symbol: "🧪" },
        { id: "scroll", symbol: "📜" },
        { id: "skull", symbol: "☠" },
        { id: "gem", symbol: "💎" },
        { id: "moon", symbol: "🌙" },
        { id: "sword", symbol: "⚔" },
        { id: "shield", symbol: "🛡" }
      ],
      layout: [0, 4, 2, 7, 1, 3, 6, 5, 6, 2, 0, 5, 4, 7, 1, 3]
    }
  }
};

const appState = {
  started: false,
  inspiration: 0,
  activePuzzle: "cipher",
  victoryPlayed: false,
  completed: {
    cipher: false,
    wordle: false,
    memory: false
  },
  cipher: {
    offsets: [],
    angles: [],
    currentIndex: 0,
    decodedLetters: [],
    hintedLetters: [],
    status: "playing",
    message: "",
    drag: null
  },
  wordle: {
    guesses: [],
    status: "playing",
    message: "",
    hintedIndexes: []
  },
  memory: {
    tiles: [],
    firstPick: null,
    secondPick: null,
    busy: false,
    matches: 0,
    status: "playing",
    shockMessage: ""
  }
};

const dom = {
  gateScreen: document.getElementById("gateScreen"),
  appShell: document.getElementById("appShell"),
  gateForm: document.getElementById("gateForm"),
  inspirationInput: document.getElementById("inspirationInput"),
  siteTitle: document.getElementById("siteTitle"),
  globalInspirationValue: document.getElementById("globalInspirationValue"),
  puzzleNav: document.getElementById("puzzleNav"),
  victoryAudio: document.getElementById("victoryAudio"),
  tickAudio: document.getElementById("tickAudio"),
  unlockAudio: document.getElementById("unlockAudio"),
  confettiCanvas: document.getElementById("confettiCanvas"),
  panels: {
    cipher: document.getElementById("cipherPanel"),
    wordle: document.getElementById("wordlePanel"),
    memory: document.getElementById("memoryPanel")
  },
  resetAllBtn: document.getElementById("resetAllBtn")
};

function init() {
  validateCipherConfig();

  dom.siteTitle.textContent = SITE_CONFIG.siteTitle;

  window.addEventListener("resize", resizeConfettiCanvas);
  resizeConfettiCanvas();

  dom.gateForm.addEventListener("submit", handleGateSubmit);
  dom.resetAllBtn.addEventListener("click", handleResetAll);

  document.addEventListener("click", (event) => {
    const resetButton = event.target.closest("[data-reset-panel]");
    if (resetButton) {
      const panelId = resetButton.dataset.resetPanel;
      resetSinglePuzzle(panelId);
      return;
    }

    const hintButton = event.target.closest("[data-hint-button]");
    if (hintButton) {
      useHint();
    }
  });
}

function handleGateSubmit(event) {
  event.preventDefault();
  const value = Math.max(0, Number(dom.inspirationInput.value || 0));

  appState.started = true;
  appState.inspiration = value;

  resetCipherState();
  resetWordleState();
  resetMemoryState();

  dom.globalInspirationValue.textContent = String(appState.inspiration);
  dom.gateScreen.classList.add("hidden");
  dom.appShell.classList.remove("hidden");

  renderNav();
  renderCipherPanel();
  renderWordlePanel();
  renderMemoryPanel();
  switchPanel("cipher");
}

function handleResetAll() {
  if (!appState.started) return;

  appState.victoryPlayed = false;

  if (dom.victoryAudio) {
    dom.victoryAudio.pause();
    dom.victoryAudio.currentTime = 0;
  }

  appState.completed = {
    cipher: false,
    wordle: false,
    memory: false
  };
  appState.activePuzzle = "cipher";

  resetCipherState();
  resetWordleState();
  resetMemoryState();

  updateGlobalInspiration();
  renderNav();
  renderCipherPanel();
  renderWordlePanel();
  renderMemoryPanel();
  switchPanel("cipher");
}

function resetSinglePuzzle(panelId) {
  if (panelId === "cipher") {
    appState.completed.cipher = false;
    resetCipherState();
    renderCipherPanel();
  }

  if (panelId === "wordle") {
    appState.completed.wordle = false;
    resetWordleState();
    renderWordlePanel();
  }

  if (panelId === "memory") {
    appState.completed.memory = false;
    resetMemoryState();
    renderMemoryPanel();
  }

  renderNav();
  switchPanel(panelId);
}

function updateGlobalInspiration() {
  dom.globalInspirationValue.textContent = String(appState.inspiration);
}

function renderNav() {
  const orderedIds = ["cipher", "wordle", "memory"];
  dom.puzzleNav.innerHTML = "";

  orderedIds.forEach((id, index) => {
    const puzzle = SITE_CONFIG.puzzles[id];
    const btn = document.createElement("button");
    btn.className = `nav-btn ${appState.activePuzzle === id ? "active" : ""}`;
    btn.type = "button";
    btn.disabled = isPuzzleLocked(index);
    btn.innerHTML = `
      <span class="nav-label">${escapeHtml(puzzle.navTitle)}: ${escapeHtml(puzzle.title)}</span>
      <span class="nav-meta">${escapeHtml(getNavStatusText(id, puzzle.navHint))}</span>
    `;
    btn.addEventListener("click", () => switchPanel(id));
    dom.puzzleNav.appendChild(btn);
  });
}

function getNavStatusText(id, fallback) {
  if (appState.completed[id]) return "Solved";
  if (id === "wordle" && appState.wordle.status === "lost") return "Failed";
  return fallback;
}

function isPuzzleLocked(index) {
  if (index === 0) return false;
  const orderedIds = ["cipher", "wordle", "memory"];

  for (let i = 0; i < index; i += 1) {
    if (!appState.completed[orderedIds[i]]) return true;
  }

  return false;
}

function switchPanel(id) {
  appState.activePuzzle = id;
  Object.entries(dom.panels).forEach(([panelId, panel]) => {
    panel.classList.toggle("active", panelId === id);
  });
  renderNav();
}

function panelHeaderHtml(puzzle, solved) {
  return `
    <div class="panel-header">
      <div>
        <h2>${escapeHtml(puzzle.title)}</h2>
      </div>
      <div>
        <button class="secondary-btn" type="button" data-reset-panel="${escapeHtml(puzzle.id)}">Reset</button>
      </div>
    </div>
    <div class="badge-row">
      <div class="badge">Mode: Sequential</div>
      <div class="badge">Status: ${solved ? "Solved" : "In Progress"}</div>
    </div>
  `;
}

/* =========================
   Cipher
========================= */

function validateCipherConfig() {
  const puzzle = SITE_CONFIG.puzzles.cipher;

  if (puzzle.encryptedTokens.length !== puzzle.targetWord.length) {
    throw new Error("Cipher config error: encryptedTokens length must equal targetWord length.");
  }

  puzzle.encryptedTokens.forEach((token, index) => {
    const decoded = decodeCipherToken(token);
    if (decoded !== puzzle.targetWord[index]) {
      throw new Error(`Cipher config error at token ${index}.`);
    }
  });
}

function renderCipherPanel() {
  const puzzle = SITE_CONFIG.puzzles.cipher;
  const solved = appState.cipher.status === "solved";
  const currentTriplet = getCipherReadTriplet();
  const decodedPreview = decodeCipherToken(currentTriplet);

  const rulesHtml = puzzle.ruleLegend.map((rule) => `
    <div class="rule-chip"><strong>${escapeHtml(rule.symbol)}</strong> ${escapeHtml(rule.text)}</div>
  `).join("");

  const controlsHtml = [puzzle.letters, puzzle.numbers, puzzle.runes].map((ring, index) => `
    <div class="ring-control">
      <button class="icon-btn" type="button" data-cipher-step data-ring-index="${index}" data-direction="-1">−</button>
      <div class="label">
        <strong>${escapeHtml(puzzle.ringLabels[index])}</strong>
        <span class="ring-note">Drag or tap</span>
      </div>
      <button class="icon-btn" type="button" data-cipher-step data-ring-index="${index}" data-direction="1">+</button>
    </div>
  `).join("");

  dom.panels.cipher.innerHTML = `
    ${panelHeaderHtml(puzzle, solved)}

    <div class="two-col">
      <div class="card cipher-stage">
        <div class="wheel-shell" id="cipherWheelShell">
          <div class="marker"></div>
          <div class="marker-label">${escapeHtml(puzzle.markerLabel)}</div>
          <div class="read-window"></div>
          <div class="center-glow"></div>
          ${buildCipherWheelHtml()}
          ${buildAtbashReferenceHtml()}
        </div>

        <div class="info-grid">
          <div class="info-box"><strong>Letter</strong>${escapeHtml(currentTriplet.outer)}</div>
          <div class="info-box"><strong>Number</strong>${escapeHtml(currentTriplet.number)}</div>
          <div class="info-box"><strong>Rule</strong>${escapeHtml(currentTriplet.rune)}</div>
          <div class="info-box"><strong>Reads</strong>${escapeHtml(decodedPreview)}</div>
        </div>

        <div>
          <h3>Code</h3>
          <div class="decoded-word">${buildCipherWordHtml()}</div>
        </div>

        <div class="resource-row">
          <div class="resource-box">
            <strong>Inspiration</strong>
            ${appState.inspiration}
          </div>
          <button
            class="primary-btn"
            type="button"
            data-hint-button
            ${appState.inspiration <= 0 || solved ? "disabled" : ""}
          >
            Hint
          </button>
        </div>

        <div class="status-message ${solved ? "good" : ""}">
          ${escapeHtml(appState.cipher.message)}
        </div>
      </div>

      <div class="card">
        <div class="rule-list">${rulesHtml}</div>

        <h3 style="margin-top: 18px;">Controls</h3>
        <div class="ring-controls-list">${controlsHtml}</div>
      </div>
    </div>
  `;

  dom.panels.cipher.querySelectorAll("[data-cipher-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const ringIndex = Number(button.dataset.ringIndex);
      const direction = Number(button.dataset.direction);
      nudgeCipherRing(ringIndex, direction);
    });
  });

  setupCipherDrag();
}

function buildCipherWordHtml() {
  const target = SITE_CONFIG.puzzles.cipher.targetWord.split("");

  return target.map((char, index) => {
    const solved = index < appState.cipher.currentIndex || appState.cipher.hintedLetters[index];
    const shown = solved ? target[index] : "_";

    return `
      <div class="letter-slot ${solved ? "solved" : ""}">
        <div class="slot-letter">${escapeHtml(shown)}</div>
        <div class="slot-check">${solved ? "open" : "locked"}</div>
      </div>
    `;
  }).join("");
}

function buildAtbashReferenceHtml() {
  return `
    <div class="atbash-card">
      <h4>Atbash</h4>
      <div class="atbash-row">A↔Z  B↔Y  C↔X  D↔W  E↔V  F↔U  G↔T</div>
      <div class="atbash-row">H↔S  I↔R  J↔Q  K↔P  L↔O  M↔N</div>
    </div>
  `;
}

function buildCipherWheelHtml() {
  const puzzle = SITE_CONFIG.puzzles.cipher;
  const rings = [puzzle.letters, puzzle.numbers, puzzle.runes];

  return rings.map((ring, ringIndex) => {
    const diameter = puzzle.diameters[ringIndex];
    const textRadius = puzzle.textRadii[ringIndex];
    const ringClass = puzzle.ringClasses[ringIndex] || "";
    const angle = appState.cipher.angles[ringIndex];
    const glyphAngleStep = 360 / ring.length;

    const glyphsHtml = ring.map((item, itemIndex) => {
      const baseAngle = itemIndex * glyphAngleStep;
      return `
        <span
          class="cipher-glyph ${escapeHtml(ringClass)}"
          data-cipher-glyph="${ringIndex}"
          data-base-angle="${baseAngle}"
          data-text-radius="${textRadius}"
          style="transform: translate(-50%, -50%) rotate(${baseAngle}deg) translateY(-${textRadius}px) rotate(${-(baseAngle + angle)}deg);"
        >${escapeHtml(item)}</span>
      `;
    }).join("");

    return `
      <div
        class="drag-ring"
        data-cipher-drag-ring="${ringIndex}"
        style="width:${diameter}px;height:${diameter}px;"
      >
        <div
          class="cipher-ring-track"
          data-cipher-track="${ringIndex}"
          style="transform: rotate(${angle}deg);"
        >
          <div class="cipher-ring-band"></div>
          <div class="cipher-ring-inner-shadow"></div>
          ${glyphsHtml}
        </div>
      </div>
    `;
  }).join("");
}

function setupCipherDrag() {
  const shell = document.getElementById("cipherWheelShell");
  if (!shell) return;

  shell.querySelectorAll("[data-cipher-drag-ring]").forEach((ringEl) => {
    ringEl.addEventListener("pointerdown", onCipherPointerDown);
  });
}

function onCipherPointerDown(event) {
  const ringEl = event.currentTarget;
  const ringIndex = Number(ringEl.dataset.cipherDragRing);
  const shell = document.getElementById("cipherWheelShell");
  if (!shell) return;

  const rect = shell.getBoundingClientRect();
  const center = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };

  appState.cipher.drag = {
    ringIndex,
    pointerId: event.pointerId,
    startPointerAngle: getPointerAngle(event.clientX, event.clientY, center.x, center.y),
    startRingAngle: appState.cipher.angles[ringIndex]
  };

  ringEl.classList.add("dragging");
  ringEl.setPointerCapture(event.pointerId);
  ringEl.addEventListener("pointermove", onCipherPointerMove);
  ringEl.addEventListener("pointerup", onCipherPointerUp);
  ringEl.addEventListener("pointercancel", onCipherPointerUp);
}

function onCipherPointerMove(event) {
  const drag = appState.cipher.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  const shell = document.getElementById("cipherWheelShell");
  if (!shell) return;

  const rect = shell.getBoundingClientRect();
  const center = {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };

  const currentPointerAngle = getPointerAngle(event.clientX, event.clientY, center.x, center.y);
  const delta = shortestAngleDelta(drag.startPointerAngle, currentPointerAngle);
  const nextAngle = drag.startRingAngle + delta;
  appState.cipher.angles[drag.ringIndex] = nextAngle;

  updateCipherTrackTransform(drag.ringIndex, nextAngle);
}

function onCipherPointerUp(event) {
  const drag = appState.cipher.drag;
  if (!drag || drag.pointerId !== event.pointerId) return;

  const ringEl = event.currentTarget;
  ringEl.classList.remove("dragging");
  ringEl.releasePointerCapture(event.pointerId);
  ringEl.removeEventListener("pointermove", onCipherPointerMove);
  ringEl.removeEventListener("pointerup", onCipherPointerUp);
  ringEl.removeEventListener("pointercancel", onCipherPointerUp);

  snapCipherRing(drag.ringIndex);
  appState.cipher.drag = null;
}

function updateCipherTrackTransform(ringIndex, angle) {
  const track = dom.panels.cipher.querySelector(`[data-cipher-track="${ringIndex}"]`);
  if (track) {
    track.style.transform = `rotate(${angle}deg)`;
  }

  const glyphs = dom.panels.cipher.querySelectorAll(`[data-cipher-glyph="${ringIndex}"]`);
  glyphs.forEach((glyph) => {
    const baseAngle = Number(glyph.dataset.baseAngle);
    const textRadius = Number(glyph.dataset.textRadius);
    glyph.style.transform =
      `translate(-50%, -50%) rotate(${baseAngle}deg) translateY(-${textRadius}px) rotate(${-(baseAngle + angle)}deg)`;
  });
}

function nudgeCipherRing(ringIndex, direction) {
  const rings = getCipherRings();
  const ringLength = rings[ringIndex].length;
  appState.cipher.offsets[ringIndex] = mod(appState.cipher.offsets[ringIndex] + direction, ringLength);
  appState.cipher.angles[ringIndex] = offsetToAngle(appState.cipher.offsets[ringIndex], ringLength);
  finishCipherMove();
}

function snapCipherRing(ringIndex) {
  const rings = getCipherRings();
  const ringLength = rings[ringIndex].length;
  const stepAngle = 360 / ringLength;
  const snappedOffset = mod(Math.round(-appState.cipher.angles[ringIndex] / stepAngle), ringLength);

  appState.cipher.offsets[ringIndex] = snappedOffset;
  appState.cipher.angles[ringIndex] = offsetToAngle(snappedOffset, ringLength);

  playTickSound(); 

  finishCipherMove();
}
function playTickSound() {
  if (!dom.tickAudio) return;

  dom.tickAudio.currentTime = 0;
  dom.tickAudio.volume = 0.4; // softer = more natural
  dom.tickAudio.play().catch(() => {});
}
function finishCipherMove() {
  checkCipherProgress();
  renderCipherPanel();

  if (appState.cipher.status === "solved") {
    completePuzzle("cipher");
  }
}

function getCipherRings() {
  const puzzle = SITE_CONFIG.puzzles.cipher;
  return [puzzle.letters, puzzle.numbers, puzzle.runes];
}

function getCipherReadTriplet() {
  const rings = getCipherRings();
  return {
    outer: rings[0][mod(appState.cipher.offsets[0], rings[0].length)],
    number: rings[1][mod(appState.cipher.offsets[1], rings[1].length)],
    rune: rings[2][mod(appState.cipher.offsets[2], rings[2].length)]
  };
}

function formatToken(token) {
  return `${token.outer}${token.number}${token.rune}`;
}

function tokensMatch(a, b) {
  return a.outer === b.outer && a.number === b.number && a.rune === b.rune;
}

function decodeCipherToken(token) {
  const alphabet = SITE_CONFIG.puzzles.cipher.letters;
  const shift = Number(token.number);
  const startIndex = alphabet.indexOf(token.outer);

  let index = startIndex;

  switch (token.rune) {
    case "☾":
      index = mod(index - shift, alphabet.length);
      break;
    case "⚔":
      index = mod(index + shift, alphabet.length);
      break;
    case "☼":
      index = alphabet.length - 1 - index;
      index = mod(index + shift, alphabet.length);
      break;
    case "☠":
      index = alphabet.length - 1 - index;
      index = mod(index - shift, alphabet.length);
      break;
    default:
      throw new Error("Unknown rune.");
  }

  return alphabet[index];
}

function checkCipherProgress() {
  const puzzle = SITE_CONFIG.puzzles.cipher;

  if (appState.cipher.status === "solved") return;

  const activeToken = puzzle.encryptedTokens[appState.cipher.currentIndex];
  if (!activeToken) {
    appState.cipher.status = "solved";
    appState.cipher.message = "Complete";
    return;
  }

  const currentTriplet = getCipherReadTriplet();
  if (tokensMatch(currentTriplet, activeToken)) {
    appState.cipher.currentIndex += 1;

if (appState.cipher.currentIndex >= SITE_CONFIG.puzzles.cipher.targetWord.length) {
  appState.cipher.status = "solved";
  appState.cipher.message = "Unlocked";
  playUnlockSound();
  completePuzzle("cipher");
} else {
  appState.cipher.message = "Hint used";
}
  playUnlockSound(); 
    return;
  }

  appState.cipher.message = "Align next token";
}

const a = document.getElementById("unlockAudio");
a.volume = 1;
a.currentTime = 0;
a.play();
function playUnlockSound() {
  if (!dom.unlockAudio) return;

  dom.unlockAudio.currentTime = 0;
  dom.unlockAudio.volume = 0.7;
  dom.unlockAudio.play().catch(() => {});
} 
function resetCipherState() {
  const puzzle = SITE_CONFIG.puzzles.cipher;
  const rings = getCipherRings();

  appState.cipher = {
    offsets: [...puzzle.offsets],
    angles: rings.map((ring, index) => offsetToAngle(puzzle.offsets[index], ring.length)),
    currentIndex: 0,
    decodedLetters: Array(puzzle.targetWord.length).fill(""),
    hintedLetters: Array(puzzle.targetWord.length).fill(false),
    status: "playing",
    message: "Align next token",
    drag: null
  };
}

/* =========================
   Wordle
========================= */

function renderWordlePanel() {
  const puzzle = SITE_CONFIG.puzzles.wordle;
  const answerLength = puzzle.answer.length;
  const solved = appState.wordle.status === "won";
  const rowsHtml = buildWordleRowsHtml();

  dom.panels.wordle.innerHTML = `
    ${panelHeaderHtml(puzzle, solved)}

    <div class="two-col">
      <div class="card">
        <form id="wordleForm" class="wordle-form">
          <input id="wordleGuess" name="guess" maxlength="${answerLength}" autocomplete="off" spellcheck="false" ${appState.wordle.status !== "playing" ? "disabled" : ""} />
          <button class="primary-btn" type="submit" ${appState.wordle.status !== "playing" ? "disabled" : ""}>Enter</button>
        </form>

        <div class="wordle-grid">${rowsHtml}</div>
        <div class="resource-row" style="margin-top:16px;">
          <div class="resource-box">
            <strong>Inspiration</strong>
            ${appState.inspiration}
          </div>
          <button class="primary-btn" type="button" data-hint-button ${appState.inspiration <= 0 || solved ? "disabled" : ""}>Hint</button>
        </div>
        <div class="status-message ${solved ? "good" : ""}">${escapeHtml(appState.wordle.message)}</div>
      </div>

      <div class="card">
        <div class="status-message warn">${escapeHtml(getWordleHintText())}</div>
      </div>
    </div>
  `;

  const form = document.getElementById("wordleForm");
  form.addEventListener("submit", handleWordleSubmit);

  if (solved) completePuzzle("wordle");
}

function getWordleHintText() {
  if (!appState.wordle.hintedIndexes.length) return "No hint used";
  const answer = SITE_CONFIG.puzzles.wordle.answer.toUpperCase();
  const lastIndex = appState.wordle.hintedIndexes[appState.wordle.hintedIndexes.length - 1];
  return `${answer[lastIndex]} is the ${ordinal(lastIndex + 1)} letter`;
}

function buildWordleRowsHtml() {
  const puzzle = SITE_CONFIG.puzzles.wordle;
  const answerLength = puzzle.answer.length;
  let rowsHtml = "";

  for (let rowIndex = 0; rowIndex < puzzle.maxGuesses; rowIndex += 1) {
    const guessData = appState.wordle.guesses[rowIndex];
    const row = guessData ? guessData.letters : Array(answerLength).fill({ char: "", state: "" });

    rowsHtml += `<div class="wordle-row" style="grid-template-columns: repeat(${answerLength}, minmax(0, 56px));">`;
    row.forEach((cell) => {
      rowsHtml += `<div class="wordle-cell ${escapeHtml(cell.state || "")}">${escapeHtml(cell.char || "")}</div>`;
    });
    rowsHtml += `</div>`;
  }

  return rowsHtml;
}

function handleWordleSubmit(event) {
  event.preventDefault();
  if (appState.wordle.status !== "playing") return;

  const puzzle = SITE_CONFIG.puzzles.wordle;
  const formData = new FormData(event.currentTarget);
  const rawGuess = String(formData.get("guess") || "").trim().toUpperCase();

  if (rawGuess.length !== puzzle.answer.length) {
    appState.wordle.message = `Need ${puzzle.answer.length} letters`;
    renderWordlePanel();
    return;
  }

  if (puzzle.hardModeDictionary) {
    const allowed = puzzle.allowedGuesses.map((word) => word.toUpperCase());
    if (!allowed.includes(rawGuess)) {
      appState.wordle.message = "Invalid";
      renderWordlePanel();
      return;
    }
  }

  const evaluated = evaluateWordleGuess(rawGuess, puzzle.answer.toUpperCase());
  appState.wordle.guesses.push({ rawGuess, letters: evaluated });

  if (rawGuess === puzzle.answer.toUpperCase()) {
    appState.wordle.status = "won";
    appState.wordle.message = "Unlocked";
  } else if (appState.wordle.guesses.length >= puzzle.maxGuesses) {
    appState.wordle.status = "lost";
    appState.wordle.message = "Locked";
  } else {
    appState.wordle.message = "Try again";
  }

  renderWordlePanel();
}

function evaluateWordleGuess(guess, answer) {
  const result = guess.split("").map((char) => ({ char, state: "absent" }));
  const answerLetters = answer.split("");
  const used = Array(answerLetters.length).fill(false);

  for (let i = 0; i < guess.length; i += 1) {
    if (guess[i] === answerLetters[i]) {
      result[i].state = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < guess.length; i += 1) {
    if (result[i].state === "correct") continue;
    const matchIndex = answerLetters.findIndex(
      (letter, index) => !used[index] && letter === guess[i]
    );
    if (matchIndex !== -1) {
      result[i].state = "present";
      used[matchIndex] = true;
    }
  }

  return result;
}

function resetWordleState() {
  const puzzle = SITE_CONFIG.puzzles.wordle;
  appState.wordle = {
    guesses: [],
    status: "playing",
    message: `Enter ${puzzle.answer.length} letters`,
    hintedIndexes: []
  };
}

/* =========================
   Memory
========================= */

function renderMemoryPanel() {
  const puzzle = SITE_CONFIG.puzzles.memory;
  const solved = appState.memory.status === "won";

  const tilesHtml = appState.memory.tiles
    .map((tile, index) => {
      const isVisible = tile.matched || tile.flipped;
      const classes = ["tile"];
      if (tile.flipped) classes.push("flipped");
      if (tile.matched) classes.push("matched");

      return `
        <button
          class="${classes.join(" ")}"
          type="button"
          data-memory-tile="${index}"
          ${tile.matched || tile.flipped || appState.memory.busy || solved ? "disabled" : ""}
        >
          ${isVisible ? escapeHtml(tile.symbol) : "?"}
        </button>
      `;
    })
    .join("");

  dom.panels.memory.innerHTML = `
    ${panelHeaderHtml(puzzle, solved)}

    <div class="two-col">
      <div class="card">
        <div class="memory-grid">${tilesHtml}</div>

        <div class="resource-row" style="margin-top:16px;">
          <div class="resource-box">
            <strong>Inspiration</strong>
            ${appState.inspiration}
          </div>
          <button class="primary-btn" type="button" data-hint-button ${appState.inspiration <= 0 || solved ? "disabled" : ""}>Hint</button>
        </div>

        ${appState.memory.shockMessage
          ? `<div class="status-message bad">${escapeHtml(appState.memory.shockMessage)}</div>`
          : `<div class="status-message ${solved ? "good" : ""}">${solved ? "Unlocked" : "Match all pairs"}</div>`
        }
      </div>

      <div class="card">
        <div class="status-message warn">Hint reveals one pair</div>
      </div>
    </div>
  `;

  dom.panels.memory.querySelectorAll("[data-memory-tile]").forEach((button) => {
    button.addEventListener("click", () => handleMemoryClick(Number(button.dataset.memoryTile)));
  });

  if (solved) completePuzzle("memory");
}

function handleMemoryClick(tileIndex) {
  if (appState.memory.busy) return;
  const tile = appState.memory.tiles[tileIndex];
  if (!tile || tile.flipped || tile.matched) return;

  appState.memory.shockMessage = "";
  tile.flipped = true;

  if (appState.memory.firstPick === null) {
    appState.memory.firstPick = tileIndex;
    renderMemoryPanel();
    return;
  }

  appState.memory.secondPick = tileIndex;
  appState.memory.busy = true;

  const first = appState.memory.tiles[appState.memory.firstPick];
  const second = appState.memory.tiles[appState.memory.secondPick];

  if (first.pairIndex === second.pairIndex) {
    first.matched = true;
    second.matched = true;
    appState.memory.matches += 1;
    clearMemorySelection();

if (appState.memory.matches === SITE_CONFIG.puzzles.memory.pairs.length) {
  appState.memory.status = "won";
  triggerFinalVictory();
  completePuzzle("memory");
}

    renderMemoryPanel();
    return;
  }

  appState.memory.shockMessage = "Wrong pair";
  renderMemoryPanel();

  setTimeout(() => {
    first.flipped = false;
    second.flipped = false;
    clearMemorySelection();
    renderMemoryPanel();
  }, 850);
}

function clearMemorySelection() {
  appState.memory.firstPick = null;
  appState.memory.secondPick = null;
  appState.memory.busy = false;
}

function resetMemoryState() {
  const puzzle = SITE_CONFIG.puzzles.memory;
  validateMemoryConfig(puzzle);

  const tiles = puzzle.layout.map((pairIndex) => ({
    pairIndex,
    symbol: puzzle.pairs[pairIndex].symbol,
    flipped: false,
    matched: false
  }));

  appState.memory = {
    tiles,
    firstPick: null,
    secondPick: null,
    busy: false,
    matches: 0,
    status: "playing",
    shockMessage: ""
  };
}

function validateMemoryConfig(puzzle) {
  const expectedTiles = puzzle.size * puzzle.size;

  if (expectedTiles !== 16) {
    throw new Error("Memory config error.");
  }

  if (puzzle.pairs.length !== 8) {
    throw new Error("Memory config error.");
  }

  if (!Array.isArray(puzzle.layout) || puzzle.layout.length !== expectedTiles) {
    throw new Error("Memory config error.");
  }
}

/* =========================
   Shared hint system
========================= */

function useHint() {
  if (appState.inspiration <= 0) return;

  if (appState.activePuzzle === "cipher") {
    useCipherHint();
  } else if (appState.activePuzzle === "wordle") {
    useWordleHint();
  } else if (appState.activePuzzle === "memory") {
    useMemoryHint();
  }

  updateGlobalInspiration();
}

function useCipherHint() {
  if (appState.cipher.status === "solved") return;
  const nextIndex = appState.cipher.currentIndex;
  if (nextIndex >= SITE_CONFIG.puzzles.cipher.targetWord.length) return;

  appState.inspiration -= 1;
  appState.cipher.hintedLetters[nextIndex] = true;
  appState.cipher.currentIndex += 1;

  if (appState.cipher.currentIndex >= SITE_CONFIG.puzzles.cipher.targetWord.length) {
    appState.cipher.status = "solved";
    appState.cipher.message = "Unlocked";
    completePuzzle("cipher");
  } else {
    appState.cipher.message = "Hint used";
  }

  renderCipherPanel();
}

function useWordleHint() {
  if (appState.wordle.status !== "playing") return;

  const answer = SITE_CONFIG.puzzles.wordle.answer.toUpperCase();
  const available = [];

  for (let i = 0; i < answer.length; i += 1) {
    if (!appState.wordle.hintedIndexes.includes(i)) {
      available.push(i);
    }
  }

  if (!available.length) return;

  appState.inspiration -= 1;
  const chosen = available[0];
  appState.wordle.hintedIndexes.push(chosen);
  appState.wordle.message = `${answer[chosen]} is the ${ordinal(chosen + 1)} letter`;
  renderWordlePanel();
}

function useMemoryHint() {
  if (appState.memory.status === "won") return;

  const tiles = appState.memory.tiles;
  const unmatchedPairIndex = (() => {
    for (let pairIndex = 0; pairIndex < SITE_CONFIG.puzzles.memory.pairs.length; pairIndex += 1) {
      const pairTiles = tiles.filter((tile) => tile.pairIndex === pairIndex);
      if (pairTiles.some((tile) => !tile.matched)) return pairIndex;
    }
    return null;
  })();

  if (unmatchedPairIndex === null) return;

  appState.inspiration -= 1;

  tiles.forEach((tile) => {
    if (tile.pairIndex === unmatchedPairIndex) {
      tile.matched = true;
      tile.flipped = true;
    }
  });

  appState.memory.matches += 1;
  appState.memory.shockMessage = "Hint revealed a pair";

if (appState.memory.matches >= SITE_CONFIG.puzzles.memory.pairs.length) {
  appState.memory.status = "won";
  triggerFinalVictory();
  completePuzzle("memory");
}

  renderMemoryPanel();
}

/* =========================
   Shared helpers
========================= */

function completePuzzle(id) {
  if (appState.completed[id]) return;
  appState.completed[id] = true;
  renderNav();

  const order = ["cipher", "wordle", "memory"];
  const currentIndex = order.indexOf(id);
  const nextId = order[currentIndex + 1];

  if (nextId) {
    switchPanel(nextId);
  }
}

function getPointerAngle(pointerX, pointerY, centerX, centerY) {
  return Math.atan2(pointerY - centerY, pointerX - centerX) * (180 / Math.PI);
}

function shortestAngleDelta(startAngle, endAngle) {
  let delta = endAngle - startAngle;
  while (delta > 180) delta -= 360;
  while (delta < -180) delta += 360;
  return delta;
}

function offsetToAngle(offset, ringLength) {
  return -(offset * (360 / ringLength));
}

function mod(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

function ordinal(num) {
  const mod10 = num % 10;
  const mod100 = num % 100;
  if (mod10 === 1 && mod100 !== 11) return `${num}st`;
  if (mod10 === 2 && mod100 !== 12) return `${num}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${num}rd`;
  return `${num}th`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function triggerFinalVictory() {
  if (appState.victoryPlayed) return;
  appState.victoryPlayed = true;

  playVictoryAudio();
  runConfettiBurst();
}

function playVictoryAudio() {
  if (!dom.victoryAudio) return;

  dom.victoryAudio.currentTime = 0;
  dom.victoryAudio.play().catch(() => {
    console.log("Audio playback was blocked by the browser.");
  });
}

function runConfettiBurst() {
  const canvas = dom.confettiCanvas;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  resizeConfettiCanvas();

  const pieces = [];
  const pieceCount = 220;

  for (let i = 0; i < pieceCount; i += 1) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.5,
      w: 6 + Math.random() * 8,
      h: 10 + Math.random() * 12,
      vx: -2 + Math.random() * 4,
      vy: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      vr: -0.15 + Math.random() * 0.3,
      color: randomConfettiColor()
    });
  }

  let frame = 0;
  const maxFrames = 260;

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const piece of pieces) {
      piece.x += piece.vx;
      piece.y += piece.vy;
      piece.rotation += piece.vr;
      piece.vy += 0.02;

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.rotate(piece.rotation);
      ctx.fillStyle = piece.color;
      ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
      ctx.restore();
    }

    frame += 1;
    if (frame < maxFrames) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animate();
}

function resizeConfettiCanvas() {
  if (!dom.confettiCanvas) return;
  dom.confettiCanvas.width = window.innerWidth;
  dom.confettiCanvas.height = window.innerHeight;
}

function randomConfettiColor() {
  const colors = [
    "#c79b52",
    "#b56f4d",
    "#f2eadf",
    "#9a6a3c",
    "#66895a"
  ];
  return colors[Math.floor(Math.random() * colors.length)];
} 
init();