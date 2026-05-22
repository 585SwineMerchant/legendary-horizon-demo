// =============================================================================
// config.js — All game data: lists, mappings, and dialogue
// Integration point: career cluster lists and mappings can be overridden by
// Maia Learning backend data. See MAIA_INTEGRATION_POINTS below.
// =============================================================================

const LIFE_GOALS = [
  "Adventure & Exploration",
  "Financial Security",
  "Creative Expression",
  "Helping Others",
  "Leadership & Influence",
  "Recognition & Fame",
  "Family & Deep Relationships",
  "Personal Growth",
  "Making a Real Difference",
  "Building Something New",
  "Knowledge & Learning",
  "Freedom & Independence"
];

const CAREER_VALUES = [
  "Autonomy",
  "Collaboration",
  "Recognition",
  "Security & Stability",
  "Innovation",
  "Community Impact",
  "Career Advancement",
  "Work-Life Balance",
  "Creativity",
  "Leadership",
  "Challenge & Growth",
  "Making a Difference"
];

const WORKER_SKILLS = [
  "Communication",
  "Problem Solving",
  "Technical Skills",
  "Leadership",
  "Creativity",
  "Attention to Detail",
  "Teamwork",
  "Critical Thinking",
  "Organization",
  "Adaptability",
  "Research",
  "Empathy"
];

// MAIA_INTEGRATION_POINT: Replace these cluster names with Maia's official
// career cluster taxonomy if needed.
const CAREER_CLUSTERS = [
  "Arts, Media & Communication",
  "Business & Management",
  "Science & Technology",
  "Health & Human Services",
  "Education & Training",
  "Law & Public Service",
  "Architecture & Engineering",
  "Environment & Agriculture",
  "Hospitality & Tourism",
  "Finance & Accounting",
  "Information Technology",
  "Manufacturing & Trades"
];

// Cluster icons (emoji) for Scroll of Destiny display
const CLUSTER_ICONS = {
  "Arts, Media & Communication":  "🎨",
  "Business & Management":        "💼",
  "Science & Technology":         "🔬",
  "Health & Human Services":      "❤️",
  "Education & Training":         "📚",
  "Law & Public Service":         "⚖️",
  "Architecture & Engineering":   "🏛️",
  "Environment & Agriculture":    "🌿",
  "Hospitality & Tourism":        "✈️",
  "Finance & Accounting":         "💰",
  "Information Technology":       "💻",
  "Manufacturing & Trades":       "⚙️"
};

// MAIA_INTEGRATION_POINT: These mappings translate assessment responses to
// career cluster scores. In a full integration, Maia's backend would supply
// these weights based on its validated psychometric model.
const GOAL_TO_CLUSTERS = {
  "Adventure & Exploration":      ["Environment & Agriculture", "Hospitality & Tourism", "Science & Technology"],
  "Financial Security":           ["Finance & Accounting", "Business & Management", "Information Technology"],
  "Creative Expression":          ["Arts, Media & Communication", "Architecture & Engineering", "Education & Training"],
  "Helping Others":               ["Health & Human Services", "Education & Training", "Law & Public Service"],
  "Leadership & Influence":       ["Business & Management", "Law & Public Service", "Education & Training"],
  "Recognition & Fame":           ["Arts, Media & Communication", "Business & Management", "Hospitality & Tourism"],
  "Family & Deep Relationships":  ["Health & Human Services", "Education & Training", "Law & Public Service"],
  "Personal Growth":              ["Education & Training", "Health & Human Services", "Science & Technology"],
  "Making a Real Difference":     ["Law & Public Service", "Health & Human Services", "Environment & Agriculture"],
  "Building Something New":       ["Architecture & Engineering", "Information Technology", "Manufacturing & Trades"],
  "Knowledge & Learning":         ["Science & Technology", "Education & Training", "Information Technology"],
  "Freedom & Independence":       ["Arts, Media & Communication", "Information Technology", "Environment & Agriculture"]
};

const VALUE_TO_CLUSTERS = {
  "Autonomy":              ["Information Technology", "Arts, Media & Communication", "Environment & Agriculture"],
  "Collaboration":         ["Health & Human Services", "Education & Training", "Business & Management"],
  "Recognition":           ["Arts, Media & Communication", "Business & Management", "Hospitality & Tourism"],
  "Security & Stability":  ["Law & Public Service", "Finance & Accounting", "Health & Human Services"],
  "Innovation":            ["Science & Technology", "Information Technology", "Architecture & Engineering"],
  "Community Impact":      ["Law & Public Service", "Health & Human Services", "Education & Training"],
  "Career Advancement":    ["Business & Management", "Finance & Accounting", "Law & Public Service"],
  "Work-Life Balance":     ["Education & Training", "Health & Human Services", "Environment & Agriculture"],
  "Creativity":            ["Arts, Media & Communication", "Architecture & Engineering", "Information Technology"],
  "Leadership":            ["Business & Management", "Law & Public Service", "Education & Training"],
  "Challenge & Growth":    ["Science & Technology", "Information Technology", "Manufacturing & Trades"],
  "Making a Difference":   ["Health & Human Services", "Law & Public Service", "Environment & Agriculture"]
};

const SKILL_TO_CLUSTERS = {
  "Communication":        ["Arts, Media & Communication", "Education & Training", "Business & Management"],
  "Problem Solving":      ["Science & Technology", "Information Technology", "Architecture & Engineering"],
  "Technical Skills":     ["Information Technology", "Manufacturing & Trades", "Science & Technology"],
  "Leadership":           ["Business & Management", "Law & Public Service", "Education & Training"],
  "Creativity":           ["Arts, Media & Communication", "Architecture & Engineering", "Information Technology"],
  "Attention to Detail":  ["Finance & Accounting", "Manufacturing & Trades", "Law & Public Service"],
  "Teamwork":             ["Health & Human Services", "Business & Management", "Education & Training"],
  "Critical Thinking":    ["Science & Technology", "Law & Public Service", "Finance & Accounting"],
  "Organization":         ["Business & Management", "Finance & Accounting", "Education & Training"],
  "Adaptability":         ["Hospitality & Tourism", "Health & Human Services", "Arts, Media & Communication"],
  "Research":             ["Science & Technology", "Law & Public Service", "Information Technology"],
  "Empathy":              ["Health & Human Services", "Education & Training", "Hospitality & Tourism"]
};

// Workspace preference question definitions
const WORKSPACE_QUESTIONS = [
  {
    id: "location",
    question: "Where do you work best?",
    icon: "🗺️",
    options: [
      { value: "in-person",  label: "In-Person",  desc: "A physical workplace with colleagues", icon: "🏢" },
      { value: "remote",     label: "Remote",      desc: "Working from home or anywhere I choose", icon: "🏠" },
      { value: "hybrid",     label: "Hybrid",      desc: "A blend of both worlds", icon: "🌐" }
    ]
  },
  {
    id: "structure",
    question: "How do you prefer your work to be structured?",
    icon: "⚙️",
    options: [
      { value: "structured", label: "Structured",  desc: "Clear schedules and defined tasks", icon: "📋" },
      { value: "flexible",   label: "Flexible",    desc: "Free to work how and when I choose", icon: "🌊" },
      { value: "balanced",   label: "Balanced",    desc: "Some structure, some freedom", icon: "⚖️" }
    ]
  },
  {
    id: "teamSize",
    question: "What's your ideal team size?",
    icon: "👥",
    options: [
      { value: "solo",       label: "Solo",        desc: "Mostly working independently", icon: "🧍" },
      { value: "small",      label: "Small Team",  desc: "A close-knit group of 2–8 people", icon: "👥" },
      { value: "large",      label: "Large Org",   desc: "A big organization with many people", icon: "🏟️" }
    ]
  },
  {
    id: "setting",
    question: "What work environment energizes you?",
    icon: "✨",
    options: [
      { value: "office",   label: "Office / Studio",  desc: "Indoor workspace with resources", icon: "🏢" },
      { value: "outdoor",  label: "Outdoors",          desc: "Working in nature or on-site", icon: "🌿" },
      { value: "lab",      label: "Lab / Workshop",    desc: "Specialized technical environment", icon: "🔬" },
      { value: "varied",   label: "Always Changing",   desc: "No two days in the same place", icon: "🎭" }
    ]
  },
  {
    id: "pace",
    question: "What pace of work feels right to you?",
    icon: "⚡",
    options: [
      { value: "steady",   label: "Steady",    desc: "Predictable rhythm, deep focus work", icon: "🌊" },
      { value: "dynamic",  label: "Dynamic",   desc: "Fast-paced, energizing, always moving", icon: "⚡" },
      { value: "project",  label: "Project-Based", desc: "Intense bursts, then recovery", icon: "🎯" }
    ]
  }
];

// Narrator dialogue for each scene transition
const NARRATOR_DIALOGUE = {
  intro: [
    "Welcome, Traveler.",
    "I am the Master Scribe — keeper of the Great Book of Destinies.",
    "Before your journey begins, you must undergo the Ritual of Revelation. A sacred practice that uncovers the path the Fates have woven for you.",
    "Answer truly, and your Scroll of Destiny shall guide you well. Answer falsely, and you walk in fog.",
    "Tell me your name, that I may inscribe it in the Great Book."
  ],

  beforeActivity1: [
    "Ah, {name}. A fitting name for a Traveler of destiny.",
    "The first trial is the Tournament of Hearts.",
    "You shall be presented with pairs of life's deepest aspirations. Choose which calls to you more truly.",
    "Through this crucible of choice, your truest desires shall emerge. Choose honestly — the Fates are watching."
  ],

  beforeActivity2: [
    "Well chosen, {name}. Your heart speaks clearly.",
    "Now the second trial awaits: the Trial of Values.",
    "In the realm of craft and labor, what matters most to your spirit? Again, choose between pairs.",
    "For in these choices, your deepest career values are revealed."
  ],

  beforeActivity3: [
    "Your values are written in the stars now.",
    "The third trial is the Rite of Environment.",
    "Tell me, Traveler — where and how do you thrive? The world offers many settings for one's craft.",
    "Answer each question as it calls to you."
  ],

  beforeActivity4: [
    "You know where you would build your life's work. Well done.",
    "Now for the final trial: the Reckoning of Skills.",
    "Look honestly upon your abilities — not what you wish to be, but what you ARE.",
    "Mark your strengths truthfully. But take heed: only THREE may shine as your greatest gifts.",
    "Choose wisely."
  ],

  scrollReveal: [
    "It is done.",
    "The ritual is complete.",
    "Gaze now upon your Scroll of Destiny — the truth of who you are, and what paths the Fates have illuminated for you.",
    "Three Signposts mark your destined roads. Study them well.",
    "Your adventure... begins NOW."
  ]
};
