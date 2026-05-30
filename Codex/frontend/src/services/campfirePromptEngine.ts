/**
 * Campfire Prompt Engine — Fireside Reflection Prompt Bank v1 (104 prompts).
 *
 * Priority order (highest first):
 *   100 — Teacher-assigned (passed via LhRuntimeFixture.session_config.campfire_prompt)
 *    90 — Major quest milestone (dynamic — not in static bank)
 *    80 — Special situational (absence, stuck, save-first-time)
 *    70 — Act-specific
 *    60 — Guild / realm-specific
 *    50 — Curriculum (career exploration themes)
 *    20 — Growth / SEL / lore
 *
 * Selection algorithm:
 *   1. Exclude recently used prompt IDs (last 10, rolling cooldown).
 *   2. Among remaining, filter eligible candidates by conditions (act, guild).
 *   3. Sort by priority DESC; LRU within same-priority bucket.
 *   4. Return top candidate.
 */

export type CampfirePrompt = {
  id: string;
  priority: number;
  /** Restricts prompt to a specific act number; 0 = any act. */
  act?: number;
  /** Restricts prompt to a specific guild realm_id; undefined = any realm. */
  guild_id?: string;
  category: 'special' | 'act' | 'guild' | 'curriculum' | 'growth';
  text: string;
};

// ─── Static Prompt Bank ────────────────────────────────────────────────────

/** All 104 static prompts. Teacher-assigned (priority 100) is dynamic and not here. */
export const CAMPFIRE_PROMPT_BANK: readonly CampfirePrompt[] = [
  // ── Priority 80 — Special Situational ───────────────────────────────────
  {
    id: 'REF_SPECIAL_ABSENCE_001',
    priority: 80,
    category: 'special',
    text: "You've returned to the realms after time away. Describe one thing you remember from before your absence, and one thing that feels new or changed now that you're back.",
  },
  {
    id: 'REF_SPECIAL_STUCK_001',
    priority: 80,
    category: 'special',
    text: "Every Traveler hits a point where the path feels unclear. Describe what's making it hard to move forward, and name one small step you could take tomorrow.",
  },
  {
    id: 'REF_SPECIAL_SAVE_001',
    priority: 80,
    category: 'special',
    text: "You've just made camp for the first time. Describe what the Legendary Horizon is — in your own words — and what you're hoping to find here.",
  },

  // ── Priority 70 — Act 1 ─────────────────────────────────────────────────
  {
    id: 'REF_ACT1_001',
    priority: 70,
    act: 1,
    category: 'act',
    text: 'What did the Traveler\'s Survey reveal about you today? Was there anything that surprised you, or anything that felt exactly right?',
  },
  {
    id: 'REF_ACT1_002',
    priority: 70,
    act: 1,
    category: 'act',
    text: 'Describe one career or guild you encountered for the first time today. What was the most interesting thing you learned about it?',
  },
  {
    id: 'REF_ACT1_003',
    priority: 70,
    act: 1,
    category: 'act',
    text: "The Scroll of Destiny holds your Foretold Signposts. What does it feel like to see those guild names written down? Do any of them surprise you?",
  },
  {
    id: 'REF_ACT1_004',
    priority: 70,
    act: 1,
    category: 'act',
    text: 'The Master Scribe says your Holland Code profile reveals something true about you. Do you agree? Explain one code that fits — and one you are still questioning.',
  },
  {
    id: 'REF_ACT1_005',
    priority: 70,
    act: 1,
    category: 'act',
    text: 'What is one question you have about the realms that you haven\'t been able to answer yet? Where do you think you might find that answer?',
  },
  {
    id: 'REF_ACT1_006',
    priority: 70,
    act: 1,
    category: 'act',
    text: 'A Traveler\'s first season is about discovery, not decision. What have you discovered about yourself today that you want to carry forward?',
  },
  {
    id: 'REF_ACT1_007',
    priority: 70,
    act: 1,
    category: 'act',
    text: "Describe one real-world career that connects to something you explored in today's session. What's the connection?",
  },

  // ── Priority 70 — Act 2 ─────────────────────────────────────────────────
  {
    id: 'REF_ACT2_001',
    priority: 70,
    act: 2,
    category: 'act',
    text: 'You are now deep in comparison work. Describe one finding from your Comparison Ledger today — what surprised you about the two career paths you examined?',
  },
  {
    id: 'REF_ACT2_002',
    priority: 70,
    act: 2,
    category: 'act',
    text: "When you compare two careers side by side, what factors matter most to you — salary, daily tasks, education required, or something else? Why?",
  },
  {
    id: 'REF_ACT2_003',
    priority: 70,
    act: 2,
    category: 'act',
    text: "The fog is lifting on the World Atlas. Which realm feels most like home to you right now, and why?",
  },
  {
    id: 'REF_ACT2_004',
    priority: 70,
    act: 2,
    category: 'act',
    text: 'What is one career you used to think you understood, but now — after comparing it to another — you see differently?',
  },
  {
    id: 'REF_ACT2_005',
    priority: 70,
    act: 2,
    category: 'act',
    text: 'Describe a moment from today\'s session where something from the real world appeared in your exploration. How did it feel to see that connection?',
  },
  {
    id: 'REF_ACT2_006',
    priority: 70,
    act: 2,
    category: 'act',
    text: 'The Comparison Ledger asks you to hold two possibilities in your mind at once. What\'s one question you still have about each of the paths you\'re comparing?',
  },

  // ── Priority 70 — Act 3 ─────────────────────────────────────────────────
  {
    id: 'REF_ACT3_001',
    priority: 70,
    act: 3,
    category: 'act',
    text: 'You have entered a guild\'s territory. What did you discover about what this career field actually looks like day-to-day?',
  },
  {
    id: 'REF_ACT3_002',
    priority: 70,
    act: 3,
    category: 'act',
    text: 'Describe a moment today where the work felt difficult or confusing. What did you do to work through it — or what would you try next time?',
  },
  {
    id: 'REF_ACT3_003',
    priority: 70,
    act: 3,
    category: 'act',
    text: 'Which piece of research you\'ve done so far feels most real — most connected to actual work people do every day? Describe it.',
  },
  {
    id: 'REF_ACT3_004',
    priority: 70,
    act: 3,
    category: 'act',
    text: 'Name one skill you think you would need to develop to work in the realm you are currently exploring. How might you begin developing it?',
  },
  {
    id: 'REF_ACT3_005',
    priority: 70,
    act: 3,
    category: 'act',
    text: 'You have been researching a guild. If you could ask the Guild Manager one question right now, what would it be?',
  },
  {
    id: 'REF_ACT3_006',
    priority: 70,
    act: 3,
    category: 'act',
    text: "The realms are getting more specific. What's one thing you learned today that changed or deepened how you think about the career path you're researching?",
  },
  {
    id: 'REF_ACT3_007',
    priority: 70,
    act: 3,
    category: 'act',
    text: 'Describe your Foretold Signposts. Which one feels strongest right now, and why?',
  },

  // ── Priority 70 — Act 4 ─────────────────────────────────────────────────
  {
    id: 'REF_ACT4_001',
    priority: 70,
    act: 4,
    category: 'act',
    text: 'You have chosen a guild to apply to. What made you choose it over the others you explored?',
  },
  {
    id: 'REF_ACT4_002',
    priority: 70,
    act: 4,
    category: 'act',
    text: 'The Enrollment Rune asked you to describe your strengths. How did it feel to write about yourself in that way?',
  },
  {
    id: 'REF_ACT4_003',
    priority: 70,
    act: 4,
    category: 'act',
    text: 'What is one thing you wish you had done differently in your guild research, now that you\'re at the application stage?',
  },
  {
    id: 'REF_ACT4_004',
    priority: 70,
    act: 4,
    category: 'act',
    text: 'Describe one moment from this entire journey where something clicked — where you truly understood something about yourself or about a career path.',
  },
  {
    id: 'REF_ACT4_005',
    priority: 70,
    act: 4,
    category: 'act',
    text: 'You are preparing for a guild interview. What is one thing you are nervous about — and one thing you feel genuinely ready for?',
  },
  {
    id: 'REF_ACT4_006',
    priority: 70,
    act: 4,
    category: 'act',
    text: 'What does "success" look like for you at the end of this journey? Has your definition of success changed since you began?',
  },

  // ── Priority 70 — Act 5 ─────────────────────────────────────────────────
  {
    id: 'REF_ACT5_001',
    priority: 70,
    act: 5,
    category: 'act',
    text: 'You are nearing the end of your first journey. Name three things you know about yourself now that you didn\'t know when you arrived in the realms.',
  },
  {
    id: 'REF_ACT5_002',
    priority: 70,
    act: 5,
    category: 'act',
    text: 'If you could give advice to a brand-new Traveler starting this journey, what would you tell them?',
  },
  {
    id: 'REF_ACT5_003',
    priority: 70,
    act: 5,
    category: 'act',
    text: 'Describe the one moment in your whole journey that you are most proud of. What made it meaningful?',
  },
  {
    id: 'REF_ACT5_004',
    priority: 70,
    act: 5,
    category: 'act',
    text: 'What is one question about your future that this journey has answered — and one question it has raised that you are now carrying forward?',
  },
  {
    id: 'REF_ACT5_005',
    priority: 70,
    act: 5,
    category: 'act',
    text: 'How has your idea of what you want to do "when you grow up" shifted over the course of this journey?',
  },
  {
    id: 'REF_ACT5_006',
    priority: 70,
    act: 5,
    category: 'act',
    text: 'The final campfire. What will you carry out of the Legendary Horizon that you will actually use in your real life?',
  },

  // ── Priority 70 — Epilogue ──────────────────────────────────────────────
  {
    id: 'REF_EPILOGUE_001',
    priority: 70,
    act: 6,
    category: 'act',
    text: 'The journey is complete. Write a letter to your future self, describing what you explored, what you decided, and what you still wonder about.',
  },
  {
    id: 'REF_EPILOGUE_002',
    priority: 70,
    act: 6,
    category: 'act',
    text: 'You have been accepted into a guild. What is the next real step you will take — tomorrow, this week — toward the career path you have chosen?',
  },

  // ── Priority 60 — Guild Prompts ─────────────────────────────────────────
  // Aethelwood (Agriculture / Environmental)
  { id: 'REF_GUILD_AETH_001', priority: 60, guild_id: 'realm_aethelwood', category: 'guild', text: 'The Aethelwood Farmsteads grow crops that feed the realm. How do you feel about work that is physically demanding and connected to living systems?' },
  { id: 'REF_GUILD_AETH_002', priority: 60, guild_id: 'realm_aethelwood', category: 'guild', text: 'Environmental science and agriculture require patience — seasons move slowly. Describe a time when patience helped you produce better results.' },
  // Ironveil (Manufacturing / Engineering)
  { id: 'REF_GUILD_IRON_001', priority: 60, guild_id: 'realm_ironveil', category: 'guild', text: 'The Ironveil Forge turns raw ore into precision tools. What does it mean to you to "build something that lasts"?' },
  { id: 'REF_GUILD_IRON_002', priority: 60, guild_id: 'realm_ironveil', category: 'guild', text: 'Manufacturing jobs are changing fast because of technology. What skills do you think will still matter no matter how much automation arrives?' },
  // Maretide (Hospitality / Tourism)
  { id: 'REF_GUILD_MARE_001', priority: 60, guild_id: 'realm_maretide', category: 'guild', text: 'Maretide thrives on people feeling welcome and cared for. How important is that kind of work to you — making others feel good?' },
  { id: 'REF_GUILD_MARE_002', priority: 60, guild_id: 'realm_maretide', category: 'guild', text: 'Hospitality and tourism can mean long hours and irregular schedules. How do you think about work-life balance when considering a career?' },
  // Scrollreach (Education / Library / Information)
  { id: 'REF_GUILD_SCRL_001', priority: 60, guild_id: 'realm_scrollreach', category: 'guild', text: 'The Scrollreach Archive preserves knowledge for future generations. What do you think is the most important thing to preserve — and why?' },
  { id: 'REF_GUILD_SCRL_002', priority: 60, guild_id: 'realm_scrollreach', category: 'guild', text: 'Working in education means your success is measured by others\' growth. How would it feel to have your impact show up years later, in someone else?' },
  // Cindermaw (Energy / Industrial)
  { id: 'REF_GUILD_CIND_001', priority: 60, guild_id: 'realm_cindermaw', category: 'guild', text: 'Energy workers keep modern life running — but the industry is transforming rapidly. If you worked in energy, where would you want to focus?' },
  { id: 'REF_GUILD_CIND_002', priority: 60, guild_id: 'realm_cindermaw', category: 'guild', text: 'Industrial and energy careers often involve safety-critical decisions. Describe a situation where being precise and careful mattered a great deal.' },
  // Brambleholt (Veterinary / Animal Science)
  { id: 'REF_GUILD_BRAM_001', priority: 60, guild_id: 'realm_brambleholt', category: 'guild', text: 'The Brambleholt Sanctuary cares for creatures of all kinds. Why do you think humans\' relationship with animals matters for career exploration?' },
  { id: 'REF_GUILD_BRAM_002', priority: 60, guild_id: 'realm_brambleholt', category: 'guild', text: 'Veterinary work can be emotionally demanding — you care deeply and sometimes cannot save every animal. How do you take care of yourself when things don\'t go the way you hoped?' },
  // Emberveil (Government / Public Administration)
  { id: 'REF_GUILD_EMBV_001', priority: 60, guild_id: 'realm_emberveil', category: 'guild', text: 'Public servants work for everyone — even people who disagree with them. What does "serving the public good" mean to you?' },
  { id: 'REF_GUILD_EMBV_002', priority: 60, guild_id: 'realm_emberveil', category: 'guild', text: 'Government work often moves slowly because it must be fair and accountable. How do you feel about working in a system with lots of rules?' },
  // Thalassic (Marine Science / Oceanography)
  { id: 'REF_GUILD_THAL_001', priority: 60, guild_id: 'realm_thalassic', category: 'guild', text: 'The ocean covers 70% of the Earth and most of it remains unexplored. What draws you toward — or away from — work that involves discovery in unknown territory?' },
  { id: 'REF_GUILD_THAL_002', priority: 60, guild_id: 'realm_thalassic', category: 'guild', text: 'Marine science often requires fieldwork in remote or challenging conditions. How important is where you work — not just what you do — in your career thinking?' },
  // Duskhollow (Mental Health / Social Work)
  { id: 'REF_GUILD_DUSK_001', priority: 60, guild_id: 'realm_duskhollow', category: 'guild', text: 'Supporting others through hard times is some of the most important work there is. What personal qualities do you think make someone good at it?' },
  { id: 'REF_GUILD_DUSK_002', priority: 60, guild_id: 'realm_duskhollow', category: 'guild', text: 'Mental health and social work are emotionally demanding careers. What does self-care mean to you — and how do you currently practice it?' },
  // Gildencrest (Finance / Banking)
  { id: 'REF_GUILD_GILD_001', priority: 60, guild_id: 'realm_gildencrest', category: 'guild', text: 'Finance affects every part of society — from personal savings to global markets. What aspect of finance feels most meaningful to you to work on?' },
  { id: 'REF_GUILD_GILD_002', priority: 60, guild_id: 'realm_gildencrest', category: 'guild', text: 'Working with money requires precision and trustworthiness. Describe one time when being careful or accurate made a real difference.' },
  // Verdant Spire (Architecture / Landscape Design)
  { id: 'REF_GUILD_VERD_001', priority: 60, guild_id: 'realm_verdant_spire', category: 'guild', text: 'Architecture shapes how people live and move through the world. If you designed one building that would stand for 100 years, what would it be for?' },
  { id: 'REF_GUILD_VERD_002', priority: 60, guild_id: 'realm_verdant_spire', category: 'guild', text: 'Design requires balancing beauty and function. Describe something in your life that is beautiful AND practical — what makes it work on both levels?' },
  // Pyretheon (Emergency Services / Public Safety)
  { id: 'REF_GUILD_PYRE_001', priority: 60, guild_id: 'realm_pyretheon', category: 'guild', text: 'Emergency responders train for situations they hope never happen. How do you feel about preparing intensely for rare, high-stakes moments?' },
  { id: 'REF_GUILD_PYRE_002', priority: 60, guild_id: 'realm_pyretheon', category: 'guild', text: 'Working in public safety means high stress and quick decisions. What helps you stay calm and think clearly when pressure is high?' },
  // Runespark (Technology / IT)
  { id: 'REF_GUILD_RUNE_001', priority: 60, guild_id: 'realm_runespark', category: 'guild', text: 'Technology changes faster than almost any other industry. How do you feel about constant learning and reinventing your skills throughout your career?' },
  { id: 'REF_GUILD_RUNE_002', priority: 60, guild_id: 'realm_runespark', category: 'guild', text: 'Describe a problem you solved using technology — even a simple one. What did that feel like, and did it make you want to do more?' },
  // Sunhallow (Healthcare / Medicine)
  { id: 'REF_GUILD_SUNH_001', priority: 60, guild_id: 'realm_sunhallow', category: 'guild', text: 'Healthcare workers see people at their most vulnerable. What qualities do you think are essential for someone who works in that space?' },
  { id: 'REF_GUILD_SUNH_002', priority: 60, guild_id: 'realm_sunhallow', category: 'guild', text: 'Medicine and health science are always evolving. Describe something in healthcare that has changed in your lifetime that you think is important.' },
  // Cinderlight (Arts / Media / Communication)
  { id: 'REF_GUILD_CINL_001', priority: 60, guild_id: 'realm_cinderlight', category: 'guild', text: 'Creative work often feels personal — your ideas become public. How do you feel about sharing creative work and receiving feedback on it?' },
  { id: 'REF_GUILD_CINL_002', priority: 60, guild_id: 'realm_cinderlight', category: 'guild', text: 'The arts and media shape culture — what people believe, value, and dream about. If you could use creative work to change one thing in the world, what would it be?' },
  // Stonemarch (Law / Criminal Justice)
  { id: 'REF_GUILD_STON_001', priority: 60, guild_id: 'realm_stonemarch', category: 'guild', text: 'The law governs how society functions together. What does fairness mean to you — and do you think the current system achieves it?' },
  { id: 'REF_GUILD_STON_002', priority: 60, guild_id: 'realm_stonemarch', category: 'guild', text: 'Legal and criminal justice careers often involve complex ethical decisions. Describe a situation where you had to choose between two difficult options.' },

  // ── Priority 50 — Curriculum ────────────────────────────────────────────
  {
    id: 'REF_CURR_001',
    priority: 50,
    category: 'curriculum',
    text: 'Career planning is about knowing yourself as much as knowing the job market. What have you learned about yourself — your strengths, values, or interests — that has surprised you?',
  },
  {
    id: 'REF_CURR_002',
    priority: 50,
    category: 'curriculum',
    text: 'Describe one career that seemed interesting from the outside but, after researching it, you decided was not for you. What did you discover?',
  },
  {
    id: 'REF_CURR_003',
    priority: 50,
    category: 'curriculum',
    text: 'Education pathways look different for every career. For the path you are most interested in — what are the next educational steps, and how do you feel about them?',
  },
  {
    id: 'REF_CURR_004',
    priority: 50,
    category: 'curriculum',
    text: 'What does financial stability mean to you in a career? How much does salary matter compared to other factors like purpose, schedule, or growth?',
  },
  {
    id: 'REF_CURR_005',
    priority: 50,
    category: 'curriculum',
    text: 'Think about someone in your life who has a career you admire. What is it about their work — not just their title — that you find meaningful?',
  },

  // ── Priority 20 — Growth / SEL / Lore ───────────────────────────────────
  {
    id: 'REF_GROW_001',
    priority: 20,
    category: 'growth',
    text: 'Describe one thing you discovered today in the realms, and one question you are still carrying with you.',
  },
  {
    id: 'REF_GROW_002',
    priority: 20,
    category: 'growth',
    text: 'What is one small thing you did today that you are proud of — even if no one else noticed?',
  },
  {
    id: 'REF_GROW_003',
    priority: 20,
    category: 'growth',
    text: 'The Legendary Horizon is a metaphor — a world where exploration and discovery never stop. What does that metaphor mean to you in real life?',
  },
  {
    id: 'REF_GROW_004',
    priority: 20,
    category: 'growth',
    text: 'What is something you find genuinely difficult about this class or this exploration — not the hard work kind of difficult, but the uncomfortable kind?',
  },
  {
    id: 'REF_GROW_005',
    priority: 20,
    category: 'growth',
    text: 'Describe one person — real or fictional — who has work you admire. What specifically about how they work, not what they do, do you respect?',
  },
  {
    id: 'REF_GROW_006',
    priority: 20,
    category: 'growth',
    text: 'Every Traveler has days where the realms feel far away and the work feels pointless. What do you do — or what could you do — to reconnect with why it matters?',
  },
  {
    id: 'REF_GROW_007',
    priority: 20,
    category: 'growth',
    text: 'If you could add one realm to the Legendary Horizon that doesn\'t exist yet, what would it be — and what careers would it represent?',
  },
  {
    id: 'REF_GROW_008',
    priority: 20,
    category: 'growth',
    text: 'Describe something you want to get better at — a skill, a habit, or a way of thinking. What would "better" actually look like?',
  },
  {
    id: 'REF_GROW_009',
    priority: 20,
    category: 'growth',
    text: 'What has been the hardest moment in your exploration so far — and what did it teach you?',
  },
  {
    id: 'REF_GROW_010',
    priority: 20,
    category: 'growth',
    text: 'The campfire is a place to reflect honestly. What is something you have been avoiding thinking about, that you might benefit from thinking about tonight?',
  },
  {
    id: 'REF_GROW_011',
    priority: 20,
    category: 'growth',
    text: 'Describe one connection you made today — between something in the realms and something in your actual life.',
  },
  {
    id: 'REF_GROW_012',
    priority: 20,
    category: 'growth',
    text: 'What would you tell a younger version of yourself about choosing a career path?',
  },
  {
    id: 'REF_GROW_013',
    priority: 20,
    category: 'growth',
    text: 'Describe one thing in the world outside school that you are genuinely curious about right now. How might it connect to your career path?',
  },
  {
    id: 'REF_GROW_014',
    priority: 20,
    category: 'growth',
    text: 'What does being ready for the future mean to you — not in school terms, but in real-life terms?',
  },
  {
    id: 'REF_GROW_015',
    priority: 20,
    category: 'growth',
    text: 'The Legendary Horizon asks Travelers to be brave — to explore unfamiliar territory. Describe one moment today where you had to be a little brave.',
  },
  {
    id: 'REF_LORE_001',
    priority: 20,
    category: 'growth',
    text: 'The Legendary Horizon has sixteen guilds, each representing a different cluster of careers. After exploring the map today, which corner of it pulls you toward it most — and why?',
  },
  {
    id: 'REF_LORE_002',
    priority: 20,
    category: 'growth',
    text: 'The Scroll of Destiny cannot tell you who you will become — only what you might explore. How do you feel about a future that is still open and undecided?',
  },
  {
    id: 'REF_LORE_003',
    priority: 20,
    category: 'growth',
    text: 'Each realm in the Legendary Horizon has its own lore — history, traditions, and a way of seeing the world. What lore from a guild you visited today stuck with you?',
  },
  {
    id: 'REF_SEL_001',
    priority: 20,
    category: 'growth',
    text: 'Describe one thing that is going well for you right now — in school, at home, or in your own head. What is making it go well?',
  },
  {
    id: 'REF_SEL_002',
    priority: 20,
    category: 'growth',
    text: 'When you imagine yourself five years from now — what does "doing okay" look like? Not perfect, just okay and moving forward.',
  },
] as const;

// ─── Selection Engine ──────────────────────────────────────────────────────

type SelectionContext = {
  /** Current act number (1–6). */
  act: number;
  /** Player's current guild realm_id (e.g. "realm_aethelwood"). */
  guild_id?: string;
  /** Recently used prompt IDs — excluded for cooldown (max last 10). */
  used_prompt_ids?: readonly string[];
  /** Whether the player has been absent (missed last session). */
  is_returning_after_absence?: boolean;
  /** Whether the player appears stuck (no progress on required_next_action for N sessions). */
  is_stuck?: boolean;
  /** Whether this is the very first campfire save for this player. */
  is_first_save?: boolean;
};

const PROMPT_COOLDOWN_SIZE = 10;

/**
 * Selects the best campfire prompt for the current session context.
 *
 * Returns the prompt object, or falls back to REF_GROW_001 (generic) if all
 * guild/act prompts are exhausted. Teacher-assigned prompts are handled by
 * the caller before invoking this function.
 */
export function selectCampfirePrompt(ctx: SelectionContext): CampfirePrompt {
  const used = new Set(ctx.used_prompt_ids ?? []);

  // Situational gates: special prompts at priority 80 override everything below.
  if (ctx.is_returning_after_absence && !used.has('REF_SPECIAL_ABSENCE_001')) {
    return CAMPFIRE_PROMPT_BANK.find((p) => p.id === 'REF_SPECIAL_ABSENCE_001')!;
  }
  if (ctx.is_stuck && !used.has('REF_SPECIAL_STUCK_001')) {
    return CAMPFIRE_PROMPT_BANK.find((p) => p.id === 'REF_SPECIAL_STUCK_001')!;
  }
  if (ctx.is_first_save && !used.has('REF_SPECIAL_SAVE_001')) {
    return CAMPFIRE_PROMPT_BANK.find((p) => p.id === 'REF_SPECIAL_SAVE_001')!;
  }

  // Build candidate list excluding recently used.
  let candidates = CAMPFIRE_PROMPT_BANK.filter((p) => !used.has(p.id));

  // If every prompt has been used recently (very long session streak), clear cooldown.
  if (candidates.length === 0) {
    candidates = [...CAMPFIRE_PROMPT_BANK];
  }

  // Filter: act-specific (must match current act or be unrestricted).
  const actMatch = candidates.filter(
    (p) => p.act === undefined || p.act === ctx.act,
  );

  // Filter: guild-specific (match current guild).
  const guildMatch = actMatch.filter(
    (p) => p.guild_id === undefined || p.guild_id === ctx.guild_id,
  );

  // Sort by priority DESC, then stable (order in array = LRU).
  const pool = guildMatch.length > 0 ? guildMatch : actMatch.length > 0 ? actMatch : candidates;
  const sorted = [...pool].sort((a, b) => b.priority - a.priority);

  return sorted[0] ?? CAMPFIRE_PROMPT_BANK[CAMPFIRE_PROMPT_BANK.length - 1];
}

/**
 * Computes the rolling used-prompt-IDs list after a prompt has been used.
 * Keeps the last N IDs (PROMPT_COOLDOWN_SIZE) to prevent repetition.
 */
export function addUsedPromptId(
  usedIds: readonly string[],
  promptId: string,
): string[] {
  const next = [...usedIds.filter((id) => id !== promptId), promptId];
  return next.slice(-PROMPT_COOLDOWN_SIZE);
}

/**
 * Parses `player.used_campfire_prompt_ids_json` from the save row.
 * Returns empty array on missing or invalid JSON.
 */
export function parseUsedPromptIds(json: string | undefined): string[] {
  if (!json) return [];
  try {
    const parsed: unknown = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === 'string')
      : [];
  } catch {
    return [];
  }
}
