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

  function setScanPill(text) {
    if (!scanPill) return;
    scanPill.textContent = text;
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
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1600);
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
    setScanPill("Error");
    toast("Σφάλμα JavaScript");
  });

  window.addEventListener("unhandledrejection", (e) => {
    console.error(e);
    setScanPill("Error");
    toast("Σφάλμα Promise");
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
      if (isRunning) setScanPill("Scanning");
      else setScanPill("Ready");
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
    // Σε αρκετές συσκευές βοηθάει το permission flow.
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());
  }

  function findMindarStreamVideo() {
    if (!arWrap) return null;
    const vids = Array.from(arWrap.querySelectorAll("video"));
    return vids.find((v) => v.srcObject instanceof MediaStream) || null;
  }

  function forceMindarVideoVisible() {
    const v = findMindarStreamVideo();
    if (v) {
      v.style.display = "block";
      v.style.opacity = "1";
      v.style.visibility = "visible";
    }
  }

  async function ensureArSystemReady(timeoutMs = 2500) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const sys = sceneEl?.systems?.["mindar-image-system"];
      if (sys) return sys;
      await sleep(80);
    }
    return null;
  }

  async function ensureVideoStreamVisible(timeoutMs = 2200) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
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
      setScanPill("Checking…");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia δεν υποστηρίζεται. Δοκίμασε Chrome/Edge.");
      }

      // Αν δεν είσαι σε secure context, η κάμερα συνήθως μπλοκάρει.
      if (!window.isSecureContext) {
        toast("Χρειάζεται https ή http://localhost για κάμερα");
      }

      await checkTargetsMind();

      // Πιάσε/περίμενε το AR system (πολλές φορές αργεί λίγο)
      if (!arSystem) {
        arSystem = await ensureArSystemReady(3000);
      }
      if (!arSystem) {
        throw new Error("Δεν είναι έτοιμο το mindar-image-system (φόρτωση βιβλιοθηκών).");
      }

      setScanPill("Permission…");
      await warmupCameraOnce();

      setScanPill("Starting…");
      await arSystem.start();

      isRunning = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;

      // προσπάθησε να “δέσεις” το video stream (μερικές συσκευές καθυστερούν)
      const ok = await ensureVideoStreamVisible(2500);
      if (!ok) {
        console.warn("Δεν εμφανίστηκε video stream έγκαιρα — retry start()");
        // fallback retry
        try {
          await arSystem.stop();
          await sleep(250);
          await arSystem.start();
          await ensureVideoStreamVisible(2500);
        } catch (e) {
          console.error(e);
        }
      }

      setScanPill("Scanning");
      toast("Σάρωση: ON");

    } catch (e) {
      console.error(e);
      isRunning = false;

      setScanPill("Failed");

      // Δείξε πιο χρήσιμο μήνυμα
      const msg = errToText(e);
      if (msg.includes("NotAllowedError")) {
        toast("Άρνηση άδειας κάμερας");
      } else if (msg.includes("NotFoundError")) {
        toast("Δεν βρέθηκε κάμερα στη συσκευή");
      } else {
        toast(msg);
      }

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
      toast(errToText(e));
    }
  }

  /* =========================
     Init / Scene hooks
     ========================= */

  async function init() {
    setScanPill("Loading…");
    startBtn.disabled = true;
    stopBtn.disabled = true;
    resetToDefault();

    try {
      await checkTargetsMind();

      // Περίμενε να είναι διαθέσιμο το system (με retry)
      arSystem = await ensureArSystemReady(3500);
      if (!arSystem) {
        throw new Error("Δεν βρέθηκε mindar-image-system. Έλεγξε ότι φορτώνουν τα CDN scripts.");
      }

      setScanPill("Ready");
      startBtn.disabled = false;
      stopBtn.disabled = true;

      toast("Έτοιμο!");
    } catch (e) {
      console.error(e);
      setScanPill("Error");
      toast(errToText(e));
      startBtn.disabled = true;
      stopBtn.disabled = true;
    }
  }

  // Αν το scene ήδη “loaded”, τρέξε init. Αλλιώς περίμενε event.
  if (sceneEl?.hasLoaded) {
    init();
  } else {
    sceneEl?.addEventListener("loaded", init);
  }

  sceneEl?.addEventListener("arReady", () => {
    if (isRunning) setScanPill("Scanning");
  });

  sceneEl?.addEventListener("arError", () => {
    setScanPill("Error");
    toast("MindAR: arError");
  });

  startBtn?.addEventListener("click", startAR);
  stopBtn?.addEventListener("click", stopAR);

  /* =========================
     Targets
     ========================= */

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

      setScanPill("Found");
      playFoundEffect();
    });

    entity.addEventListener("targetLost", () => {
      setScanPill("Lost…");
      scheduleResetAfterLost();
    });
  }
});
