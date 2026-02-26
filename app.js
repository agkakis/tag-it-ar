/* app.js — Tag-it-AR
   - 3 sections: Home / Scan / Quiz
   - MindAR + A-Frame scene is injected dynamically in #arWrap when scanning starts
   - Level 2 "code view" hides helper div wrappers via applyCode()
*/

(() => {
  "use strict";

  // -----------------------------
  // Helpers
  // -----------------------------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function show(el) { el?.classList.remove("hidden"); }
  function hide(el) { el?.classList.add("hidden"); }

  function setText(el, txt) { if (el) el.textContent = txt; }
  function setHTML(el, html) { if (el) el.innerHTML = html; }

  // -----------------------------
  // DOM
  // -----------------------------
  const homeSection = $("#home");
  const scanSection = $("#scan");
  const quizSection = $("#quiz");

  const btnHome = $("#btnHome");
  const btnBackHome = $("#btnBackHome");
  const btnDark = $("#btnDark");

  const btnGoL1 = $("#btnGoL1");
  const btnGoL2 = $("#btnGoL2");
  const btnGoQuiz = $("#btnGoQuiz");

  const scanTitle = $("#scanTitle");
  const scanSubtitle = $("#scanSubtitle");

  const statusBox = $("#statusBox");
  const statusText = $("#statusText");
  const hintText = $("#hintText");

  const btnStart = $("#btnStart");
  const btnStop = $("#btnStop");

  const arWrap = $("#arWrap");
  const rendered = $("#rendered");
  const codeBox = $("#codeBox");

  const quizContainer = $("#quizContainer");
  const quizScore = $("#quizScore");

  // Portrait overlay (optional)
  const rotateOverlay = $("#rotateOverlay");

  // -----------------------------
  // State
  // -----------------------------
  const state = {
    currentMode: "home", // home | scan | quiz
    currentLevelKey: null, // L1 | L2
    isScanning: false,
    sceneEl: null,
    foundTimer: null,
    lastTargetIndex: -1
  };

  // -----------------------------
  // Levels definition
  // -----------------------------
  const levels = {
    L1: {
      key: "L1",
      title: "Level 1",
      subtitle: "Μορφοποίηση κειμένου (μπλε κάρτες)",
      mindFile: "level-1.mind", // change to your path
      // Map target index -> tag key
      targets: [
        "i", "b", "u", "h1", "strong", "em", "ins",
        "sub", "sup", "del", "code", "kbd"
      ],
      baseText: "Hello World!",
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
        kbd: "Πλήκτρο/συντόμευση με <kbd>…</kbd>"
      },
      apply(tag) {
        const t = this.baseText;
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
      }
    },

    L2: {
      key: "L2",
      title: "Level 2",
      subtitle: "Δομή κειμένου (πράσινες κάρτες)",
      mindFile: "level-2.mind", // change to your path
      targets: ["h1", "p", "br", "hr", "ul", "ol"],
      hints: {
        h1: "Τίτλος σε <h1>…</h1>",
        p: "Παράγραφος με <p>…</p>",
        br: "Αλλαγή γραμμής με <br>",
        hr: "Οριζόντια γραμμή με <hr>",
        ul: "Λίστα χωρίς αρίθμηση με <ul><li>…</li></ul>",
        ol: "Λίστα με αρίθμηση με <ol><li>…</li></ol>"
      },

      // Rendered HTML (με wrappers για highlight)
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
          // sentence + "list" as line breaks
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

        // outer wrapper exists only for layout grouping
        return `<div class="l2-root">${titleBlock}${hrBlock}${sentenceBlock}${listBlock}</div>`;
      },

      // Code HTML (ΧΩΡΙΣ wrappers div)
      applyCode(tag) {
        const title = "Η πρώτη μου ιστοσελίδα!";
        const sentenceA = "Αυτή είναι η πρώτη μου ιστοσελίδα";
        const sentenceB = "και περιέχαει:";
        const items = ["Κείμενα", "εικόνες", "ήχους"];

        const titleBlock =
          tag === "h1" ? `<h1>${title}</h1>` : `${title}`;

        const hrBlock = tag === "hr" ? `<hr>` : ``;

        let sentenceBlock = "";
        let listBlock = "";

        if (tag === "br") {
          sentenceBlock = `
${sentenceA} ${sentenceB}<br>
${items[0]}<br>
${items[1]}<br>
${items[2]}
          `.trim();
          listBlock = "";
        } else {
          sentenceBlock =
            tag === "p"
              ? `<p>${sentenceA} ${sentenceB}</p>`
              : `${sentenceA} ${sentenceB}`;

          if (tag === "ul") {
            listBlock = `<ul>${items.map(x => `<li>${x}</li>`).join("")}</ul>`;
          } else if (tag === "ol") {
            listBlock = `<ol>${items.map(x => `<li>${x}</li>`).join("")}</ol>`;
          } else {
            listBlock = `${items[0]}, ${items[1]} και ${items[2]}.`;
          }
        }

        return [titleBlock, hrBlock, sentenceBlock, listBlock].filter(Boolean).join("\n");
      }
    }
  };

  // -----------------------------
  // Quiz (simple)
  // -----------------------------
  const quizData = [
    {
      q: "Ποιο tag δημιουργεί κύρια επικεφαλίδα;",
      a: ["<p>", "<h1>", "<br>", "<hr>"],
      correct: 1
    },
    {
      q: "Ποιο tag κάνει αλλαγή γραμμής;",
      a: ["<br>", "<ul>", "<em>", "<sub>"],
      correct: 0
    },
    {
      q: "Ποιο tag φτιάχνει λίστα με αρίθμηση;",
      a: ["<ul>", "<ol>", "<li>", "<strong>"],
      correct: 1
    }
  ];

  // -----------------------------
  // Navigation
  // -----------------------------
  function go(mode) {
    state.currentMode = mode;

    if (mode !== "scan" && state.isScanning) stopScanning();

    hide(homeSection);
    hide(scanSection);
    hide(quizSection);

    if (mode === "home") show(homeSection);
    if (mode === "scan") show(scanSection);
    if (mode === "quiz") show(quizSection);
  }

  // -----------------------------
  // MindAR scene injection
  // -----------------------------
  function buildSceneHtml(mindFile, targetsCount) {
    // We create a <a-scene> with MindAR image system.
    // NOTE: Requires external libs in index.html (A-Frame + MindAR)
    const targets = Array.from({ length: targetsCount }, (_, i) => {
      // Empty entities that only emit targetFound/targetLost
      return `
        <a-entity mindar-image-target="targetIndex: ${i}" id="target-${i}">
          <a-entity position="0 0 0"></a-entity>
        </a-entity>
      `;
    }).join("");

    return `
      <a-scene
        embedded
        renderer="colorManagement: true; physicallyCorrectLights: true"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        mindar-image="imageTargetSrc: ${mindFile}; autoStart: true; uiLoading: no; uiError: no; uiScanning: no;"
      >
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
        ${targets}
      </a-scene>
    `;
  }

  function attachTargetListeners(level) {
    for (let i = 0; i < level.targets.length; i++) {
      const tEl = $(`#target-${i}`, state.sceneEl);
      if (!tEl) continue;

      tEl.addEventListener("targetFound", () => onTargetFound(level, i));
      tEl.addEventListener("targetLost", () => onTargetLost(level, i));
    }
  }

  // -----------------------------
  // Target handling
  // -----------------------------
  function onTargetFound(level, idx) {
    state.lastTargetIndex = idx;
    clearTimeout(state.foundTimer);

    const tag = level.targets[idx] ?? null;
    if (!tag) return;

    setText(statusText, `Αναγνωρίστηκε: <${tag}>`);
    setText(hintText, level.hints?.[tag] ?? "");

    const html = level.apply(tag);
    const codeHtml = level.applyCode ? level.applyCode(tag) : html;

    setHTML(rendered, html);
    setHTML(codeBox, escapeHtml(codeHtml));
  }

  function onTargetLost(level, idx) {
    if (idx !== state.lastTargetIndex) return;

    setText(statusText, "Η κάρτα χάθηκε — επιστροφή σε 2s…");
    clearTimeout(state.foundTimer);

    state.foundTimer = setTimeout(() => {
      // reset output (simple)
      setText(statusText, "Έτοιμο για σάρωση…");
      setText(hintText, "Σκάναρε μία κάρτα για να δεις το αποτέλεσμα.");
      setHTML(rendered, `<div class="placeholder">Το αποτέλεσμα θα εμφανιστεί εδώ.</div>`);
      setHTML(codeBox, escapeHtml("<!-- Ο κώδικας θα εμφανιστεί εδώ -->"));
      state.lastTargetIndex = -1;
    }, 2000);
  }

  // -----------------------------
  // Scanning controls
  // -----------------------------
  function startScanning() {
    if (state.isScanning) return;

    const level = levels[state.currentLevelKey];
    if (!level) return;

    state.isScanning = true;
    btnStart.disabled = true;
    btnStop.disabled = false;

    setText(statusText, "Άνοιγμα κάμερας…");
    setText(hintText, "Στόχευσε μια κάρτα.");

    // inject scene
    arWrap.innerHTML = buildSceneHtml(level.mindFile, level.targets.length);
    state.sceneEl = $("a-scene", arWrap);

    // wait a tick for DOM
    setTimeout(() => {
      attachTargetListeners(level);
      setText(statusText, "Σάρωση ενεργή.");
    }, 0);
  }

  function stopScanning() {
    if (!state.isScanning) return;

    state.isScanning = false;
    btnStart.disabled = false;
    btnStop.disabled = true;

    clearTimeout(state.foundTimer);
    state.lastTargetIndex = -1;

    // Remove scene (stops camera)
    arWrap.innerHTML = "";
    state.sceneEl = null;

    setText(statusText, "Σάρωση σταμάτησε.");
    setText(hintText, "Πάτα Έναρξη για να ξεκινήσεις ξανά.");
  }

  // -----------------------------
  // Quiz rendering
  // -----------------------------
  function renderQuiz() {
    let score = 0;

    const form = document.createElement("form");
    form.className = "quiz-form";

    quizData.forEach((item, qi) => {
      const block = document.createElement("div");
      block.className = "quiz-q";

      const q = document.createElement("h3");
      q.textContent = `${qi + 1}. ${item.q}`;
      block.appendChild(q);

      item.a.forEach((opt, ai) => {
        const label = document.createElement("label");
        label.className = "quiz-opt";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = `q${qi}`;
        input.value = String(ai);
        label.appendChild(input);

        const span = document.createElement("span");
        span.textContent = opt;
        label.appendChild(span);

        block.appendChild(label);
      });

      form.appendChild(block);
    });

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Υποβολή";
    form.appendChild(submit);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      score = 0;

      quizData.forEach((item, qi) => {
        const chosen = form.querySelector(`input[name="q${qi}"]:checked`);
        if (!chosen) return;
        if (Number(chosen.value) === item.correct) score++;
      });

      setText(quizScore, `Σκορ: ${score}/${quizData.length}`);
    });

    quizContainer.innerHTML = "";
    quizContainer.appendChild(form);
    setText(quizScore, "");
  }

  // -----------------------------
  // Orientation overlay (optional)
  // -----------------------------
  function updateOrientationOverlay() {
    if (!rotateOverlay) return;
    const isLandscape = window.matchMedia("(orientation: landscape)").matches;
    if (isLandscape) show(rotateOverlay);
    else hide(rotateOverlay);
  }

  // -----------------------------
  // Events
  // -----------------------------
  btnHome?.addEventListener("click", () => go("home"));
  btnBackHome?.addEventListener("click", () => go("home"));

  btnGoL1?.addEventListener("click", () => {
    state.currentLevelKey = "L1";
    setText(scanTitle, `${levels.L1.title} — Σάρωση`);
    setText(scanSubtitle, levels.L1.subtitle);
    go("scan");
  });

  btnGoL2?.addEventListener("click", () => {
    state.currentLevelKey = "L2";
    setText(scanTitle, `${levels.L2.title} — Σάρωση`);
    setText(scanSubtitle, levels.L2.subtitle);
    go("scan");
  });

  btnGoQuiz?.addEventListener("click", () => {
    go("quiz");
    renderQuiz();
  });

  btnStart?.addEventListener("click", startScanning);
  btnStop?.addEventListener("click", stopScanning);

  btnDark?.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
  });

  window.addEventListener("resize", updateOrientationOverlay);
  window.addEventListener("orientationchange", updateOrientationOverlay);

  // -----------------------------
  // Init
  // -----------------------------
  function initDefaults() {
    go("home");

    setText(statusText, "Έτοιμο για σάρωση…");
    setText(hintText, "Σκάναρε μία κάρτα για να δεις το αποτέλεσμα.");
    setHTML(rendered, `<div class="placeholder">Το αποτέλεσμα θα εμφανιστεί εδώ.</div>`);
    setHTML(codeBox, escapeHtml("<!-- Ο κώδικας θα εμφανιστεί εδώ -->"));

    btnStop.disabled = true;
    updateOrientationOverlay();
  }

  initDefaults();
})();
