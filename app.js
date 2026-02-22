document.addEventListener("DOMContentLoaded", () => {
  // Screens
  const homeScreen = document.getElementById("homeScreen");
  const scanScreen = document.getElementById("scanScreen");

  // Top UI
  const topSubtitle = document.getElementById("topSubtitle");

  // Home buttons
  const goL1 = document.getElementById("goL1");
  const goL2 = document.getElementById("goL2");
  const goQuizL1 = document.getElementById("goQuizL1");
  const goQuizL2 = document.getElementById("goQuizL2");

  // Back button
  const backHomeFromScan = document.getElementById("backHomeFromScan");

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

  // Quiz HUD
  const quizHud = document.getElementById("quizHud");
  const quizQuestion = document.getElementById("quizQuestion");
  const quizScoreEl = document.getElementById("quizScore");
  const quizProgressEl = document.getElementById("quizProgress");
  const quizFeedback = document.getElementById("quizFeedback");

  // Portrait overlay
  const overlay = document.getElementById("portraitOverlay");

  // -----------------------
  // Helpers
  // -----------------------
  const RESET_DELAY_MS = 2000;
  const QUIZ_LOCK_MS = 1000;

  function setStatus(msg) { statusText.textContent = msg; }
  function setDetected(msg) { detectedTag.textContent = msg; }
  function setHint(msg) { hintText.textContent = msg; }

  function escapeHtml(str) {
    return str.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function showScreen(which) {
    for (const el of [homeScreen, scanScreen]) el.classList.remove("is-active");
    which.classList.add("is-active");
  }

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
  // Level 2 article with highlight
  // -----------------------
  function l2Article({ hlTarget }) {
    const title = "Η Τάξη μας";
    const p1 = "Σήμερα μαθαίνουμε HTML!";
    const p2 = "Το HTML οργανώνει το περιεχόμενο μιας σελίδας.";
    const items = ["Τίτλος", "Παράγραφοι", "Λίστες"];
    const signature = "— Tag-it-AR";

    const block = (tag, html) => (hlTarget === tag ? `<div class="hl">${html}</div>` : html);
    const inline = (tag, html) => (hlTarget === tag ? `<span class="hl-inline">${html}</span>` : html);

    const ul = `<ul>${items.map((x, idx) => {
      if (hlTarget === "li" && idx === 0) return `<li class="hl">${x}</li>`;
      return `<li>${x}</li>`;
    }).join("")}</ul>`;

    const ol = `<ol>${items.map((x, idx) => {
      if (hlTarget === "li" && idx === 0) return `<li class="hl">${x}</li>`;
      return `<li>${x}</li>`;
    }).join("")}</ol>`;

    const pWithBr = `${p1}${inline("br", "<br>")}${p2}`;
    const hrHtml = (hlTarget === "hr") ? `<hr class="hl">` : `<hr>`;

    let headerOut = `<header><h1>${title}</h1></header>`;
    if (hlTarget === "header") headerOut = block("header", headerOut);
    if (hlTarget === "h1") headerOut = `<header>${block("h1", `<h1>${title}</h1>`)}</header>`;

    let listOut = ul;
    if (hlTarget === "ol") listOut = block("ol", ol);
    if (hlTarget === "ul") listOut = block("ul", ul);

    let mainInner = `
      <p>${p1}</p>
      <p>${p2}</p>
      ${listOut}
      ${hrHtml}
      <footer>${signature}</footer>
    `;

    if (hlTarget === "p") {
      mainInner = `
        ${block("p", `<p>${p1}</p><p>${p2}</p>`)}
        ${ul}
        ${hrHtml}
        <footer>${signature}</footer>
      `;
    }

    if (hlTarget === "br") {
      mainInner = `
        <p>${pWithBr}</p>
        ${ul}
        ${hrHtml}
        <footer>${signature}</footer>
      `;
    }

    if (hlTarget === "footer") {
      mainInner = `
        <p>${p1}</p>
        <p>${p2}</p>
        ${ul}
        ${hrHtml}
        ${block("footer", `<footer>${signature}</footer>`)}
      `;
    }

    let mainOut = `<main>${mainInner}</main>`;
    if (hlTarget === "main") mainOut = block("main", mainOut);

    const banner = `<div class="l2-banner">Highlight: &lt;${hlTarget}&gt;</div>`;
    return `${banner}<article>${headerOut}${mainOut}</article>`;
  }

  // -----------------------
  // Levels
  // -----------------------
  const LEVELS = {
    L1: {
      key: "L1",
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
      title: "Level 2 — Δομή",
      mini: "Πράσινες κάρτες: δομή πάνω σε μικρό άρθρο",
      helper: "Σκανάρισε δομικές κάρτες και δες τι μέρος του άρθρου επηρεάζουν.",
      mindFile: "./targets_level2.mind",
      contentLabel: "Άρθρο (απόδοση):",
      defaultHtml: l2Article({ hlTarget: "main" }),
      indexToTag: { 0:"h1", 1:"p", 2:"br", 3:"hr", 4:"ul", 5:"ol", 6:"li", 7:"header", 8:"main", 9:"footer" },
      hints: {
        h1: "Κύριος τίτλος.",
        p: "Παράγραφος.",
        br: "Αλλαγή γραμμής.",
        hr: "Διαχωριστικό γραμμή.",
        ul: "Λίστα με κουκκίδες.",
        ol: "Αριθμημένη λίστα.",
        li: "Στοιχείο λίστας (μπαίνει μέσα σε ul/ol).",
        header: "Κεφαλίδα (πάνω μέρος).",
        main: "Κύριο περιεχόμενο.",
        footer: "Υποσέλιδο (υπογραφή/πηγή).",
      },
      apply(tag) {
        return l2Article({ hlTarget: tag });
      },
    },
  };

  // -----------------------
  // Quiz banks (scan-to-answer)
  // -----------------------
  const QUIZ_BANK = {
    L1: [
      { prompt: "Σκάναρε την κάρτα για έντονα (basic).", answerTag: "b" },
      { prompt: "Σκάναρε την κάρτα για πλάγια.", answerTag: "i" },
      { prompt: "Σκάναρε την κάρτα για υπογράμμιση.", answerTag: "u" },
      { prompt: "Σκάναρε την κάρτα για επισήμανση (highlight).", answerTag: "mark" },
      { prompt: "Σκάναρε την κάρτα για διαγραφή.", answerTag: "del" },
      { prompt: "Σκάναρε την κάρτα για εισαγωγή/προσθήκη.", answerTag: "ins" },
      { prompt: "Σκάναρε την κάρτα για H₂O (δείκτης κάτω).", answerTag: "sub" },
      { prompt: "Σκάναρε την κάρτα για m² (δείκτης πάνω).", answerTag: "sup" },
      { prompt: "Σκάναρε την κάρτα για ‘σημαντικό’.", answerTag: "strong" },
      { prompt: "Σκάναρε την κάρτα για ‘έμφαση’.", answerTag: "em" },
    ],
    L2: [
      { prompt: "Σκάναρε την κάρτα για τίτλο άρθρου.", answerTag: "h1" },
      { prompt: "Σκάναρε την κάρτα για παράγραφο.", answerTag: "p" },
      { prompt: "Σκάναρε την κάρτα για αλλαγή γραμμής.", answerTag: "br" },
      { prompt: "Σκάναρε την κάρτα για διαχωριστικό (γραμμή).", answerTag: "hr" },
      { prompt: "Σκάναρε την κάρτα για λίστα με κουκκίδες.", answerTag: "ul" },
      { prompt: "Σκάναρε την κάρτα για αριθμημένη λίστα.", answerTag: "ol" },
      { prompt: "Σκάναρε την κάρτα για στοιχείο λίστας.", answerTag: "li" },
      { prompt: "Σκάναρε την κάρτα για κεφαλίδα.", answerTag: "header" },
      { prompt: "Σκάναρε την κάρτα για κύριο περιεχόμενο.", answerTag: "main" },
      { prompt: "Σκάναρε την κάρτα για υποσέλιδο.", answerTag: "footer" },
    ],
  };

  // -----------------------
  // AR engine state
  // -----------------------
  let currentLevel = null;
  let sceneEl = null;
  let arSystem = null;
  let isRunning = false;
  let resetTimer = null;

  // mode: "LEARN" | "QUIZ"
  let mode = "LEARN";

  // quiz state
  let quizItems = [];
  let quizIndex = 0;
  let quizScore = 0;
  let quizLock = false;

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

    s.innerHTML = `
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      <a-entity id="t0" mindar-image-target="targetIndex: 0"></a-entity>
      <a-entity id="t1" mindar-image-target="targetIndex: 1"></a-entity>
      <a-entity id="t2" mindar-image-target="targetIndex: 2"></a-entity>
      <a-entity id="t3" mindar-image-target="targetIndex: 3"></a-entity>
      <a-entity id="t4" mindar-image-target="targetIndex: 4"></a-entity>
      <a-entity id="t5" mindar-image-target="targetIndex: 5"></a-entity>
      <a-entity id="t6" mindar-image-target="targetIndex: 6"></a-entity>
      <a-entity id="t7" mindar-image-target="targetIndex: 7"></a-entity>
      <a-entity id="t8" mindar-image-target="targetIndex: 8"></a-entity>
      <a-entity id="t9" mindar-image-target="targetIndex: 9"></a-entity>
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
    for (let i = 0; i < 10; i++) {
      const e = sceneEl.querySelector(`#t${i}`);
      if (!e) continue;

      e.addEventListener("targetFound", () => {
        if (mode === "QUIZ") {
          handleQuizScan(i);
          return;
        }

        // LEARN
        clearReset();
        const tag = currentLevel.indexToTag[i];
        setDetected(`<${tag}>`);
        setHint(currentLevel.hints[tag] || "—");
        setStatus("Εντοπίστηκε κάρτα");

        const html = currentLevel.apply(tag);
        rendered.innerHTML = html;
        codeBox.innerHTML = escapeHtml(html);
      });

      e.addEventListener("targetLost", () => {
        if (mode === "QUIZ") return; // στο quiz δεν κάνουμε reset με lost
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

      if (!arSystem) { setStatus("Φόρτωση…"); return; }
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

  // -----------------------
  // Quiz logic (scan-to-answer)
  // -----------------------
  function quizHudShow() { quizHud.hidden = false; }
  function quizHudHide() { quizHud.hidden = true; }

  function quizSetUI() {
    const total = quizItems.length;
    const item = quizItems[quizIndex];
    quizQuestion.textContent = item ? item.prompt : "—";
    quizScoreEl.textContent = String(quizScore);
    quizProgressEl.textContent = `${Math.min(quizIndex + 1, total)}/${total}`;
  }

  function quizSetFeedback(msg, type) {
    // type: "neutral" | "good" | "bad"
    quizFeedback.textContent = msg;
    quizFeedback.style.borderColor =
      type === "good" ? "rgba(34,197,94,0.35)" :
      type === "bad"  ? "rgba(239,68,68,0.35)" :
                        "rgba(168,85,247,0.18)";
    quizFeedback.style.background =
      type === "good" ? "rgba(34,197,94,0.10)" :
      type === "bad"  ? "rgba(239,68,68,0.10)" :
                        "rgba(255,255,255,0.65)";
  }

  function quizStart(levelKey) {
    mode = "QUIZ";
    currentLevel = LEVELS[levelKey];
    quizItems = [...QUIZ_BANK[levelKey]];
    quizIndex = 0;
    quizScore = 0;
    quizLock = false;

    // UI titles
    topSubtitle.textContent = `Quiz — ${levelKey === "L1" ? "Μπλε" : "Πράσινες"}`;
    scanTitle.textContent = `Quiz — ${levelKey === "L1" ? "Μπλε κάρτες" : "Πράσινες κάρτες"}`;
    scanMini.textContent = "Απάντησε σκανάροντας την σωστή κάρτα.";
    helperText.textContent = "Πάτα «Έναρξη» και σκάναρε την κάρτα που απαντά σωστά στην ερώτηση.";

    // rendered styling
    rendered.classList.toggle("level2", levelKey === "L2");

    // quiz HUD
    quizHudShow();
    quizSetUI();
    quizSetFeedback("Σκάναρε την σωστή κάρτα.", "neutral");

    // “result” panel: δεν δείχνουμε output ως μάθημα, αλλά μπορούμε να δείχνουμε hint/output
    contentLabel.textContent = "Οθόνη Quiz:";
    rendered.innerHTML = `<p>Στόχος: <strong>Σκάναρε την σωστή κάρτα</strong>.</p>`;
    codeBox.innerHTML = escapeHtml("<p>Quiz mode</p>");

    // build scene with correct mind file
    showScreen(scanScreen);
    startBtn.disabled = true;
    stopBtn.disabled = true;
    setStatus("Φόρτωση…");
    setDetected("—");
    setHint("—");
    buildScene(currentLevel.mindFile);
  }

  function quizFinish() {
    quizSetFeedback(`Τέλος! Σκορ: ${quizScore}/${quizItems.length}.`, "good");
    setStatus("Quiz ολοκληρώθηκε");
    // Μικρή “οθόνη αποτελέσματος” στο panel
    rendered.innerHTML = `
      <p><strong>Τέλος! 🎉</strong></p>
      <p>Σκορ: <strong>${quizScore}</strong> / ${quizItems.length}</p>
      <p>Πάτα «⬅ Αρχική» για να συνεχίσεις.</p>
    `;
    codeBox.innerHTML = escapeHtml(`<p>Score: ${quizScore}/${quizItems.length}</p>`);
  }

  function handleQuizScan(targetIndex) {
    if (quizLock) return;
    if (quizIndex >= quizItems.length) return;

    const scannedTag = currentLevel.indexToTag[targetIndex];
    const expected = quizItems[quizIndex].answerTag;

    setDetected(`<${scannedTag}>`);
    setHint(currentLevel.hints[scannedTag] || "—");

    if (scannedTag === expected) {
      quizScore++;
      quizSetFeedback(`✅ Σωστό! Αυτό είναι <${scannedTag}>.`, "good");
      quizScoreEl.textContent = String(quizScore);
      setStatus("Σωστό");

      // προχωράμε στην επόμενη ερώτηση
      quizIndex++;
      if (quizIndex >= quizItems.length) {
        quizProgressEl.textContent = `${quizItems.length}/${quizItems.length}`;
        quizFinish();
        return;
      }
      quizSetUI();
    } else {
      quizSetFeedback(`❌ Όχι. Αυτό είναι <${scannedTag}>. Δοκίμασε ξανά.`, "bad");
      setStatus("Λάθος");

      // μικρό lock για να μην “τρέχει” με πολλά scans
      quizLock = true;
      setTimeout(() => { quizLock = false; }, QUIZ_LOCK_MS);
    }
  }

  // -----------------------
  // Learn mode enter
  // -----------------------
  function enterLearn(levelKey) {
    mode = "LEARN";
    quizHudHide();

    currentLevel = LEVELS[levelKey];

    topSubtitle.textContent = currentLevel.title;
    scanTitle.textContent = currentLevel.title;
    scanMini.textContent = currentLevel.mini;
    helperText.textContent = currentLevel.helper;

    rendered.classList.toggle("level2", levelKey === "L2");

    showScreen(scanScreen);

    startBtn.disabled = true;
    stopBtn.disabled = true;
    setStatus("Φόρτωση…");
    setDetected("—");
    setHint("—");

    buildScene(currentLevel.mindFile);

    rendered.innerHTML = currentLevel.defaultHtml;
    codeBox.innerHTML = escapeHtml(currentLevel.defaultHtml);
    contentLabel.textContent = currentLevel.contentLabel;
  }

  function enterHome() {
    mode = "LEARN";
    quizHudHide();
    stopAR();
    destroyScene();
    rendered.classList.remove("level2");
    topSubtitle.textContent = "Μάθε HTML με κάρτες AR.";
    showScreen(homeScreen);
  }

  // -----------------------
  // Orientation behavior
  // -----------------------
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
  // Wiring UI
  // -----------------------
  goL1.addEventListener("click", () => enterLearn("L1"));
  goL2.addEventListener("click", () => enterLearn("L2"));

  goQuizL1.addEventListener("click", () => quizStart("L1"));
  goQuizL2.addEventListener("click", () => quizStart("L2"));

  backHomeFromScan.addEventListener("click", enterHome);

  startBtn.addEventListener("click", startAR);
  stopBtn.addEventListener("click", () => {
    stopAR();
    if (mode === "LEARN") {
      setDefaultContent();
      setStatus("Σταμάτησε");
    } else {
      setStatus("Σταμάτησε (Quiz)");
      quizSetFeedback("Πάτα «Έναρξη» για να συνεχίσεις το Quiz.", "neutral");
    }
  });

  // Initial state
  showScreen(homeScreen);
});
