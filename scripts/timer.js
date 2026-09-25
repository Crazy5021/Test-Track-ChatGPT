/**
 * PlanCheck AI - Timer Module
 * High-precision timer for tracking experimental session duration.
 */

class SessionTimer {
  constructor() {
    this.intervalId = null;
    this.elapsedSeconds = 0;
    this.isRunning = false;
    this.displayElements = [];
  }

  registerDisplay(elementId) {
    const el = document.getElementById(elementId);
    if (el && !this.displayElements.includes(el)) {
      this.displayElements.push(el);
    }
  }

  start(initialSeconds = 0) {
    this.stop(); // Clear any existing timer
    this.elapsedSeconds = initialSeconds;
    this.isRunning = true;
    this.updateDisplays();

    this.intervalId = setInterval(() => {
      this.elapsedSeconds += 1;
      this.updateDisplays();
      if (window.state) {
        window.state.updateTimer(this.elapsedSeconds);
      }
    }, 1000);
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  resume() {
    if (!this.isRunning) {
      this.start(this.elapsedSeconds);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    const finalSeconds = this.elapsedSeconds;
    return finalSeconds;
  }

  reset() {
    this.stop();
    this.elapsedSeconds = 0;
    this.updateDisplays();
  }

  getElapsedSeconds() {
    return this.elapsedSeconds;
  }

  formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (num) => String(num).padStart(2, '0');

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  formatDurationVerbose(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) {
      return `${seconds} seg`;
    }
    return `${minutes} min ${seconds} seg`;
  }

  updateDisplays() {
    const formatted = this.formatTime(this.elapsedSeconds);
    this.displayElements.forEach(el => {
      if (el) el.textContent = formatted;
    });
  }
}

window.timer = new SessionTimer();
