document.addEventListener("DOMContentLoaded", () => {
  // UI refs
  const statusText = document.getElementById("statusText");
  const detectedTag = document.getElementById("detectedTag");
  const hintText = document.getElementById("hintText");

  const rendered = document.getElementById("rendered");
  const codeBox = document.getElementById("codeBox");

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  const sceneEl = document.getElementById("scene");
  const arWrap = document.getElementById("arWrap");

  // Config
  const RESET_DELAY_MS = 2000;
  const MIND_FILE = "./targets_level1.mind";

  // Level 1 mapping (σύμφωνα με τη σειρά σου στο MindAR)
  const indexToTag = {
    0: "b",
    1: "i",
    2: "u",
    3: "mark",
    4: "del",
    5: "ins",
    6: "sub",
    7: "sup",
    8: "strong",
    9: "em",
  };

  // Φιλικά μηνύματα (mini επεξήγηση)
  const tagHints = {
    b: "Έντονα γράμματα.",
    i: "Πλάγια γράμματα.",
    u: "Υπογράμμιση.",
    mark: "Επισήμανση (highlight).",
    del: "Διαγραφή (σαν διορθώσεις).",
    ins: "Εισαγωγή/προσθήκη (σαν διορθώσεις).",
    sub: "Δείκτης κάτω (π.χ. H₂O).",
    sup: "Δείκτης πάνω (π.χ. m²).",
    strong: "Σημαντικό (συνήθως έντονο).",
    em: "Έμφαση (συνήθως πλάγιο).",
  };

  // Default demo
  const DEFAULT_HTML = "<p>Hello World!</p>";

  // Ειδικά demos για sub/sup (ώστε να φαίνεται καθαρά)
  const SPECIAL_DEMOS = {
    sub: "<p>H<sub>2</sub>O</p>",
    sup: "<p>m<sup>2</sup></p>",
  };

  function setStatus(msg) { statusText.textContent = msg; }
  function setDetected(msg) { detectedTag.textContent = msg; }
  function setHint(msg) { hintText.textContent = msg; }

  function escapeHtml(str) {
    return str.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function setDefault() {
    setDetected("—");
    setHint("—");
    rendered.innerHTML = DEFAULT_HTML;
    codeBox.innerHTML = escapeHtml(DEFAULT_HTML);
  }

  function applyFormattingTag(tagName) {
    // Αν είναι sub/sup, δείξε ειδικό demo (H2O / m2)
    if (SPECIAL_DEMOS[tagName]) {
      const html = SPECIAL_DEMOS[tagName];
      rendered.innerHTML = html;
      codeBox.innerHTML = escapeHtml(html);
      return;
    }

    // Για όλα τα άλλα: τυπικό Hello World μέσα σε <p>
    const html = `<p><${tagName}>Hello World!</${tagName}></p>`;
    rendered.innerHTML = html;
    codeBox.innerHTML = escapeHtml(html);
  }

  // --- AR state ---
  let arSystem = null;
  let isRunning = false;
  let resetTimer = null;

  function cancelReset() {
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = null;
  }

  function scheduleResetAfterLost() {
    cancelReset();
    resetTimer = setTimeout(() => {
      setDefault();
      setStatus("Αναμονή…");
    }, RESET_DELAY_MS);
  }

  async function checkMindFileReachable(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} HTTP ${res.status} (λείπει ή λάθος όνομα)`);
  }

  async function warmupCameraOnce() {
    // Σε mobile απαιτείται user gesture (κουμπί Έναρξη) + HTTPS.
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } }, // πίσω κάμερα
      audio: false
    });
    stream.getTracks().forEach(t => t.stop());
  }

  function findMindarStreamVideo() {
    const vids = Array.from(arWrap.querySelectorAll("video"));
    return vids.find(v => v.srcObject instanceof MediaStream) || null;
  }

  function stopMindarCameraTracks() {
    const v = findMindarStreamVideo();
    const stream = v?.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach(t => t.stop());
      v.srcObject = null;
      return true;
    }
    return false;
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
      setStatus("Έλεγχος αρχείων…");
      await checkMindFileReachable(MIND_FILE);

      if (!arSystem) throw new Error("AR system not ready.");
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Η συσκευή δεν υποστηρίζει κάμερα (getUserMedia).");

      setStatus("Ζητάω άδεια κάμερας…");
      await warmupCameraOnce();

      setStatus("Ξεκινάω σάρωση…");
      arSystem.start();
      isRunning = true;

      startBtn.disabled = true;
      stopBtn.disabled = false;

      setTimeout(() => {
        if (!isRunning) return;
        forceMindarVideoVisible();
        setStatus("Σάρωση ενεργή");
      }, 600);

    } catch (e) {
      console.error(e);
      isRunning = false;
      setStatus("Αποτυχία εκκίνησης");
      setHint(e?.message ? e.message : String(e));
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  function stopAR() {
    try {
      if (!arSystem) return;

      isRunning = false;
      cancelReset();

      setStatus("Σταματάω…");

      arSystem.stop();
      stopMindarCameraTracks();

      setDefault();
      setStatus("Σταμάτησε");

      startBtn.disabled = false;
      stopBtn.disabled = true;

    } catch (e) {
      console.error(e);
      setStatus("Σφάλμα στο stop");
      setHint(e?.message ? e.message : String(e));
    }
  }

  // --- Scene lifecycle ---
  sceneEl.addEventListener("loaded", async () => {
    try {
      setStatus("Φόρτωση…");
      arSystem = sceneEl.systems["mindar-image-system"];
      if (!arSystem) throw new Error("Δεν βρέθηκε mindar-image-system (φόρτωση script).");

      await checkMindFileReachable(MIND_FILE);

      setDefault();
      setStatus("Έτοιμο – πάτα «Έναρξη»");
      startBtn.disabled = false;
      stopBtn.disabled = true;

    } catch (e) {
      console.error(e);
      setStatus("Σφάλμα αρχικοποίησης");
      setHint(e?.message ? e.message : String(e));
      startBtn.disabled = true;
      stopBtn.disabled = true;
    }
  });

  // Buttons
  startBtn.addEventListener("click", startAR);
  stopBtn.addEventListener("click", stopAR);

  // Targets 0..9
  for (let i = 0; i < 10; i++) {
    const entity = document.getElementById(`t${i}`);
    if (!entity) continue;

    entity.addEventListener("targetFound", () => {
      cancelReset();

      const tag = indexToTag[i];
      setDetected(`<${tag}>`);
      setHint(tagHints[tag] || "—");
      setStatus("Εντοπίστηκε κάρτα");

      applyFormattingTag(tag);
    });

    entity.addEventListener("targetLost", () => {
      setStatus("Η κάρτα χάθηκε – επιστροφή σε 2s…");
      scheduleResetAfterLost();
    });
  }
});
