export type CourtGroup='maid'|'eunuch'|'concubine'|'scholar'|'consort'|'general';
/** Original20 identities plus28 additions form the requested48 courtiers.
 * Archetype art is pending; identity and personality never depend on shared meshes. */
export const COURT_EXPANSION = [
  {
    "name": "Maid Ting",
    "group": "maid",
    "brief": "Practical linen keeper; quiet grey-green dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Maid He",
    "group": "maid",
    "brief": "Observant tea attendant; pale sage dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Maid Rou",
    "group": "maid",
    "brief": "Gentle music-room attendant; dusty blue dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Maid Zhu",
    "group": "maid",
    "brief": "Forthright wardrobe attendant; plain beige dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Eunuch Gao",
    "group": "eunuch",
    "brief": "Formal keeper of ceremony; loyal to order",
    "paths": [
      "prince",
      "minister",
      "concubine"
    ]
  },
  {
    "name": "Eunuch Lu",
    "group": "eunuch",
    "brief": "Alert messenger; receptive to reform",
    "paths": [
      "prince",
      "minister",
      "concubine"
    ]
  },
  {
    "name": "Eunuch Ren",
    "group": "eunuch",
    "brief": "Reserved chamber steward; values stability",
    "paths": [
      "prince",
      "minister",
      "concubine"
    ]
  },
  {
    "name": "Eunuch Min",
    "group": "eunuch",
    "brief": "Curious archive attendant; questions tradition",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Eunuch Jin",
    "group": "eunuch",
    "brief": "Cautious treasury attendant; pragmatic loyalty",
    "paths": [
      "prince",
      "minister"
    ]
  },
  {
    "name": "Eunuch Bo",
    "group": "eunuch",
    "brief": "Blunt gate steward; sympathetic to outsiders",
    "paths": [
      "prince"
    ]
  },
  {
    "name": "Eunuch Tian",
    "group": "eunuch",
    "brief": "Watchful palace messenger; court loyalist",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Eunuch Shu",
    "group": "eunuch",
    "brief": "Patient records keeper; quiet reformer",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Concubine An",
    "group": "concubine",
    "brief": "Calm musician; simple pale blue robe",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Concubine Qiao",
    "group": "concubine",
    "brief": "Competitive poet; simple peach robe",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Scholar Qin",
    "group": "scholar",
    "brief": "Careful archivist; blue-grey plain robe",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Scholar Tao",
    "group": "scholar",
    "brief": "Curious reformer; pale ochre plain robe",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Scholar Jia",
    "group": "scholar",
    "brief": "Reserved calligrapher; ink-green plain robe",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Scholar Ren",
    "group": "scholar",
    "brief": "Patient astronomer; slate plain robe",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Scholar Song",
    "group": "scholar",
    "brief": "Outspoken historian; brown plain robe",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Scholar Yu",
    "group": "scholar",
    "brief": "Methodical examiner; grey-blue plain robe",
    "paths": [
      "minister"
    ]
  },
  {
    "name": "Consort Hua",
    "group": "consort",
    "brief": "Court diplomat; peacock-blue dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Consort Zhen",
    "group": "consort",
    "brief": "Protective traditionalist; cream and grey dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Consort Rong",
    "group": "consort",
    "brief": "Ambitious networker; dusty-rose dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "Consort Yue",
    "group": "consort",
    "brief": "Composed patron of music; dark violet dress",
    "paths": [
      "concubine"
    ]
  },
  {
    "name": "General Zhao",
    "group": "general",
    "brief": "Disciplined commander; navy coat and large armor shapes",
    "paths": [
      "prince",
      "minister"
    ]
  },
  {
    "name": "General Shen",
    "group": "general",
    "brief": "Reform-minded commander; forest-dark coat",
    "paths": [
      "prince",
      "minister"
    ]
  },
  {
    "name": "General Wei",
    "group": "general",
    "brief": "Pragmatic border veteran; brown-charcoal coat",
    "paths": [
      "prince",
      "minister"
    ]
  },
  {
    "name": "General Luo",
    "group": "general",
    "brief": "Impatient cavalry commander; dark red coat",
    "paths": [
      "prince",
      "minister"
    ]
  }
] as const;
