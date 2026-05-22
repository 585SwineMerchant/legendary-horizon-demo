// =============================================================================
// WorkerSkillsRating.js — Activity 4: Rate all skills 1–5 (max 3 rated 4+)
//
// Constraint: players may assign at most 3 skills a "high" rating (4 or 5).
// This forces meaningful prioritization rather than rating everything highly.
//
// Result: { [skillName]: 1–5 }
// =============================================================================

const MAX_HIGH_RATINGS = 3;
const HIGH_THRESHOLD   = 4;

class WorkerSkillsRating {
  constructor(skills = WORKER_SKILLS) {
    this.skills = skills;
    this.ratings = {};
    // Initialize all skills to rating 1
    skills.forEach(s => (this.ratings[s] = 1));
    this.result = null;
    this.onComplete = null;
    this._container = null;
  }

  mount(container, onComplete) {
    this._container = container;
    this.onComplete = onComplete;
    this._render();
  }

  _countHighRatings() {
    return Object.values(this.ratings).filter(r => r >= HIGH_THRESHOLD).length;
  }

  _setRating(skill, newRating) {
    const currentRating = this.ratings[skill];
    const highCount = this._countHighRatings();

    // Block if trying to go high when cap is reached
    if (newRating >= HIGH_THRESHOLD && currentRating < HIGH_THRESHOLD && highCount >= MAX_HIGH_RATINGS) {
      this._showCap();
      return false;
    }

    this.ratings[skill] = newRating;
    return true;
  }

  _showCap() {
    const banner = this._container.querySelector(".cap-banner");
    if (!banner) return;
    banner.classList.add("cap-banner-visible");
    clearTimeout(this._capTimer);
    this._capTimer = setTimeout(() => banner.classList.remove("cap-banner-visible"), 2500);
  }

  _render() {
    const highCount = this._countHighRatings();

    this._container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">🌟 Reckoning of Skills</h2>
        <p class="activity-subtitle">Rate your abilities honestly. Only three may shine as your greatest gifts.</p>
        <div class="high-rating-tracker">
          <span class="tracker-label">High ratings used:</span>
          ${[1,2,3].map(i => `<span class="tracker-pip ${i <= highCount ? "pip-filled" : ""}"></span>`).join("")}
          <span class="tracker-count">${highCount} / ${MAX_HIGH_RATINGS}</span>
        </div>
      </div>

      <div class="cap-banner">
        ⚠️ Only ${MAX_HIGH_RATINGS} skills may be rated ${HIGH_THRESHOLD}+. Lower another skill first.
      </div>

      <div class="skills-grid">
        ${this.skills.map(skill => this._skillRowHTML(skill)).join("")}
      </div>

      <div class="skills-footer">
        <p class="skills-note">Rate each skill from 1 (developing) to 5 (exceptional).</p>
        <button class="btn-proceed" id="btn-skills-done">Inscribe My Skills →</button>
      </div>
    `;

    // Star click handlers
    this._container.querySelectorAll(".star-btn").forEach(star => {
      star.addEventListener("click", () => {
        const skill  = star.dataset.skill;
        const rating = parseInt(star.dataset.rating, 10);
        const changed = this._setRating(skill, rating);
        if (changed) this._refreshRow(skill);
      });
    });

    this._container.querySelector("#btn-skills-done").addEventListener("click", () => {
      this.result = { ...this.ratings };
      this._showComplete();
    });
  }

  _skillRowHTML(skill) {
    const rating = this.ratings[skill];
    const isHigh = rating >= HIGH_THRESHOLD;
    const stars = [1,2,3,4,5].map(n => `
      <button class="star-btn ${n <= rating ? "star-filled" : ""} ${n >= HIGH_THRESHOLD ? "star-high" : ""}"
              data-skill="${skill}" data-rating="${n}" title="${n} star${n !== 1 ? "s" : ""}">
        ${n <= rating ? "★" : "☆"}
      </button>
    `).join("");

    return `
      <div class="skill-row ${isHigh ? "skill-row-high" : ""}" id="row-${skill.replace(/\s/g,"-")}">
        <div class="skill-name">${skill}</div>
        <div class="skill-stars">${stars}</div>
        <div class="skill-level">${_ratingLabel(rating)}</div>
      </div>
    `;
  }

  // Re-renders just one row after a rating change (avoids full re-render flicker)
  _refreshRow(skill) {
    const rowId = `row-${skill.replace(/\s/g,"-")}`;
    const existingRow = this._container.querySelector(`#${rowId}`);
    if (!existingRow) return;

    const newRowHTML = this._skillRowHTML(skill);
    const temp = document.createElement("div");
    temp.innerHTML = newRowHTML;
    const newRow = temp.firstElementChild;

    // Re-bind stars in the new row
    newRow.querySelectorAll(".star-btn").forEach(star => {
      star.addEventListener("click", () => {
        const s = star.dataset.skill;
        const r = parseInt(star.dataset.rating, 10);
        const changed = this._setRating(s, r);
        if (changed) this._refreshRow(s);
      });
    });

    existingRow.replaceWith(newRow);

    // Update tracker pip display
    const highCount = this._countHighRatings();
    this._container.querySelectorAll(".tracker-pip").forEach((pip, i) => {
      pip.classList.toggle("pip-filled", i < highCount);
    });
    const countEl = this._container.querySelector(".tracker-count");
    if (countEl) countEl.textContent = `${highCount} / ${MAX_HIGH_RATINGS}`;
  }

  _showComplete() {
    const sorted = Object.entries(this.ratings).sort((a, b) => b[1] - a[1]);
    const rows = sorted.map(([skill, rating]) => `
      <div class="result-skill-row ${rating >= HIGH_THRESHOLD ? "skill-result-high" : ""}">
        <span class="result-skill-name">${skill}</span>
        <span class="result-skill-stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>
        <span class="result-skill-level">${_ratingLabel(rating)}</span>
      </div>
    `).join("");

    this._container.innerHTML = `
      <div class="activity-header">
        <h2 class="activity-title">🌟 Reckoning of Skills</h2>
        <p class="activity-subtitle">Your abilities have been measured and recorded.</p>
      </div>

      <div class="skills-result-list">
        ${rows}
      </div>

      <button class="btn-proceed">Reveal My Destiny →</button>
    `;

    this._container.querySelector(".btn-proceed").addEventListener("click", () => {
      if (this.onComplete) this.onComplete(this.result);
    });
  }
}

function _ratingLabel(r) {
  return ["", "Developing", "Familiar", "Competent", "Proficient", "Exceptional"][r] || "";
}
