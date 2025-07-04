interface GlossaryTerm {
  term: string
  definition: string
  pronunciation?: string
  also_known_as?: string[]
  related_terms?: string[]
  category?: string
}

export const enhancedGlossaryTerms: GlossaryTerm[] = [
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
  }
]