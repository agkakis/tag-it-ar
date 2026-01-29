document.addEventListener("DOMContentLoaded", () => {
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

  function escapeHtml(str) {
    return str.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function buildHtmlForTag(tagName, text) {
    const allowed = new Set(Object.values(targetIndexToTag));
    if (!allowed.has(tagName)) return `<p>${text}</p>`;
    if (tagName === "h1") return `<h1>${text}</h1>`;
    return `<p><${tagName}>${text}</${tagName}></p>`;
  }

  function setScanPill(text) {
    if (!scanPill) return;
    scanPill.textContent = text;
  }

  function errToText(e) {
    const name = e?.name ? `${e.name}` : "Error";
    const msg = e?.message ? `${e.message}` : String(e);
    return `${name}: ${msg}`;
  }

  function resetToDefault() {
    detectedTag.textContent = "—";
    rendered.textContent = DEFAULT_RENDERED_TEXT;
    codeBox.innerHTML = DEFAULT_CODE;
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
    setScanPill("Error");
    toast("Κάτι πήγε στραβά (JS)");
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error(e);
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
      setScanPill("Scanning");
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

  async function startAR() {
    if (isRunning) return;

    try {
      setScanPill("Checking…");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia δεν υποστηρίζεται. Δοκίμασε Chrome/Edge.");
      }

      await checkTargetsMind();

      if (!arSystem) {
        throw new Error("Το AR σύστημα δεν είναι έτοιμο. Περίμενε 1–2 δευτερόλεπτα και ξαναπάτα.");
      }

      setScanPill("Permission…");
      await warmupCameraOnce();

      setScanPill("Starting…");
      await arSystem.start();

      isRunning = true;
      setScanPill("Scanning");
      toast("Σάρωση: ON");

      startBtn.disabled = true;
      stopBtn.disabled = false;

      setTimeout(() => {
        forceMindarVideoVisible();
      }, 600);

      // Fallback retry: αν δεν βρούμε stream video μετά από 1200ms, κάνουμε ένα retry start()
      setTimeout(async () => {
        if (!isRunning) return;
        const v = findMindarStreamVideo();
        if (!v || !(v.srcObject instanceof MediaStream)) {
          console.warn("Δεν βρέθηκε stream video — retry start()");
          try {
            await arSystem.stop();
            await arSystem.start();
            setTimeout(() => {
              forceMindarVideoVisible();
            }, 600);
          } catch (e) {
            console.error(e);
            setScanPill("Failed");
            toast("Αποτυχία εκκίνησης");
            startBtn.disabled = false;
            stopBtn.disabled = true;
            isRunning = false;
          }
        }
      }, 1200);

    } catch (e) {
      console.error(e);
      isRunning = false;
      setScanPill("Failed");
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

      setScanPill("Ready");
      resetToDefault();

      startBtn.disabled = false;
      stopBtn.disabled = true;

      toast("Σάρωση: OFF");

    } catch (e) {
      console.error(e);
      setScanPill("Error");
      toast("Σφάλμα στο stop");
    }
  }

  sceneEl.addEventListener("loaded", async () => {
    try {
      setScanPill("Loading…");

      arSystem = sceneEl.systems["mindar-image-system"];
      if (!arSystem) {
        throw new Error("Δεν βρέθηκε mindar-image-system. Έλεγξε ότι φορτώνουν τα CDN scripts.");
      }

      await checkTargetsMind();

      setScanPill("Ready");
      startBtn.disabled = false;

      resetToDefault();
      toast("Έτοιμο!");

    } catch (e) {
      console.error(e);
      setScanPill("Error");
      toast(errToText(e));
      startBtn.disabled = true;
      stopBtn.disabled = true;
    }
  });

  sceneEl.addEventListener("arReady", () => {
    if (isRunning) setScanPill("Scanning");
  });

  sceneEl.addEventListener("arError", () => {
    setScanPill("Error");
    toast("MindAR: arError");
  });

  startBtn.addEventListener("click", startAR);
  stopBtn.addEventListener("click", stopAR);

  for (let i = 0; i < 10; i++) {
    const entity = document.getElementById(`t${i}`);
    if (!entity) continue;

    entity.addEventListener("targetFound", () => {
      cancelScheduledReset();

      const tagName = targetIndexToTag[i];
      detectedTag.textContent = `<${tagName}>`;

      const html = buildHtmlForTag(tagName, "Hello World!");
      codeBox.innerHTML = escapeHtml(html);
      rendered.innerHTML = html;

      setScanPill("Found");
      playFoundEffect();
    });

    entity.addEventListener("targetLost", () => {
      setScanPill("Lost…");
      scheduleResetAfterLost();
    });
  }
});
