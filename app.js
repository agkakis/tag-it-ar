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
      helper: "Σκανάρισε δομικές κάρτες για να οργανώσεις το “Η Τάξη μας”.",
      mindFile: "./targets_level2.mind",
      contentLabel: "Μικρό άρθρο (απόδοση):",
      defaultHtml: [
        "<article>",
        "<header><h1>Η Τάξη μας</h1></header>",
        "<main>",
        "<p>Σήμερα μαθαίνουμε HTML!</p>",
        "<p>Το HTML οργανώνει το περιεχόμενο μιας σελίδας.</p>",
        "<ul><li>Τίτλος</li><li>Παράγραφοι</li><li>Λίστες</li></ul>",
        "<hr>",
        "<footer>— Tag-it-AR</footer>",
        "</main>",
        "</article>"
      ].join(""),
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
        const title = "Η Τάξη μας";
        const p1 = "Σήμερα μαθαίνουμε HTML!";
        const p2 = "Το HTML οργανώνει το περιεχόμενο μιας σελίδας.";
        const items = ["Τίτλος", "Παράγραφοι", "Λίστες"];
        const signature = "— Tag-it-AR";

        const ul = `<ul>${items.map(x => `<li>${x}</li>`).join("")}</ul>`;
        const ol = `<ol>${items.map(x => `<li>${x}</li>`).join("")}</ol>`;

        const box = (label, inner) =>
          `<section class="l2-box">
            <div class="l2-box__label">${label}</div>
            ${inner}
          </section>`;

        switch (tag) {
          case "h1":
            return box("Κύριος τίτλος (<h1>)", `<h1>${title}</h1>`)
              + box("Υπόλοιπο", `<p>${p1}</p><p>${p2}</p>${ul}<hr><footer>${signature}</footer>`);
          case "p":
            return box("Παράγραφοι (<p>)", `<p>${p1}</p><p>${p2}</p>`)
              + box("Λίστα + υπογραφή", `${ul}<hr><footer>${signature}</footer>`);
          case "br":
            return box("Αλλαγή γραμμής (<br>)", `${p1}<br>${p2}`)
              + box("Λίστα + υπογραφή", `${ul}<hr><footer>${signature}</footer>`);
          case "hr":
            return box("Διαχωριστικό (<hr>)", `<p>${p1}</p><p>${p2}</p><hr><footer>${signature}</footer>`)
              + box("Λίστα", `${ul}`);
          case "ul":
            return box("Λίστα κουκκίδων (<ul>)", ul)
              + box("Κείμενο", `<p>${p1}</p><p>${p2}</p>`);
          case "ol":
            return box("Αριθμημένη λίστα (<ol>)", ol)
              + box("Κείμενο", `<p>${p1}</p><p>${p2}</p>`);
          case "li":
            return box("Στοιχείο λίστας (<li>)", `<ul><li>${items[0]}</li></ul>`)
              + `<div class="l2-note">
                   Το <strong>&lt;li&gt;</strong> μπαίνει μέσα σε <strong>&lt;ul&gt;</strong> ή <strong>&lt;ol&gt;</strong> 🙂
                 </div>`;
          case "header":
            return box("Κεφαλίδα (<header>)", `<header><h1>${title}</h1></header>`)
              + box("Κύριο περιεχόμενο", `<p>${p1}</p><p>${p2}</p>${ul}<hr><footer>${signature}</footer>`);
          case "main":
            return box("Κύριο περιεχόμενο (<main>)", `<main><p>${p1}</p><p>${p2}</p>${ul}<hr><footer>${signature}</footer></main>`)
              + box("Τίτλος", `<h1>${title}</h1>`);
          case "footer":
            return box("Υποσέλιδο (<footer>)", `<footer>${signature}</footer>`)
              + box("Υπόλοιπο", `<h1>${title}</h1><p>${p1}</p><p>${p2}</p>${ul}<hr>`);
          default:
            return LEVELS.L2.defaultHtml;
        }
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
  // Quiz (ίδιο όπως πριν)
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

  // Wiring UI
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

