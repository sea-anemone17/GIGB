// -----------------------------
// 1. 연성소재 데이터
// -----------------------------
const SETTING_POOL = [
  "밀폐 공간",
  "야간 경계",
  "치료 직후",
  "비 오는 날 귀환 후",
  "임무 전 대기",
  "불 꺼진 사무실",
  "좁은 복도",
  "장거리 이동 중",
  "부상 회복 중",
  "회의 후 단둘이 남음"
];

const EMOTION_POOL = [
  "억제 실패 직전",
  "거리 유지 시도",
  "무의식적 집착",
  "상대는 눈치채지 못함",
  "감정을 부정 중",
  "자각 없는 동요",
  "말하면 무너질 것 같음",
  "이유 모를 소유욕",
  "평소보다 통제가 약함",
  "괜히 예민해짐"
];

const TWIST_POOL = [
  "들키기 직전",
  "시간 제한",
  "제3자가 바로 근처에 있음",
  "갑작스런 신체 접촉",
  "오해 발생",
  "상대의 무방비",
  "비밀이 하나 더 있음",
  "퇴로 없음"
];

const SSR_POOL = [
  "이미 선을 넘은 상태",
  "더 이상 못 참음",
  "무의식적 집착 노출",
  "항상 참던 쪽이 먼저 무너짐",
  "절대 들키면 안 되는 순간",
  "자각 없이 드러남"
];

const STORAGE_KEY = "hazel-study-trpg-v2";

// -----------------------------
// 2. 기본 상태
// -----------------------------
function createDefaultState() {
  return {
    subjects: {},
    subject: "",
    unit: "",
    normalToken: 0,
    specialToken: 0,
    logs: [],
    gachaText: "아직 가챠 결과가 없습니다.",
    gachaClass: "",
    unitProgress: {}
  };
}

const state = createDefaultState();

// -----------------------------
// 3. DOM 참조
// -----------------------------
const subjectSelect = document.getElementById("subjectSelect");
const unitSelect = document.getElementById("unitSelect");

const newSubjectInput = document.getElementById("newSubjectInput");
const newUnitInput = document.getElementById("newUnitInput");
const addSubjectBtn = document.getElementById("addSubjectBtn");
const addUnitBtn = document.getElementById("addUnitBtn");

const currentSubject = document.getElementById("currentSubject");
const currentUnit = document.getElementById("currentUnit");
const successRateEl = document.getElementById("successRate");
const solvedCountEl = document.getElementById("solvedCount");
const remainingForRollEl = document.getElementById("remainingForRoll");

const lastRollEl = document.getElementById("lastRoll");
const rollResultEl = document.getElementById("rollResult");

const normalTokenEl = document.getElementById("normalToken");
const specialTokenEl = document.getElementById("specialToken");

const solveCorrectBtn = document.getElementById("solveCorrectBtn");
const solveWrongBtn = document.getElementById("solveWrongBtn");
const rollBtn = document.getElementById("rollBtn");
const drawBtn = document.getElementById("drawBtn");
const resetProgressBtn = document.getElementById("resetProgressBtn");

const gachaResult = document.getElementById("gachaResult");
const logList = document.getElementById("logList");

// -----------------------------
// 4. 유틸
// -----------------------------
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addLog(message) {
  state.logs.unshift(message);
  if (state.logs.length > 12) {
    state.logs = state.logs.slice(0, 12);
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
  return Boolean(state.subject && state.unit && (state.subjects[state.subject] || []).includes(state.unit));
}

function getRemainingForRoll() {
  const progress = getCurrentProgress();
  if (!progress) return 3;
  return Math.max(0, 3 - progress.attemptsSinceRoll);
}

function canRoll() {
  const progress = getCurrentProgress();
  return Boolean(progress && progress.attemptsSinceRoll >= 3);
}

function canDraw() {
  return state.normalToken >= 1;
}

// -----------------------------
// 5. 저장 / 불러오기
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
    state.logs = Array.isArray(parsed.logs) ? parsed.logs : [];
    state.gachaText = parsed.gachaText || "아직 가챠 결과가 없습니다.";
    state.gachaClass = parsed.gachaClass || "";
    state.unitProgress = parsed.unitProgress || {};

    return true;
  } catch (error) {
    console.error("불러오기 실패:", error);
    return false;
  }
}

// -----------------------------
// 6. 드롭다운 초기화
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
// 7. 렌더
// -----------------------------
function renderStatus() {
  const progress = getCurrentProgress();

  currentSubject.textContent = state.subject || "-";
  currentUnit.textContent = state.unit || "-";
  successRateEl.textContent = progress ? progress.successRate : 35;
  solvedCountEl.textContent = progress ? progress.solvedCount : 0;
  remainingForRollEl.textContent = getRemainingForRoll();

  lastRollEl.textContent = progress?.lastRoll ?? "-";
  rollResultEl.textContent = progress?.lastRollResult ?? "-";

  normalTokenEl.textContent = state.normalToken;
  specialTokenEl.textContent = state.specialToken;

  const validUnit = hasCurrentUnit();

  solveCorrectBtn.disabled = !validUnit;
  solveWrongBtn.disabled = !validUnit;
  resetProgressBtn.disabled = !validUnit;
  rollBtn.disabled = !canRoll();
  drawBtn.disabled = !canDraw();

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

function renderAll() {
  renderStatus();
  renderLogs();
}

// -----------------------------
// 8. 과목 / 소단원 추가
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
// 9. 학습 로직
// -----------------------------
function completeProblem(type) {
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

  if (type === "correct") {
    progress.successRate = clamp(progress.successRate + 6, 0, 95);
    addLog(`📘 ${state.subject} - ${state.unit}: 정답 문제 완료 → 성공률 +6`);
  } else {
    progress.successRate = clamp(progress.successRate + 2, 0, 95);
    addLog(`📗 ${state.subject} - ${state.unit}: 오답 시도 완료 → 성공률 +2`);
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

  addLog(`🔄 ${state.subject} - ${state.unit} 진행도를 초기화했습니다.`);
  renderAll();
  saveState();
}

// -----------------------------
// 10. 판정 로직
// -----------------------------
function roll1d100() {
  if (!canRoll()) {
    addLog("⚠️ 아직 판정할 수 없습니다. 문제를 더 풀어 주세요.");
    renderAll();
    saveState();
    return;
  }

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
  progress.attemptsSinceRoll = 0;

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

  state.normalToken -= 1;

  const roll = Math.random();
  let rarity = "R";

  const ssrChance = state.specialToken > 0 ? 0.12 : 0.05;
  const srChance = 0.30;

  if (roll < ssrChance) {
    rarity = "SSR";
  } else if (roll < srChance) {
    rarity = "SR";
  }

  const setting = pickRandom(SETTING_POOL);
  const emotion = pickRandom(EMOTION_POOL);
  const twist = pickRandom(TWIST_POOL);

  let resultText = "";
  let resultClass = "";

  if (rarity === "R") {
    resultText =
      `【R】\n` +
      `상황: ${setting}`;
    resultClass = "r";
  } else if (rarity === "SR") {
    resultText =
      `【SR】\n` +
      `상황: ${setting}\n` +
      `감정: ${emotion}`;
    resultClass = "sr";
  } else {
    const ssrKeyword = pickRandom(SSR_POOL);

    resultText =
      `【SSR】\n` +
      `상황: ${setting}\n` +
      `감정: ${emotion}\n` +
      `트위스트: ${twist}\n` +
      `특별 키워드: ${ssrKeyword}`;
    resultClass = "ssr";
  }

  state.gachaText = resultText;
  state.gachaClass = resultClass;

  addLog(`🎰 연성소재 가챠 결과: ${rarity}`);
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

  newSubjectInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addSubject();
  });

  newUnitInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addUnit();
  });

  solveCorrectBtn.addEventListener("click", () => completeProblem("correct"));
  solveWrongBtn.addEventListener("click", () => completeProblem("wrong"));
  rollBtn.addEventListener("click", roll1d100);
  drawBtn.addEventListener("click", drawGacha);
  resetProgressBtn.addEventListener("click", resetCurrentProgress);
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

  renderAll();
}

initApp();
