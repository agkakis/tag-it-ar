document.addEventListener("DOMContentLoaded", () => {
  // Device gating
  const desktopOverlay = document.getElementById("desktopOverlay");
  const portraitOverlay = document.getElementById("portraitOverlay");
  const appRoot = document.getElementById("appRoot");

  function isMobileDevice() {
    const ua = navigator.userAgent || navigator.vendor || window.opera || "";
    const mobileUA =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    const noHover = window.matchMedia("(hover: none)").matches;
    const narrowScreen = window.innerWidth <= 1024;

    return mobileUA || (coarsePointer && noHover && narrowScreen);
  }

  function showDesktopOverlay() {
    desktopOverlay.classList.add("is-visible");
    appRoot.classList.add("is-hidden");
    portraitOverlay.classList.remove("is-visible");
  }

  function hideDesktopOverlay() {
    desktopOverlay.classList.remove("is-visible");
    appRoot.classList.remove("is-hidden");
  }

  function isSupportedMobile() {
    return isMobileDevice();
  }

  if (!isSupportedMobile()) {
    showDesktopOverlay();
    return;
  }

  hideDesktopOverlay();

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
  const codeWrap = document.getElementById("codeWrap");

  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");

  // Quiz UI
  const quizBox = document.getElementById("quizBox");

  const RESET_DELAY_MS = 2000;

  function setStatus(msg) {
    statusText.textContent = msg;
  }

  function setDetected(msg) {
    detectedTag.textContent = msg;
  }

  function setHint(msg) {
    hintText.textContent = msg;
  }

  function hideCode() {
    codeWrap?.classList.add("is-hidden");
  }

  function showCode() {
    codeWrap?.classList.remove("is-hidden");
  }

  function escapeHtml(str) {
    return str.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function showScreen(which) {
    for (const el of [homeScreen, scanScreen, quizScreen]) {
      el.classList.remove("is-active");
    }
    which.classList.add("is-active");
  }

  function isPortrait() {
    return window.innerHeight >= window.innerWidth;
  }

  function showOverlay() {
    portraitOverlay.classList.add("is-visible");
  }

  function hideOverlay() {
    portraitOverlay.classList.remove("is-visible");
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
    if (!res.ok) {
      throw new Error(`${path} HTTP ${res.status} (λείπει ή λάθος όνομα)`);
    }
  }

  const LEVEL2_TEXT =
    "Η πρώτη μου ιστοσελίδα! Αυτή είναι η πρώτη μου ιστοσελίδα και περιέχει: Κείμενα, εικόνες και ήχους.";

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
      mini: "Πράσινες κάρτες: εφαρμογή 1 κανόνα στο ίδιο κείμενο",
      helper: "Κάθε κάρτα εφαρμόζει ένα tag στο ίδιο κείμενο (χωρίς before/after).",
      mindFile: "./targets_level2.mind",
      contentLabel: "Κείμενο (με επίδραση):",
      indexToTag: { 0: "h1", 1: "p", 2: "br", 3: "hr", 4: "ul", 5: "ol" },
      hints: {
        h1: "Κύριος τίτλος: ξεχωρίζει το θέμα της σελίδας.",
        p: "Παράγραφος: ομαδοποιεί προτάσεις και δίνει spacing.",
        br: "Αλλαγή γραμμής: εδώ τη χρησιμοποιούμε σαν ‘λίστα’ με γραμμές.",
        hr: "Οπτικός διαχωριστής ενότητας.",
        ul: "Λίστα bullets (απλή απαρίθμηση).",
        ol: "Αριθμημένη λίστα (σειρά/βήματα).",
      },
      defaultHtml: `<div>${LEVEL2_TEXT}</div>`,
      apply(tag) {
        const title = "Η πρώτη μου ιστοσελίδα!";
        const sentenceA = "Αυτή είναι η πρώτη μου ιστοσελίδα";
        const sentenceB = "και περιέχει:";
        const items = ["Κείμενα", "εικόνες", "ήχους"];

        const focus = (name) => (name === tag ? "l2-focus" : "");

        const titleBlock =
          tag === "h1"
            ? `<h1 class="${focus("h1")}">${title}</h1>`
            : `<div class="${focus("h1")}">${title}</div>`;

        const hrBlock =
          tag === "hr"
            ? `<div class="${focus("hr")}"><hr></div>`
            : ``;

        let sentenceBlock = "";
        let listBlock = "";

        if (tag === "br") {
          sentenceBlock = `
            <div class="l2-focus">
              ${sentenceA} ${sentenceB}<br>
              ${items[0]}<br>
              ${items[1]}<br>
              ${items[2]}
            </div>
          `.trim();
          listBlock = "";
        } else {
          const sentenceClass = tag === "p" ? "l2-focus" : "";
          sentenceBlock =
            tag === "p"
              ? `<p class="${sentenceClass}">${sentenceA} ${sentenceB}</p>`
              : `<div class="${sentenceClass}">${sentenceA} ${sentenceB}</div>`;

          if (tag === "ul") {
            listBlock = `<ul class="${focus("ul")}">${items
              .map((x) => `<li>${x}</li>`)
              .join("")}</ul>`;
          } else if (tag === "ol") {
            listBlock = `<ol class="${focus("ol")}">${items
              .map((x) => `<li>${x}</li>`)
              .join("")}</ol>`;
          } else {
            listBlock = `<div>${items[0]}, ${items[1]} και ${items[2]}.</div>`;
          }
        }

        return `
          <div>
            ${titleBlock}
            ${hrBlock}
            ${sentenceBlock}
            ${listBlock}
          </div>
        `.trim();
      },
    },
  };

  let currentLevel = null;
  let sceneEl = null;
  let arSystem = null;
  let isRunning = false;
  let resetTimer = null;
  let mindarUiObserver = null;

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

    if (currentLevel.key === "L2") hideCode();
    else showCode();
  }

  function removeMindARScannerUI() {
    const selectors = [
      ".mindar-ui-overlay",
      ".mindar-ui-scanning",
      ".mindar-ui-loading",
      ".mindar-ui-compatibility",
      "[class*='mindar-ui']",
      "[id*='mindar-ui']",
    ];

    selectors.forEach((selector) => {
      const nodes = document.querySelectorAll(selector);
      nodes.forEach((node) => node.remove());
    });
  }

  function startMindARUiBlocker() {
    stopMindARUiBlocker();
    removeMindARScannerUI();

    mindarUiObserver = new MutationObserver(() => {
      removeMindARScannerUI();
    });

    mindarUiObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function stopMindARUiBlocker() {
    if (mindarUiObserver) {
      mindarUiObserver.disconnect();
      mindarUiObserver = null;
    }
  }

  function findMindarStreamVideo() {
    const vids = Array.from(arWrap.querySelectorAll("video"));
    return vids.find((v) => v.srcObject instanceof MediaStream) || null;
  }

  function stopMindarCameraTracks() {
    const v = findMindarStreamVideo();
    const stream = v?.srcObject;

    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((t) => t.stop());
      v.srcObject = null;
      return true;
    }

    return false;
  }

  function stopAR() {
    try {
      stopMindARUiBlocker();

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

    removeMindARScannerUI();
  }

  function buildScene(mindFile) {
    destroyScene();

    const s = document.createElement("a-scene");
    s.setAttribute("embedded", "");
    s.setAttribute("vr-mode-ui", "enabled: false");
    s.setAttribute("device-orientation-permission-ui", "enabled: false");
    s.setAttribute("renderer", "colorManagement: true, physicallyCorrectLights");
    s.setAttribute("mindar-image", `imageTargetSrc: ${mindFile}; autoStart: false;`);

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
      removeMindARScannerUI();

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

        if (currentLevel.key === "L2") showCode();

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
      audio: false,
    });
    stream.getTracks().forEach((t) => t.stop());
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

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Η συσκευή δεν υποστηρίζει κάμερα (getUserMedia).");
      }

      setStatus("Ζητάω άδεια κάμερας…");
      await warmupCameraOnce();

      setStatus("Ξεκινάω σάρωση…");

      startMindARUiBlocker();
      arSystem.start();
      isRunning = true;

      startBtn.disabled = true;
      stopBtn.disabled = false;

      setTimeout(() => {
        if (!isRunning) return;

        removeMindARScannerUI();

        const v = findMindarStreamVideo();
        if (v) {
          v.style.display = "block";
          v.style.opacity = "1";
          v.style.visibility = "visible";
        }

        setStatus("Σάρωση ενεργή");
      }, 600);

      setTimeout(removeMindARScannerUI, 50);
      setTimeout(removeMindARScannerUI, 300);
      setTimeout(removeMindARScannerUI, 1000);
    } catch (e) {
      console.error(e);

      stopMindARUiBlocker();
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

    if (currentLevel.key === "L2") hideCode();
    else showCode();

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
    stopAR();
    destroyScene();
    topSubtitle.textContent = "Μάθε HTML με κάρτες AR!";
    showScreen(homeScreen);
  }

  function handleOrientationChange() {
    if (!isSupportedMobile()) {
      showDesktopOverlay();
      return;
    }

    hideDesktopOverlay();
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

  const QUIZ = [
    { q: "Τι κάνει το <b>;", a: ["Πλάγια γράμματα", "Έντονα γράμματα", "Υπογράμμιση"], correct: 1 },
    { q: "Τι κάνει το <i>;", a: ["Πλάγια γράμματα", "Διαγραφή", "Highlight"], correct: 0 },
    { q: "Τι κάνει το <u>;", a: ["Υπογράμμιση", "Τίτλο", "Λίστα"], correct: 0 },
    { q: "Τι κάνει το <mark>;", a: ["Σημαντικό", "Επισήμανση (highlight)", "Νέα γραμμή"], correct: 1 },
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
        ${item.a
          .map(
            (txt, idx) =>
              `<button class="answer-btn" type="button" data-idx="${idx}">${escapeHtml(txt)}</button>`
          )
          .join("")}
      </div>
      <div class="quiz-footer">
        <div><strong>Σκορ:</strong> ${quizScore}</div>
        <div><strong>Πρόοδος:</strong> ${quizIndex + 1}/${QUIZ.length}</div>
      </div>
    `;

    quizLocked = false;

    const buttons = quizBox.querySelectorAll(".answer-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (quizLocked) return;
        quizLocked = true;

        const idx = Number(btn.getAttribute("data-idx"));
        const correct = item.correct;

        buttons.forEach((b) => {
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
              quizIndex = 0;
              quizScore = 0;
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

  showScreen(homeScreen);
});
