// Car brands with their models
export const carBrandsWithModels: Record<string, string[]> = {
  // Luxury & Exotic
  "Aston Martin": ["DB11", "DB12", "DBS", "DBX", "Vantage", "Vanquish", "Rapide", "Virage", "DB9", "DB7"],
  "Bentley": ["Continental GT", "Continental GTC", "Flying Spur", "Bentayga", "Mulsanne", "Arnage", "Azure"],
  "Bugatti": ["Chiron", "Veyron", "Divo", "Centodieci", "La Voiture Noire", "Bolide"],
  "Ferrari": ["296 GTB", "296 GTS", "SF90 Stradale", "F8 Tributo", "Roma", "Portofino", "812 Superfast", "812 GTS", "Purosangue", "488", "458", "California", "LaFerrari", "Enzo", "F12", "GTC4Lusso"],
  "Koenigsegg": ["Jesko", "Regera", "Gemera", "Agera", "CC850", "One:1"],
  "Lamborghini": ["Huracán", "Urus", "Revuelto", "Aventador", "Gallardo", "Murciélago", "Diablo", "Countach"],
  "Lotus": ["Emira", "Eletre", "Evija", "Exige", "Elise", "Evora", "Esprit"],
  "McLaren": ["750S", "720S", "GT", "Artura", "765LT", "600LT", "570S", "540C", "P1", "Senna", "Speedtail"],
  "Pagani": ["Huayra", "Zonda", "Utopia"],
  "Rimac": ["Nevera", "Concept One"],
  "Rolls-Royce": ["Phantom", "Ghost", "Wraith", "Dawn", "Cullinan", "Spectre", "Silver Shadow", "Silver Spirit"],

  // Premium
  "Alfa Romeo": ["Giulia", "Stelvio", "Giulietta", "MiTo", "Tonale", "159", "147", "GT", "Brera", "Spider", "4C", "8C"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q6 e-tron", "Q7", "Q8", "Q8 e-tron", "e-tron", "e-tron GT", "TT", "R8", "RS3", "RS4", "RS5", "RS6", "RS7", "RS Q3", "RS Q8", "S3", "S4", "S5", "S6", "S7", "S8", "SQ5", "SQ7", "SQ8"],
  "BMW": ["1er", "2er", "3er", "4er", "5er", "6er", "7er", "8er", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "XM", "iX", "iX1", "iX2", "iX3", "i3", "i4", "i5", "i7", "i8", "Z3", "Z4", "M2", "M3", "M4", "M5", "M8"],
  "Cadillac": ["CT4", "CT5", "Escalade", "XT4", "XT5", "XT6", "Lyriq", "Celestiq", "CTS", "ATS", "SRX"],
  "Genesis": ["G70", "G80", "G90", "GV60", "GV70", "GV80"],
  "Infiniti": ["Q30", "Q50", "Q60", "Q70", "QX30", "QX50", "QX55", "QX60", "QX70", "QX80"],
  "Jaguar": ["XE", "XF", "XJ", "F-Type", "E-Pace", "F-Pace", "I-Pace"],
  "Lexus": ["CT", "IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX", "LC", "RC", "RZ", "LBX"],
  "Lincoln": ["Aviator", "Corsair", "Nautilus", "Navigator", "Continental", "MKZ", "MKC", "MKX"],
  "Maserati": ["Ghibli", "Quattroporte", "Levante", "MC20", "Grecale", "GranTurismo", "GranCabrio"],
  "Mercedes-Benz": ["A-Klasse", "B-Klasse", "C-Klasse", "E-Klasse", "S-Klasse", "CLA", "CLE", "CLS", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Klasse", "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "AMG GT", "SL", "SLC", "SLK", "Maybach", "Vito", "V-Klasse", "Sprinter"],
  "Porsche": ["911", "718 Cayman", "718 Boxster", "Panamera", "Taycan", "Macan", "Cayenne", "918 Spyder", "Carrera GT"],

  // Mainstream European
  "Citroën": ["C1", "C3", "C3 Aircross", "C4", "C4 Cactus", "C4 X", "C5", "C5 Aircross", "C5 X", "Berlingo", "Jumpy", "SpaceTourer", "ë-C4"],
  "Cupra": ["Formentor", "Born", "Leon", "Ateca", "Tavascan", "Terramar"],
  "Dacia": ["Sandero", "Duster", "Logan", "Jogger", "Spring"],
  "DS": ["DS3", "DS3 Crossback", "DS4", "DS5", "DS7", "DS9"],
  "Fiat": ["500", "500X", "500L", "Panda", "Tipo", "Punto", "Ducato", "Doblo", "500e", "600"],
  "Opel": ["Corsa", "Astra", "Insignia", "Mokka", "Crossland", "Grandland", "Combo", "Zafira", "Vivaro", "Movano", "Adam", "Meriva", "Ampera"],
  "Peugeot": ["108", "208", "308", "408", "508", "2008", "3008", "5008", "Rifter", "Traveller", "Partner", "Expert", "e-208", "e-2008", "e-308"],
  "Renault": ["Twingo", "Clio", "Megane", "Talisman", "Captur", "Kadjar", "Koleos", "Scenic", "Espace", "Kangoo", "Trafic", "Master", "Zoe", "Megane E-Tech", "Arkana", "Austral", "5 E-Tech"],
  "Seat": ["Ibiza", "Leon", "Arona", "Ateca", "Tarraco", "Alhambra", "Mii"],
  "Skoda": ["Fabia", "Scala", "Octavia", "Superb", "Kamiq", "Karoq", "Kodiaq", "Enyaq", "Citigo", "Elroq"],
  "Volkswagen": ["up!", "Polo", "Golf", "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "Passat", "Arteon", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Touran", "Sharan", "Caddy", "Multivan", "Transporter", "Amarok"],

  // Mainstream Asian
  "Honda": ["Civic", "Accord", "Jazz", "HR-V", "CR-V", "e", "ZR-V", "e:Ny1", "NSX", "S2000"],
  "Hyundai": ["i10", "i20", "i30", "i40", "Ioniq", "Ioniq 5", "Ioniq 6", "Kona", "Tucson", "Santa Fe", "Bayon", "Nexo", "Staria"],
  "Kia": ["Picanto", "Rio", "Ceed", "Proceed", "Stinger", "Sportage", "Sorento", "Niro", "EV6", "EV9", "Soul", "Stonic", "XCeed"],
  "Mazda": ["2", "3", "6", "CX-3", "CX-30", "CX-5", "CX-60", "CX-80", "MX-5", "MX-30", "RX-7", "RX-8"],
  "Mitsubishi": ["Space Star", "ASX", "Eclipse Cross", "Outlander", "L200", "Pajero", "Colt", "Lancer"],
  "Nissan": ["Micra", "Juke", "Qashqai", "X-Trail", "Leaf", "Ariya", "GT-R", "370Z", "400Z", "Navara", "Pathfinder", "Murano"],
  "Subaru": ["Impreza", "XV", "Crosstrek", "Forester", "Outback", "Legacy", "Levorg", "BRZ", "WRX", "Solterra"],
  "Suzuki": ["Swift", "Ignis", "Baleno", "Vitara", "S-Cross", "Jimny", "Across", "Swace", "SX4"],
  "Toyota": ["Aygo", "Aygo X", "Yaris", "Yaris Cross", "Corolla", "Camry", "Crown", "Prius", "C-HR", "RAV4", "Highlander", "Land Cruiser", "Supra", "GR86", "GR Yaris", "bZ4X", "Mirai", "Proace", "Hilux"],

  // American
  "Chevrolet": ["Camaro", "Corvette", "Cruze", "Malibu", "Spark", "Trax", "Equinox", "Tahoe", "Suburban", "Silverado", "Colorado", "Blazer", "Traverse"],
  "Chrysler": ["300", "Pacifica", "Voyager"],
  "Dodge": ["Challenger", "Charger", "Durango", "Journey", "Ram", "Viper"],
  "Ford": ["Fiesta", "Focus", "Mondeo", "Mustang", "Mustang Mach-E", "Puma", "Kuga", "Explorer", "EcoSport", "Edge", "Ranger", "Transit", "S-Max", "Galaxy", "Bronco", "F-150", "Raptor", "GT"],
  "GMC": ["Sierra", "Canyon", "Yukon", "Acadia", "Terrain", "Hummer EV"],
  "Jeep": ["Renegade", "Compass", "Cherokee", "Grand Cherokee", "Wrangler", "Gladiator", "Avenger"],

  // British
  "Mini": ["Mini 3-Türer", "Mini 5-Türer", "Mini Cabrio", "Mini Clubman", "Mini Countryman", "Mini Electric", "Mini Aceman"],
  "Morgan": ["Plus Four", "Plus Six", "Super 3", "3 Wheeler"],
  "MG": ["ZS", "HS", "MG4", "MG5", "Marvel R", "Cyberster", "3", "4"],

  // Swedish
  "Polestar": ["Polestar 1", "Polestar 2", "Polestar 3", "Polestar 4", "Polestar 5", "Polestar 6"],
  "Volvo": ["S60", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC90", "C40", "EX30", "EX90", "EM90"],

  // Electric Startups
  "Aiways": ["U5", "U6"],
  "BYD": ["Atto 3", "Han", "Tang", "Seal", "Dolphin", "Seal U"],
  "Fisker": ["Ocean", "Pear"],
  "Lucid": ["Air", "Gravity"],
  "NIO": ["ET5", "ET7", "EL6", "EL7", "ES6", "ES8", "EC6", "EC7"],
  "Rivian": ["R1T", "R1S", "R2", "R3"],
  "Smart": ["fortwo", "forfour", "#1", "#3"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck", "Roadster", "Semi"],
  "Xpeng": ["G3", "G6", "G9", "P5", "P7"],

  // Other European
  "Alpine": ["A110", "A290"],
  "Lancia": ["Ypsilon", "Delta", "Thema", "Fulvia"],

  // Other Asian
  "Daihatsu": ["Terios", "Sirion", "Cuore", "Rocky"],
  "Isuzu": ["D-Max", "MU-X"],
  "SsangYong": ["Tivoli", "Korando", "Rexton", "Musso", "Torres"],

  // Chinese (growing in Europe)
  "Lynk & Co": ["01", "02", "03", "05", "09"],
  "Ora": ["Funky Cat", "03", "07"],
  "Zeekr": ["001", "007", "009", "X"],
}
