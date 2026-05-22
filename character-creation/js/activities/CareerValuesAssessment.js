// =============================================================================
// CareerValuesAssessment.js — Activity 2: 2-phase tournament for top 3 values
//
// Phase 1 — Elimination: same queue-tournament as LifeGoalsTournament.
//   Runs until 3 items remain (9 matches for 12 values).
//
// Phase 2 — Final Ranking: user explicitly ranks the 3 finalists.
//   Match A: finalist[0] vs finalist[1] → rank1 winner, consolation loser
//   Match B: consolation vs finalist[2] → rank2 winner, rank3 loser
//   Total matches: 9 + 2 = 11 for 12 values.
//
// Result: [rank1, rank2, rank3]
// =============================================================================

class CareerValuesAssessment {
  constructor(values = CAREER_VALUES) {
    this.queue = _cvShuffle([...values]);
    this.eliminated = [];
    this.matchNumber = 0;
    this.phase = 1;                           // 1 = elimination, 2 = final ranking
    this.finalists = [];                      // the last 3 standing
    this.finalStep = 0;                       // 0 or 1 within Phase 2
    this.finalWinner = null;                  // rank1 candidate
    this.result = null;                       // [rank1, rank2, rank3]
    this.totalMatches = values.length - 3 + 2; // (n-3) elim + 2 finals
    this.onComplete = null;
    this._container = null;
  }

  mount(container, onComplete) {
    this._container = container;
    this.onComplete = onComplete;
    this._render();
  }

  pick(winner) {
    if (this.phase === 1) {
      this._pickPhase1(winner);
    } else {
      this._pickPhase2(winner);
    }
  }

  _pickPhase1(winner) {
    const [a, b] = this.queue.splice(0, 2);
    const loser = winner === a ? b : a;
    this.eliminated.push(loser);
    this.matchNumber++;

    if (this.queue.length + 1 === 3) {
      // After adding winner back we'll have exactly 3 — enter Phase 2
      this.queue.push(winner);
      this.finalists = [...this.queue];
      this.phase = 2;
      this.finalStep = 0;
      this._render();
    } else {
      this.queue.push(winner);
      this._render();
    }
  }

  _pickPhase2(winner) {
    this.matchNumber++;
    if (this.finalStep === 0) {
      // Match 1 of Phase 2: finalists[0] vs finalists[1]
      this.finalWinner = winner;
      const consolation = (winner === this.finalists[0]) ? this.finalists[1] : this.finalists[0];
      this.finalStep = 1;
      this._pendingConsolation = consolation;
      this._render();
    } else {
      // Match 2 of Phase 2: consolation vs finalists[2]
      const rank2 = winner;
      const rank3 = (winner === this._pendingConsolation) ? this.finalists[2] : this._pendingConsolation;
      this.result = [this.finalWinner, rank2, rank3];
      this._showComplete();
    }
  }

  _render() {
    const progress = Math.round((this.matchNumber / this.totalMatches) * 100);

    if (this.phase === 1) {
      const [a, b] = [this.queue[0], this.queue[1]];
      const remaining = this.queue.length;

      this._container.innerHTML = `
        <div class="activity-header">
          <h2 class="activity-title">⚖️ Trial of Values</h2>
          <p class="activity-subtitle">Which matters more to you in your work?</p>
          <div class="progress-wrap">
            <div class="progress-bar" style="width:${progress}%"></div>
          </div>
          <p class="progress-label">Match ${this.matchNumber + 1} of ${this.totalMatches}
            &nbsp;·&nbsp; ${remaining} values remaining &nbsp;·&nbsp;
            <em>Phase 1: Elimination</em></p>
        </div>

        <div class="vs-arena">
          <button class="choice-card choice-left" data-pick="a">
            <div class="choice-icon">💎</div>
            <div class="choice-label">${a}</div>
            <div class="choice-hint">Click to choose</div>
          </button>

          <div class="vs-badge">VS</div>

          <button class="choice-card choice-right" data-pick="b">
            <div class="choice-icon">💎</div>
            <div class="choice-label">${b}</div>
            <div class="choice-hint">Click to choose</div>
          </button>
        </div>

        <p class="activity-note">
          ${remaining > 4
            ? `Narrowing the field — ${remaining - 3} values must be eliminated.`
            : "⚠️ Getting close! The top 3 finalists are almost decided."}
        </p>
      `;
    } else {
      // Phase 2 — render the correct final match
      const [matchA, matchB] = this.finalStep === 0
        ? [this.finalists[0], this.finalists[1]]
        : [this._pendingConsolation, this.finalists[2]];

      const phaseLabel = this.finalStep === 0
        ? "Phase 2: Grand Final — 1st vs 2nd Place"
        : "Phase 2: 2nd vs 3rd Place";

      this._container.innerHTML = `
        <div class="activity-header">
          <h2 class="activity-title">⚖️ Trial of Values</h2>
          <p class="activity-subtitle">Your top 3 finalists! Rank them now.</p>
          <div class="progress-wrap">
            <div class="progress-bar" style="width:${progress}%"></div>
          </div>
          <p class="progress-label">Match ${this.matchNumber + 1} of ${this.totalMatches}
            &nbsp;·&nbsp; <em>${phaseLabel}</em></p>
        </div>

        ${this.finalStep === 0 ? `
          <div class="finalists-banner">
            <span class="finalist-chip">${this.finalists[0]}</span>
            <span class="finalist-chip">${this.finalists[1]}</span>
            <span class="finalist-chip finalist-pending">${this.finalists[2]}</span>
          </div>
          <p class="activity-note">Which of your top two values reigns supreme?</p>
        ` : `
          <div class="finalists-banner">
            <span class="finalist-chip finalist-ranked">🥇 ${this.finalWinner}</span>
            <span class="finalist-chip">${this._pendingConsolation}</span>
            <span class="finalist-chip">${this.finalists[2]}</span>
          </div>
          <p class="activity-note">Now decide 2nd and 3rd place.</p>
        `}

        <div class="vs-arena">
          <button class="choice-card choice-left" data-pick="a">
            <div class="choice-icon">👑</div>
            <div class="choice-label">${matchA}</div>
            <div class="choice-hint">Click to choose</div>
          </button>

          <div class="vs-badge">VS</div>

          <button class="choice-card choice-right" data-pick="b">
            <div class="choice-icon">👑</div>
            <div class="choice-label">${matchB}</div>
            <div class="choice-hint">Click to choose</div>
          </button>
        </div>
      `;
    }

    this._container.querySelectorAll(".choice-card").forEach(btn => {
      btn.addEventListener("click", () => {
        const [a, b] = this.phase === 1
          ? [this.queue[0], this.queue[1]]
          : this.finalStep === 0
            ? [this.finalists[0], this.finalists[1]]
            : [this._pendingConsolation, this.finalists[2]];

        const winner = btn.dataset.pick === "a" ? a : b;
        btn.classList.add("chosen");
        btn.closest(".vs-arena").querySelectorAll(".choice-card").forEach(c => {
          if (c !== btn) c.classList.add("defeated");
        });
        setTimeout(() => this.pick(winner), 500);
      });
    });
  }

  _showComplete() {
    const [r1, r2, r3] = this.result;
    this._container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">⚖️ Trial of Values</h2>
        <p class="activity-subtitle">Your career values have been revealed!</p>
      </div>

      <div class="results-reveal">
        <div class="result-item result-gold">
          <span class="result-rank">1st</span>
          <span class="result-label">${r1}</span>
        </div>
        <div class="result-item result-silver">
          <span class="result-rank">2nd</span>
          <span class="result-label">${r2}</span>
        </div>
        <div class="result-item result-bronze">
          <span class="result-rank">3rd</span>
          <span class="result-label">${r3}</span>
        </div>
      </div>

      <button class="btn-proceed">Continue the Ritual →</button>
    `;
    this._container.querySelector(".btn-proceed").addEventListener("click", () => {
      if (this.onComplete) this.onComplete(this.result);
    });
  }
}

function _cvShuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
