// =============================================================================
// MasterScribeController.js — Scene state machine for the full ritual flow
//
// Screens (in order):
//   INTRO → SCRIBE_DIALOGUE → ACTIVITY_1 → ACTIVITY_2 → ACTIVITY_3
//   → ACTIVITY_4 → SCROLL_REVEAL → COMPLETE
//
// MAIA_INTEGRATION_POINT: After SCROLL_REVEAL, call postToMaia() to send the
// completed CharacterSheet to the Maia Learning backend before advancing.
// =============================================================================

const SCREENS = {
  INTRO:          "intro",
  SCRIBE_DIALOGUE: "scribe_dialogue",
  ACTIVITY_1:     "activity_1",
  ACTIVITY_2:     "activity_2",
  ACTIVITY_3:     "activity_3",
  ACTIVITY_4:     "activity_4",
  SCROLL_REVEAL:  "scroll_reveal",
  COMPLETE:       "complete"
};

class MasterScribeController {
  constructor(rootElement) {
    this.root     = rootElement;
    this.sheet    = new CharacterSheet();
    this.screen   = SCREENS.INTRO;
    this._dialogQueue = [];
    this._dialogIndex = 0;
  }

  start() {
    this._goTo(SCREENS.INTRO);
  }

  // Jump straight to scroll with mock data (dev shortcut)
  devSkipToScroll(name) {
    this.sheet = MockData.getSheet(name);
    this._goTo(SCREENS.SCROLL_REVEAL);
  }

  // --- Screen router ---

  _goTo(screen) {
    this.screen = screen;
    this.root.innerHTML = "";
    this.root.className = `game-screen screen-${screen}`;

    // Fade in
    this.root.style.opacity = "0";
    requestAnimationFrame(() => {
      this.root.style.transition = "opacity 0.4s ease";
      this.root.style.opacity = "1";
    });

    switch (screen) {
      case SCREENS.INTRO:           return this._renderIntro();
      case SCREENS.SCRIBE_DIALOGUE: return this._renderDialogue(
        NARRATOR_DIALOGUE.intro,
        () => this._goTo(SCREENS.ACTIVITY_1)
      );
      case SCREENS.ACTIVITY_1:      return this._renderActivity1();
      case SCREENS.ACTIVITY_2:      return this._renderActivity2();
      case SCREENS.ACTIVITY_3:      return this._renderActivity3();
      case SCREENS.ACTIVITY_4:      return this._renderActivity4();
      case SCREENS.SCROLL_REVEAL:   return this._renderScrollReveal();
      case SCREENS.COMPLETE:        return this._renderComplete();
    }
  }

  _fadeToScreen(screen, delay = 600) {
    this.root.style.transition = "opacity 0.4s ease";
    this.root.style.opacity = "0";
    setTimeout(() => this._goTo(screen), delay);
  }

  // --- Individual screen renderers ---

  _renderIntro() {
    this.root.innerHTML = `
      <div class="screen-intro-wrap">
        <div class="game-logo">
          <div class="logo-subtitle">A Character Revelation Ritual</div>
          <h1 class="logo-title">Quest of Fate</h1>
          <div class="logo-tagline">~ Scroll of Destiny ~</div>
        </div>

        <div class="intro-card">
          <p class="intro-flavor">
            You stand at the threshold of the Scribe's Hall.<br>
            Within, the Master Scribe awaits with quill in hand.
          </p>
          <div class="name-entry">
            <label for="traveler-name" class="name-label">Enter your name, Traveler:</label>
            <input type="text" id="traveler-name" class="name-input"
              placeholder="Your name..." maxlength="40" autocomplete="off" />
          </div>
          <button class="btn-begin" id="btn-begin">Enter the Hall →</button>
        </div>

        <div class="dev-controls">
          <button class="btn-dev" id="btn-dev-skip">⚙ Dev: Skip to Scroll</button>
        </div>
      </div>
    `;

    const input  = this.root.querySelector("#traveler-name");
    const btn    = this.root.querySelector("#btn-begin");
    const devBtn = this.root.querySelector("#btn-dev-skip");

    input.addEventListener("keydown", e => {
      if (e.key === "Enter") btn.click();
    });

    btn.addEventListener("click", () => {
      const name = input.value.trim();
      if (!name) {
        input.classList.add("input-error");
        input.placeholder = "A name is required, Traveler.";
        return;
      }
      this.sheet.name = name;
      this._fadeToScreen(SCREENS.SCRIBE_DIALOGUE);
    });

    devBtn.addEventListener("click", () => {
      const name = input.value.trim() || "Test Traveler";
      this.devSkipToScroll(name);
    });

    setTimeout(() => input.focus(), 300);
  }

  // Generic dialogue screen: shows lines one at a time with typewriter feel
  _renderDialogue(lines, onFinish, titleOverride) {
    const processedLines = lines.map(l => l.replace("{name}", this.sheet.getDisplayName()));

    this.root.innerHTML = `
      <div class="dialogue-wrap">
        <div class="scribe-portrait">
          <div class="scribe-avatar">📜</div>
          <div class="scribe-name">The Master Scribe</div>
        </div>
        <div class="dialogue-box">
          <div class="dialogue-text" id="dialogue-text"></div>
          <button class="btn-dialogue-next" id="btn-next">▶</button>
        </div>
        <div class="dialogue-dots">
          ${processedLines.map((_, i) => `<span class="d-dot" id="ddot-${i}"></span>`).join("")}
        </div>
      </div>
    `;

    let index = 0;
    const textEl = this.root.querySelector("#dialogue-text");
    const nextBtn = this.root.querySelector("#btn-next");

    const showLine = (i) => {
      textEl.textContent = "";
      this.root.querySelectorAll(".d-dot").forEach((d, di) => {
        d.className = "d-dot" + (di < i ? " d-done" : "") + (di === i ? " d-active" : "");
      });
      _typewriter(textEl, processedLines[i], 28);
    };

    const advance = () => {
      index++;
      if (index >= processedLines.length) {
        this._fadeToScreen(
          this.screen === SCREENS.SCRIBE_DIALOGUE ? SCREENS.ACTIVITY_1 : SCREENS.COMPLETE
        );
        if (onFinish) onFinish();
      } else {
        showLine(index);
      }
    };

    nextBtn.addEventListener("click", advance);
    // Also allow clicking the dialogue box itself
    this.root.querySelector(".dialogue-box").addEventListener("click", (e) => {
      if (e.target !== nextBtn) advance();
    });

    showLine(0);
  }

  // Activity screen wrapper: shows narrator transition before launching activity
  _renderActivityWrapper(dialogueLines, activityFn) {
    const processedLines = dialogueLines.map(l => l.replace("{name}", this.sheet.getDisplayName()));

    this.root.innerHTML = `
      <div class="dialogue-wrap">
        <div class="scribe-portrait">
          <div class="scribe-avatar">📜</div>
          <div class="scribe-name">The Master Scribe</div>
        </div>
        <div class="dialogue-box">
          <div class="dialogue-text" id="dialogue-text"></div>
          <button class="btn-dialogue-next" id="btn-next">▶</button>
        </div>
        <div class="dialogue-dots">
          ${processedLines.map((_, i) => `<span class="d-dot" id="ddot-${i}"></span>`).join("")}
        </div>
      </div>
    `;

    let index = 0;
    const textEl = this.root.querySelector("#dialogue-text");
    const nextBtn = this.root.querySelector("#btn-next");

    const showLine = (i) => {
      textEl.textContent = "";
      this.root.querySelectorAll(".d-dot").forEach((d, di) => {
        d.className = "d-dot" + (di < i ? " d-done" : "") + (di === i ? " d-active" : "");
      });
      _typewriter(textEl, processedLines[i], 28);
    };

    const advance = () => {
      index++;
      if (index >= processedLines.length) {
        // Launch the activity
        this.root.innerHTML = `<div id="activity-container" class="activity-wrap"></div>`;
        const activityContainer = this.root.querySelector("#activity-container");
        activityFn(activityContainer);
      } else {
        showLine(index);
      }
    };

    nextBtn.addEventListener("click", advance);
    this.root.querySelector(".dialogue-box").addEventListener("click", (e) => {
      if (e.target !== nextBtn) advance();
    });

    showLine(0);
  }

  _renderActivity1() {
    this._renderActivityWrapper(NARRATOR_DIALOGUE.beforeActivity1, (container) => {
      const activity = new LifeGoalsTournament(LIFE_GOALS);
      activity.mount(container, (result) => {
        this.sheet.lifeGoals = result;
        this._fadeToScreen(SCREENS.ACTIVITY_2);
      });
    });
  }

  _renderActivity2() {
    this._renderActivityWrapper(NARRATOR_DIALOGUE.beforeActivity2, (container) => {
      const activity = new CareerValuesAssessment(CAREER_VALUES);
      activity.mount(container, (result) => {
        this.sheet.careerValues = result;
        this._fadeToScreen(SCREENS.ACTIVITY_3);
      });
    });
  }

  _renderActivity3() {
    this._renderActivityWrapper(NARRATOR_DIALOGUE.beforeActivity3, (container) => {
      const activity = new WorkspacePreferences(WORKSPACE_QUESTIONS);
      activity.mount(container, (result) => {
        this.sheet.workspacePreferences = result;
        this._fadeToScreen(SCREENS.ACTIVITY_4);
      });
    });
  }

  _renderActivity4() {
    this._renderActivityWrapper(NARRATOR_DIALOGUE.beforeActivity4, (container) => {
      const activity = new WorkerSkillsRating(WORKER_SKILLS);
      activity.mount(container, (result) => {
        this.sheet.skillRatings = result;
        this.sheet.computeForetoldSignposts();
        this._fadeToScreen(SCREENS.SCROLL_REVEAL);
      });
    });
  }

  _renderScrollReveal() {
    // Brief cinematic reveal sequence before showing the scroll
    const lines = NARRATOR_DIALOGUE.scrollReveal.map(l =>
      l.replace("{name}", this.sheet.getDisplayName())
    );

    this.root.innerHTML = `
      <div class="reveal-cinematic">
        <div class="reveal-glow"></div>
        <div class="reveal-text" id="reveal-text"></div>
        <button class="btn-reveal-skip" id="btn-reveal-skip">Skip →</button>
      </div>
    `;

    let li = 0;
    const textEl = this.root.querySelector("#reveal-text");
    const showRevealLine = () => {
      if (li >= lines.length) {
        this._showScrollDocument();
        return;
      }
      textEl.style.opacity = "0";
      textEl.style.transition = "opacity 0.5s";
      setTimeout(() => {
        textEl.textContent = lines[li];
        textEl.style.opacity = "1";
        li++;
        setTimeout(showRevealLine, 1800);
      }, 500);
    };

    showRevealLine();
    this.root.querySelector("#btn-reveal-skip").addEventListener("click", () => {
      this._showScrollDocument();
    });
  }

  _showScrollDocument() {
    this.root.innerHTML = `<div id="scroll-container" class="scroll-container"></div>`;

    // PHASER_INTEGRATION_POINT: if onComplete is set (e.g. by CharacterCreationScene),
    // clicking "Begin Your Journey" calls it instead of going to the COMPLETE screen.
    const onScrollDone = this.onComplete
      ? () => this.onComplete(this.sheet)
      : () => this._fadeToScreen(SCREENS.COMPLETE);

    ScrollOfDestiny.render(
      this.root.querySelector("#scroll-container"),
      this.sheet,
      onScrollDone
    );

    // MAIA_INTEGRATION_POINT: POST sheet data to Maia backend here.
    // Example:
    //   fetch('/api/maia/character', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: this.sheet.toJSON()
    //   }).then(r => r.json()).then(data => console.log('Maia response:', data));
    console.log("Scroll of Destiny complete:", JSON.parse(this.sheet.toJSON()));
  }

  _renderComplete() {
    this.root.innerHTML = `
      <div class="complete-wrap">
        <div class="complete-icon">✨</div>
        <h2 class="complete-title">Your journey begins, ${this.sheet.getDisplayName()}.</h2>
        <p class="complete-body">
          The ritual is complete. Your Scroll of Destiny has been inscribed
          in the Great Book. The Master Scribe nods and gestures toward the
          open road beyond.
        </p>
        <div class="complete-signposts">
          ${this.sheet.foretoldSignposts.map((s, i) => `
            <div class="complete-signpost">
              <span>${CLUSTER_ICONS[s] || "✦"}</span>
              <span>${s}</span>
            </div>
          `).join("")}
        </div>
        <button class="btn-proceed" id="btn-restart">Begin Again (New Traveler)</button>
      </div>
    `;

    this.root.querySelector("#btn-restart").addEventListener("click", () => {
      this.sheet = new CharacterSheet();
      this._fadeToScreen(SCREENS.INTRO);
    });
  }
}

// Typewriter effect helper
function _typewriter(el, text, speed = 30) {
  let i = 0;
  el.textContent = "";
  const timer = setInterval(() => {
    el.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(timer);
  }, speed);
  return timer;
}
