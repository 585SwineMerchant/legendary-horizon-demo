// =============================================================================
// WorkspacePreferences.js — Activity 3: Sequential multiple-choice questionnaire
//
// Presents WORKSPACE_QUESTIONS one at a time. Each question has 3–4 options
// displayed as visual cards. Player clicks to select.
//
// Result: { location, structure, teamSize, setting, pace }
// =============================================================================

class WorkspacePreferences {
  constructor(questions = WORKSPACE_QUESTIONS) {
    this.questions = questions;
    this.answers = {};
    this.currentIndex = 0;
    this.result = null;
    this.onComplete = null;
    this._container = null;
  }

  mount(container, onComplete) {
    this._container = container;
    this.onComplete = onComplete;
    this._renderQuestion();
  }

  _answer(questionId, value) {
    this.answers[questionId] = value;
    this.currentIndex++;

    if (this.currentIndex >= this.questions.length) {
      this.result = { ...this.answers };
      this._showComplete();
    } else {
      // Brief flash of selected state before advancing
      setTimeout(() => this._renderQuestion(), 400);
    }
  }

  _renderQuestion() {
    const q = this.questions[this.currentIndex];
    const progress = Math.round((this.currentIndex / this.questions.length) * 100);
    const dots = this.questions.map((_, i) => `
      <span class="q-dot ${i < this.currentIndex ? "q-dot-done" : ""} ${i === this.currentIndex ? "q-dot-active" : ""}"></span>
    `).join("");

    this._container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">🏡 Rite of Environment</h2>
        <p class="activity-subtitle">Reveal the conditions where you thrive.</p>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${progress}%"></div>
        </div>
        <div class="q-dots">${dots}</div>
        <p class="progress-label">Question ${this.currentIndex + 1} of ${this.questions.length}</p>
      </div>

      <div class="workspace-question-wrap">
        <div class="workspace-question-icon">${q.icon}</div>
        <h3 class="workspace-question-text">${q.question}</h3>
      </div>

      <div class="workspace-options ${q.options.length === 4 ? "options-grid-2" : "options-grid-3"}">
        ${q.options.map(opt => `
          <button class="workspace-option" data-value="${opt.value}">
            <div class="workspace-option-icon">${opt.icon}</div>
            <div class="workspace-option-label">${opt.label}</div>
            <div class="workspace-option-desc">${opt.desc}</div>
          </button>
        `).join("")}
      </div>
    `;

    this._container.querySelectorAll(".workspace-option").forEach(btn => {
      btn.addEventListener("click", () => {
        // Visual feedback
        this._container.querySelectorAll(".workspace-option").forEach(b => {
          b.classList.remove("selected");
          b.classList.add("dimmed");
        });
        btn.classList.remove("dimmed");
        btn.classList.add("selected");

        this._answer(q.id, btn.dataset.value);
      });
    });
  }

  _showComplete() {
    const prefs = this.result;
    const summaryLines = this.questions.map(q => {
      const chosen = q.options.find(o => o.value === prefs[q.id]);
      return `
        <div class="pref-summary-row">
          <span class="pref-q-icon">${q.icon}</span>
          <span class="pref-q-label">${q.question.replace("?", "")}</span>
          <span class="pref-answer">${chosen ? chosen.icon + " " + chosen.label : "—"}</span>
        </div>
      `;
    }).join("");

    this._container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">🏡 Rite of Environment</h2>
        <p class="activity-subtitle">Your ideal workspace has been inscribed.</p>
      </div>

      <div class="pref-summary">
        ${summaryLines}
      </div>

      <button class="btn-proceed">Continue the Ritual →</button>
    `;

    this._container.querySelector(".btn-proceed").addEventListener("click", () => {
      if (this.onComplete) this.onComplete(this.result);
    });
  }
}
