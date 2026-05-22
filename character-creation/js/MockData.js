// =============================================================================
// MockData.js — Generates realistic sample CharacterSheets for testing
// Use MockData.getSheet() to skip the ritual and jump straight to the Scroll.
// =============================================================================

const MockData = (() => {

  // Produces a fully-populated CharacterSheet without user interaction
  function getSheet(nameOverride) {
    const sheet = new CharacterSheet();

    sheet.name = nameOverride || _randomFrom([
      "Aela Brightquill", "Doran Ironscribe", "Mira Stormweave",
      "Caelan Duskborn", "Lyssa Emberveil", "Theron Coldwater"
    ]);

    sheet.lifeGoals = _sample(LIFE_GOALS, 2);
    sheet.careerValues = _sample(CAREER_VALUES, 3);

    // Workspace prefs: pick a random option from each question
    WORKSPACE_QUESTIONS.forEach(q => {
      sheet.workspacePreferences[q.id] = _randomFrom(q.options).value;
    });

    // Skills: assign 1–5 ratings, but only 3 can be 4+
    const shuffled = _shuffle([...WORKER_SKILLS]);
    let highCount = 0;
    shuffled.forEach(skill => {
      let rating;
      if (highCount < 3 && Math.random() > 0.5) {
        rating = _randomInt(4, 5);
        highCount++;
      } else {
        rating = _randomInt(1, 3);
      }
      sheet.skillRatings[skill] = rating;
    });

    sheet.computeForetoldSignposts();
    return sheet;
  }

  // Returns sample tournament responses for activity testing
  function getTournamentResponses(items, topN) {
    return _sample(items, topN);
  }

  // Returns pre-set responses for each activity type
  function getActivityResponses() {
    return {
      lifeGoals:    _sample(LIFE_GOALS, 2),
      careerValues: _sample(CAREER_VALUES, 3),
      workspacePreferences: (() => {
        const prefs = {};
        WORKSPACE_QUESTIONS.forEach(q => {
          prefs[q.id] = _randomFrom(q.options).value;
        });
        return prefs;
      })(),
      skillRatings: (() => {
        const ratings = {};
        let highCount = 0;
        _shuffle([...WORKER_SKILLS]).forEach(skill => {
          if (highCount < 3 && Math.random() > 0.5) {
            ratings[skill] = _randomInt(4, 5);
            highCount++;
          } else {
            ratings[skill] = _randomInt(1, 3);
          }
        });
        return ratings;
      })()
    };
  }

  // --- Utilities ---

  function _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function _sample(arr, n) {
    return _shuffle([...arr]).slice(0, n);
  }

  function _randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function _randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  return { getSheet, getTournamentResponses, getActivityResponses };
})();
