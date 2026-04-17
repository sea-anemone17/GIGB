const subjectSelect = document.getElementById("subjectSelect");
const unitSelect = document.getElementById("unitSelect");

const newSubjectInput = document.getElementById("newSubjectInput");
const newUnitInput = document.getElementById("newUnitInput");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const addUnitBtn = document.getElementById("addUnitBtn");
const deleteSubjectBtn = document.getElementById("deleteSubjectBtn");
const deleteUnitBtn = document.getElementById("deleteUnitBtn");

const currentSubject = document.getElementById("currentSubject");
const currentUnit = document.getElementById("currentUnit");
const successRateEl = document.getElementById("successRate");
const solvedCountEl = document.getElementById("solvedCount");
const remainingForRollEl = document.getElementById("remainingForRoll");
const rollTicketsEl = document.getElementById("rollTickets");
const tokenFragmentsEl = document.getElementById("tokenFragments");

const lastRollEl = document.getElementById("lastRoll");
const rollResultEl = document.getElementById("rollResult");
const rollResultBox = document.getElementById("rollResultBox");
const resultPraiseEl = document.getElementById("resultPraise");

const normalTokenEl = document.getElementById("normalToken");
const specialTokenEl = document.getElementById("specialToken");

const solveProblemBtn = document.getElementById("solveProblemBtn");
const timerSuccessBtn = document.getElementById("timerSuccessBtn");
const rollBtn = document.getElementById("rollBtn");
const drawBtn = document.getElementById("drawBtn");
const resetProgressBtn = document.getElementById("resetProgressBtn");

const gachaResult = document.getElementById("gachaResult");
const logList = document.getElementById("logList");
const clearLogBtn = document.getElementById("clearLogBtn");

const useSpecialTokenCheckbox = document.getElementById("useSpecialToken");
const savePromptBtn = document.getElementById("savePromptBtn");
const savedPromptList = document.getElementById("savedPromptList");

const timerMinutesInput = document.getElementById("timerMinutesInput");
const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");

const startTimerBtn = document.getElementById("startTimerBtn");
const pauseTimerBtn = document.getElementById("pauseTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");

function canRollNow() {
  if (!canRoll()) return false;
  if (!state.subject || !state.unit) return false;

  const progress = getCurrentProgress();
  if (!progress) return false;

  const successRate = Number(progress.successRate);
  if (!Number.isFinite(successRate)) return false;
  if (successRate < 1 || successRate > 95) return false;

  return true;
}

function setText(el, value) {
  if (el) el.textContent = value;
}

function initSubjectOptions() {
  if (!subjectSelect) return;

  subjectSelect.innerHTML = "";
  const subjects = Object.keys(state.subjects);

  if (subjects.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "과목을 먼저 추가해 주세요";
    subjectSelect.appendChild(option);
    state.subject = "";
    return;
  }

  subjects.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject;
    option.textContent = subject;
    subjectSelect.appendChild(option);
  });

  if (!subjects.includes(state.subject)) {
    state.subject = subjects[0];
  }

  subjectSelect.value = state.subject;
}

function initUnitOptions() {
  if (!unitSelect) return;

  unitSelect.innerHTML = "";
  const units = state.subjects[state.subject] || [];

  if (units.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "소단원을 먼저 추가해 주세요";
    unitSelect.appendChild(option);
    state.unit = "";
    return;
  }

  units.forEach((unit) => {
    const option = document.createElement("option");
    option.value = unit;
    option.textContent = unit;
    unitSelect.appendChild(option);
  });

  if (!units.includes(state.unit)) {
    state.unit = units[0];
  }

  unitSelect.value = state.unit;
  ensureProgress(state.subject, state.unit);
}

function renderStatus() {
  const progress = getCurrentProgress();

  setText(currentSubject, state.subject || "-");
  setText(currentUnit, state.unit || "-");
  setText(successRateEl, progress ? progress.successRate : 35);
  setText(solvedCountEl, progress ? progress.solvedCount : 0);
  setText(remainingForRollEl, getCurrentProgress() ? getRemainingForRoll() : "-");
  setText(rollTicketsEl, state.rollTickets);
  setText(tokenFragmentsEl, state.tokenFragments);

  if (rollResultBox) {
    rollResultBox.className = "roll-result-box";

    const currentResult = progress?.lastRollResult ?? "-";
    if (currentResult === "보통 성공") {
      rollResultBox.classList.add("result-success");
    } else if (currentResult === "어려운 성공") {
      rollResultBox.classList.add("result-hard-success");
    } else if (currentResult === "극단적 성공") {
      rollResultBox.classList.add("result-critical-success");
    } else if (currentResult === "실패") {
      rollResultBox.classList.add("result-fail");
    } else if (currentResult === "대실패") {
      rollResultBox.classList.add("result-critical-fail");
    }
  }

  setText(lastRollEl, progress?.lastRoll ?? "-");
  setText(rollResultEl, progress?.lastRollResult ?? "-");

  setText(normalTokenEl, state.normalToken);
  setText(specialTokenEl, state.specialToken);

  const validUnit = hasCurrentUnit();

  if (solveProblemBtn) solveProblemBtn.disabled = !validUnit;
  if (timerSuccessBtn) timerSuccessBtn.disabled = !validUnit;
  if (resetProgressBtn) resetProgressBtn.disabled = !validUnit;

  if (rollBtn) {
    const rollReady = canRollNow();
    rollBtn.disabled = !rollReady;

    if (rollReady) {
      rollBtn.classList.add("ready");
    } else {
      rollBtn.classList.remove("ready");
    }
  }

  if (drawBtn) drawBtn.disabled = !canDraw();

  if (deleteSubjectBtn) deleteSubjectBtn.disabled = !state.subject;
  if (deleteUnitBtn) deleteUnitBtn.disabled = !hasCurrentUnit();

  if (useSpecialTokenCheckbox) {
    useSpecialTokenCheckbox.disabled = state.specialToken < 1;
    if (state.specialToken < 1) {
      useSpecialTokenCheckbox.checked = false;
    }
  }

  if (savePromptBtn) savePromptBtn.disabled = !state.currentGachaResult;

  syncTimerDisplay();

  if (startTimerBtn) startTimerBtn.disabled = state.timer.isRunning && !state.timer.isPaused;
  if (pauseTimerBtn) pauseTimerBtn.disabled = !state.timer.isRunning || state.timer.isPaused;
  if (resetTimerBtn) resetTimerBtn.disabled = false;

  if (gachaResult) {
    gachaResult.textContent = state.gachaText;
    gachaResult.className = "gacha-result";
    if (state.gachaClass) {
      gachaResult.classList.add(state.gachaClass);
    }
  }
}

function renderLogs() {
  if (!logList) return;

  logList.innerHTML = "";

  if (state.logs.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-log";
    li.textContent = "아직 로그가 없습니다.";
    logList.appendChild(li);
    return;
  }

  state.logs.forEach((log) => {
    const li = document.createElement("li");
    li.textContent = log;
    logList.appendChild(li);
  });
}

function renderSavedPrompts() {
  if (!savedPromptList) return;

  savedPromptList.innerHTML = "";

  if (!state.savedPrompts || state.savedPrompts.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-log";
    li.textContent = "아직 저장된 소재가 없습니다.";
    savedPromptList.appendChild(li);
    return;
  }

  state.savedPrompts.forEach((prompt, index) => {
    const li = document.createElement("li");
    const rarityClass = `saved-${String(prompt.rarity || "").toLowerCase()}`;
    li.classList.add(rarityClass);

    li.innerHTML = `
      <strong class="saved-rarity-badge">[${prompt.rarity}]</strong><br>
      상황: ${prompt.setting || "-"}<br>
      ${prompt.emotion ? `감정: ${prompt.emotion}<br>` : ""}
      ${prompt.twist ? `트위스트: ${prompt.twist}<br>` : ""}
      ${prompt.specialKeyword ? `특별 키워드: ${prompt.specialKeyword}<br>` : ""}
      <div class="saved-item-actions">
        <button class="secondary" type="button" data-delete-index="${index}">삭제</button>
      </div>
    `;

    savedPromptList.appendChild(li);
  });

  savedPromptList.querySelectorAll("[data-delete-index]").forEach((button) => {
    button.addEventListener("click", (event) => {
      const index = Number(event.currentTarget.dataset.deleteIndex);
      deleteSavedPrompt(index);
    });
  });
}

function renderAll() {
  renderStatus();
  renderLogs();
  renderSavedPrompts();
}
