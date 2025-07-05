import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { enhancedGlossaryTerms } from "@/data/glossary-enhanced"
import { GlossaryEnhanced } from "@/components/glossary/glossary-enhanced"

// Use enhanced glossary data if available, fallback to basic data
const glossaryTerms = enhancedGlossaryTerms.length > 0 ? enhancedGlossaryTerms : [
  {
    term: "Abscess",
    definition: "A pocket of pus that forms around the root of an infected tooth or in the gums due to bacterial infection."
  },
  {
    term: "Amalgam",
    definition: "A silver-colored filling material made from a mixture of metals including mercury, silver, tin, and copper."
  },
  {
    term: "Apicoectomy",
    definition: "A surgical procedure to remove the tip of a tooth root and surrounding infected tissue."
  },
  {
    term: "Bite",
    definition: "The way upper and lower teeth come together when the mouth is closed; also called occlusion."
  },
  {
    term: "Bruxism",
    definition: "The involuntary grinding or clenching of teeth, often during sleep."
  },
  {
    term: "Calculus",
    definition: "Hardened plaque that forms on teeth; also known as tartar."
  },
  {
    term: "Caries",
    definition: "The medical term for tooth decay or cavities caused by bacteria."
  },
  {
    term: "Crown",
    definition: "A cap that covers a damaged tooth to restore its shape, size, and function."
  },
  {
    term: "Dentin",
    definition: "The layer of tooth structure beneath the enamel, which is softer and more susceptible to decay."
  },
  {
    term: "Denture",
    definition: "A removable replacement for missing teeth and surrounding tissues."
  },
  {
    term: "Enamel",
    definition: "The hard, white outer layer of a tooth that protects it from decay."
  },
  {
    term: "Endodontics",
    definition: "The branch of dentistry concerned with diseases of the tooth pulp; includes root canal treatment."
  },
  {
    term: "Extraction",
    definition: "The removal of a tooth from its socket in the bone."
  },
  {
    term: "Fluoride",
    definition: "A mineral that helps prevent tooth decay and can reverse early stages of dental caries."
  },
  {
    term: "Gingivitis",
    definition: "Inflammation of the gums, the earliest stage of gum disease."
  },
  {
    term: "Gum Disease",
    definition: "Infection and inflammation of the gums and supporting structures of the teeth; also called periodontal disease."
  },
  {
    term: "Halitosis",
    definition: "The medical term for bad breath."
  },
  {
    term: "Impaction",
    definition: "A tooth that is unable to erupt properly and remains partially or fully beneath the gum line."
  },
  {
    term: "Implant",
    definition: "A titanium post surgically placed in the jawbone to replace a missing tooth root."
  },
  {
    term: "Inlay",
    definition: "A custom-made filling fitted into the grooves of a tooth without covering the cusps."
  },
  {
    term: "Malocclusion",
    definition: "Improper alignment of teeth when the jaws are closed."
  },
  {
    term: "Molar",
    definition: "The large, flat teeth at the back of the mouth used for grinding food."
  },
  {
    term: "Occlusion",
    definition: "The contact between teeth when the jaws are brought together."
  },
  {
    term: "Onlay",
    definition: "A restoration that covers one or more tooth cusps, larger than an inlay but smaller than a crown."
  },
  {
    term: "Orthodontics",
    definition: "The branch of dentistry that corrects teeth and jaw alignment problems."
  },
  {
    term: "Periodontitis",
    definition: "Advanced gum disease that can lead to tooth loss if untreated."
  },
  {
    term: "Plaque",
    definition: "A sticky film of bacteria that constantly forms on teeth."
  },
  {
    term: "Pulp",
    definition: "The soft tissue inside a tooth containing nerves and blood vessels."
  },
  {
    term: "Root Canal",
    definition: "A treatment to repair and save a badly damaged or infected tooth by removing the pulp."
  },
  {
    term: "Scaling",
    definition: "The removal of plaque and tartar from tooth surfaces."
  },
  {
    term: "Sealant",
    definition: "A plastic coating applied to the chewing surfaces of back teeth to prevent decay."
  },
  {
    term: "Tartar",
    definition: "Hardened plaque that has been left on the tooth for some time; also called calculus."
  },
  {
    term: "TMJ",
    definition: "Temporomandibular joint; the hinge joint that connects the lower jaw to the skull."
  },
  {
    term: "Veneer",
    definition: "A thin shell of porcelain or composite material bonded to the front of a tooth."
  },
  {
    term: "Wisdom Teeth",
    definition: "The third and final set of molars that most people get in their late teens or early twenties."
  },
  {
    term: "Xerostomia",
    definition: "The medical term for dry mouth caused by reduced saliva flow."
  },
  {
    term: "Abutment",
    definition: "A tooth or implant that supports a dental prosthesis such as a bridge or denture."
  },
  {
    term: "Air Abrasion",
    definition: "A drill-free technique using a stream of fine particles to remove tooth decay."
  },
  {
    term: "Alveolar Bone",
    definition: "The part of the jawbone that holds the tooth sockets and supports the teeth."
  },
  {
    term: "Anterior Teeth",
    definition: "The front teeth including incisors and canines, used for cutting and tearing food."
  },
  {
    term: "Bicuspid",
    definition: "A premolar tooth with two cusps, located between the canines and molars."
  },
  {
    term: "Biofilm",
    definition: "A thin layer of microorganisms, including bacteria, that forms on tooth surfaces; dental plaque is a type of biofilm."
  },
  {
    term: "Bonding",
    definition: "A cosmetic procedure using tooth-colored composite resin to repair or improve tooth appearance."
  },
  {
    term: "Bridge",
    definition: "A fixed dental restoration that replaces one or more missing teeth by joining artificial teeth to adjacent teeth or implants."
  },
  {
    term: "Canine",
    definition: "The pointed teeth located between the incisors and premolars, also called cuspids."
  },
  {
    term: "Cementum",
    definition: "The thin layer of bone-like tissue covering the tooth root that helps anchor it to the jawbone."
  },
  {
    term: "Composite Resin",
    definition: "A tooth-colored filling material made of plastic and fine glass particles."
  },
  {
    term: "Crossbite",
    definition: "A misalignment where upper teeth fit inside lower teeth when biting down."
  },
  {
    term: "Cusp",
    definition: "The pointed or rounded elevation on the chewing surface of a tooth."
  },
  {
    term: "Debridement",
    definition: "The removal of plaque, calculus, and stain from teeth, especially when buildup is heavy."
  },
  {
    term: "Deciduous Teeth",
    definition: "Primary or baby teeth that are eventually replaced by permanent teeth."
  },
  {
    term: "Dental Dam",
    definition: "A thin sheet of rubber used to isolate teeth during dental procedures."
  },
  {
    term: "Dental Floss",
    definition: "A thin thread used to remove food and plaque from between teeth."
  },
  {
    term: "Diastema",
    definition: "A gap or space between two teeth, commonly seen between upper front teeth."
  },
  {
    term: "Edentulous",
    definition: "Having no natural teeth remaining in the mouth."
  },
  {
    term: "Eruption",
    definition: "The process of teeth breaking through the gums as they grow."
  },
  {
    term: "Exfoliation",
    definition: "The natural loss of baby teeth as permanent teeth develop."
  },
  {
    term: "Fissure",
    definition: "A deep groove or cleft in the chewing surface of a tooth."
  },
  {
    term: "Frenectomy",
    definition: "Surgical removal or modification of the frenum (tissue connecting lips or tongue to gums)."
  },
  {
    term: "Gingiva",
    definition: "The medical term for gums; the soft tissue that surrounds and supports teeth."
  },
  {
    term: "Gingival Recession",
    definition: "The pulling back of gum tissue from teeth, exposing tooth roots."
  },
  {
    term: "Gutta-percha",
    definition: "A rubber-like material used to fill root canals after cleaning."
  },
  {
    term: "Hypersensitivity",
    definition: "Tooth sensitivity to temperature, touch, or certain foods due to exposed dentin."
  },
  {
    term: "Incisor",
    definition: "The flat, sharp-edged front teeth used for cutting food."
  },
  {
    term: "Interproximal",
    definition: "The area between adjacent teeth."
  },
  {
    term: "Irrigation",
    definition: "Flushing of a specific area with a stream of fluid to remove debris."
  },
  {
    term: "Mandible",
    definition: "The lower jaw bone."
  },
  {
    term: "Maxilla",
    definition: "The upper jaw bone."
  },
  {
    term: "Mesial",
    definition: "The surface of a tooth closest to the midline of the face."
  },
  {
    term: "Mouthguard",
    definition: "A protective device worn over teeth to prevent injury during sports or to treat bruxism."
  },
  {
    term: "Nitrous Oxide",
    definition: "A gas used for mild sedation during dental procedures, also known as laughing gas."
  },
  {
    term: "Obturation",
    definition: "The process of filling and sealing a root canal."
  },
  {
    term: "Oral Prophylaxis",
    definition: "Professional teeth cleaning to prevent dental disease."
  },
  {
    term: "Overbite",
    definition: "Vertical overlap of upper front teeth over lower front teeth."
  },
  {
    term: "Overjet",
    definition: "Horizontal projection of upper teeth beyond lower teeth."
  },
  {
    term: "Palate",
    definition: "The roof of the mouth, consisting of hard and soft portions."
  },
  {
    term: "Panoramic X-ray",
    definition: "A dental X-ray that captures the entire mouth in a single image."
  },
  {
    term: "Partial Denture",
    definition: "A removable appliance that replaces some missing teeth."
  },
  {
    term: "Periapical",
    definition: "The area around the tip of a tooth root."
  },
  {
    term: "Periodontal Ligament",
    definition: "The connective tissue that attaches teeth to the jawbone."
  },
  {
    term: "Periodontal Pocket",
    definition: "A deepened space between tooth and gum caused by gum disease."
  },
  {
    term: "Pit",
    definition: "A small depression in tooth enamel, often found on chewing surfaces."
  },
  {
    term: "Pontic",
    definition: "The artificial tooth in a bridge that replaces a missing natural tooth."
  },
  {
    term: "Post",
    definition: "A metal or fiber rod placed in a root canal to support a crown."
  },
  {
    term: "Posterior Teeth",
    definition: "The back teeth including premolars and molars, used for grinding food."
  },
  {
    term: "Premolar",
    definition: "Teeth located between canines and molars, also called bicuspids."
  },
  {
    term: "Prophylaxis",
    definition: "Professional cleaning of teeth to remove plaque, calculus, and stains."
  },
  {
    term: "Prosthodontics",
    definition: "The dental specialty focused on replacing missing teeth and jaw structures."
  },
  {
    term: "Pulpectomy",
    definition: "Complete removal of pulp tissue from a tooth."
  },
  {
    term: "Pulpitis",
    definition: "Inflammation of the tooth pulp, often causing pain."
  },
  {
    term: "Pulpotomy",
    definition: "Partial removal of pulp tissue, typically in baby teeth."
  },
  {
    term: "Radiograph",
    definition: "An X-ray image used to diagnose dental conditions."
  },
  {
    term: "Recession",
    definition: "The loss of gum tissue resulting in exposure of tooth roots."
  },
  {
    term: "Reimplantation",
    definition: "Replacing a tooth in its socket after it has been knocked out."
  },
  {
    term: "Remineralization",
    definition: "The natural repair process of tooth enamel using minerals from saliva."
  },
  {
    term: "Resorption",
    definition: "The body's process of breaking down and absorbing tissue, such as tooth roots."
  },
  {
    term: "Restoration",
    definition: "Any dental work that repairs or replaces tooth structure."
  },
  {
    term: "Retainer",
    definition: "An appliance worn after orthodontic treatment to maintain tooth position."
  },
  {
    term: "Root Planing",
    definition: "Deep cleaning of tooth roots to remove bacteria and smooth rough spots."
  },
  {
    term: "Rubber Dam",
    definition: "A sheet of rubber used to isolate teeth during dental procedures."
  },
  {
    term: "Saliva",
    definition: "The watery substance produced in the mouth that aids digestion and protects teeth."
  },
  {
    term: "Space Maintainer",
    definition: "A device used to keep space open for a permanent tooth after early loss of a baby tooth."
  },
  {
    term: "Splint",
    definition: "A device used to stabilize loose teeth or protect teeth from grinding."
  },
  {
    term: "Supernumerary Teeth",
    definition: "Extra teeth beyond the normal number."
  },
  {
    term: "Suture",
    definition: "Stitches used to close wounds after oral surgery."
  },
  {
    term: "Temporomandibular Disorder (TMD)",
    definition: "Problems affecting the jaw joint and muscles that control jaw movement."
  },
  {
    term: "Torus",
    definition: "A benign bony growth in the mouth, often on the palate or lower jaw."
  },
  {
    term: "Trismus",
    definition: "Limited ability to open the mouth, often due to muscle spasm or joint problems."
  },
  {
    term: "Underbite",
    definition: "A condition where lower teeth extend beyond upper teeth when biting."
  },
  {
    term: "Unerupted Tooth",
    definition: "A tooth that has not yet broken through the gum."
  },
  {
    term: "Vestibule",
    definition: "The space between teeth/gums and the lips or cheeks."
  },
  {
    term: "Vitality Test",
    definition: "A test to determine if a tooth's nerve is alive and healthy."
  },
  {
    term: "Xeroradiography",
    definition: "A type of X-ray imaging that uses less radiation than traditional X-rays."
  },
  {
    term: "Zinc Oxide Eugenol",
    definition: "A temporary filling material with soothing properties."
  }
].sort((a, b) => a.term.localeCompare(b.term))

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dental Glossary</h1>
          <p className="text-xl text-gray-600">
            Your comprehensive guide to dental terminology. Learn what your dentist is talking about.
          </p>
        </div>

        <GlossaryEnhanced terms={glossaryTerms} />
      </div>
      
      <Footer />
    </div>
  )
}