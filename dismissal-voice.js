(function () {
  "use strict";

  const STORAGE_KEY = "unionCityDismissalVoiceEnabled";
  let lastAnnouncement = "";
  let voiceEnabled = localStorage.getItem(STORAGE_KEY) === "true";

  function canSpeak() {
    return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  function speak(value) {
    const text = String(value ?? "").trim();
    if (!voiceEnabled || !text || !canSpeak()) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  }

  function announce(value) {
    const text = String(value ?? "").trim();
    if (!text) return;
    lastAnnouncement = text;
    speak(text);
  }

  function repeatLast() {
    if (lastAnnouncement) speak(lastAnnouncement);
  }

  function updateButton() {
    const button = document.getElementById("dismissalVoiceToggle");
    if (!button) return;
    button.textContent = voiceEnabled ? "🔊 Voice ON" : "🔇 Voice OFF";
    button.style.background = voiceEnabled ? "#2e7d32" : "#616161";
  }

  function setEnabled(enabled) {
    voiceEnabled = Boolean(enabled);
    localStorage.setItem(STORAGE_KEY, String(voiceEnabled));
    if (!voiceEnabled && canSpeak()) window.speechSynthesis.cancel();
    updateButton();
  }

  function createControls() {
    if (document.getElementById("dismissalVoiceControls")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "dismissalVoiceControls";
    wrapper.className = "dismissal-voice-controls";

    const toggle = document.createElement("button");
    toggle.id = "dismissalVoiceToggle";
    toggle.type = "button";
    toggle.onclick = function () { setEnabled(!voiceEnabled); };

    const repeat = document.createElement("button");
    repeat.type = "button";
    repeat.textContent = "🔁 Repeat Last";
    repeat.onclick = repeatLast;

    wrapper.append(toggle, repeat);

    const mount = document.getElementById("voice-controls-mount") ||
                  document.querySelector("header") ||
                  document.getElementById("app") ||
                  document.body;
    mount.appendChild(wrapper);
    updateButton();
  }

  window.DismissalVoice = {
    announce,
    repeatLast,
    setEnabled,
    isEnabled: function () { return voiceEnabled; },
    createControls
  };

  window.addEventListener("dismissal:number-called", function (event) {
    const detail = event.detail || {};
    announce(detail.value ?? detail.number ?? detail.text);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createControls);
  } else {
    createControls();
  }
})();