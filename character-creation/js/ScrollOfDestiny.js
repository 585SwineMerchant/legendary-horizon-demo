// =============================================================================
// ScrollOfDestiny.js — Renders the completed CharacterSheet as a fantasy scroll
//
// Call ScrollOfDestiny.render(container, sheet, onDone) to display.
// Export buttons output JSON or plain text for debugging / Maia integration.
// =============================================================================

const ScrollOfDestiny = (() => {

  function render(container, sheet, onDone) {
    const prefs = sheet.workspacePreferences;
    const prefLabels = _buildPrefLabels(prefs);
    const skillRows  = _buildSkillRows(sheet.skillRatings);
    const signposts  = _buildSignposts(sheet.foretoldSignposts);

    container.innerHTML = `
      <div class="scroll-reveal-wrap">
        <div class="scroll-top-deco">⋆ ✦ ⋆ ✦ ⋆ ✦ ⋆ ✦ ⋆</div>

        <div class="scroll-document">
          <div class="scroll-header">
            <div class="scroll-title-line">— Scroll of Destiny —</div>
            <div class="scroll-traveler-name">${sheet.getDisplayName()}</div>
            <div class="scroll-subtitle">Revealed by the Master Scribe · ${_formatDate(sheet.completedAt)}</div>
          </div>

          <div class="scroll-divider">✦ ─────────────────────── ✦</div>

          <!-- Life Goals -->
          <section class="scroll-section">
            <h3 class="scroll-section-title">⚔️ Life Goals</h3>
            <div class="scroll-goals">
              ${sheet.lifeGoals.map((g, i) => `
                <div class="scroll-goal ${i === 0 ? "goal-primary" : "goal-secondary"}">
                  <span class="goal-rank">${i === 0 ? "Primary" : "Secondary"}</span>
                  <span class="goal-text">${g}</span>
                </div>
              `).join("")}
            </div>
          </section>

          <div class="scroll-divider-thin">· · · · · · · · · · · · · · ·</div>

          <!-- Career Values -->
          <section class="scroll-section">
            <h3 class="scroll-section-title">⚖️ Career Values</h3>
            <div class="scroll-values">
              ${sheet.careerValues.map((v, i) => `
                <div class="scroll-value-chip value-rank-${i + 1}">
                  <span class="value-medal">${["🥇","🥈","🥉"][i]}</span>
                  <span class="value-name">${v}</span>
                </div>
              `).join("")}
            </div>
          </section>

          <div class="scroll-divider-thin">· · · · · · · · · · · · · · ·</div>

          <!-- Workspace Preferences -->
          <section class="scroll-section">
            <h3 class="scroll-section-title">🏡 Workspace</h3>
            <div class="scroll-prefs-grid">
              ${prefLabels.map(p => `
                <div class="scroll-pref-item">
                  <span class="pref-item-icon">${p.icon}</span>
                  <span class="pref-item-val">${p.label}</span>
                </div>
              `).join("")}
            </div>
          </section>

          <div class="scroll-divider-thin">· · · · · · · · · · · · · · ·</div>

          <!-- Skills -->
          <section class="scroll-section">
            <h3 class="scroll-section-title">🌟 Skills</h3>
            <div class="scroll-skills">
              ${skillRows}
            </div>
          </section>

          <div class="scroll-divider">✦ ─────────────────────── ✦</div>

          <!-- Foretold Signposts -->
          <section class="scroll-section scroll-signposts-section">
            <h3 class="scroll-section-title signpost-title">🔮 Foretold Signposts</h3>
            <p class="signpost-subtitle">The Fates have illuminated three paths before you.</p>
            <div class="scroll-signposts">
              ${signposts}
            </div>
          </section>

          <div class="scroll-divider">✦ ─────────────────────── ✦</div>

          <div class="scroll-footer">
            <span class="scroll-id">ID: ${sheet.id}</span>
          </div>
        </div>

        <div class="scroll-bottom-deco">⋆ ✦ ⋆ ✦ ⋆ ✦ ⋆ ✦ ⋆</div>

        <!-- Export controls -->
        <div class="export-controls">
          <button class="btn-export" id="btn-export-json">Export JSON</button>
          <button class="btn-export" id="btn-export-text">Export Text</button>
          ${onDone ? `<button class="btn-proceed" id="btn-scroll-done">Begin Your Journey →</button>` : ""}
        </div>
      </div>
    `;

    // Staggered section animations
    container.querySelectorAll(".scroll-section").forEach((sec, i) => {
      sec.style.animationDelay = `${i * 0.15}s`;
      sec.classList.add("section-animate-in");
    });

    container.querySelector("#btn-export-json").addEventListener("click", () => {
      _download(`${sheet.getDisplayName()}_scroll.json`, sheet.toJSON(), "application/json");
    });

    container.querySelector("#btn-export-text").addEventListener("click", () => {
      _download(`${sheet.getDisplayName()}_scroll.txt`, sheet.toTextExport(), "text/plain");
    });

    if (onDone) {
      container.querySelector("#btn-scroll-done").addEventListener("click", onDone);
    }
  }

  // --- Helpers ---

  function _buildPrefLabels(prefs) {
    const map = {
      location: {
        "in-person": { icon: "🏢", label: "In-Person" },
        "remote":    { icon: "🏠", label: "Remote" },
        "hybrid":    { icon: "🌐", label: "Hybrid" }
      },
      structure: {
        "structured": { icon: "📋", label: "Structured" },
        "flexible":   { icon: "🌊", label: "Flexible" },
        "balanced":   { icon: "⚖️", label: "Balanced" }
      },
      teamSize: {
        "solo":  { icon: "🧍", label: "Solo" },
        "small": { icon: "👥", label: "Small Team" },
        "large": { icon: "🏟️", label: "Large Org" }
      },
      setting: {
        "office":  { icon: "🏢", label: "Office/Studio" },
        "outdoor": { icon: "🌿", label: "Outdoors" },
        "lab":     { icon: "🔬", label: "Lab/Workshop" },
        "varied":  { icon: "🎭", label: "Always Changing" }
      },
      pace: {
        "steady":  { icon: "🌊", label: "Steady" },
        "dynamic": { icon: "⚡", label: "Dynamic" },
        "project": { icon: "🎯", label: "Project-Based" }
      }
    };
    return Object.entries(prefs).map(([key, val]) => {
      return (map[key] && map[key][val]) || { icon: "·", label: val };
    });
  }

  function _buildSkillRows(ratings) {
    return Object.entries(ratings)
      .sort((a, b) => b[1] - a[1])
      .map(([skill, r]) => `
        <div class="scroll-skill-row ${r >= 4 ? "skill-high" : ""}">
          <span class="scroll-skill-name">${skill}</span>
          <span class="scroll-skill-stars">${"★".repeat(r)}${"☆".repeat(5 - r)}</span>
        </div>
      `).join("");
  }

  function _buildSignposts(signposts) {
    const labels = ["Primary Path", "Secondary Path", "Hidden Path"];
    return signposts.map((s, i) => `
      <div class="signpost-card signpost-${i + 1}">
        <div class="signpost-icon">${CLUSTER_ICONS[s] || "✨"}</div>
        <div class="signpost-path-label">${labels[i]}</div>
        <div class="signpost-name">${s}</div>
      </div>
    `).join("");
  }

  function _formatDate(iso) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch { return iso; }
  }

  function _download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return { render };
})();
