// =============================================================================
// CharacterSheet.js — Core data model for a player's character
// This object persists throughout the game as the "Scroll of Destiny."
//
// MAIA_INTEGRATION_POINT: fromMaiaData() would accept a backend assessment
// payload and hydrate this model. The toJSON() output is designed to be
// compatible with a REST body to POST to Maia Learning's API.
// =============================================================================

class CharacterSheet {
  constructor() {
    this.id = `traveler_${Date.now()}`;
    this.name = "";
    this.lifeGoals = [];          // string[2] — top 2 from Life Goals Tournament
    this.careerValues = [];       // string[3] — top 3 from Career Values Assessment
    this.workspacePreferences = {}; // { location, structure, teamSize, setting, pace }
    this.skillRatings = {};        // { [skillName]: 1–5 }
    this.foretoldSignposts = [];  // string[3] — derived career clusters
    this.createdAt = new Date().toISOString();
    this.completedAt = null;
  }

  // --- Serialization ---

  toJSON() {
    return JSON.stringify({
      id: this.id,
      name: this.name,
      lifeGoals: this.lifeGoals,
      careerValues: this.careerValues,
      workspacePreferences: this.workspacePreferences,
      skillRatings: this.skillRatings,
      foretoldSignposts: this.foretoldSignposts,
      createdAt: this.createdAt,
      completedAt: this.completedAt
    }, null, 2);
  }

  fromJSON(json) {
    const data = typeof json === "string" ? JSON.parse(json) : json;
    Object.assign(this, data);
    return this;
  }

  // MAIA_INTEGRATION_POINT: Hydrate from a Maia Learning API response payload.
  // Expected shape mirrors Maia's "learner_profile" object.
  static fromMaiaData(maiaPayload) {
    const sheet = new CharacterSheet();
    // TODO: map maiaPayload fields to CharacterSheet properties
    // sheet.name = maiaPayload.learner.displayName;
    // sheet.lifeGoals = maiaPayload.interests.topTwo;
    // etc.
    console.warn("fromMaiaData() not yet implemented — using placeholder data.");
    return sheet;
  }

  // --- Display helpers ---

  getDisplayName() {
    return this.name || "Unknown Traveler";
  }

  getSummary() {
    return {
      traveler:    this.getDisplayName(),
      topGoal:     this.lifeGoals[0]          || "Uncharted",
      topValue:    this.careerValues[0]        || "Uncharted",
      destinyPath: this.foretoldSignposts[0]   || "Uncharted"
    };
  }

  isComplete() {
    return (
      this.name.trim().length > 0 &&
      this.lifeGoals.length >= 2 &&
      this.careerValues.length >= 3 &&
      Object.keys(this.workspacePreferences).length >= 5 &&
      Object.keys(this.skillRatings).length > 0
    );
  }

  // --- Career cluster scoring ---
  // Tallies scores across all four assessments and picks the top 3 clusters.
  //
  // MAIA_INTEGRATION_POINT: This algorithm is a standalone prototype.
  // In production, scoring logic lives in Maia's backend. The client would
  // POST the raw assessment data and receive foretoldSignposts in the response.
  computeForetoldSignposts() {
    const scores = {};
    CAREER_CLUSTERS.forEach(c => (scores[c] = 0));

    // Life Goals — top pick worth 3pts, second pick worth 2pts
    this.lifeGoals.forEach((goal, i) => {
      const weight = i === 0 ? 3 : 2;
      (GOAL_TO_CLUSTERS[goal] || []).forEach(c => (scores[c] += weight));
    });

    // Career Values — ranked 3/2/1 pts
    this.careerValues.forEach((val, i) => {
      const weight = 3 - i;
      (VALUE_TO_CLUSTERS[val] || []).forEach(c => (scores[c] += weight));
    });

    // Skills — only high-rated skills (4+) contribute; weight = rating value
    Object.entries(this.skillRatings).forEach(([skill, rating]) => {
      if (rating >= 4) {
        (SKILL_TO_CLUSTERS[skill] || []).forEach(c => (scores[c] += rating));
      }
    });

    // Workspace preference nudges (minor adjustments)
    const prefs = this.workspacePreferences;
    if (prefs.setting === "outdoor")  scores["Environment & Agriculture"] += 2;
    if (prefs.setting === "lab")      scores["Science & Technology"]       += 2;
    if (prefs.setting === "varied")   scores["Hospitality & Tourism"]      += 1;
    if (prefs.pace   === "dynamic")   scores["Business & Management"]      += 1;
    if (prefs.structure === "structured") scores["Finance & Accounting"]   += 1;

    this.foretoldSignposts = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cluster]) => cluster);

    this.completedAt = new Date().toISOString();
    return this.foretoldSignposts;
  }

  // Returns a human-readable plain-text export of the full sheet
  toTextExport() {
    const line = (label, val) => `  ${label}: ${val}`;
    const prefs = this.workspacePreferences;
    const skills = Object.entries(this.skillRatings)
      .sort((a, b) => b[1] - a[1])
      .map(([s, r]) => `${s} (${"★".repeat(r)}${"☆".repeat(5 - r)})`)
      .join(", ");

    return [
      "╔══════════════════════════════════════╗",
      "║        SCROLL OF DESTINY             ║",
      "╚══════════════════════════════════════╝",
      "",
      `TRAVELER: ${this.getDisplayName()}`,
      "",
      "── LIFE GOALS ──",
      ...this.lifeGoals.map((g, i) => `  ${i + 1}. ${g}`),
      "",
      "── CAREER VALUES ──",
      ...this.careerValues.map((v, i) => `  ${i + 1}. ${v}`),
      "",
      "── WORKSPACE PREFERENCES ──",
      line("Location",  prefs.location  || "—"),
      line("Structure", prefs.structure || "—"),
      line("Team Size", prefs.teamSize  || "—"),
      line("Setting",   prefs.setting   || "—"),
      line("Pace",      prefs.pace      || "—"),
      "",
      "── SKILL RATINGS ──",
      `  ${skills}`,
      "",
      "── FORETOLD SIGNPOSTS ──",
      ...this.foretoldSignposts.map((s, i) => `  ${i + 1}. ${s}`),
      "",
      `Created: ${this.createdAt}`,
      `ID: ${this.id}`
    ].join("\n");
  }
}
