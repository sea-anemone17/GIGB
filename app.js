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

// -----------------------------
// 2. 앱 상태
// -----------------------------
const state = {
  subjects: {},
  subject: "",
  unit: "",
  successRate: 35,
  solvedCount: 0,
  attemptsSinceRoll: 0,
  normalToken: 0,
  specialToken: 0,
  lastRoll: null,
  lastRollResult: "-",
  logs: []
};

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

const gachaResult = document.getElementById("gachaResult");
const logList = document.getElementById("logList");

// -----------------------------
// 4. 유틸 함수
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

function getRemainingForRoll() {
  return Math.max(0, 3 - state.attemptsSinceRoll);
}

function canRoll() {
  return state.attemptsSinceRoll >= 3;
}

function canDraw() {
  return state.normalToken >= 1;
}

function hasCurrentUnit() {
  return Boolean(state.subject && state.unit && (state.subjects[state.subject] || []).length > 0);
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
}

// -----------------------------
// 6. 렌더 함수
// -----------------------------
function renderStatus() {
  currentSubject.textContent = state.subject || "-";
  currentUnit.textContent = state.unit || "-";
  successRateEl.textContent = state.successRate;
  solvedCountEl.textContent = state.solvedCount;
  remainingForRollEl.textContent = getRemainingForRoll();

  lastRollEl.textContent = state.lastRoll ?? "-";
  rollResultEl.textContent = state.lastRollResult;

  normalTokenEl.textContent = state.normalToken;
  specialTokenEl.textContent = state.specialToken;

  const validUnit = hasCurrentUnit();

  solveCorrectBtn.disabled = !validUnit;
  solveWrongBtn.disabled = !validUnit;
  rollBtn.disabled = !canRoll();
  drawBtn.disabled = !canDraw();
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
// 7. 과목 / 소단원 추가
// -----------------------------
function addSubject() {
  const newSubject = newSubjectInput.value.trim();

  if (!newSubject) {
    addLog("⚠️ 과목 이름을 입력해 주세요.");
    renderAll();
    return;
  }

  if (state.subjects[newSubject]) {
    addLog(`⚠️ 이미 존재하는 과목입니다: ${newSubject}`);
    renderAll();
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
}

function addUnit() {
  const newUnit = newUnitInput.value.trim();

  if (!state.subject) {
    addLog("⚠️ 먼저 과목을 추가하거나 선택해 주세요.");
    renderAll();
    return;
  }

  if (!newUnit) {
    addLog("⚠️ 소단원 이름을 입력해 주세요.");
    renderAll();
    return;
  }

  const units = state.subjects[state.subject];

  if (units.includes(newUnit)) {
    addLog(`⚠️ 이미 존재하는 소단원입니다: ${newUnit}`);
    renderAll();
    return;
  }

  units.push(newUnit);
  state.unit = newUnit;

  initUnitOptions();

  newUnitInput.value = "";
  addLog(`🧩 ${state.subject}에 새 소단원 추가: ${newUnit}`);
  renderAll();
}

// -----------------------------
// 8. 학습 로직
// -----------------------------
function completeProblem(type) {
  if (!hasCurrentUnit()) {
    addLog("⚠️ 먼저 과목과 소단원을 준비해 주세요.");
    renderAll();
    return;
  }

  state.solvedCount += 1;
  state.attemptsSinceRoll += 1;

  if (type === "correct") {
    state.successRate = clamp(state.successRate + 6, 0, 95);
    addLog(`📘 ${state.subject} - ${state.unit}: 정답 문제 완료 → 성공률 +6`);
  } else {
    state.successRate = clamp(state.successRate + 2, 0, 95);
    addLog(`📗 ${state.subject} - ${state.unit}: 오답 시도 완료 → 성공률 +2`);
  }

  renderAll();
}

// -----------------------------
// 9. 판정 로직
// -----------------------------
function roll1d100() {
  if (!canRoll()) {
    addLog("⚠️ 아직 판정할 수 없습니다. 문제를 더 풀어 주세요.");
    renderAll();
    return;
  }

  const roll = Math.floor(Math.random() * 100) + 1;
  state.lastRoll = roll;

  let result = "";
  let normalReward = 0;
  let specialReward = 0;

  if (roll <= 5) {
    result = "대성공";
    normalReward = 1;
    specialReward = 1;
  } else if (roll >= 96) {
    result = "대실패";
  } else if (roll <= state.successRate) {
    result = "성공";
    normalReward = 1;
  } else {
    result = "실패";
  }

  state.lastRollResult = result;
  state.normalToken += normalReward;
  state.specialToken += specialReward;
  state.attemptsSinceRoll = 0;

  if (result === "대성공") {
    addLog(`🎉 1d100=${roll} → 대성공! 일반 토큰 +1, 스페셜 토큰 +1`);
  } else if (result === "성공") {
    addLog(`✨ 1d100=${roll} → 성공! 일반 토큰 +1`);
  } else if (result === "실패") {
    addLog(`🌫️ 1d100=${roll} → 실패... 다음 턴을 준비합니다.`);
  } else {
    addLog(`💥 1d100=${roll} → 대실패... 토큰 없음.`);
  }

  renderAll();
}

// -----------------------------
// 10. 가챠 로직
// -----------------------------
function drawGacha() {
  if (!canDraw()) {
    addLog("⚠️ 일반 토큰이 부족합니다.");
    renderAll();
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

  if (rarity === "R") {
    resultText =
      `【R】\n` +
      `상황: ${setting}`;
    gachaResult.className = "gacha-result r";
  } else if (rarity === "SR") {
    resultText =
      `【SR】\n` +
      `상황: ${setting}\n` +
      `감정: ${emotion}`;
    gachaResult.className = "gacha-result sr";
  } else {
    const ssrKeyword = pickRandom(SSR_POOL);

    resultText =
      `【SSR】\n` +
      `상황: ${setting}\n` +
      `감정: ${emotion}\n` +
      `트위스트: ${twist}\n` +
      `특별 키워드: ${ssrKeyword}`;
    gachaResult.className = "gacha-result ssr";
  }

  gachaResult.textContent = resultText;
  addLog(`🎰 연성소재 가챠 결과: ${rarity}`);

  renderAll();
}

// -----------------------------
// 11. 이벤트 연결
// -----------------------------
function bindEvents() {
  subjectSelect.addEventListener("change", (event) => {
    state.subject = event.target.value;
    initUnitOptions();
    addLog(`📚 과목 변경: ${state.subject}`);
    renderAll();
  });

  unitSelect.addEventListener("change", (event) => {
    state.unit = event.target.value;
    addLog(`🧩 소단원 변경: ${state.unit}`);
    renderAll();
  });

  addSubjectBtn.addEventListener("click", () => {
    addSubject();
  });

  addUnitBtn.addEventListener("click", () => {
    addUnit();
  });

  newSubjectInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addSubject();
    }
  });

  newUnitInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      addUnit();
    }
  });

  solveCorrectBtn.addEventListener("click", () => {
    completeProblem("correct");
  });

  solveWrongBtn.addEventListener("click", () => {
    completeProblem("wrong");
  });

  rollBtn.addEventListener("click", () => {
    roll1d100();
  });

  drawBtn.addEventListener("click", () => {
    drawGacha();
  });
}

// -----------------------------
// 12. 앱 시작
// -----------------------------
function initApp() {
  initSubjectOptions();
  initUnitOptions();
  bindEvents();
  renderAll();

  addLog("✨ 과목과 소단원을 직접 추가해서 시스템을 시작해 보세요.");
  renderAll();
}

initApp();
