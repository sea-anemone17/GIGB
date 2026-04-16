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

  const successRate = progress.successRate;
  const hardSuccess = Math.floor(successRate / 2);
  const extremeSuccess = Math.floor(successRate / 5);

  let result = "";
  let normalReward = 0;
  let specialReward = 0;
  let fragmentReward = 0;

  if (roll >= 96) {
    result = "대실패";
    fragmentReward = 2;
  } else if (roll <= extremeSuccess) {
    result = "극단적 성공";
    specialReward = 3;
  } else if (roll <= hardSuccess) {
    result = "어려운 성공";
    normalReward = 1;
    fragmentReward = 1;
  } else if (roll <= successRate) {
    result = "보통 성공";
    normalReward = 1;
  } else {
    result = "실패";
    fragmentReward = 1;
  }

  progress.lastRollResult = result;
  state.normalToken += normalReward;
  state.specialToken += specialReward;
  state.tokenFragments += fragmentReward;

  if (result === "극단적 성공") {
    addLog(`🌟 ${state.subject} - ${state.unit}: 1d100=${roll} → 극단적 성공! 스페셜 토큰 +3`);
  } else if (result === "어려운 성공") {
    addLog(`✨ ${state.subject} - ${state.unit}: 1d100=${roll} → 어려운 성공! 일반 토큰 +1 / 조각 +1`);
  } else if (result === "보통 성공") {
    addLog(`✅ ${state.subject} - ${state.unit}: 1d100=${roll} → 보통 성공! 일반 토큰 +1`);
  } else if (result === "실패") {
    addLog(`🌫️ ${state.subject} - ${state.unit}: 1d100=${roll} → 실패... 하지만 조각 +1`);
  } else {
    addLog(`💥 ${state.subject} - ${state.unit}: 1d100=${roll} → 대실패!!! 하지만 조각 +2`);
  }

  if (resultPraiseEl) {
    if (result === "대실패") {
      resultPraiseEl.textContent = pickRandom(FUMBLE_PRAISES);
    } else if (result === "실패") {
      resultPraiseEl.textContent = pickRandom(FAILURE_PRAISES);
    } else {
      resultPraiseEl.textContent = "";
    }
  }

  renderAll();
  saveState();

  if (lastRollEl) lastRollEl.classList.remove("flash");
  if (rollResultBox) rollResultBox.classList.remove("flash");

  if (lastRollEl) void lastRollEl.offsetWidth;
  if (rollResultBox) void rollResultBox.offsetWidth;

  if (lastRollEl) lastRollEl.classList.add("flash");
  if (rollResultBox) rollResultBox.classList.add("flash");
}
