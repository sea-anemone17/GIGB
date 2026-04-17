function initApp() {
  const loaded = loadState();

  initSubjectOptions();
  initUnitOptions();
  bindEvents();

  if (!loaded) {
    addLog("✨ 과목과 소단원을 직접 추가해서 시스템을 시작해 보세요.");
    saveState();
  }

  if (timerMinutesInput) {
    timerMinutesInput.value = Math.max(
      1,
      Math.floor((state.timer?.durationSeconds || 900) / 60)
    );
  }

  if (state.timer && state.timer.isRunning && !state.timer.isPaused) {
    reconcileTimerWithElapsedTime();
    runTimerLoop();
  }

  renderAll();
}

initApp();
