// Données fictives pour la V1 visuelle d'OTC — OFF TRAIL CHALLENGE

export const LOGO_URL = "https://media.base44.com/images/public/user_6a9bc44dd5b274433df43734/6899155a2_83CF55CA-B77D-41D6-A37F-A4E8DCCB4267.png";

export const courses = [
  {
    id: "calanques",
    name: "Trail des Calanques",
    region: "PACA",
    city: "Marseille",
    distance: 25,
    dplus: 1180,
    dminus: 1180,
    difficulty: "Modéré",
    price: 9.99,
    period: "1er mars — 30 nov. 2026",
    status: "available",
    participants: 184,
    coords: [43.20, 5.36],
    cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    description: "Entre mer et falaises blanches, un parcours sauvage sur les crêtes des Calanques marseillaises. Vues vertigineuses sur la Méditerranée à chaque sommet.",
    checkpoints: ["Sormiou", "Morgiou", "En-Vau", "Sugiton"],
    profile: [0, 180, 420, 610, 880, 1180, 940, 700, 520, 380, 200, 0]
  },
  {
    id: "mont-blanc",
    name: "Traversée du Mont-Blanc",
    region: "Auvergne-Rhône-Alpes",
    city: "Chamonix",
    distance: 50,
    dplus: 3500,
    dminus: 3500,
    difficulty: "Expert",
    price: 12.99,
    period: "15 juin — 30 sept. 2026",
    status: "available",
    participants: 92,
    coords: [45.83, 6.86],
    cover: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
    description: "Une traversée alpine mythique autour du toit de l'Europe. Terrain haute montagne, autonomie complète exigée.",
    checkpoints: ["Chamonix", "Plan de l'Aiguille", "Le Buet", "Col du Bonhomme", "Chamonix"],
    profile: [0, 600, 1450, 2200, 2900, 3500, 3100, 2400, 1600, 800, 0]
  },
  {
    id: "mercantour",
    name: "Trail du Mercantour",
    region: "PACA",
    city: "Saint-Martin-Vésubie",
    distance: 40,
    dplus: 2400,
    dminus: 2400,
    difficulty: "Soutenu",
    price: 11.99,
    period: "1er juin — 31 oct. 2026",
    status: "available",
    participants: 137,
    coords: [44.10, 7.30],
    cover: "https://images.unsplash.com/photo-1464822759023-fed616ff2f3b?auto=format&fit=crop&w=1200&q=80",
    description: "Lacs d'altitude et vallées sauvages du parc national du Mercantour. L'un des plus beaux terrains de trail des Alpes du Sud.",
    checkpoints: ["Vésubie", "Boréon", "Lacs de Vens", "Casterino"],
    profile: [0, 400, 900, 1500, 2100, 2400, 1900, 1300, 700, 300, 0]
  },
  {
    id: "vosges",
    name: "Grand Raid des Vosges",
    region: "Grand Est",
    city: "Gérardmer",
    distance: 60,
    dplus: 2800,
    dminus: 2800,
    difficulty: "Expert",
    price: 14.99,
    period: "1er mai — 31 oct. 2026",
    status: "soon",
    participants: 64,
    coords: [48.02, 7.12],
    cover: "https://images.unsplash.com/photo-1431274172761-f0f67ec8c5e8?auto=format&fit=crop&w=1200&q=80",
    description: "Crêtes vosgiennes d'est en ouest, du Hohneck au Grand Ballon. Forêts, chaumes et panoramas à perte de vue.",
    checkpoints: ["Gérardmer", "Hohneck", "Markstein", "Grand Ballon"],
    profile: [0, 350, 800, 1300, 1800, 2200, 2800, 2400, 1700, 900, 0]
  },
  {
    id: "volcans",
    name: "Trail des Volcans",
    region: "Auvergne",
    city: "Clermont-Ferrand",
    distance: 30,
    dplus: 1500,
    dminus: 1500,
    difficulty: "Modéré",
    price: 10.99,
    period: "1er avril — 31 oct. 2026",
    status: "available",
    participants: 211,
    coords: [45.50, 2.95],
    cover: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
    description: "Puy de Dôme, Puy de Sancy et chaîne des Puys. Un terrain volcanique unique au monde, classé à l'UNESCO.",
    checkpoints: ["Puy de Dôme", "Puy de Pariou", "Puy de Sancy"],
    profile: [0, 300, 700, 1100, 1500, 1300, 900, 500, 200, 0]
  },
  {
    id: "cote-opale",
    name: "Côte d'Opale Trail",
    region: "Hauts-de-France",
    city: "Wimereux",
    distance: 20,
    dplus: 600,
    dminus: 600,
    difficulty: "Accessible",
    price: 7.99,
    period: "Toute l'année",
    status: "available",
    participants: 298,
    coords: [50.95, 1.85],
    cover: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1200&q=80",
    description: "Falaises crayeuses, dunes et plages du littoral opalinois. Un trail roulant face à la Manche.",
    checkpoints: ["Wimereux", "Cap Gris-Nez", "Cap Blanc-Nez"],
    profile: [0, 150, 350, 600, 480, 300, 180, 0]
  },
  {
    id: "cathares",
    name: "Trail des Cathares",
    region: "Occitanie",
    city: "Quillan",
    distance: 42,
    dplus: 2100,
    dminus: 2100,
    difficulty: "Soutenu",
    price: 11.99,
    period: "1er mars — 30 nov. 2026",
    status: "available",
    participants: 156,
    coords: [42.88, 2.37],
    cover: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    description: "De château en château, sur les sentiers des Cathares entre Ariège et Aude. Histoire et cailloux.",
    checkpoints: ["Quillan", "Puivert", "Montségur", "Roquefixade"],
    profile: [0, 500, 1100, 1700, 2100, 1800, 1200, 700, 300, 0]
  },
  {
    id: "quiberon",
    name: "Quiberon Wild Run",
    region: "Bretagne",
    city: "Quiberon",
    distance: 15,
    dplus: 350,
    dminus: 350,
    difficulty: "Accessible",
    price: 7.99,
    period: "Toute l'année",
    status: "available",
    participants: 342,
    coords: [47.50, -3.10],
    cover: "https://images.unsplash.com/photo-1505852679233-d9fd2aff2241?auto=format&fit=crop&w=1200&q=80",
    description: "Côte Sauvage de la presqu'île de Quiberon. Océan, vents et sentiers côtiers iodés.",
    checkpoints: ["Quiberon", "Pointe du Percho", "Port Haliguen"],
    profile: [0, 120, 250, 350, 280, 160, 0]
  }
];

export const rankings = {
  course: [
    { rank: 1, name: "Quentin Lefèvre", city: "Toulon", time: "1h42'08\"", date: "12 mai 2026" },
    { rank: 2, name: "Thomas Roy", city: "Aix-en-Provence", time: "1h47'33\"", date: "12 mai 2026" },
    { rank: 3, name: "Julien Mercier", city: "Marseille", time: "1h51'20\"", date: "19 mai 2026" },
    { rank: 4, name: "Camille Faure", city: "Nice", time: "1h54'02\"", date: "26 mai 2026" },
    { rank: 5, name: "Lucas Petit", city: "Toulon", time: "1h58'47\"", date: "02 juin 2026" },
    { rank: 6, name: "Sarah Bonnet", city: "Lyon", time: "2h03'15\"", date: "09 juin 2026" },
    { rank: 7, name: "Antoine Girard", city: "Marseille", time: "2h07'41\"", date: "16 juin 2026" },
    { rank: 8, name: "Marie Lambert", city: "Toulon", time: "2h12'09\"", date: "23 juin 2026" }
  ],
  region: [
    { rank: 1, name: "Quentin Lefèvre", city: "Toulon", score: "1840 pts", courses: 6 },
    { rank: 2, name: "Thomas Roy", city: "Aix-en-Provence", score: "1620 pts", courses: 5 },
    { rank: 3, name: "Julien Mercier", city: "Marseille", score: "1490 pts", courses: 5 },
    { rank: 4, name: "Camille Faure", city: "Nice", score: "1320 pts", courses: 4 },
    { rank: 5, name: "Lucas Petit", city: "Toulon", score: "1180 pts", courses: 4 }
  ],
  global: [
    { rank: 1, name: "Quentin Lefèvre", city: "Toulon", score: "1840 pts", courses: 6 },
    { rank: 2, name: "Hugo Bernard", city: "Chamonix", score: "1790 pts", courses: 7 },
    { rank: 3, name: "Léa Moreau", city: "Clermont-Ferrand", score: "1710 pts", courses: 6 },
    { rank: 4, name: "Thomas Roy", city: "Aix-en-Provence", score: "1620 pts", courses: 5 },
    { rank: 5, name: "Julien Mercier", city: "Marseille", score: "1490 pts", courses: 5 }
  ]
};

export const otcTour = [
  { id: "calanques", name: "Trail des Calanques", region: "PACA", distance: "25 km", window: "1er mars — 30 nov.", status: "open" },
  { id: "mont-blanc", name: "Traversée du Mont-Blanc", region: "Auvergne-Rhône-Alpes", distance: "50 km", window: "15 juin — 30 sept.", status: "open" },
  { id: "mercantour", name: "Trail du Mercantour", region: "PACA", distance: "40 km", window: "1er juin — 31 oct.", status: "open" },
  { id: "vosges", name: "Grand Raid des Vosges", region: "Grand Est", distance: "60 km", window: "1er mai — 31 oct.", status: "soon" },
  { id: "volcans", name: "Trail des Volcans", region: "Auvergne", distance: "30 km", window: "1er avril — 31 oct.", status: "open" },
  { id: "cote-opale", name: "Côte d'Opale Trail", region: "Hauts-de-France", distance: "20 km", window: "Toute l'année", status: "open" },
  { id: "cathares", name: "Trail des Cathares", region: "Occitanie", distance: "42 km", window: "1er mars — 30 nov.", status: "open" },
  { id: "quiberon", name: "Quiberon Wild Run", region: "Bretagne", distance: "15 km", window: "Toute l'année", status: "open" },
  { id: "corsica", name: "Corsica Wild Trail", region: "Corse", distance: "45 km", window: "1er mai — 31 oct.", status: "soon" },
  { id: "pyrenees", name: "Raid des Pyrénées", region: "Occitanie", distance: "55 km", window: "1er juin — 30 sept.", status: "soon" }
];

export const myAttempts = [
  { course: "Trail des Calanques", date: "12 mai 2026", time: "2h48'12\"", status: "validé", best: false },
  { course: "Trail des Calanques", date: "26 mai 2026", time: "2h42'55\"", status: "validé", best: true },
  { course: "Trail des Calanques", date: "09 juin 2026", time: "2h51'30\"", status: "validé", best: false },
  { course: "Trail des Volcans", date: "21 avril 2026", time: "3h12'40\"", status: "validé", best: true }
];

export const profile = {
  name: "Quentin Lefèvre",
  city: "Toulon",
  club: "Trail Club Toulonnais",
  birthdate: "1989-03-14",
  gender: "M",
  category: "Sénior M",
  region: "PACA",
  avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
  stats: {
    courses: 6,
    kilometers: 187,
    dplus: 9800,
    bestTime: "2h42'55\""
  }
};