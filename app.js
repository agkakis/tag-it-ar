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

  const videoDebugBox = document.getElementById("videoDebugBox");
  const videoDebug = document.getElementById("videoDebug");

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

  function escapeHtml(str) {
    return str.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function buildHtmlForTag(tagName, text) {
    const allowed = new Set(Object.values(targetIndexToTag));
    if (!allowed.has(tagName)) return `<p>${text}</p>`;
    if (tagName === "h1") return `<h1>${text}</h1>`;
    return `<p><${tagName}>${text}</${tagName}></p>`;
  }

  function setStatus(msg) { statusText.textContent = msg; }
  function setDebug(msg) { debugText.textContent = msg; }

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

  window.addEventListener("error", (e) => {
    setStatus("Σφάλμα JS");
    setDebug(e.message || "Άγνωστο σφάλμα");
  });
  window.addEventListener("unhandledrejection", (e) => {
    setStatus("Σφάλμα Promise");
    setDebug(errToText(e.reason));
  });

  let arSystem = null;
  let isRunning = false;

  let resetTimer = null;
  function scheduleResetAfterLost() {
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      resetToDefault();
      setStatus("Αναμονή…");
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

  function attachDebugPreviewIfPossible() {
    const v = findMindarStreamVideo();
    if (v && v.srcObject) {
      videoDebug.srcObject = v.srcObject;
      videoDebugBox.style.display = "block";
      setDebug("Camera stream OK (debug preview ενεργό)");
    }
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
      setStatus("Έλεγχος…");
      setDebug(`${location.protocol}//${location.host} | secureContext=${window.isSecureContext}`);

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("getUserMedia δεν υποστηρίζεται. Δοκίμασε Chrome/Edge.");
      }

      await checkTargetsMind();

      if (!arSystem) {
        throw new Error("Το AR σύστημα δεν είναι έτοιμο. Περίμενε 1–2 δευτερόλεπτα και ξαναπάτα.");
      }

      setStatus("Permission κάμερας…");
      await warmupCameraOnce();

      setStatus("Ξεκινάω σάρωση…");
      await arSystem.start();

      isRunning = true;
      setStatus("Σάρωση ενεργή");
      setDebug("arSystem.start OK");

      startBtn.disabled = true;
      stopBtn.disabled = false;

      // Δώσε λίγο χρόνο και μετά “δέσε” video + layering
      setTimeout(() => {
        forceMindarVideoVisible();
        attachDebugPreviewIfPossible();
      }, 600);

      // Fallback: αν δεν βρούμε stream video μετά από 1200ms, κάνουμε ένα retry
      setTimeout(async () => {
        if (!isRunning) return;
        const v = findMindarStreamVideo();
        if (!v || !(v.srcObject instanceof MediaStream)) {
          setDebug("Δεν βρέθηκε stream video — retry start()");
          try {
            await arSystem.stop();
            await arSystem.start();
            setTimeout(() => {
              forceMindarVideoVisible();
              attachDebugPreviewIfPossible();
              setDebug("Retry OK");
            }, 600);
          } catch (e) {
            setStatus("Αποτυχία εκκίνησης");
            setDebug(errToText(e));
            startBtn.disabled = false;
            stopBtn.disabled = true;
            isRunning = false;
          }
        }
      }, 1200);

    } catch (e) {
      console.error(e);
      isRunning = false;
      setStatus("Αποτυχία εκκίνησης");
      setDebug(errToText(e));
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
      setDebug("—");
      resetToDefault();

      videoDebugBox.style.display = "none";
      videoDebug.srcObject = null;

      startBtn.disabled = false;
      stopBtn.disabled = true;

    } catch (e) {
      console.error(e);
      setStatus("Σφάλμα στο stop");
      setDebug(errToText(e));
    }
  }

  sceneEl.addEventListener("loaded", async () => {
    try {
      setStatus("Φόρτωση…");
      setDebug("—");

      arSystem = sceneEl.systems["mindar-image-system"];
      if (!arSystem) {
        throw new Error("Δεν βρέθηκε mindar-image-system. Έλεγξε ότι φορτώνουν τα CDN scripts.");
      }

      await checkTargetsMind();

      setStatus("Έτοιμο – πάτα «Έναρξη Σάρωσης»");
      setDebug("—");
      startBtn.disabled = false;

      resetToDefault();

    } catch (e) {
      console.error(e);
      setStatus("Σφάλμα αρχικοποίησης");
      setDebug(errToText(e));
      startBtn.disabled = true;
      stopBtn.disabled = true;
    }
  });

  sceneEl.addEventListener("arReady", () => {
    if (isRunning) {
      setStatus("Σάρωση ενεργή");
      setDebug("arReady");
    }
  });

  sceneEl.addEventListener("arError", () => {
    setStatus("arError (MindAR)");
    setDebug("Δες Console (F12) για λεπτομέρειες");
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

      setStatus("Εντοπίστηκε κάρτα");
      setDebug(`targetFound index=${i}`);
    });

    entity.addEventListener("targetLost", () => {
      setStatus("Η κάρτα χάθηκε – επιστροφή σε 2s…");
      setDebug(`targetLost index=${i}`);
      scheduleResetAfterLost();
    });
  }
});
