import { Metadata } from 'next'
import { ChevronDown } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Dentistry Explained',
  description: 'Find answers to common questions about dental health, treatments, and using the Dentistry Explained platform.',
}

const faqs = [
  {
    category: 'General Dental Health',
    questions: [
      {
        question: 'How often should I visit the dentist?',
        answer: 'Most people should visit the dentist every 6 months for regular check-ups and cleanings. However, some individuals may need more frequent visits based on their oral health condition.'
      },
      {
        question: 'What causes tooth decay?',
        answer: 'Tooth decay is caused by bacteria in your mouth that produce acid when they feed on sugars and starches from food. This acid attacks tooth enamel, creating cavities over time.'
      },
      {
        question: 'Is flossing really necessary?',
        answer: 'Yes, flossing is essential for removing plaque and food particles between teeth where your toothbrush cannot reach. It helps prevent gum disease and cavities between teeth.'
      },
      {
        question: 'What are the signs of gum disease?',
        answer: 'Common signs include red, swollen, or bleeding gums, persistent bad breath, receding gums, loose teeth, and changes in bite. Early detection and treatment are important.'
      }
    ]
  },
  {
    category: 'Dental Treatments',
    questions: [
      {
        question: 'Does getting a filling hurt?',
        answer: 'Modern dentistry uses local anesthetics to numb the area before filling a cavity. You may feel pressure but should not feel pain during the procedure.'
      },
      {
        question: 'How long do dental crowns last?',
        answer: 'With proper care, dental crowns typically last 10-15 years or longer. Their lifespan depends on oral hygiene, habits like teeth grinding, and the crown material.'
      },
      {
        question: 'What is the difference between a crown and a veneer?',
        answer: 'A crown covers the entire tooth and is used for damaged teeth, while a veneer is a thin shell that covers only the front surface for cosmetic improvements.'
      },
      {
        question: 'Are dental implants safe?',
        answer: 'Yes, dental implants have a very high success rate (95%+) and are considered safe. They are made from biocompatible titanium that integrates with your jawbone.'
      }
    ]
  },
  {
    category: 'Using Dentistry Explained',
    questions: [
      {
        question: 'Is Dentistry Explained free to use?',
        answer: 'Yes, basic access to our educational content is free. Professional features and advanced tools may require a subscription.'
      },
      {
        question: 'How accurate is the information on this site?',
        answer: 'All our content is written and reviewed by qualified dental professionals and is based on current evidence-based dental practices.'
      },
      {
        question: 'Can I use this site to diagnose my dental problems?',
        answer: 'No, this site is for educational purposes only. Always consult a qualified dentist for proper diagnosis and treatment of dental conditions.'
      },
      {
        question: 'How do I find a dentist near me?',
        answer: 'Use our Find a Dentist feature to search for dental practices in your area. You can filter by location, services offered, and whether they accept NHS patients.'
      }
    ]
  },
  {
    category: 'Emergency Dental Care',
    questions: [
      {
        question: 'What counts as a dental emergency?',
        answer: 'Dental emergencies include severe toothache, knocked-out teeth, broken teeth with sharp edges, dental abscesses, and uncontrolled bleeding after dental work.'
      },
      {
        question: 'What should I do if I knock out a tooth?',
        answer: 'Keep the tooth moist (in milk or saliva), handle it by the crown only, and see a dentist immediately. Time is critical - ideally within 30 minutes.'
      },
      {
        question: 'How can I manage severe tooth pain at home?',
        answer: 'Use over-the-counter pain relievers as directed, apply cold compresses, rinse with warm salt water, and avoid very hot or cold foods. See a dentist as soon as possible.'
      }
    ]
  }
]

export default function FAQPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-gray-600">
          Find answers to common questions about dental health and using our platform.
        </p>
      </div>

      <div className="space-y-8">
        {faqs.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                {category.category}
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      <span className="text-gray-900 font-medium pr-4">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Still have questions?
        </h3>
        <p className="text-gray-600 mb-4">
          If you couldn't find the answer you're looking for, our support team is here to help.
        </p>
        <a
          href="/support"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
        >
          Contact Support
        </a>
      </div>
    </div>
      </main>
      <Footer />
    </>
  )
}