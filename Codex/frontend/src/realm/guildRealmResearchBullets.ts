const DEFAULT_BULLETS: readonly [string, string, string] = [
  'What real careers belong to this cluster?',
  'What training, credentials, or apprenticeships appear most often?',
  'Which working conditions fit your expedition style?',
];

const REALM_RESEARCH_BULLETS: Readonly<Record<string, readonly [string, string, string]>> = {
  realm_aethelwood: [
    'What jobs work with land, plants, or animals — like farmer, forester, park ranger, or food scientist?',
    'What hands-on skills matter here — working outdoors, knowing soil and animals, or growing food?',
    'Compare: does working with nature fit your style better than science or building in other realms?',
  ],
  realm_monolith_masonry: [
    'What jobs build or design structures — like carpenter, electrician, architect, or project manager?',
    'What skills matter here — reading blueprints, using tools safely, and understanding materials?',
    'Compare: does this realm lean more toward hands-on building or planning and design work?',
  ],
  realm_chroniclers_spire: [
    'What jobs tell stories or create content — like filmmaker, journalist, graphic designer, or broadcaster?',
    'What skills matter here — writing, drawing, editing video, or speaking in front of an audience?',
    'Compare: does this creative realm match your style better than a technical or science-focused one?',
  ],
  realm_mercantile_citadel: [
    'What jobs run organizations — like manager, HR director, operations specialist, or business analyst?',
    'What skills matter here — organizing teams, planning projects, problem-solving, and communicating?',
    'Compare: does leading and organizing appeal to you more than working directly with people or products?',
  ],
  realm_archives_ascension: [
    'What jobs help others learn — like teacher, trainer, curriculum developer, or school counselor?',
    'What skills matter here — patience, explaining things clearly, and knowing a subject very well?',
    'Compare: does teaching and mentoring fit your style better than doing the same work in another realm?',
  ],
  realm_gilded_vault: [
    'What jobs handle money and planning — like accountant, financial advisor, banker, or budget analyst?',
    'What skills matter here — math, attention to detail, and understanding how money flows and grows?',
    'Compare: does working with numbers and financial planning appeal to you more than other realms?',
  ],
  realm_high_council_hall: [
    'What jobs serve the public — like city planner, policy analyst, elected official, or government administrator?',
    'What skills matter here — understanding laws, working with communities, and making decisions for many people?',
    'Compare: does public service appeal to you, or do you prefer a career inside one organization?',
  ],
  realm_aurora_apothecary: [
    "What jobs help people stay healthy — like doctor, nurse, pharmacist, physical therapist, or lab technician?",
    "What skills matter here — science knowledge, careful attention, and caring about other people's wellbeing?",
    "Compare: does this realm match the Empath's Enclave — or are the career paths different in key ways?",
  ],
  realm_crossroads_haven: [
    'What jobs welcome and serve others — like hotel manager, travel agent, event planner, or restaurant chef?',
    'What skills matter here — customer service, staying calm under pressure, and knowing what people need?',
    'Compare: does a career built around experiences and service fit your style?',
  ],
  realm_empaths_enclave: [
    'What jobs support people in need — like social worker, counselor, childcare provider, or community organizer?',
    'What skills matter here — listening carefully, showing empathy, and connecting people with resources?',
    "Compare: how is this realm similar to or different from the Aurora Apothecary's healthcare careers?",
  ],
  realm_etheric_nexus: [
    'What jobs work with computers and networks — like software developer, cybersecurity analyst, IT support, or data scientist?',
    'What skills matter here — logical thinking, coding, troubleshooting, and keeping systems running?',
    'Compare: does this realm feel more creative or more technical compared to other realms you have explored?',
  ],
  realm_valors_watchtower: [
    'What jobs protect and uphold the law — like police officer, firefighter, lawyer, corrections officer, or security specialist?',
    'What skills matter here — staying calm in emergencies, physical fitness, and understanding rules and rights?',
    'Compare: how does a career in safety and law compare to public service in the High Council Hall?',
  ],
  realm_vulcanis_forge: [
    'What jobs make and produce things — like machinist, quality inspector, production supervisor, or industrial engineer?',
    'What skills matter here — working with machinery, following safety procedures, and solving production problems?',
    'Compare: does hands-on manufacturing fit your style, or would you prefer design and construction?',
  ],
  realm_bards_beacon: [
    'What jobs promote ideas and products — like marketing manager, social media strategist, copywriter, or brand designer?',
    'What skills matter here — creativity, understanding audiences, storytelling, and analyzing what works?',
    "Compare: how does marketing in this realm compare to the storytelling focus of the Chronicler's Spire?",
  ],
  realm_alchemical_observatory: [
    'What jobs investigate and build knowledge — like scientist, engineer, mathematician, researcher, or data analyst?',
    'What skills matter here — curiosity, math and science, experimenting carefully, and solving complex problems?',
    'Compare: does this realm call to you, or do you prefer applying science in health or manufacturing?',
  ],
  realm_odyssey_harbor: [
    'What jobs move people and goods — like logistics coordinator, pilot, supply chain manager, or transportation planner?',
    'What skills matter here — organization, problem-solving under time pressure, and understanding routes and systems?',
    'Compare: does keeping everything moving and connected appeal to you more than working in one place?',
  ],
};

export function getRealmResearchBullets(realmId: string): readonly string[] {
  return REALM_RESEARCH_BULLETS[realmId] ?? DEFAULT_BULLETS;
}
