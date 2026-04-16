const {
  settings: SETTING_POOL,
  emotions: EMOTION_POOL,
  twists: TWIST_POOL,
  ssrKeywords: SSR_POOL,
  probabilities: GACHA_PROB
} = window.PROMPT_DATA;

const STORAGE_KEY = "hazel-study-trpg-v4";

// -----------------------------
// 1. 기본 상태
// -----------------------------
function createDefaultState() {
  return {
    subjects: {},
    subject: "",
    unit: "",
    normalToken: 0,
    specialToken: 0,
    rollTickets: 0,
    logs: [],
    gachaText: "아직 가챠 결과가 없습니다.",
    gachaClass: "",
    currentGachaResult: null,
    savedPrompts: [],
    timer: {
      durationSeconds: 15 * 60,
      remainingSeconds: 15 * 60,
      isRunning: false,
      isPaused: false,
      lastUpdatedAt: null
    },
    unitProgress: {}
  };
}

const state = createDefaultState();

// -----------------------------
// 2. DOM 참조
// -----------------------------
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

const lastRollEl = document.getElementById("lastRoll");
const rollResultEl = document.getElementById("rollResult");
const rollResultBox = document.getElementById("rollResultBox");

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

// -----------------------------
// 3. 유틸
// -----------------------------

let timerInterval = null;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function syncTimerDisplay() {
  timerDisplay.textContent = formatTime(state.timer.remainingSeconds);

  if (state.timer.isRunning) {
    timerStatus.textContent = state.timer.isPaused ? "일시정지" : "집중 중";
  } else {
    timerStatus.textContent = "대기 중";
  }
}

function stopTimerInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer() {
  const inputMinutes = Number(timerMinutesInput.value);

  if (!state.timer.isRunning) {
    const minutes = Number.isFinite(inputMinutes) && inputMinutes > 0 ? inputMinutes : 15;
    state.timer.durationSeconds = minutes * 60;
    state.timer.remainingSeconds = minutes * 60;
    state.timer.isRunning = true;
    state.timer.isPaused = false;
  } else if (state.timer.isPaused) {
    state.timer.isPaused = false;
  }

  state.timer.lastUpdatedAt = Date.now();
  addLog(`⏱️ 타이머 시작: ${Math.floor(state.timer.durationSeconds / 60)}분`);
  saveState();
  runTimerLoop();
  renderAll();
}

function pauseTimer() {
  if (!state.timer.isRunning || state.timer.isPaused) return;

  state.timer.isPaused = true;
  stopTimerInterval();
  addLog("⏸️ 타이머 일시정지");
  saveState();
  renderAll();
}

function resetTimer() {
  stopTimerInterval();

  const inputMinutes = Number(timerMinutesInput.value);
  const minutes = Number.isFinite(inputMinutes) && inputMinutes > 0 ? inputMinutes : 15;

  state.timer.durationSeconds = minutes * 60;
  state.timer.remainingSeconds = minutes * 60;
  state.timer.isRunning = false;
  state.timer.isPaused = false;
  state.timer.lastUpdatedAt = null;

  addLog("🔄 타이머 리셋");
  saveState();
  renderAll();
}

function finishTimer() {
  stopTimerInterval();

  state.timer.remainingSeconds = 0;
  state.timer.isRunning = false;
  state.timer.isPaused = false;
  state.timer.lastUpdatedAt = null;

  addLog("✅ 타이머 완료!");
  recordTimerSuccess();

  showTimerCelebration(); // ⭐ 이거 추가
}

function showTimerCelebration() {
  const praiseEl = document.getElementById("timerPraise");
  const timerBox = timerDisplay;

  // 문구 랜덤
  const messages = [
    "집중 성공!",
    "좋아요, 흐름 이어졌어요.",
    "완료. 한 턴 확보.",
    "잘했어요. 계속 갑니다.",
    "집중 유지 성공."
  ];

  praiseEl.textContent = pickRandom(messages);

  // 애니메이션 트리거
  praiseEl.classList.remove("show");
  timerBox.classList.remove("timer-finished");

  void praiseEl.offsetWidth;

  praiseEl.classList.add("show");
  timerBox.classList.add("timer-finished");

  // 1초 후 제거
  setTimeout(() => {
    praiseEl.classList.remove("show");
    timerBox.classList.remove("timer-finished");
  }, 1000);
}

function runTimerLoop() {
  stopTimerInterval();

  timerInterval = setInterval(() => {
    if (!state.timer.isRunning || state.timer.isPaused) return;

    state.timer.remainingSeconds -= 1;

    if (state.timer.remainingSeconds <= 0) {
      finishTimer();
      return;
    }

    syncTimerDisplay();
  }, 1000);
}

function clearLogs() {
  state.logs = [];
  addLog("🧹 로그를 초기화했습니다.");
  renderAll();
  saveState();
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addLog(message) {
  state.logs.unshift(message);
  if (state.logs.length > 5) {
    state.logs = state.logs.slice(0, 5);
  }
}

function getUnitKey(subject, unit) {
  if (!subject || !unit) return "";
  return `${subject}::${unit}`;
}

function createDefaultProgress() {
  return {
    successRate: 35,
    solvedCount: 0,
    attemptsSinceRoll: 0,
    lastRoll: null,
    lastRollResult: "-"
  };
}

function ensureProgress(subject, unit) {
  const key = getUnitKey(subject, unit);
  if (!key) return null;

  if (!state.unitProgress[key]) {
    state.unitProgress[key] = createDefaultProgress();
  }

  return state.unitProgress[key];
}

function getCurrentProgress() {
  return ensureProgress(state.subject, state.unit);
}

function hasCurrentUnit() {
  return Boolean(
    state.subject &&
      state.unit &&
      (state.subjects[state.subject] || []).includes(state.unit)
  );
}

function getRemainingForRoll() {
  const progress = getCurrentProgress();
  if (!progress) return 3;
  return Math.max(0, 3 - progress.attemptsSinceRoll);
}

function canRoll() {
  return state.rollTickets >= 1;
}

function canDraw() {
  return state.normalToken >= 1;
}

// -----------------------------
// 4. 저장 / 불러오기
// -----------------------------
function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("저장 실패:", error);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw);

    state.subjects = parsed.subjects || {};
    state.subject = parsed.subject || "";
    state.unit = parsed.unit || "";
    state.normalToken = parsed.normalToken || 0;
    state.specialToken = parsed.specialToken || 0;
    state.rollTickets = parsed.rollTickets || 0;
    state.logs = Array.isArray(parsed.logs) ? parsed.logs : [];
    state.gachaText = parsed.gachaText || "아직 가챠 결과가 없습니다.";
    state.gachaClass = parsed.gachaClass || "";
    state.currentGachaResult = parsed.currentGachaResult || null;
    state.savedPrompts = Array.isArray(parsed.savedPrompts) ? parsed.savedPrompts : [];
    state.unitProgress = parsed.unitProgress || {};
    state.timer = parsed.timer || {
     durationSeconds: 15 * 60,
     remainingSeconds: 15 * 60,
     isRunning: false,
     isPaused: false,
     lastUpdatedAt: null
    };

    return true;
  } catch (error) {
    console.error("불러오기 실패:", error);
    return false;
  }
}

// -----------------------------
// 5. 드롭다운 초기화
// -----------------------------
function initSubjectOptions() {
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

// -----------------------------
// 6. 렌더
// -----------------------------
function renderStatus() {
  const progress = getCurrentProgress();

  currentSubject.textContent = state.subject || "-";
  currentUnit.textContent = state.unit || "-";
  successRateEl.textContent = progress ? progress.successRate : 35;
  solvedCountEl.textContent = progress ? progress.solvedCount : 0;
  remainingForRollEl.textContent = getRemainingForRoll();

  rollResultBox.className = "roll-result-box";

  const currentResult = progress?.lastRollResult ?? "-";

  if (currentResult === "성공") {
   rollResultBox.classList.add("result-success");
  } else if (currentResult === "실패") {
   rollResultBox.classList.add("result-fail");
  } else if (currentResult === "대성공") {
   rollResultBox.classList.add("result-critical-success");
  } else if (currentResult === "대실패") {
   rollResultBox.classList.add("result-critical-fail");
  }

  lastRollEl.textContent = progress?.lastRoll ?? "-";
  rollResultEl.textContent = progress?.lastRollResult ?? "-";

  normalTokenEl.textContent = state.normalToken;
  specialTokenEl.textContent = state.specialToken;

  const validUnit = hasCurrentUnit();

  solveProblemBtn.disabled = !validUnit;
  timerSuccessBtn.disabled = !validUnit;
  resetProgressBtn.disabled = !validUnit;
  rollBtn.disabled = !canRoll();
  drawBtn.disabled = !canDraw();

  deleteSubjectBtn.disabled = !state.subject;
  deleteUnitBtn.disabled = !hasCurrentUnit();

  useSpecialTokenCheckbox.disabled = state.specialToken < 1;
  savePromptBtn.disabled = !state.currentGachaResult;

  syncTimerDisplay();

  startTimerBtn.disabled = state.timer.isRunning && !state.timer.isPaused;
  pauseTimerBtn.disabled = !state.timer.isRunning || state.timer.isPaused;
  resetTimerBtn.disabled = false;

  if (state.specialToken < 1) {
    useSpecialTokenCheckbox.checked = false;
  }

  gachaResult.textContent = state.gachaText;
  gachaResult.className = "gacha-result";
  if (state.gachaClass) {
    gachaResult.classList.add(state.gachaClass);
  }
}

function renderLogs() {
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

// -----------------------------
// 7. 과목 / 소단원 추가
// -----------------------------
function addSubject() {
  const newSubject = newSubjectInput.value.trim();

  if (!newSubject) {
    addLog("⚠️ 과목 이름을 입력해 주세요.");
    renderAll();
    saveState();
    return;
  }

  if (state.subjects[newSubject]) {
    addLog(`⚠️ 이미 존재하는 과목입니다: ${newSubject}`);
    renderAll();
    saveState();
    return;
  }

  state.subjects[newSubject] = [];
  state.subject = newSubject;
  state.unit = "";

  initSubjectOptions();
  initUnitOptions();

  newSubjectInput.value = "";
  addLog(`📚 새 과목 추가: ${newSubject}`);
  renderAll();
  saveState();
}

function addUnit() {
  const newUnit = newUnitInput.value.trim();

  if (!state.subject) {
    addLog("⚠️ 먼저 과목을 추가하거나 선택해 주세요.");
    renderAll();
    saveState();
    return;
  }

  if (!newUnit) {
    addLog("⚠️ 소단원 이름을 입력해 주세요.");
    renderAll();
    saveState();
    return;
  }

  const units = state.subjects[state.subject];

  if (units.includes(newUnit)) {
    addLog(`⚠️ 이미 존재하는 소단원입니다: ${newUnit}`);
    renderAll();
    saveState();
    return;
  }

  units.push(newUnit);
  state.unit = newUnit;
  ensureProgress(state.subject, newUnit);

  initUnitOptions();

  newUnitInput.value = "";
  addLog(`🧩 ${state.subject}에 새 소단원 추가: ${newUnit}`);
  renderAll();
  saveState();
}

// -----------------------------
// 8. 과목 / 소단원 삭제
// -----------------------------
function deleteUnit() {
  if (!hasCurrentUnit()) {
    addLog("⚠️ 삭제할 소단원이 없습니다.");
    renderAll();
    saveState();
    return;
  }

  const ok = confirm(`정말 "${state.subject} - ${state.unit}" 소단원을 삭제할까요?`);
  if (!ok) return;

  const subject = state.subject;
  const unit = state.unit;
  const units = state.subjects[subject];
  const unitKey = getUnitKey(subject, unit);

  state.subjects[subject] = units.filter((item) => item !== unit);
  delete state.unitProgress[unitKey];

  addLog(`🗑️ ${subject} - ${unit} 소단원을 삭제했습니다.`);

  const remainingUnits = state.subjects[subject];

  if (remainingUnits.length > 0) {
    state.unit = remainingUnits[0];
    ensureProgress(state.subject, state.unit);
  } else {
    state.unit = "";
  }

  initUnitOptions();
  renderAll();
  saveState();
}

function deleteSubject() {
  if (!state.subject) {
    addLog("⚠️ 삭제할 과목이 없습니다.");
    renderAll();
    saveState();
    return;
  }

  const ok = confirm(
    `정말 "${state.subject}" 과목을 삭제할까요?\n소단원과 진행도도 함께 삭제됩니다.`
  );
  if (!ok) return;

  const subjectToDelete = state.subject;
  const unitsToDelete = state.subjects[subjectToDelete] || [];

  unitsToDelete.forEach((unit) => {
    const key = getUnitKey(subjectToDelete, unit);
    delete state.unitProgress[key];
  });

  delete state.subjects[subjectToDelete];

  addLog(`🗑️ ${subjectToDelete} 과목을 삭제했습니다.`);

  const remainingSubjects = Object.keys(state.subjects);

  if (remainingSubjects.length > 0) {
    state.subject = remainingSubjects[0];
    const nextUnits = state.subjects[state.subject] || [];
    state.unit = nextUnits[0] || "";
    if (state.unit) {
      ensureProgress(state.subject, state.unit);
    }
  } else {
    state.subject = "";
    state.unit = "";
  }

  initSubjectOptions();
  initUnitOptions();
  renderAll();
  saveState();
}

// -----------------------------
// 9. 학습 로직
// -----------------------------

function recordProblemSolved() {
  if (!hasCurrentUnit()) {
    addLog("⚠️ 먼저 과목과 소단원을 준비해 주세요.");
    renderAll();
    saveState();
    return;
  }

  const progress = getCurrentProgress();
  if (!progress) return;

  progress.solvedCount += 1;
  progress.attemptsSinceRoll += 1;
  progress.successRate = clamp(progress.successRate + 1, 0, 95);

  if (progress.attemptsSinceRoll >= 3) {
    progress.attemptsSinceRoll = 0;
    state.rollTickets += 1;
    addLog(`📘 ${state.subject} - ${state.unit}: 문제 풀이 완료 → 성공률 +1 / 🎯 판정권 +1`);
  } else {
    addLog(`📘 ${state.subject} - ${state.unit}: 문제 풀이 완료 → 성공률 +1`);
  }

  renderAll();
  saveState();
}

function recordTimerSuccess() {
  if (!hasCurrentUnit()) {
    addLog("⚠️ 먼저 과목과 소단원을 준비해 주세요.");
    renderAll();
    saveState();
    return;
  }

  const progress = getCurrentProgress();
  if (!progress) return;

  progress.attemptsSinceRoll += 1;
  progress.successRate = clamp(progress.successRate + 1, 0, 95);

  if (progress.attemptsSinceRoll >= 3) {
    progress.attemptsSinceRoll = 0;
    state.rollTickets += 1;
    addLog(`⏱️ ${state.subject} - ${state.unit}: 타이머 성공 → 성공률 +1 / 🎯 판정권 +1`);
  } else {
    addLog(`⏱️ ${state.subject} - ${state.unit}: 타이머 성공 → 성공률 +1`);
  }

  renderAll();
  saveState();
}

function resetCurrentProgress() {
  if (!hasCurrentUnit()) {
    addLog("⚠️ 초기화할 소단원이 없습니다.");
    renderAll();
    saveState();
    return;
  }

  const key = getUnitKey(state.subject, state.unit);
  state.unitProgress[key] = createDefaultProgress();
  state.rollTickets = 0;

  addLog(`🔄 ${state.subject} - ${state.unit} 진행도를 초기화했습니다.`);
  renderAll();
  saveState();
}

// -----------------------------
// 10. 판정 로직
// -----------------------------

function roll1d100() {
  if (!canRoll()) {
    addLog("⚠️ 아직 판정할 수 없습니다. 카운트를 더 쌓아 주세요.");
    renderAll();
    saveState();
    return;
  }

  if (state.rollTickets < 1) {
    addLog("⚠️ 판정권이 없습니다.");
    renderAll();
    saveState();
    return;
  }

  state.rollTickets -= 1;

  const progress = getCurrentProgress();
  if (!progress) return;

  const roll = Math.floor(Math.random() * 100) + 1;
  progress.lastRoll = roll;

  let result = "";
  let normalReward = 0;
  let specialReward = 0;

  if (roll <= 5) {
    result = "대성공";
    normalReward = 1;
    specialReward = 1;
  } else if (roll >= 96) {
    result = "대실패";
  } else if (roll <= progress.successRate) {
    result = "성공";
    normalReward = 1;
  } else {
    result = "실패";
  }

  progress.lastRollResult = result;
  state.normalToken += normalReward;
  state.specialToken += specialReward;

  if (result === "대성공") {
    addLog(`🎉 ${state.subject} - ${state.unit}: 1d100=${roll} → 대성공! 일반 토큰 +1, 스페셜 토큰 +1`);
  } else if (result === "성공") {
    addLog(`✨ ${state.subject} - ${state.unit}: 1d100=${roll} → 성공! 일반 토큰 +1`);
  } else if (result === "실패") {
    addLog(`🌫️ ${state.subject} - ${state.unit}: 1d100=${roll} → 실패... 다음 턴을 준비합니다.`);
  } else {
    addLog(`💥 ${state.subject} - ${state.unit}: 1d100=${roll} → 대실패... 토큰 없음.`);
  }

  renderAll();
  saveState();

  lastRollEl.classList.remove("flash");
  rollResultBox.classList.remove("flash");

  void lastRollEl.offsetWidth;
  void rollResultBox.offsetWidth;

  lastRollEl.classList.add("flash");
  rollResultBox.classList.add("flash");
}

// -----------------------------
// 11. 가챠 로직
// -----------------------------
function drawGacha() {
  if (!canDraw()) {
    addLog("⚠️ 일반 토큰이 부족합니다.");
    renderAll();
    saveState();
    return;
  }

  const useSpecial = useSpecialTokenCheckbox.checked;

  if (useSpecial && state.specialToken < 1) {
    addLog("⚠️ 스페셜 토큰이 부족합니다.");
    useSpecialTokenCheckbox.checked = false;
    renderAll();
    saveState();
    return;
  }

  state.normalToken -= 1;

  if (useSpecial) {
    state.specialToken -= 1;
  }

  const probs = useSpecial ? GACHA_PROB.boosted : GACHA_PROB.normal;
  const roll = Math.random();

  let rarity = "R";
  if (roll < probs.ssr) {
    rarity = "SSR";
  } else if (roll < probs.ssr + probs.sr) {
    rarity = "SR";
  } else {
    rarity = "R";
  }

  const setting = pickRandom(SETTING_POOL);
  const emotion = pickRandom(EMOTION_POOL);
  const twist = pickRandom(TWIST_POOL);

  let resultText = "";
  let resultClass = "";
  let resultData = {
    rarity,
    setting: null,
    emotion: null,
    twist: null,
    specialKeyword: null,
    createdAt: new Date().toISOString()
  };

  if (rarity === "R") {
    resultText =
      `【R】\n` +
      `상황: ${setting}`;
    resultClass = "r";
    resultData.setting = setting;
  } else if (rarity === "SR") {
    resultText =
      `【SR】\n` +
      `상황: ${setting}\n` +
      `감정: ${emotion}`;
    resultClass = "sr";
    resultData.setting = setting;
    resultData.emotion = emotion;
  } else {
    const ssrKeyword = pickRandom(SSR_POOL);

    resultText =
      `【SSR】\n` +
      `상황: ${setting}\n` +
      `감정: ${emotion}\n` +
      `트위스트: ${twist}\n` +
      `특별 키워드: ${ssrKeyword}`;
    resultClass = "ssr";

    resultData.setting = setting;
    resultData.emotion = emotion;
    resultData.twist = twist;
    resultData.specialKeyword = ssrKeyword;
  }

  state.gachaText = resultText;
  state.gachaClass = resultClass;
  state.currentGachaResult = resultData;

  if (useSpecial) {
    addLog(`🎰 스페셜 토큰 사용 가챠 결과: ${rarity}`);
    useSpecialTokenCheckbox.checked = false;
  } else {
    addLog(`🎰 연성소재 가챠 결과: ${rarity}`);
  }

  renderAll();
  saveState();
}

function saveCurrentPrompt() {
  if (!state.currentGachaResult) {
    addLog("⚠️ 저장할 가챠 결과가 없습니다.");
    renderAll();
    saveState();
    return;
  }

  state.savedPrompts.unshift({ ...state.currentGachaResult });

  if (state.savedPrompts.length > 50) {
    state.savedPrompts = state.savedPrompts.slice(0, 50);
  }

  addLog(`💾 ${state.currentGachaResult.rarity} 소재를 보관함에 저장했습니다.`);
  renderAll();
  saveState();
}

function deleteSavedPrompt(index) {
  state.savedPrompts.splice(index, 1);
  addLog("🗑️ 보관함에서 소재를 삭제했습니다.");
  renderAll();
  saveState();
}

// -----------------------------
// 12. 이벤트 연결
// -----------------------------

function bindEvents() {
  subjectSelect.addEventListener("change", (event) => {
    state.subject = event.target.value;
    initUnitOptions();
    addLog(`📚 과목 변경: ${state.subject}`);
    renderAll();
    saveState();
  });

  unitSelect.addEventListener("change", (event) => {
    state.unit = event.target.value;
    ensureProgress(state.subject, state.unit);
    addLog(`🧩 소단원 변경: ${state.unit}`);
    renderAll();
    saveState();
  });

  addSubjectBtn.addEventListener("click", addSubject);
  addUnitBtn.addEventListener("click", addUnit);
  deleteSubjectBtn.addEventListener("click", deleteSubject);
  deleteUnitBtn.addEventListener("click", deleteUnit);

  newSubjectInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addSubject();
  });

  newUnitInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addUnit();
  });

  solveProblemBtn.addEventListener("click", recordProblemSolved);
  timerSuccessBtn.addEventListener("click", recordTimerSuccess);
  rollBtn.addEventListener("click", roll1d100);
  drawBtn.addEventListener("click", drawGacha);
  resetProgressBtn.addEventListener("click", resetCurrentProgress);
  savePromptBtn.addEventListener("click", saveCurrentPrompt);
  clearLogBtn.addEventListener("click", clearLogs);

  startTimerBtn.addEventListener("click", startTimer);
  pauseTimerBtn.addEventListener("click", pauseTimer);
  resetTimerBtn.addEventListener("click", resetTimer);

  timerMinutesInput.addEventListener("change", () => {
    if (!state.timer.isRunning) {
      const minutes = Number(timerMinutesInput.value) || 15;
      state.timer.durationSeconds = minutes * 60;
      state.timer.remainingSeconds = minutes * 60;
      saveState();
      renderAll();
    }
  });
}

// -----------------------------
// 13. 앱 시작
// -----------------------------
function initApp() {
  const loaded = loadState();

  initSubjectOptions();
  initUnitOptions();
  bindEvents();

  if (!loaded) {
    addLog("✨ 과목과 소단원을 직접 추가해서 시스템을 시작해 보세요.");
    saveState();
  }

  timerMinutesInput.value = Math.max(1, Math.floor((state.timer?.durationSeconds || 900) / 60));

  if (state.timer && state.timer.isRunning && !state.timer.isPaused) {
   runTimerLoop();
  }

  renderAll();
}

initApp();
