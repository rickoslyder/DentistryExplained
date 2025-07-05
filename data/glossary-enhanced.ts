interface GlossaryTerm {
  term: string
  definition: string
  pronunciation?: string
  also_known_as?: string[]
  related_terms?: string[]
  category?: string
  difficulty?: 'basic' | 'advanced'
  example?: string
}

export const enhancedGlossaryTerms: GlossaryTerm[] = [
  // Emergency-related terms
  {
    term: "Dental Emergency",
    definition: "Any dental problem requiring immediate treatment to stop ongoing tissue bleeding, alleviate severe pain, or save a tooth.",
    pronunciation: "DEN-tal ee-MER-jen-see",
    also_known_as: ["Urgent dental care", "Emergency dentistry"],
    related_terms: ["Trauma", "Abscess", "Severe pain"],
    category: "conditions",
    difficulty: "basic",
    example: "A knocked-out tooth is a dental emergency requiring treatment within 30 minutes."
  },
  {
    term: "Avulsion",
    definition: "Complete displacement of a tooth from its socket due to trauma. Adult teeth can often be reimplanted if handled correctly.",
    pronunciation: "ah-VUL-shun",
    also_known_as: ["Knocked-out tooth", "Tooth avulsion"],
    related_terms: ["Dental trauma", "Reimplantation", "Emergency"],
    category: "conditions",
    difficulty: "advanced"
  },
  {
    term: "Dry Socket",
    definition: "A painful condition occurring after tooth extraction when the blood clot is dislodged, exposing bone and nerves.",
    pronunciation: "dry SOK-et",
    also_known_as: ["Alveolar osteitis"],
    related_terms: ["Extraction", "Post-operative complication"],
    category: "conditions",
    difficulty: "basic",
    example: "Dry socket typically develops 2-3 days after tooth extraction and causes severe pain."
  },
  {
    term: "Cellulitis",
    definition: "A serious bacterial infection of the soft tissues that can spread from a dental infection, causing facial swelling.",
    pronunciation: "sel-yoo-LIE-tis",
    related_terms: ["Infection", "Abscess", "Medical emergency"],
    category: "conditions",
    difficulty: "advanced"
  },
  {
    term: "Ludwig's Angina",
    definition: "A life-threatening infection of the floor of the mouth that can cause airway obstruction. Requires immediate medical attention.",
    pronunciation: "LOOD-vigs an-JIE-nah",
    related_terms: ["Cellulitis", "Dental infection", "Medical emergency"],
    category: "conditions",
    difficulty: "advanced"
  },
  {
    term: "Pericoronitis",
    definition: "Inflammation of the gum tissue around a partially erupted tooth, commonly affecting wisdom teeth.",
    pronunciation: "pair-ih-kor-oh-NIE-tis",
    also_known_as: ["Wisdom tooth infection"],
    related_terms: ["Wisdom teeth", "Infection", "Impaction"],
    category: "conditions",
    difficulty: "basic"
  },
  // NHS and UK-specific terms
  {
    term: "NHS Band",
    definition: "The pricing structure for NHS dental treatments in England, ranging from Band 1 (basic) to Band 3 (complex).",
    also_known_as: ["NHS dental charges", "Treatment bands"],
    related_terms: ["NHS dentistry", "Dental charges"],
    category: "costs",
    difficulty: "basic",
    example: "A filling falls under NHS Band 2, which costs £65.20 in 2024."
  },
  {
    term: "111 Service",
    definition: "The NHS non-emergency medical helpline that can provide urgent dental advice and arrange emergency appointments.",
    pronunciation: "one-one-one service",
    also_known_as: ["NHS 111"],
    related_terms: ["Emergency dentist", "Out-of-hours care"],
    category: "procedures",
    difficulty: "basic"
  },
  {
    term: "GDC",
    definition: "General Dental Council - the UK regulator for dental professionals. All dentists must be registered with the GDC.",
    pronunciation: "G-D-C",
    also_known_as: ["General Dental Council"],
    related_terms: ["Dental registration", "Professional regulation"],
    category: "costs",
    difficulty: "basic"
  },
  // Additional emergency procedures
  {
    term: "Reimplantation",
    definition: "The process of placing a knocked-out tooth back into its socket. Best results occur within 30 minutes of injury.",
    pronunciation: "ree-im-plan-TAY-shun",
    related_terms: ["Avulsion", "Dental trauma", "Emergency treatment"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "Pulp Capping",
    definition: "An emergency procedure to protect exposed tooth pulp using a medicated covering to preserve tooth vitality.",
    pronunciation: "pulp KAP-ing",
    related_terms: ["Pulp exposure", "Dental trauma", "Root canal"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "Incision and Drainage",
    definition: "A surgical procedure to drain pus from a dental abscess, providing immediate pain relief.",
    pronunciation: "in-SIZH-un and DRAY-nij",
    also_known_as: ["I&D", "Abscess drainage"],
    related_terms: ["Abscess", "Infection", "Emergency treatment"],
    category: "procedures",
    difficulty: "basic"
  },
  {
    term: "Abscess",
    definition: "A pocket of pus that forms around the root of an infected tooth or in the gums due to bacterial infection.",
    pronunciation: "AB-sess",
    also_known_as: ["Dental abscess", "Tooth abscess", "Periapical abscess"],
    related_terms: ["Infection", "Root canal", "Antibiotics", "Pulpitis"],
    category: "conditions"
  },
  {
    term: "Amalgam",
    definition: "A silver-colored filling material made from a mixture of metals including mercury, silver, tin, and copper.",
    pronunciation: "ah-MAL-gum",
    also_known_as: ["Silver filling", "Metal filling"],
    related_terms: ["Filling", "Composite", "Restoration", "Cavity"],
    category: "materials"
  },
  {
    term: "Apicoectomy",
    definition: "A surgical procedure to remove the tip of a tooth root and surrounding infected tissue.",
    pronunciation: "ay-pih-ko-EK-toh-mee",
    also_known_as: ["Root end surgery", "Root end resection"],
    related_terms: ["Endodontics", "Root canal", "Abscess"],
    category: "procedures"
  },
  {
    term: "Bite",
    definition: "The way upper and lower teeth come together when the mouth is closed; also called occlusion.",
    pronunciation: "bite",
    also_known_as: ["Occlusion", "Dental occlusion"],
    related_terms: ["Malocclusion", "Overbite", "Underbite", "Crossbite"],
    category: "anatomy"
  },
  {
    term: "Bruxism",
    definition: "The involuntary grinding or clenching of teeth, often during sleep.",
    pronunciation: "BRUK-sizm",
    also_known_as: ["Teeth grinding", "Teeth clenching"],
    related_terms: ["Night guard", "TMJ", "Tooth wear"],
    category: "conditions"
  },
  {
    term: "Calculus",
    definition: "Hardened plaque that forms on teeth; also known as tartar.",
    pronunciation: "KAL-kyuh-lus",
    also_known_as: ["Tartar", "Dental calculus"],
    related_terms: ["Plaque", "Scaling", "Gum disease", "Cleaning"],
    category: "conditions"
  },
  {
    term: "Cavity",
    definition: "A hole in a tooth caused by decay; also known as dental caries.",
    pronunciation: "KAV-ih-tee",
    also_known_as: ["Dental caries", "Tooth decay"],
    related_terms: ["Filling", "Decay", "Plaque", "Fluoride"],
    category: "conditions"
  },
  {
    term: "Composite",
    definition: "A tooth-colored filling material made from a mixture of plastic and glass.",
    pronunciation: "kom-PAH-zit",
    also_known_as: ["White filling", "Tooth-colored filling", "Resin filling"],
    related_terms: ["Filling", "Amalgam", "Bonding", "Restoration"],
    category: "materials"
  },
  {
    term: "Crown",
    definition: "A cap that covers a damaged tooth to restore its shape, size, and function.",
    pronunciation: "crown",
    also_known_as: ["Cap", "Dental crown"],
    related_terms: ["Bridge", "Onlay", "Root canal", "Restoration"],
    category: "procedures"
  },
  {
    term: "Denture",
    definition: "A removable replacement for missing teeth and surrounding tissues.",
    pronunciation: "DEN-chur",
    also_known_as: ["False teeth", "Plates"],
    related_terms: ["Partial denture", "Complete denture", "Implant", "Bridge"],
    category: "prosthetics"
  },
  {
    term: "Dentin",
    definition: "The layer of tooth structure beneath the enamel, yellowish in color and softer than enamel.",
    pronunciation: "DEN-tin",
    also_known_as: ["Dentine"],
    related_terms: ["Enamel", "Pulp", "Tooth structure", "Sensitivity"],
    category: "anatomy"
  },
  {
    term: "Enamel",
    definition: "The hard, white outer layer of a tooth that protects it from decay.",
    pronunciation: "ih-NAM-ul",
    also_known_as: ["Tooth enamel"],
    related_terms: ["Dentin", "Fluoride", "Erosion", "Cavity"],
    category: "anatomy"
  },
  {
    term: "Endodontics",
    definition: "The branch of dentistry concerned with diseases of the tooth pulp; includes root canal treatment.",
    pronunciation: "en-doh-DON-tiks",
    also_known_as: ["Root canal therapy"],
    related_terms: ["Pulp", "Root canal", "Apicoectomy", "Abscess"],
    category: "specialties"
  },
  {
    term: "Extraction",
    definition: "The removal of a tooth from its socket in the bone.",
    pronunciation: "ek-STRAK-shun",
    also_known_as: ["Tooth removal", "Tooth extraction"],
    related_terms: ["Oral surgery", "Wisdom teeth", "Socket", "Dry socket"],
    category: "procedures"
  },
  {
    term: "Fluoride",
    definition: "A mineral that helps prevent tooth decay and can reverse early stages of dental caries.",
    pronunciation: "FLOOR-ide",
    also_known_as: ["Fluoride treatment"],
    related_terms: ["Prevention", "Enamel", "Cavity", "Toothpaste"],
    category: "materials"
  },
  {
    term: "Gingivitis",
    definition: "Inflammation of the gums, the earliest stage of gum disease.",
    pronunciation: "jin-jih-VYE-tis",
    also_known_as: ["Gum inflammation"],
    related_terms: ["Periodontitis", "Plaque", "Bleeding gums", "Gum disease"],
    category: "conditions"
  },
  {
    term: "Gum Disease",
    definition: "Infection and inflammation of the gums and supporting structures of the teeth; also called periodontal disease.",
    pronunciation: "gum dih-ZEEZ",
    also_known_as: ["Periodontal disease", "Periodontitis"],
    related_terms: ["Gingivitis", "Bone loss", "Scaling", "Deep cleaning"],
    category: "conditions"
  },
  {
    term: "Halitosis",
    definition: "The medical term for bad breath.",
    pronunciation: "hal-ih-TOH-sis",
    also_known_as: ["Bad breath", "Oral malodor"],
    related_terms: ["Oral hygiene", "Tongue scraper", "Gum disease"],
    category: "conditions"
  },
  {
    term: "Impaction",
    definition: "A tooth that is unable to erupt properly and remains partially or fully beneath the gum line.",
    pronunciation: "im-PAK-shun",
    also_known_as: ["Impacted tooth"],
    related_terms: ["Wisdom teeth", "Extraction", "Oral surgery"],
    category: "conditions"
  },
  {
    term: "Implant",
    definition: "A titanium post surgically placed in the jawbone to replace a missing tooth root.",
    pronunciation: "IM-plant",
    also_known_as: ["Dental implant", "Tooth implant"],
    related_terms: ["Crown", "Bridge", "Bone graft", "Osseointegration"],
    category: "procedures"
  },
  {
    term: "Inlay",
    definition: "A custom-made filling fitted into the grooves of a tooth without covering the cusps.",
    pronunciation: "IN-lay",
    also_known_as: ["Indirect filling"],
    related_terms: ["Onlay", "Crown", "Filling", "Restoration"],
    category: "procedures"
  },
  {
    term: "Malocclusion",
    definition: "Improper alignment of teeth when the jaws are closed.",
    pronunciation: "mal-oh-KLOO-zhun",
    also_known_as: ["Bad bite", "Misaligned teeth"],
    related_terms: ["Orthodontics", "Braces", "Bite", "Overbite"],
    category: "conditions"
  },
  {
    term: "Molar",
    definition: "The large, flat teeth at the back of the mouth used for grinding food.",
    pronunciation: "MOH-lar",
    also_known_as: ["Back teeth"],
    related_terms: ["Premolar", "Wisdom teeth", "Chewing", "Crown"],
    category: "anatomy"
  },
  {
    term: "Occlusion",
    definition: "The contact between teeth when the jaws are brought together.",
    pronunciation: "oh-KLOO-zhun",
    also_known_as: ["Bite", "Dental occlusion"],
    related_terms: ["Malocclusion", "TMJ", "Bite adjustment"],
    category: "anatomy"
  },
  {
    term: "Onlay",
    definition: "A restoration that covers one or more cusps of a tooth.",
    pronunciation: "ON-lay",
    also_known_as: ["Partial crown"],
    related_terms: ["Inlay", "Crown", "Filling", "Restoration"],
    category: "procedures"
  },
  {
    term: "Orthodontics",
    definition: "The branch of dentistry that corrects teeth and jaw alignment problems.",
    pronunciation: "or-thoh-DON-tiks",
    also_known_as: ["Braces treatment"],
    related_terms: ["Braces", "Retainer", "Malocclusion", "Invisalign"],
    category: "specialties"
  },
  {
    term: "Periodontitis",
    definition: "Advanced gum disease that damages soft tissue and destroys bone supporting teeth.",
    pronunciation: "per-ee-oh-don-TYE-tis",
    also_known_as: ["Advanced gum disease", "Pyorrhea"],
    related_terms: ["Gingivitis", "Bone loss", "Deep cleaning", "Gum surgery"],
    category: "conditions"
  },
  {
    term: "Plaque",
    definition: "A sticky film of bacteria that forms on teeth.",
    pronunciation: "plak",
    also_known_as: ["Biofilm", "Bacterial plaque"],
    related_terms: ["Tartar", "Cavity", "Gingivitis", "Brushing"],
    category: "conditions"
  },
  {
    term: "Pulp",
    definition: "The soft tissue inside a tooth containing nerves and blood vessels.",
    pronunciation: "pulp",
    also_known_as: ["Tooth pulp", "Dental pulp"],
    related_terms: ["Root canal", "Pulpitis", "Nerve", "Endodontics"],
    category: "anatomy"
  },
  {
    term: "Root Canal",
    definition: "A treatment to repair and save a badly damaged or infected tooth by removing the pulp.",
    pronunciation: "root kuh-NAL",
    also_known_as: ["Endodontic treatment", "RCT"],
    related_terms: ["Pulp", "Crown", "Abscess", "Endodontics"],
    category: "procedures"
  },
  {
    term: "Scaling",
    definition: "The removal of plaque and tartar from tooth surfaces.",
    pronunciation: "SKAY-ling",
    also_known_as: ["Deep cleaning", "Prophylaxis"],
    related_terms: ["Tartar", "Cleaning", "Gum disease", "Root planing"],
    category: "procedures"
  },
  {
    term: "Sealant",
    definition: "A thin, protective coating applied to the chewing surfaces of back teeth to prevent cavities.",
    pronunciation: "SEE-lant",
    also_known_as: ["Dental sealant", "Fissure sealant"],
    related_terms: ["Prevention", "Children", "Molar", "Cavity"],
    category: "procedures"
  },
  {
    term: "Tartar",
    definition: "Hardened plaque that has been left on the tooth for some time.",
    pronunciation: "TAR-ter",
    also_known_as: ["Calculus", "Dental calculus"],
    related_terms: ["Plaque", "Scaling", "Cleaning", "Gum disease"],
    category: "conditions"
  },
  {
    term: "TMJ",
    definition: "Temporomandibular joint; the joint connecting the lower jaw to the skull.",
    pronunciation: "T-M-J",
    also_known_as: ["Jaw joint", "TMD"],
    related_terms: ["Jaw pain", "Bruxism", "Bite", "Night guard"],
    category: "anatomy"
  },
  {
    term: "Veneer",
    definition: "A thin shell of porcelain or composite material bonded to the front of a tooth.",
    pronunciation: "vuh-NEER",
    also_known_as: ["Dental veneer", "Porcelain veneer"],
    related_terms: ["Cosmetic dentistry", "Bonding", "Crown", "Smile makeover"],
    category: "procedures"
  },
  {
    term: "Wisdom Teeth",
    definition: "The third and final set of molars that most people get in their late teens or early twenties.",
    pronunciation: "WIZ-dum teeth",
    also_known_as: ["Third molars"],
    related_terms: ["Extraction", "Impaction", "Oral surgery", "Molar"],
    category: "anatomy"
  },
  {
    term: "X-ray",
    definition: "A diagnostic tool that uses radiation to see inside teeth and below the gum line.",
    pronunciation: "EKS-ray",
    also_known_as: ["Radiograph", "Dental X-ray"],
    related_terms: ["Diagnosis", "Cavity detection", "Panoramic X-ray"],
    category: "procedures"
  },
  // Additional General Dental Terms
  // Basic Anatomy Terms
  {
    term: "Cementum",
    definition: "A thin layer of bone-like tissue covering the root of a tooth, helping to anchor it in the jawbone.",
    pronunciation: "see-MEN-tum",
    related_terms: ["Root", "Periodontal ligament", "Tooth structure"],
    category: "anatomy",
    difficulty: "advanced"
  },
  {
    term: "Periodontal Ligament",
    definition: "The connective tissue fibers that attach a tooth to the surrounding bone socket.",
    pronunciation: "pair-ee-oh-DON-tal LIG-ah-ment",
    also_known_as: ["PDL"],
    related_terms: ["Periodontium", "Tooth mobility", "Bone"],
    category: "anatomy",
    difficulty: "advanced"
  },
  {
    term: "Alveolar Bone",
    definition: "The part of the jawbone that contains the tooth sockets and supports the teeth.",
    pronunciation: "al-VEE-oh-lar bone",
    also_known_as: ["Socket bone"],
    related_terms: ["Bone loss", "Extraction", "Implant"],
    category: "anatomy",
    difficulty: "advanced"
  },
  {
    term: "Apex",
    definition: "The tip or end of the tooth root where nerves and blood vessels enter.",
    pronunciation: "AY-peks",
    also_known_as: ["Root tip", "Root apex"],
    related_terms: ["Root canal", "Apicoectomy", "Abscess"],
    category: "anatomy",
    difficulty: "advanced"
  },
  {
    term: "Cusp",
    definition: "The pointed or rounded elevation on the chewing surface of a tooth.",
    pronunciation: "kusp",
    related_terms: ["Molar", "Premolar", "Occlusion"],
    category: "anatomy",
    difficulty: "basic",
    example: "Molars typically have four or five cusps for grinding food."
  },
  // Common Procedures
  {
    term: "Prophylaxis",
    definition: "Professional dental cleaning to remove plaque, tartar, and stains from teeth.",
    pronunciation: "proh-fih-LAK-sis",
    also_known_as: ["Dental cleaning", "Scale and polish"],
    related_terms: ["Hygienist", "Plaque", "Prevention"],
    category: "procedures",
    difficulty: "basic",
    example: "Most patients need prophylaxis every six months."
  },
  {
    term: "Bonding",
    definition: "A cosmetic procedure where tooth-colored resin is applied to repair chips, cracks, or gaps.",
    pronunciation: "BON-ding",
    also_known_as: ["Dental bonding", "Composite bonding"],
    related_terms: ["Composite", "Veneer", "Cosmetic dentistry"],
    category: "procedures",
    difficulty: "basic"
  },
  {
    term: "Bridge",
    definition: "A fixed dental restoration that replaces one or more missing teeth by joining crowns together.",
    pronunciation: "brij",
    also_known_as: ["Fixed bridge", "Dental bridge"],
    related_terms: ["Crown", "Pontic", "Abutment"],
    category: "prosthetics",
    difficulty: "basic",
    example: "A three-unit bridge replaces one missing tooth using the adjacent teeth as anchors."
  },
  {
    term: "Bone Graft",
    definition: "A surgical procedure to rebuild or augment jawbone, often needed before implant placement.",
    pronunciation: "bone graft",
    related_terms: ["Implant", "Oral surgery", "Regeneration"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "Deep Cleaning",
    definition: "A thorough cleaning below the gum line to treat gum disease, including scaling and root planing.",
    pronunciation: "deep KLEE-ning",
    also_known_as: ["Scaling and root planing", "SRP"],
    related_terms: ["Periodontitis", "Gum disease", "Tartar"],
    category: "procedures",
    difficulty: "basic"
  },
  // Orthodontic Terms
  {
    term: "Clear Aligners",
    definition: "Transparent, removable trays used to straighten teeth as an alternative to traditional braces.",
    pronunciation: "kleer ah-LYE-ners",
    also_known_as: ["Invisible braces", "Invisalign"],
    related_terms: ["Orthodontics", "Retainer", "Malocclusion"],
    category: "orthodontics",
    difficulty: "basic"
  },
  {
    term: "Retainer",
    definition: "A custom-made appliance worn after orthodontic treatment to maintain teeth in their new position.",
    pronunciation: "ree-TAY-ner",
    related_terms: ["Braces", "Orthodontics", "Relapse"],
    category: "orthodontics",
    difficulty: "basic",
    example: "Retainers must be worn as directed to prevent teeth from shifting back."
  },
  {
    term: "Overbite",
    definition: "A condition where the upper front teeth overlap significantly with the lower front teeth.",
    pronunciation: "OH-ver-bite",
    also_known_as: ["Deep bite"],
    related_terms: ["Malocclusion", "Underbite", "Orthodontics"],
    category: "conditions",
    difficulty: "basic"
  },
  {
    term: "Underbite",
    definition: "A condition where the lower teeth protrude past the upper front teeth when biting.",
    pronunciation: "UN-der-bite",
    also_known_as: ["Class III malocclusion"],
    related_terms: ["Overbite", "Crossbite", "Jaw surgery"],
    category: "conditions",
    difficulty: "basic"
  },
  {
    term: "Crossbite",
    definition: "A misalignment where some upper teeth sit inside the lower teeth when biting.",
    pronunciation: "KROSS-bite",
    related_terms: ["Malocclusion", "Orthodontics", "Expander"],
    category: "conditions",
    difficulty: "basic"
  },
  {
    term: "Diastema",
    definition: "A gap or space between two teeth, most commonly seen between the upper front teeth.",
    pronunciation: "dye-ah-STEE-mah",
    also_known_as: ["Gap teeth", "Tooth gap"],
    related_terms: ["Spacing", "Bonding", "Orthodontics"],
    category: "conditions",
    difficulty: "basic"
  },
  // Pediatric Terms
  {
    term: "Primary Teeth",
    definition: "The first set of 20 teeth that appear in childhood and are later replaced by permanent teeth.",
    pronunciation: "PRY-mare-ee teeth",
    also_known_as: ["Baby teeth", "Deciduous teeth", "Milk teeth"],
    related_terms: ["Eruption", "Exfoliation", "Permanent teeth"],
    category: "pediatric",
    difficulty: "basic",
    example: "Primary teeth usually start appearing around 6 months of age."
  },
  {
    term: "Teething",
    definition: "The process of teeth breaking through the gums, typically causing discomfort in infants.",
    pronunciation: "TEE-thing",
    related_terms: ["Eruption", "Primary teeth", "Gum pain"],
    category: "pediatric",
    difficulty: "basic"
  },
  {
    term: "Space Maintainer",
    definition: "An appliance used to hold space for a permanent tooth when a baby tooth is lost early.",
    pronunciation: "space main-TAY-ner",
    related_terms: ["Primary teeth", "Premature loss", "Orthodontics"],
    category: "pediatric",
    difficulty: "basic"
  },
  {
    term: "Eruption",
    definition: "The process of teeth breaking through the gums and becoming visible in the mouth.",
    pronunciation: "ee-RUP-shun",
    related_terms: ["Teething", "Impaction", "Development"],
    category: "pediatric",
    difficulty: "basic"
  },
  {
    term: "Natal Teeth",
    definition: "Teeth that are present at birth, occurring in about 1 in 2,000 newborns.",
    pronunciation: "NAY-tal teeth",
    related_terms: ["Neonatal teeth", "Primary teeth"],
    category: "pediatric",
    difficulty: "advanced"
  },
  // Diagnostic Terms
  {
    term: "Bitewing X-ray",
    definition: "A type of dental X-ray showing the crowns of upper and lower teeth, used to detect cavities between teeth.",
    pronunciation: "BITE-wing",
    related_terms: ["X-ray", "Cavity detection", "Interproximal"],
    category: "procedures",
    difficulty: "basic"
  },
  {
    term: "Panoramic X-ray",
    definition: "A dental X-ray that captures the entire mouth in a single image, including all teeth and jaws.",
    pronunciation: "pan-oh-RAM-ik",
    also_known_as: ["Panorex", "OPG"],
    related_terms: ["X-ray", "Wisdom teeth", "Jaw evaluation"],
    category: "procedures",
    difficulty: "basic"
  },
  {
    term: "Periapical X-ray",
    definition: "An X-ray showing the entire tooth from crown to root tip and surrounding bone.",
    pronunciation: "pair-ee-AY-pih-kal",
    also_known_as: ["PA X-ray"],
    related_terms: ["Root canal", "Abscess", "Diagnosis"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "CBCT",
    definition: "Cone Beam Computed Tomography - a 3D imaging technique for detailed views of teeth, bone, and soft tissues.",
    pronunciation: "C-B-C-T",
    also_known_as: ["Cone beam", "3D X-ray"],
    related_terms: ["Implant planning", "Oral surgery", "Diagnosis"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "Intraoral Camera",
    definition: "A small camera used to take detailed images inside the mouth for diagnosis and patient education.",
    pronunciation: "in-trah-OR-al",
    related_terms: ["Diagnosis", "Patient education", "Digital dentistry"],
    category: "procedures",
    difficulty: "basic"
  },
  // Materials
  {
    term: "Porcelain",
    definition: "A ceramic material used in crowns, veneers, and bridges that mimics natural tooth appearance.",
    pronunciation: "POR-suh-lin",
    also_known_as: ["Dental ceramic"],
    related_terms: ["Crown", "Veneer", "Aesthetics"],
    category: "materials",
    difficulty: "basic"
  },
  {
    term: "Zirconia",
    definition: "An extremely strong ceramic material used for crowns and bridges, known for durability.",
    pronunciation: "zer-KOH-nee-ah",
    related_terms: ["Crown", "Bridge", "All-ceramic"],
    category: "materials",
    difficulty: "advanced"
  },
  {
    term: "Gold",
    definition: "A biocompatible metal alloy traditionally used for crowns and fillings, known for longevity.",
    pronunciation: "gold",
    also_known_as: ["Gold alloy"],
    related_terms: ["Crown", "Inlay", "Restoration"],
    category: "materials",
    difficulty: "basic"
  },
  {
    term: "Impression Material",
    definition: "Materials used to create molds of teeth and gums for making crowns, dentures, and other restorations.",
    pronunciation: "im-PRESH-un",
    also_known_as: ["Dental impression", "Mold"],
    related_terms: ["Crown", "Digital scanning", "Restoration"],
    category: "materials",
    difficulty: "basic"
  },
  // Periodontal Terms
  {
    term: "Pocket Depth",
    definition: "The measurement of the space between the gum and tooth, used to assess gum health.",
    pronunciation: "POK-et depth",
    also_known_as: ["Probing depth"],
    related_terms: ["Periodontal probe", "Gum disease", "Periodontitis"],
    category: "conditions",
    difficulty: "basic",
    example: "Healthy pocket depths are typically 1-3mm deep."
  },
  {
    term: "Gum Recession",
    definition: "The exposure of tooth roots due to gum tissue pulling back from the teeth.",
    pronunciation: "gum ree-SESH-un",
    also_known_as: ["Receding gums"],
    related_terms: ["Gum grafting", "Sensitivity", "Bone loss"],
    category: "conditions",
    difficulty: "basic"
  },
  {
    term: "Gum Grafting",
    definition: "A surgical procedure to cover exposed tooth roots or thicken gum tissue.",
    pronunciation: "gum GRAF-ting",
    also_known_as: ["Soft tissue graft"],
    related_terms: ["Recession", "Periodontal surgery", "Coverage"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "Periodontal Probe",
    definition: "A dental instrument used to measure pocket depths around teeth.",
    pronunciation: "pair-ee-oh-DON-tal probe",
    related_terms: ["Gum examination", "Pocket depth", "Diagnosis"],
    category: "procedures",
    difficulty: "basic"
  },
  // Additional Common Terms
  {
    term: "Anesthetic",
    definition: "Medication used to numb areas of the mouth during dental procedures.",
    pronunciation: "an-es-THET-ik",
    also_known_as: ["Numbing", "Local anesthetic", "Lidocaine"],
    related_terms: ["Injection", "Pain management", "Procedure"],
    category: "materials",
    difficulty: "basic"
  },
  {
    term: "Rubber Dam",
    definition: "A sheet of rubber used to isolate teeth during procedures, keeping them dry and protected.",
    pronunciation: "RUB-ber dam",
    also_known_as: ["Dental dam"],
    related_terms: ["Root canal", "Filling", "Isolation"],
    category: "materials",
    difficulty: "basic"
  },
  {
    term: "Abutment",
    definition: "A tooth or implant that supports a bridge or denture; also the connector piece on an implant.",
    pronunciation: "ah-BUT-ment",
    related_terms: ["Bridge", "Implant", "Crown"],
    category: "prosthetics",
    difficulty: "advanced"
  },
  {
    term: "Pontic",
    definition: "The artificial tooth in a bridge that replaces a missing natural tooth.",
    pronunciation: "PON-tik",
    related_terms: ["Bridge", "Missing tooth", "Restoration"],
    category: "prosthetics",
    difficulty: "advanced"
  },
  {
    term: "Osseointegration",
    definition: "The process by which a dental implant fuses with the jawbone.",
    pronunciation: "oss-ee-oh-in-teh-GRAY-shun",
    related_terms: ["Implant", "Bone healing", "Integration"],
    category: "procedures",
    difficulty: "advanced",
    example: "Osseointegration typically takes 3-6 months after implant placement."
  },
  {
    term: "Night Guard",
    definition: "A removable appliance worn during sleep to protect teeth from grinding or clenching.",
    pronunciation: "nite gard",
    also_known_as: ["Occlusal guard", "Bite guard"],
    related_terms: ["Bruxism", "TMJ", "Protection"],
    category: "prosthetics",
    difficulty: "basic"
  },
  {
    term: "Partial Denture",
    definition: "A removable appliance that replaces some missing teeth while clasping onto remaining natural teeth.",
    pronunciation: "PAR-shul DEN-chur",
    also_known_as: ["Partial", "RPD"],
    related_terms: ["Denture", "Missing teeth", "Clasps"],
    category: "prosthetics",
    difficulty: "basic"
  },
  {
    term: "Post and Core",
    definition: "A foundation restoration placed in a root canal treated tooth to support a crown.",
    pronunciation: "post and kor",
    related_terms: ["Root canal", "Crown", "Build-up"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "Pulpitis",
    definition: "Inflammation of the tooth pulp, often causing severe toothache.",
    pronunciation: "pul-PIE-tis",
    related_terms: ["Pulp", "Root canal", "Toothache"],
    category: "conditions",
    difficulty: "basic",
    example: "Reversible pulpitis may heal, but irreversible pulpitis requires root canal treatment."
  },
  {
    term: "Xerostomia",
    definition: "Chronic dry mouth caused by reduced saliva flow, increasing cavity risk.",
    pronunciation: "zee-roh-STOH-mee-ah",
    also_known_as: ["Dry mouth"],
    related_terms: ["Saliva", "Medication side effect", "Cavity risk"],
    category: "conditions",
    difficulty: "advanced"
  },
  {
    term: "Bleaching",
    definition: "The process of whitening teeth using peroxide-based chemicals.",
    pronunciation: "BLEE-ching",
    also_known_as: ["Teeth whitening", "Tooth whitening"],
    related_terms: ["Cosmetic dentistry", "Stains", "Peroxide"],
    category: "procedures",
    difficulty: "basic"
  },
  {
    term: "Frenectomy",
    definition: "Surgical removal or modification of the frenum (tissue connecting lips or tongue to gums).",
    pronunciation: "free-NEK-toh-mee",
    related_terms: ["Tongue tie", "Lip tie", "Oral surgery"],
    category: "procedures",
    difficulty: "advanced"
  },
  {
    term: "Occlusal Adjustment",
    definition: "Reshaping the biting surfaces of teeth to improve how they come together.",
    pronunciation: "oh-KLOO-zal",
    also_known_as: ["Bite adjustment"],
    related_terms: ["Bite", "TMJ", "High spot"],
    category: "procedures",
    difficulty: "basic"
  }
]