function addSubject() {
  const newSubject = newSubjectInput ? newSubjectInput.value.trim() : "";

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

  if (newSubjectInput) newSubjectInput.value = "";
  addLog(`📚 새 과목 추가: ${newSubject}`);
  renderAll();
  saveState();
}

function addUnit() {
  const newUnit = newUnitInput ? newUnitInput.value.trim() : "";

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

  if (newUnitInput) newUnitInput.value = "";
  addLog(`🧩 ${state.subject}에 새 소단원 추가: ${newUnit}`);
  renderAll();
  saveState();
}

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

function convertCountToRollTicket(progress, sourceLabel) {
  if (progress.attemptsSinceRoll >= 3) {
    progress.attemptsSinceRoll = 0;
    state.rollTickets += 1;
    addLog(`${sourceLabel} → 🎯 판정권 +1`);
    return true;
  }
  return false;
}

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

  const converted = convertCountToRollTicket(
    progress,
    `📘 ${state.subject} - ${state.unit}: 문제 풀이 완료 → 성공률 +1`
  );

  if (!converted) {
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

  const converted = convertCountToRollTicket(
    progress,
    `⏱️ ${state.subject} - ${state.unit}: 타이머 성공 → 성공률 +1`
  );

  if (!converted) {
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
