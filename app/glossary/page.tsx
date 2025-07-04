'use client'

import { useState } from 'react'
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const glossaryTerms = [
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
  }
].sort((a, b) => a.term.localeCompare(b.term))

export default function GlossaryPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)

  // Filter terms based on search and selected letter
  const filteredTerms = glossaryTerms.filter(item => {
    const matchesSearch = item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.definition.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLetter = !selectedLetter || item.term.charAt(0).toUpperCase() === selectedLetter
    return matchesSearch && matchesLetter
  })

  // Get unique first letters
  const availableLetters = [...new Set(glossaryTerms.map(item => item.term.charAt(0).toUpperCase()))].sort()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dental Glossary</h1>
          <p className="text-xl text-gray-600">
            Common dental terms and their definitions to help you better understand your oral health.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Alphabet Navigation */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              !selectedLetter 
                ? 'bg-primary text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {availableLetters.map(letter => (
            <button
              key={letter}
              onClick={() => setSelectedLetter(letter)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                selectedLetter === letter 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {letter}
            </button>
          ))}
        </div>

        {/* Glossary Terms */}
        <div className="space-y-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No terms found matching your search.
            </div>
          ) : (
            filteredTerms.map((item, index) => (
              <div
                key={index}
                className="border-b border-gray-200 pb-4 last:border-0"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.term}
                      {item.pronunciation && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                          [{item.pronunciation}]
                        </span>
                      )}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      {item.definition}
                    </p>
                    {item.also_known_as && item.also_known_as.length > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-gray-500">Also known as:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.also_known_as.map((aka, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {aka}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.related_terms && item.related_terms.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Related:</span>
                        <div className="flex flex-wrap gap-1">
                          {item.related_terms.map((term, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {term}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {item.category && (
                    <Badge className="ml-4 capitalize">
                      {item.category.replace('-', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Results Count */}
        {searchTerm && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Showing {filteredTerms.length} of {glossaryTerms.length} terms
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  )
}