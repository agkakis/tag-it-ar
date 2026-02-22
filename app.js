document.addEventListener("DOMContentLoaded", () => {
  // Screens
  const homeScreen = document.getElementById("homeScreen");
  const scanScreen = document.getElementById("scanScreen");
  const quizScreen = document.getElementById("quizScreen");

  // Top UI
  const topSubtitle = document.getElementById("topSubtitle");

  // Home buttons
  const goL1 = document.getElementById("goL1");
  const goL2 = document.getElementById("goL2");
  const goQuiz = document.getElementById("goQuiz");

  // Back buttons
  const backHomeFromScan = document.getElementById("backHomeFromScan");
  const backHomeFromQuiz = document.getElementById("backHomeFromQuiz");

  // Scan UI
  const scanTitle = document.getElementById("scanTitle");
  const scanMini = document.getElementById("scanMini");
  const helperText = document.getElementById("helperText");

  const arWrap = document.getElementById("arWrap");

  const statusText = document.getElementById("statusText");
  const detectedTag = document.getElementById("detectedTag");
  const hintText = document.getElementById("hintText");

  const contentLabel = document.getElementById("contentLabel");
  const rendered = document.getElementById("rendered");
  const codeBox = document.getElementById("codeBox");

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  // Portrait overlay
  const overlay = document.getElementById("portraitOverlay");

  // Quiz UI
  const quizBox = document.getElementById("quizBox");

  const RESET_DELAY_MS = 2000;

  function setStatus(msg) { statusText.textContent = msg; }
  function setDetected(msg) { detectedTag.textContent = msg; }
  function setHint(msg) { hintText.textContent = msg; }

  function escapeHtml(str) {
    return str.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function showScreen(which) {
    for (const el of [homeScreen, scanScreen, quizScreen]) el.classList.remove("is-active");
    which.classList.add("is-active");
  }

  // ✅ ΠΙΟ ΣΤΑΘΕΡΟ σε iOS/Android από matchMedia
  function isPortrait() {
    return window.innerHeight >= window.innerWidth;
  }

  function showOverlay() {
    overlay.classList.add("is-visible");
    overlay.setAttribute("aria-hidden", "false");
  }

  function hideOverlay() {
    overlay.classList.remove("is-visible");
    overlay.setAttribute("aria-hidden", "true");
  }

  function enforcePortraitUI() {
    if (isPortrait()) hideOverlay();
    else showOverlay();
  }

  async function tryLockPortrait() {
    try {
      if (screen?.orientation?.lock) {
        await screen.orientation.lock("portrait");
        return true;
      }
    } catch (_) {}
    return false;
  }

  async function checkFileReachable(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} HTTP ${res.status} (λείπει ή λάθος όνομα)`);
  }

  // -----------------------
  // Level configurations
  // -----------------------
  const LEVELS = {
    L1: {
      key: "L1",
      numTargets: 10,
      title: "Level 1 — Μορφοποίηση",
      mini: "Μπλε κάρτες: μορφοποίηση στο “Hello World!”",
      helper: "Στόχευσε την κάρτα μέσα στον κύκλο και κράτα το κινητό σταθερό.",
      mindFile: "./targets_level1.mind",
      contentLabel: "Κείμενο (απόδοση):",
      defaultHtml: "<p>Hello World!</p>",
      indexToTag: {
        0: "b", 1: "i", 2: "u", 3: "mark", 4: "del",
        5: "ins", 6: "sub", 7: "sup", 8: "strong", 9: "em",
      },
      hints: {
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
      },
      apply(tag) {
        if (tag === "sub") return "<p>H<sub>2</sub>O</p>";
        if (tag === "sup") return "<p>m<sup>2</sup></p>";
        return `<p><${tag}>Hello World!</${tag}></p>`;
      },
    },

    L2: {
      key: "L2",
      numTargets: 6,
      title: "Level 2 — Δομή",
      mini: "Πράσινες κάρτες: από “Before” σε “After” (δομή)",
      helper: "Σκανάρισε κάρτες δομής και δες καθαρά Before → After στο ίδιο περιεχόμενο.",
      mindFile: "./targets_level2.mind",
      contentLabel: "Before (χωρίς δομή):",

      // ✅ BEFORE: 1 γραμμή, μικρό για mobile
      defaultHtml: `
        <div class="l2-box">
          <div class="l2-box__label">Before (χωρίς δομή)</div>
          <div class="l2-before">
            Mini οδηγός HTML: Στόχος να οργανώνεις κείμενο σε τίτλο, παραγράφους και λίστες.
            Τι θα δεις σήμερα: δομή, bullets, βήματα.
            Bullets: Δομή σελίδας, Καθαρό κείμενο, Έλεγχος πριν το quiz.
            Βήματα: 1 Διάβασε, 2 Σημείωσε, 3 Εφάρμοσε.
            Σημείωση: γραμμή Α / γραμμή Β.
          </div>
        </div>
      `.trim(),

      // Τα 6 tags σου (αν τα .mind σου είναι 6 targets, αυτό είναι το σωστό mapping)
      indexToTag: { 0: "h1", 1: "p", 2: "ul", 3: "ol", 4: "br", 5: "hr" },

      hints: {
        h1: "Κύριος τίτλος (μία φορά ανά σελίδα).",
        p: "Παράγραφος: καθαρίζει/ομαδοποιεί προτάσεις.",
        ul: "Λίστα bullets (χωρίς σειρά).",
        ol: "Λίστα βημάτων (με σειρά).",
        br: "Αλλαγή γραμμής μέσα στο ίδιο block.",
        hr: "Οπτικός διαχωριστής ενότητας.",
      },

      apply(tag) {
        const beforeText =
          "Mini οδηγός HTML: Στόχος να οργανώνεις κείμενο σε τίτλο, παραγράφους και λίστες. " +
          "Τι θα δεις σήμερα: δομή, bullets, βήματα. " +
          "Bullets: Δομή σελίδας, Καθαρό κείμενο, Έλεγχος πριν το quiz. " +
          "Βήματα: 1 Διάβασε, 2 Σημείωσε, 3 Εφάρμοσε. " +
          "Σημείωση: γραμμή Α / γραμμή Β.";

        const box = (label, inner) =>
          `<div class="l2-box"><div class="l2-box__label">${label}</div>${inner}</div>`;

        const beforeHtml = box("Before (χωρίς δομή)", `<div class="l2-before">${beforeText}</div>`);

        const focusClass = (t) => (t === tag ? "l2-focus" : "");

        // ✅ AFTER: ίδιο περιεχόμενο, καθαρή δομή (μικρό για mobile)
        const afterHtml = `
          <h1 class="${focusClass("h1")}">Mini οδηγός HTML</h1>

          <p class="${focusClass("p")}">
            Στόχος: να οργανώνεις κείμενο σε τίτλο, παραγράφους και λίστες.<br class="${focusClass("br")}">
            Τι θα δεις σήμερα: δομή, bullets, βήματα.
          </p>

          <hr class="${focusClass("hr")}">

          <p class="${focusClass("p")}">Bullets:</p>
          <ul class="${focusClass("ul")}">
            <li>Δομή σελίδας</li>
            <li>Καθαρό κείμενο</li>
            <li>Έλεγχος πριν το quiz</li>
          </ul>

          <p class="${focusClass("p")}">Βήματα:</p>
          <ol class="${focusClass("ol")}">
            <li>Διάβασε</li>
            <li>Σημείωσε</li>
            <li>Εφάρμοσε</li>
          </ol>

          <p class="${focusClass("p")}">
            Σημείωση:<br class="${focusClass("br")}">
            γραμμή Α<br class="${focusClass("br")}">
            γραμμή Β
          </p>
        `.trim();

        const afterBox = box(`After (δομή με <${tag}>)`, afterHtml);

        return `${beforeHtml}${afterBox}`;
      },
    },
  };

  // -----------------------
  // AR engine
  // -----------------------
  let currentLevel = null;
  let sceneEl = null;
  let arSystem = null;
  let isRunning = false;
  let resetTimer = null;

  function clearReset() {
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = null;
  }

  function scheduleReset() {
    clearReset();
    resetTimer = setTimeout(() => {
      setDefaultContent();
      setStatus("Αναμονή…");
    }, RESET_DELAY_MS);
  }

  function setDefaultContent() {
    setDetected("—");
    setHint("—");
    rendered.innerHTML = currentLevel.defaultHtml;
    codeBox.innerHTML = escapeHtml(currentLevel.defaultHtml);
    contentLabel.textContent = currentLevel.contentLabel;
  }

  function stopAR() {
    try {
      if (!arSystem) return;
      isRunning = false;
      clearReset();
      arSystem.stop();
      stopMindarCameraTracks();
      startBtn.disabled = false;
      stopBtn.disabled = true;
    } catch (_) {}
  }

  function destroyScene() {
    stopAR();
    if (sceneEl) {
      sceneEl.remove();
      sceneEl = null;
      arSystem = null;
    }
  }

  function buildScene(mindFile) {
    destroyScene();

    const s = document.createElement("a-scene");
    s.setAttribute("embedded", "");
    s.setAttribute("vr-mode-ui", "enabled: false");
    s.setAttribute("device-orientation-permission-ui", "enabled: false");
    s.setAttribute("renderer", "colorManagement: true, physicallyCorrectLights");
    s.setAttribute("mindar-image", `imageTargetSrc: ${mindFile}; autoStart: false;`);

    // ✅ Δυναμικός αριθμός targets (L1=10, L2=6)
    const n = currentLevel?.numTargets ?? 10;
    const targets = Array.from({ length: n }, (_, i) =>
      `<a-entity id="t${i}" mindar-image-target="targetIndex: ${i}"></a-entity>`
    ).join("");

    s.innerHTML = `
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      ${targets}
    `;

    arWrap.prepend(s);
    sceneEl = s;

    sceneEl.addEventListener("loaded", () => {
      arSystem = sceneEl.systems["mindar-image-system"];
      wireTargets();
      setStatus("Έτοιμο – πάτα «Έναρξη»");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    });
  }

  function wireTargets() {
    const n = currentLevel?.numTargets ?? 10;

    for (let i = 0; i < n; i++) {
      const e = sceneEl.querySelector(`#t${i}`);
      if (!e) continue;

      e.addEventListener("targetFound", () => {
        clearReset();
        const tag = currentLevel.indexToTag[i];

        if (!tag) return;

        setDetected(`<${tag}>`);
        setHint(currentLevel.hints[tag] || "—");
        setStatus("Εντοπίστηκε κάρτα");

        const html = currentLevel.apply(tag);
        rendered.innerHTML = html;
        codeBox.innerHTML = escapeHtml(html);
      });

      e.addEventListener("targetLost", () => {
        setStatus("Η κάρτα χάθηκε – επιστροφή σε 2s…");
        scheduleReset();
      });
    }
  }

  async function warmupCameraOnce() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
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

  async function startAR() {
    if (isRunning) return;

    enforcePortraitUI();
    if (!isPortrait()) {
      setStatus("Γύρισε σε portrait για να ξεκινήσεις");
      return;
    }

    await tryLockPortrait();

    try {
      setStatus("Έλεγχος αρχείων…");
      await checkFileReachable(currentLevel.mindFile);

      if (!arSystem) {
        setStatus("Φόρτωση…");
        return;
      }
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
        const v = findMindarStreamVideo();
        if (v) {
          v.style.display = "block";
          v.style.opacity = "1";
          v.style.visibility = "visible";
        }
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

  function enterScan(levelKey) {
    currentLevel = LEVELS[levelKey];

    topSubtitle.textContent = currentLevel.title;
    scanTitle.textContent = currentLevel.title;
    scanMini.textContent = currentLevel.mini;
    helperText.textContent = currentLevel.helper;

    showScreen(scanScreen);

    startBtn.disabled = true;
    stopBtn.disabled = true;
    setStatus("Φόρτωση…");
    setDetected("—");
    setHint("—");

    buildScene(currentLevel.mindFile);

    // default content
    rendered.innerHTML = currentLevel.defaultHtml;
    codeBox.innerHTML = escapeHtml(currentLevel.defaultHtml);
    contentLabel.textContent = currentLevel.contentLabel;
  }

  function enterHome() {
    stopAR();
    destroyScene();
    topSubtitle.textContent = "Μάθε HTML με κάρτες AR.";
    showScreen(homeScreen);
  }

  function handleOrientationChange() {
    enforcePortraitUI();
    if (!isPortrait() && isRunning) {
      stopAR();
      setStatus("Σταμάτησε — γύρισε σε portrait για να συνεχίσεις");
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  window.addEventListener("resize", handleOrientationChange);
  window.addEventListener("orientationchange", handleOrientationChange);

  enforcePortraitUI();
  setTimeout(enforcePortraitUI, 250);
  setTimeout(enforcePortraitUI, 800);

  // -----------------------
  // Quiz
  // -----------------------
  const QUIZ = [
    { q: "Τι κάνει το <b>;", a: ["Πλάγια γράμματα", "Έντονα γράμματα", "Υπογράμμιση"], correct: 1 },
    { q: "Τι κάνει το <i>;", a: ["Πλάγια γράμματα", "Διαγραφή", "Highlight"], correct: 0 },
    { q: "Τι κάνει το <u>;", a: ["Υπογράμμιση", "Τίτλο", "Λίστα"], correct: 0 },
    { q: "Τι κάνει το <mark>;", a: ["Σημαντικό", "Επισήμανση (highlight)", "Νέα γραμμή"], correct: 1 },
    { q: "Τι δείχνει το <del>;", a: ["Διαγραφή", "Εισαγωγή", "Δείκτη πάνω"], correct: 0 },
    { q: "Τι δείχνει το <ins>;", a: ["Διαγραφή", "Προσθήκη/εισαγωγή", "Δείκτη κάτω"], correct: 1 },
    { q: "Πότε χρησιμοποιούμε <sub>;", a: ["m²", "H₂O", "Λίστα"], correct: 1 },
    { q: "Πότε χρησιμοποιούμε <sup>;", a: ["H₂O", "m²", "Τίτλο"], correct: 1 },
    { q: "Τι σημαίνει συνήθως <strong>;", a: ["Έμφαση/σημαντικό", "Υπογράμμιση", "Διαχωριστικό"], correct: 0 },
    { q: "Τι σημαίνει συνήθως <em>;", a: ["Έμφαση (συνήθως πλάγιο)", "Λίστα", "Νέα γραμμή"], correct: 0 },
  ];

  let quizIndex = 0;
  let quizScore = 0;
  let quizLocked = false;

  function renderQuiz() {
    const item = QUIZ[quizIndex];
    if (!item) return;

    quizBox.innerHTML = `
      <div class="quiz-q">${quizIndex + 1}/${QUIZ.length}: ${escapeHtml(item.q)}</div>
      <div class="quiz-answers">
        ${item.a.map((txt, idx) => `<button class="answer-btn" type="button" data-idx="${idx}">${escapeHtml(txt)}</button>`).join("")}
      </div>
      <div class="quiz-footer">
        <div><strong>Σκορ:</strong> ${quizScore}</div>
        <div><strong>Πρόοδος:</strong> ${quizIndex + 1}/${QUIZ.length}</div>
      </div>
    `;

    quizLocked = false;

    const buttons = quizBox.querySelectorAll(".answer-btn");
    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        if (quizLocked) return;
        quizLocked = true;

        const idx = Number(btn.getAttribute("data-idx"));
        const correct = item.correct;

        buttons.forEach(b => {
          const bi = Number(b.getAttribute("data-idx"));
          if (bi === correct) b.classList.add("correct");
          if (bi === idx && idx !== correct) b.classList.add("wrong");
          b.disabled = true;
        });

        if (idx === correct) quizScore++;

        setTimeout(() => {
          quizIndex++;
          if (quizIndex >= QUIZ.length) {
            quizBox.innerHTML = `
              <div class="quiz-q">Τέλος! 🎉</div>
              <p>Σκορ: <strong>${quizScore}</strong> / ${QUIZ.length}</p>
              <div class="buttons">
                <button id="restartQuiz" class="btn btn-primary" type="button">Ξανά</button>
                <button id="goHomeAfterQuiz" class="btn btn-secondary" type="button">Αρχική</button>
              </div>
            `;
            document.getElementById("restartQuiz").addEventListener("click", () => {
              quizIndex = 0; quizScore = 0;
              renderQuiz();
            });
            document.getElementById("goHomeAfterQuiz").addEventListener("click", enterHome);
          } else {
            renderQuiz();
          }
        }, 650);
      });
    });
  }

  function enterQuiz() {
    stopAR();
    destroyScene();
    topSubtitle.textContent = "Quiz — Έλεγξε τι έμαθες";
    showScreen(quizScreen);

    enforcePortraitUI();
    setTimeout(enforcePortraitUI, 250);

    quizIndex = 0;
    quizScore = 0;
    renderQuiz();
  }

  // -----------------------
  // Wiring UI
  // -----------------------
  goL1.addEventListener("click", () => enterScan("L1"));
  goL2.addEventListener("click", () => enterScan("L2"));
  goQuiz.addEventListener("click", enterQuiz);

  backHomeFromScan.addEventListener("click", enterHome);
  backHomeFromQuiz.addEventListener("click", enterHome);

  startBtn.addEventListener("click", startAR);
  stopBtn.addEventListener("click", () => {
    stopAR();
    setDefaultContent();
    setStatus("Σταμάτησε");
  });

  // Initial state
  showScreen(homeScreen);
});
