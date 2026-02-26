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
  const codeWrap = document.getElementById("codeWrap");

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

  function hideCode() { codeWrap?.classList.add("is-hidden"); }
  function showCode() { codeWrap?.classList.remove("is-hidden"); }

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

  function showOverlay() { overlay.classList.add("is-visible"); }
  function hideOverlay() { overlay.classList.remove("is-visible"); }

  function handleOrientation() {
    if (!overlay) return;
    if (isPortrait()) hideOverlay();
    else showOverlay();
  }

  // -----------------------
  // Levels
  // -----------------------
  const LEVELS = {
    L1: {
      key: "L1",
      title: "Level 1",
      subtitle: "Μορφοποίηση κειμένου (μπλε κάρτες)",
      mindFile: "level-1.mind",
      numTargets: 12,
      contentLabel: "Αποτέλεσμα:",
      defaultHtml: "Hello World!",
      indexToTag: {
        0: "i",
        1: "b",
        2: "u",
        3: "h1",
        4: "strong",
        5: "em",
        6: "ins",
        7: "sub",
        8: "sup",
        9: "del",
        10: "code",
        11: "kbd",
      },
      hints: {
        i: "Πλάγια γραφή με <i>…</i>",
        b: "Έντονη γραφή με <b>…</b>",
        u: "Υπογράμμιση με <u>…</u>",
        h1: "Επικεφαλίδα με <h1>…</h1>",
        strong: "Σημαντική έντονη έμφαση με <strong>…</strong>",
        em: "Έμφαση με <em>…</em>",
        ins: "Εισαγωγή/προσθήκη με <ins>…</ins>",
        sub: "Δείκτης κάτω με <sub>…</sub>",
        sup: "Δείκτης πάνω με <sup>…</sup>",
        del: "Διαγραφή με <del>…</del>",
        code: "Κώδικας inline με <code>…</code>",
        kbd: "Πλήκτρο/συντόμευση με <kbd>…</kbd>",
      },
      apply(tag) {
        const t = "Hello World!";
        switch (tag) {
          case "i": return `<i>${t}</i>`;
          case "b": return `<b>${t}</b>`;
          case "u": return `<u>${t}</u>`;
          case "h1": return `<h1>${t}</h1>`;
          case "strong": return `<strong>${t}</strong>`;
          case "em": return `<em>${t}</em>`;
          case "ins": return `<ins>${t}</ins>`;
          case "sub": return `H<sub>2</sub>O`;
          case "sup": return `x<sup>2</sup>`;
          case "del": return `<del>${t}</del>`;
          case "code": return `<code>${t}</code>`;
          case "kbd": return `Πάτα <kbd>Ctrl</kbd> + <kbd>S</kbd>`;
          default: return t;
        }
      },
    },

    L2: {
      key: "L2",
      title: "Level 2",
      subtitle: "Δομή κειμένου (πράσινες κάρτες)",
      mindFile: "level-2.mind",
      numTargets: 6,
      contentLabel: "Αποτέλεσμα:",
      defaultHtml:
        `Η πρώτη μου ιστοσελίδα! Αυτή είναι η πρώτη μου ιστοσελίδα και περιέχει: Κείμενα, εικόνες και ήχους.`,
      indexToTag: {
        0: "h1",
        1: "p",
        2: "br",
        3: "hr",
        4: "ul",
        5: "ol",
      },
      hints: {
        h1: "Τίτλος σε <h1>…</h1>",
        p: "Παράγραφος με <p>…</p>",
        br: "Αλλαγή γραμμής με <br>",
        hr: "Οριζόντια γραμμή με <hr>",
        ul: "Λίστα χωρίς αρίθμηση με <ul><li>…</li></ul>",
        ol: "Λίστα με αρίθμηση με <ol><li>…</li></ol>",
      },
      apply(tag) {
        const title = "Η πρώτη μου ιστοσελίδα!";
        const sentenceA = "Αυτή είναι η πρώτη μου ιστοσελίδα";
        const sentenceB = "και περιέχαει:";
        const items = ["Κείμενα", "εικόνες", "ήχους"];

        // helper to wrap focus
        const focus = (html) => `<div class="l2-focus">${html}</div>`;

        const titleBlock =
          tag === "h1" ? focus(`<h1>${title}</h1>`) : `<div>${title}</div>`;

        const hrBlock =
          tag === "hr" ? focus(`<hr>`) : ``;

        let sentenceBlock = "";
        let listBlock = "";

        if (tag === "br") {
          sentenceBlock = focus(
            `${sentenceA} ${sentenceB}<br>${items[0]}<br>${items[1]}<br>${items[2]}`
          );
          listBlock = "";
        } else {
          sentenceBlock =
            tag === "p"
              ? focus(`<p>${sentenceA} ${sentenceB}</p>`)
              : `<div>${sentenceA} ${sentenceB}</div>`;

          if (tag === "ul") {
            listBlock = focus(`<ul>${items.map(x => `<li>${x}</li>`).join("")}</ul>`);
          } else if (tag === "ol") {
            listBlock = focus(`<ol>${items.map(x => `<li>${x}</li>`).join("")}</ol>`);
          } else {
            listBlock = `<div>${items[0]}, ${items[1]} και ${items[2]}.</div>`;
          }
        }

        return `
          <div class="l2-root">
            ${titleBlock}
            ${hrBlock}
            ${sentenceBlock}
            ${listBlock}
          </div>
        `.trim();
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

    // στο L2 κρύβουμε τον κώδικα μόνιμα
    if (currentLevel.key === "L2") hideCode();
    else showCode();
  }

  function stopMindarCameraTracks() {
    try {
      const video = sceneEl?.querySelector("video");
      const stream = video?.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(t => t.stop());
      }
    } catch (_) {}
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
    s.setAttribute("renderer", "colorManagement: true; physicallyCorrectLights: true");
    s.setAttribute("vr-mode-ui", "enabled: false");
    s.setAttribute("device-orientation-permission-ui", "enabled: false");
    s.setAttribute(
      "mindar-image",
      `imageTargetSrc: ${mindFile}; autoStart: true; uiLoading: no; uiError: no; uiScanning: no;`
    );

    // camera
    const cam = document.createElement("a-camera");
    cam.setAttribute("position", "0 0 0");
    cam.setAttribute("look-controls", "enabled: false");
    s.appendChild(cam);

    // targets
    const n = currentLevel?.numTargets ?? 10;
    for (let i = 0; i < n; i++) {
      const t = document.createElement("a-entity");
      t.setAttribute("id", `t${i}`);
      t.setAttribute("mindar-image-target", `targetIndex: ${i}`);
      s.appendChild(t);
    }

    arWrap.innerHTML = "";
    arWrap.appendChild(s);

    sceneEl = s;
    return s;
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

        // στο L2 το παράθυρο κώδικα μένει κρυφό (ακόμα και όταν βρίσκει κάρτα)
        if (currentLevel.key === "L2") hideCode();

        const html = currentLevel.apply(tag);
        rendered.innerHTML = html;

        // ενημερώνουμε το codeBox (δεν φαίνεται στο L2, αλλά δεν πειράζει)
        codeBox.innerHTML = escapeHtml(html);
      });

      e.addEventListener("targetLost", () => {
        setStatus("Η κάρτα χάθηκε – επιστροφή σε 2s…");
        scheduleReset();
      });
    }
  }

  async function warmupCameraOnce() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach(t => t.stop());
  }

  async function startAR() {
    if (isRunning) return;
    isRunning = true;

    setStatus("Άνοιγμα κάμερας…");
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // scene
    buildScene(currentLevel.mindFile);

    // after scene is in DOM
    setTimeout(() => {
      try {
        arSystem = sceneEl.systems["mindar-image-system"];
        wireTargets();
        setStatus("Σάρωση ενεργή.");
      } catch (_) {
        setStatus("Σφάλμα εκκίνησης AR.");
      }
    }, 0);
  }

  // -----------------------
  // Quiz (basic demo)
  // -----------------------
  const QUIZ = [
    { q: "Ποιο tag δημιουργεί κύρια επικεφαλίδα;", a: ["<p>", "<h1>", "<br>", "<hr>"], c: 1 },
    { q: "Ποιο tag κάνει αλλαγή γραμμής;", a: ["<br>", "<ul>", "<em>", "<sub>"], c: 0 },
    { q: "Ποιο tag φτιάχνει λίστα με αρίθμηση;", a: ["<ul>", "<ol>", "<li>", "<strong>"], c: 1 },
  ];

  function renderQuiz() {
    quizBox.innerHTML = "";
    const form = document.createElement("form");
    form.className = "quiz-form";

    QUIZ.forEach((item, i) => {
      const block = document.createElement("div");
      block.className = "quiz-q";

      const h = document.createElement("h3");
      h.textContent = `${i + 1}. ${item.q}`;
      block.appendChild(h);

      item.a.forEach((opt, oi) => {
        const label = document.createElement("label");
        label.className = "quiz-opt";

        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${i}`;
        input.value = String(oi);

        const span = document.createElement("span");
        span.textContent = opt;

        label.appendChild(input);
        label.appendChild(span);
        block.appendChild(label);
      });

      form.appendChild(block);
    });

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Υποβολή";
    form.appendChild(submit);

    const out = document.createElement("div");
    out.className = "quiz-score";
    form.appendChild(out);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let score = 0;
      QUIZ.forEach((item, i) => {
        const chosen = form.querySelector(`input[name="q${i}"]:checked`);
        if (!chosen) return;
        if (Number(chosen.value) === item.c) score++;
      });
      out.textContent = `Σκορ: ${score}/${QUIZ.length}`;
    });

    quizBox.appendChild(form);
  }

  // -----------------------
  // Navigation actions
  // -----------------------
  goL1.addEventListener("click", () => {
    currentLevel = LEVELS.L1;
    scanTitle.textContent = "Level 1 — Σάρωση";
    scanMini.textContent = currentLevel.subtitle;
    helperText.textContent = "Σκανάρισε μια κάρτα για να δεις την επίδραση στο κείμενο.";
    topSubtitle.textContent = "Level 1";

    showScreen(scanScreen);
    setDefaultContent();
  });

  goL2.addEventListener("click", () => {
    currentLevel = LEVELS.L2;
    scanTitle.textContent = "Level 2 — Σάρωση";
    scanMini.textContent = currentLevel.subtitle;
    helperText.textContent = "Σκανάρισε μια κάρτα για να δεις τη δομή στο ίδιο κείμενο.";
    topSubtitle.textContent = "Level 2";

    showScreen(scanScreen);
    setDefaultContent();
  });

  goQuiz.addEventListener("click", () => {
    topSubtitle.textContent = "Quiz";
    showScreen(quizScreen);
    renderQuiz();
  });

  backHomeFromScan.addEventListener("click", () => {
    destroyScene();
    topSubtitle.textContent = "Σκανάρισε…";
    showScreen(homeScreen);
  });

  backHomeFromQuiz.addEventListener("click", () => {
    topSubtitle.textContent = "Σκανάρισε…";
    showScreen(homeScreen);
  });

  startBtn.addEventListener("click", async () => {
    try {
      // warmup (helps on iOS sometimes)
      await warmupCameraOnce();
    } catch (_) {
      // ignore
    }
    startAR();
  });

  stopBtn.addEventListener("click", () => {
    destroyScene();
    setStatus("Σταμάτησε.");
  });

  // -----------------------
  // Init
  // -----------------------
  handleOrientation();
  window.addEventListener("resize", handleOrientation);
  window.addEventListener("orientationchange", handleOrientation);

  stopBtn.disabled = true;
  showScreen(homeScreen);

  // default L1 selection is not forced; wait for user
});
