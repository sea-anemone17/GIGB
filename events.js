function bindEvents() {
  if (subjectSelect) {
    subjectSelect.addEventListener("change", (event) => {
      state.subject = event.target.value;
      initUnitOptions();
      addLog(`📚 과목 변경: ${state.subject}`);
      renderAll();
      saveState();
    });
  }

  if (unitSelect) {
    unitSelect.addEventListener("change", (event) => {
      state.unit = event.target.value;
      ensureProgress(state.subject, state.unit);
      addLog(`🧩 소단원 변경: ${state.unit}`);
      renderAll();
      saveState();
    });
  }

  if (addSubjectBtn) addSubjectBtn.addEventListener("click", addSubject);
  if (addUnitBtn) addUnitBtn.addEventListener("click", addUnit);
  if (deleteSubjectBtn) deleteSubjectBtn.addEventListener("click", deleteSubject);
  if (deleteUnitBtn) deleteUnitBtn.addEventListener("click", deleteUnit);

  if (newSubjectInput) {
    newSubjectInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addSubject();
    });
  }

  if (newUnitInput) {
    newUnitInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") addUnit();
    });
  }

  if (solveProblemBtn) solveProblemBtn.addEventListener("click", recordProblemSolved);
  if (timerSuccessBtn) timerSuccessBtn.addEventListener("click", recordTimerSuccess);
  if (rollBtn) rollBtn.addEventListener("click", roll1d100);
  if (drawBtn) drawBtn.addEventListener("click", drawGacha);
  if (resetProgressBtn) resetProgressBtn.addEventListener("click", resetCurrentProgress);
  if (savePromptBtn) savePromptBtn.addEventListener("click", saveCurrentPrompt);
  if (clearLogBtn) clearLogBtn.addEventListener("click", clearLogs);

  if (startTimerBtn) startTimerBtn.addEventListener("click", startTimer);
  if (pauseTimerBtn) pauseTimerBtn.addEventListener("click", pauseTimer);
  if (resetTimerBtn) resetTimerBtn.addEventListener("click", resetTimer);

  if (timerMinutesInput) {
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
}
