// =============================================================================
// LifeGoalsTournament.js — Activity 1: Tournament-bracket to find top 2 goals
//
// Algorithm: single-elimination from a shuffled queue.
//   - Each round: take the front two items, present them, loser is eliminated.
//   - Winner returns to back of queue.
//   - When 2 items remain, a final "grand match" is played.
//   - Result: [rank1, rank2]
//
// With 12 goals: 10 matches total (12 − 2 = 10 eliminations).
// =============================================================================

class LifeGoalsTournament {
  constructor(goals = LIFE_GOALS) {
    this.queue = _shuffleArray([...goals]);
    this.eliminated = [];
    this.matchNumber = 0;
    this.totalMatches = goals.length - 2 + 1; // down to 2, then 1 final
    this.result = null;              // [rank1, rank2] after completion
    this.onComplete = null;          // callback(result)
    this._container = null;
  }

  // Mount this activity into a DOM element and start it
  mount(container, onComplete) {
    this._container = container;
    this.onComplete = onComplete;
    this._render();
  }

  // Returns true when all matches are decided
  isDone() {
    return this.queue.length <= 2 && this.matchNumber >= this.totalMatches - 1;
  }

  // Returns [itemA, itemB] for the current match, or null if done
  getCurrentMatch() {
    if (this.queue.length < 2) return null;
    return [this.queue[0], this.queue[1]];
  }

  // Called when the player clicks a choice. winner must be queue[0] or queue[1].
  pick(winner) {
    // Check BEFORE splice: if exactly 2 remain this is the grand final.
    const isFinalMatch = this.queue.length === 2;

    const [a, b] = this.queue.splice(0, 2);
    const loser = winner === a ? b : a;
    this.eliminated.push(loser);
    this.matchNumber++;

    if (isFinalMatch) {
      this.result = [winner, loser];
      this._showComplete();
    } else {
      this.queue.push(winner);
      this._render();
    }
  }

  _render() {
    const [a, b] = this.getCurrentMatch() || ["?", "?"];
    const progress = Math.round((this.matchNumber / this.totalMatches) * 100);
    const remaining = this.queue.length;

    this._container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">⚔️ Tournament of Hearts</h2>
        <p class="activity-subtitle">Which life goal calls to you more deeply?</p>
        <div class="progress-wrap">
          <div class="progress-bar" style="width:${progress}%"></div>
        </div>
        <p class="progress-label">Match ${this.matchNumber + 1} of ${this.totalMatches}
          &nbsp;·&nbsp; ${remaining} goals still in contention</p>
      </div>

      <div class="vs-arena">
        <button class="choice-card choice-left" data-pick="a">
          <div class="choice-icon">🏆</div>
          <div class="choice-label">${a}</div>
          <div class="choice-hint">Click to choose</div>
        </button>

        <div class="vs-badge">VS</div>

        <button class="choice-card choice-right" data-pick="b">
          <div class="choice-icon">🏆</div>
          <div class="choice-label">${b}</div>
          <div class="choice-hint">Click to choose</div>
        </button>
      </div>

      <p class="activity-note">
        ${remaining > 2
          ? `${remaining - 2} more goals wait in the wings.`
          : "⚠️ This is the Grand Final — choose your greatest aspiration."}
      </p>
    `;

    // Bind click events
    this._container.querySelectorAll(".choice-card").forEach(btn => {
      btn.addEventListener("click", () => {
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
    const [rank1, rank2] = this.result;
    this._container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">⚔️ Tournament of Hearts</h2>
        <p class="activity-subtitle">Your truest aspirations have emerged!</p>
      </div>

      <div class="results-reveal">
        <div class="result-item result-gold">
          <span class="result-rank">1st</span>
          <span class="result-label">${rank1}</span>
        </div>
        <div class="result-item result-silver">
          <span class="result-rank">2nd</span>
          <span class="result-label">${rank2}</span>
        </div>
      </div>

      <button class="btn-proceed">Continue the Ritual →</button>
    `;

    this._container.querySelector(".btn-proceed").addEventListener("click", () => {
      if (this.onComplete) this.onComplete(this.result);
    });
  }
}

function _shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
