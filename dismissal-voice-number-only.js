/*
 Union City Dismissal App - Number-Only Voice Announcements

 Drop this file into your app and include it with:
 <script src="dismissal-voice-number-only.js"></script>

 Use:
 DismissalVoice.announce("Car Rider", "426");
 This will speak only: "426"

 If the entered value contains words:
 DismissalVoice.announce("Car Rider", "Come to office");
 This will speak: "Come to office"

 The pickup category (Car Rider, Walk Up, Office) is never spoken.
*/

(function () {
  "use strict";

  const STORAGE_KEY = "unionCityDismissalVoiceEnabled";
  const RATE_KEY = "unionCityDismissalVoiceRate";

  let lastAnnouncement = "";
  let voiceEnabled = localStorage.getItem(STORAGE_KEY) === "true";
  let voiceRate = parseFloat(localStorage.getItem(RATE_KEY) || "1");

  function canSpeak() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function speak(text) {
    if (!voiceEnabled || !text || !canSpeak()) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number.isFinite(voiceRate) ? voiceRate : 1;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(utterance);
  }

  function updateButton() {
    const button = document.getElementById("dismissalVoiceToggle");
    if (!button) return;

    button.textContent = voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF";
    button.setAttribute("aria-pressed", String(voiceEnabled));
    button.style.background = voiceEnabled ? "#2e7d32" : "#616161";
  }

  function setEnabled(enabled) {
    voiceEnabled = Boolean(enabled);
    localStorage.setItem(STORAGE_KEY, String(voiceEnabled));

    if (!voiceEnabled && canSpeak()) {
      window.speechSynthesis.cancel();
    }

    updateButton();
    return voiceEnabled;
  }

  function toggle() {
    return setEnabled(!voiceEnabled);
  }

  /*
   The first argument is accepted for compatibility with the existing app,
   but it is intentionally ignored so "Car Rider", "Walk Up", and "Office"
   are never announced automatically.
  */
  function announce(type, enteredValue) {
    const value = String(enteredValue ?? "").trim();

    if (!value) return;

    lastAnnouncement = value;
    speak(value);
  }

  function repeatLast() {
    if (lastAnnouncement) speak(lastAnnouncement);
  }

  function setRate(rate) {
    const parsed = parseFloat(rate);

    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 2) {
      return false;
    }

    voiceRate = parsed;
    localStorage.setItem(RATE_KEY, String(voiceRate));
    return true;
  }

  function createControls() {
    if (document.getElementById("dismissalVoiceControls")) {
      updateButton();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.id = "dismissalVoiceControls";
    wrapper.style.display = "flex";
    wrapper.style.gap = "10px";
    wrapper.style.flexWrap = "wrap";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "12px 0";

    const toggleButton = document.createElement("button");
    toggleButton.id = "dismissalVoiceToggle";
    toggleButton.type = "button";
    toggleButton.setAttribute("aria-pressed", String(voiceEnabled));
    toggleButton.style.color = "white";
    toggleButton.style.border = "none";
    toggleButton.style.borderRadius = "10px";
    toggleButton.style.padding = "12px 18px";
    toggleButton.style.fontSize = "18px";
    toggleButton.style.fontWeight = "700";
    toggleButton.style.cursor = "pointer";
    toggleButton.addEventListener("click", toggle);

    const repeatButton = document.createElement("button");
    repeatButton.id = "dismissalRepeatLast";
    repeatButton.type = "button";
    repeatButton.textContent = "🔁 Repeat Last";
    repeatButton.style.border = "none";
    repeatButton.style.borderRadius = "10px";
    repeatButton.style.padding = "12px 18px";
    repeatButton.style.fontSize = "18px";
    repeatButton.style.fontWeight = "700";
    repeatButton.style.cursor = "pointer";
    repeatButton.addEventListener("click", repeatLast);

    wrapper.append(toggleButton, repeatButton);

    const mount =
      document.getElementById("voice-controls-mount") ||
      document.getElementById("app") ||
      document.body;

    mount.prepend(wrapper);
    updateButton();
  }

  window.addEventListener("dismissal:number-called", function (event) {
    const detail = event.detail || {};
    announce(detail.type, detail.number ?? detail.value ?? detail.text);
  });

  window.DismissalVoice = {
    announce,
    repeatLast,
    toggle,
    setEnabled,
    isEnabled: () => voiceEnabled,
    setRate,
    createControls
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createControls);
  } else {
    createControls();
  }
})();
