/*
 Union City Dismissal App - Voice Announcements
 Drop this file into your app and include it with:
 <script src="dismissal-voice.js"></script>

 When a number is called, run:
 DismissalVoice.announce("Car Rider", "426");

 You may also use:
 DismissalVoice.setEnabled(true);
 DismissalVoice.setEnabled(false);
 DismissalVoice.repeatLast();
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

  function announce(type, number) {
    const cleanType = String(type || "Number").trim();
    const cleanNumber = String(number || "").trim();

    if (!cleanNumber) return;

    lastAnnouncement = `${cleanType} ${cleanNumber}`;
    speak(lastAnnouncement);
  }

  function repeatLast() {
    if (lastAnnouncement) speak(lastAnnouncement);
  }

  function setRate(rate) {
    const parsed = parseFloat(rate);
    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 2) return false;

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
    repeatButton.textContent = "🔁 Repeat Last Number";
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

  // Optional automatic integration:
  // Dispatch this event from your app:
  // window.dispatchEvent(new CustomEvent("dismissal:number-called", {
  //   detail: { type: "Car Rider", number: "426" }
  // }));
  window.addEventListener("dismissal:number-called", function (event) {
    const detail = event.detail || {};
    announce(detail.type, detail.number);
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
