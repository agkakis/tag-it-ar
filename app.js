document.addEventListener("DOMContentLoaded", () => {
  const statusText = document.getElementById("statusText");
  const debugText = document.getElementById("debugText");
  const detectedTag = document.getElementById("detectedTag");
  const rendered = document.getElementById("rendered");
  const codeBox = document.getElementById("codeBox");

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  const sceneEl = document.getElementById("scene");
  const arWrap = document.getElementById("arWrap");

  const themeBtn = document.getElementById("themeBtn");
  const toastEl = document.getElementById("toast");
  const scanPill = document.getElementById("scanPill");

  const RESET_DELAY_MS = 2000;
  const DEFAULT_RENDERED_TEXT = "Hello World!";
  const DEFAULT_CODE = "&lt;p&gt;Hello World!&lt;/p&gt;";

  const targetIndexToTag = {
    0: "b",
    1: "del",
    2: "em",
    3: "h1",
    4: "i",
    5: "mark",
    6: "strong",
    7: "sub",
    8: "sup",
    9: "u",
  };

  /* =========================
     Utilities
     ========================= */

  function setStatus(msg) {
    if (statusText) statusText.textContent = msg;
  }

  function setDebug(msg) {
    if (debugText) debugText.textContent = msg;
  }

  function setScanPill(text) {
    if (scanPill) scanPill.textContent = text;
  }

  function escapeHtml(str) {
    return str.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function buildHtmlForTag(tagName, text) {
    const allowed = new Set(Object.values(targetIndexToTag));
    if (!allowed.has(tagName)) return `<p>${text}</p>`;
    if (tagName === "h1") return `<h1>${text}</h1>`;
    return `<p><${tagName}>${text}</${tagName}></p>`;
  }

  function errToText(e) {
    const name = e?.name ? `${e.name}` : "Error";
    const msg = e?.message ? `${e.message}` : String(e);
    return `${name}: ${msg}`;
  }

  function resetToDefault() {
    if (detectedTag) detectedTag.textContent = "—";
    if (rendered) rendered.textContent = DEFAULT_RENDERED_TEXT;
    if (codeBox) codeBox.innerHTML = DEFAULT_CODE;
  }

  let toastTimer = null;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1400);
  }

  function playFoundEffect() {
    if (!arWrap) return;
    arWrap.classList.add("is-found");
    setTimeout(() => arWrap.classList.remove("is-found"), 520);
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  /* =========================
     Theme toggle
     ========================= */

  function applyTheme(theme) {
    if (!theme) {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("theme");
      return;
    }
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || savedTheme === "light") applyTheme(savedTheme);

  themeBtn?.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    applyTheme(next);
    toast(next === "dark" ? "Dark mode" : "Light mode");
  });

  /* =========================
     Global error hooks
     ========================= */

  window.addEventListener("error", (e) => {
    console.error(e);
    setStatus("Σφάλμα JS");
    setDebug(e.message || "Άγνωστο σφάλμα");
    setScanPill("Error");
    toast("Κάτι πήγε στραβά (JS)");
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error(e);
    setStatus("Σφάλμα Promise");
    setDebug(errToText(e.reason));
    setScanPill("Error");
    toast("Κάτι πήγε στραβά (Promise)");
  });

  /* =========================
     MindAR start/stop logic
     ========================= */

  let arSystem = null;
  let isRunning = false;

  let resetTimer = null;

  function scheduleResetAfterLost() {
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      resetToDefault();
      if (isRunning) {
        setStatus("Αναμονή…");
        setScanPill("Scanning");
      } else {
        setStatus("Stopped");
        setScanPill("Ready");
      }
      setDebug(`reset μετά από ${RESET_DELAY_MS}ms`);
    }, RESET_DELAY_MS);
  }

  function cancelScheduledReset() {
    if (resetTimer) {
      clearTimeout(resetTimer);
      resetTimer = null;
    }
  }

  async function checkTargetsMind() {
    const res = await fetch("./targets.mind", { cache: "no-store" });
    if (!res.ok) throw new Error(`targets.mind HTTP ${res.status} (δεν βρίσκεται στο σωστό φάκελο)`);
  }

  async function warmupCameraOnce() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach(t => t.stop());
  }

  function findMindarStreamVideo() {
    if (!arWrap) return null;
    const vids = Array.from(arWrap.querySelectorAll("video"));
    return vids.find(v => v.srcObject instanceof MediaStream) || null;
  }

  function forceMindarVideoVisible() {
    const v = findMindarStreamVideo();
    if (v) {
      v.style.display = "block";
      v.style.opacity = "1";
      v.style.visibility = "visible";
    }
  }

  async function ensureArSystemReady(timeoutMs = 3500) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const sys = sceneEl?.systems?.["mindar-image-system"];
      if (sys) return sys;
      await sleep(80);
    }
    return null;
  }

  async function ensureVideoStreamVisible(timeoutMs = 2500) {
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs) {
      const v = findMindarStreamVideo();
      if (v && v.srcObject instanceof MediaStream) {
        forceMindarVideoVisible();
        return true;
      }
      await sleep(120);
    }
    return false;
  }

  async function startAR() {
    if (isRunning) return;

    try {
      setStatus("Έλεγχος…");
      setScanPill("Checking…");
      setDebug(`${location.protocol}//${location.host} | secureContext=${window.isSecureContext}`);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia δεν υποστηρίζεται. Δοκίμασε Chrome/Edge.");
      }

      await checkTargetsMind();

      if (!arSystem) arSystem = await ensureArSystemReady(3500);
      if (!arSystem) {
        throw new Error("Δεν βρέθηκε mindar-image-system. Έλεγξε ότι φορτώνουν τα CDN scripts.");
      }

      setStatus("Permission κάμερας…");
      setScanPill("Permission…");
      await warmupCameraOnce();

      setStatus("Ξεκινάω σάρωση…");
      setScanPill("Starting…");
      await arSystem.start();

      isRunning = true;
      setStatus("Σάρωση ενεργή");
      setScanPill("Scanning");
      toast("Σάρωση: ON");

      startBtn.disabled = true;
      stopBtn.disabled = false;

      // Δώσε λίγο χρόνο και μετά “δέσε” video + layering
      const ok = await ensureVideoStreamVisible(2500);
      if (!ok) {
        setDebug("Δεν βρέθηκε stream video — retry start()");
        try {
          await arSystem.stop();
          await sleep(250);
          await arSystem.start();
          await ensureVideoStreamVisible(2500);
          setDebug("Retry OK");
        } catch (e) {
          throw e;
        }
      } else {
        setDebug("Camera stream OK");
      }

    } catch (e) {
      console.error(e);
      isRunning = false;
      setStatus("Αποτυχία εκκίνησης");
      setScanPill("Failed");
      setDebug(errToText(e));
      toast("Αποτυχία εκκίνησης");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  async function stopAR() {
    try {
      if (!arSystem) return;

      cancelScheduledReset();
      await arSystem.stop();
      isRunning = false;

      setStatus("Σταμάτησε");
      setScanPill("Ready");
      setDebug("—");
      resetToDefault();

      startBtn.disabled = false;
      stopBtn.disabled = true;

      toast("Σάρωση: OFF");

    } catch (e) {
      console.error(e);
      setStatus("Σφάλμα στο stop");
      setScanPill("Error");
      setDebug(errToText(e));
      toast("Σφάλμα στο stop");
    }
  }

  /* Init */
  async function init() {
    try {
      setStatus("Φόρτωση…");
      setScanPill("Loading…");
      setDebug("—");

      await checkTargetsMind();

      arSystem = await ensureArSystemReady(3500);
      if (!arSystem) {
        throw new Error("Δεν βρέθηκε mindar-image-system. Έλεγξε ότι φορτώνουν τα CDN scripts.");
      }

      setStatus("Έτοιμο – πάτα «Έναρξη Σάρωσης»");
      setScanPill("Ready");
      setDebug("—");

      startBtn.disabled = false;
      stopBtn.disabled = true;

      resetToDefault();
      toast("Έτοιμο!");

    } catch (e) {
      console.error(e);
      setStatus("Σφάλμα αρχικοποίησης");
      setScanPill("Error");
      setDebug(errToText(e));
      toast("Σφάλμα αρχικοποίησης");
      startBtn.disabled = true;
      stopBtn.disabled = true;
    }
  }

  if (sceneEl?.hasLoaded) init();
  else sceneEl?.addEventListener("loaded", init);

  sceneEl?.addEventListener("arReady", () => {
    if (isRunning) {
      setStatus("Σάρωση ενεργή");
      setScanPill("Scanning");
      setDebug("arReady");
    }
  });

  sceneEl?.addEventListener("arError", () => {
    setStatus("arError (MindAR)");
    setScanPill("Error");
    setDebug("Δες Console (F12) για λεπτομέρειες");
    toast("MindAR: arError");
  });

  startBtn?.addEventListener("click", startAR);
  stopBtn?.addEventListener("click", stopAR);

  /* Targets */
  for (let i = 0; i < 10; i++) {
    const entity = document.getElementById(`t${i}`);
    if (!entity) continue;

    entity.addEventListener("targetFound", () => {
      cancelScheduledReset();

      const tagName = targetIndexToTag[i];
      if (detectedTag) detectedTag.textContent = `<${tagName}>`;

      const html = buildHtmlForTag(tagName, "Hello World!");
      if (codeBox) codeBox.innerHTML = escapeHtml(html);
      if (rendered) rendered.innerHTML = html;

      setStatus("Εντοπίστηκε κάρτα");
      setScanPill("Found");
      setDebug(`targetFound index=${i}`);

      playFoundEffect();
    });

    entity.addEventListener("targetLost", () => {
      setStatus("Η κάρτα χάθηκε – επιστροφή σε 2s…");
      setScanPill("Lost…");
      setDebug(`targetLost index=${i}`);
      scheduleResetAfterLost();
    });
  }
});
