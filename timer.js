let timerInterval = null;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function syncTimerDisplay() {
  setText(timerDisplay, formatTime(state.timer.remainingSeconds));

  if (!timerStatus) return;

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

function showTimerCelebration() {
  const praiseEl = document.getElementById("timerPraise");
  if (!praiseEl || !timerDisplay) return;

  const messages = [
    "집중 성공!",
    "좋아요, 흐름 이어졌어요.",
    "완료. 한 턴 확보.",
    "잘했어요. 계속 갑니다.",
    "집중 유지 성공."
  ];

  praiseEl.textContent = pickRandom(messages);

  praiseEl.classList.remove("show");
  timerDisplay.classList.remove("timer-finished");

  void praiseEl.offsetWidth;

  praiseEl.classList.add("show");
  timerDisplay.classList.add("timer-finished");

  setTimeout(() => {
    praiseEl.classList.remove("show");
    timerDisplay.classList.remove("timer-finished");
  }, 1000);
}

function startTimer() {
  if (!timerMinutesInput) return;

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
  if (!timerMinutesInput) return;

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
  showTimerCelebration();
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
