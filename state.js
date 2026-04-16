function createDefaultState() {
  return {
    subjects: {},
    subject: "",
    unit: "",
    normalToken: 0,
    specialToken: 0,
    tokenFragments: 0,
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function pickRandom(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "";
  return arr[Math.floor(Math.random() * arr.length)];
}

function addLog(message) {
  state.logs.unshift(message);
  if (state.logs.length > 8) {
    state.logs = state.logs.slice(0, 8);
  }
}

function clearLogs() {
  state.logs = [];
  addLog("🧹 로그를 초기화했습니다.");
  renderAll();
  saveState();
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
