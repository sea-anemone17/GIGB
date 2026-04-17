function drawGacha() {
  if (!canDraw()) {
    addLog("⚠️ 일반 토큰이 부족합니다.");
    renderAll();
    saveState();
    return;
  }

  const useSpecial = useSpecialTokenCheckbox ? useSpecialTokenCheckbox.checked : false;

  if (useSpecial && state.specialToken < 1) {
    addLog("⚠️ 스페셜 토큰이 부족합니다.");
    if (useSpecialTokenCheckbox) useSpecialTokenCheckbox.checked = false;
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
    resultText = `【R】\n상황: ${setting}`;
    resultClass = "r";
    resultData.setting = setting;
  } else if (rarity === "SR") {
    resultText = `【SR】\n상황: ${setting}\n감정: ${emotion}`;
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
      `특별 칭호: ${ssrKeyword || "-"}`;
    resultClass = "ssr";

    resultData.setting = setting;
    resultData.emotion = emotion;
    resultData.twist = twist;
    resultData.specialKeyword = ssrKeyword || null;
  }

  state.gachaText = resultText;
  state.gachaClass = resultClass;
  state.currentGachaResult = resultData;

  if (useSpecial) {
    addLog(`🎰 스페셜 토큰 사용 가챠 결과: ${rarity}`);
    if (useSpecialTokenCheckbox) useSpecialTokenCheckbox.checked = false;
  } else {
    addLog(`🎰 일반 토큰 사용 가챠 결과: ${rarity}`);
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

  addLog(`💾 ${state.currentGachaResult.rarity} 칭호를 보관함에 저장했습니다.`);
  renderAll();
  saveState();
}

function deleteSavedPrompt(index) {
  state.savedPrompts.splice(index, 1);
  addLog("🗑️ 보관함에서 칭호를 삭제했습니다.");
  renderAll();
  saveState();
}
