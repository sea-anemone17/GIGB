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
    state.tokenFragments = parsed.tokenFragments || 0;
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
