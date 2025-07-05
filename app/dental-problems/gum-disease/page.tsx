import { ArticleTrackingWrapper } from "@/components/article/article-tracking-wrapper"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function GumDiseasePage() {
  const articleData = {
    slug: "dental-problems/gum-disease",
    title: "Gum Disease: Signs, Causes, and Treatment",
    category: "Dental Problems",
    readTime: "7 min",
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <ArticleTrackingWrapper
        article={articleData}
        fullSlug={articleData.slug}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="prose prose-lg max-w-none">
            <h2>What is Gum Disease?</h2>
            <p>
              Gum disease, also known as periodontal disease, is an infection of the tissues that hold your teeth in place. 
              It's typically caused by poor brushing and flossing habits that allow plaque—a sticky film of bacteria—to 
              build up on the teeth and harden.
            </p>
            
            <h2>Signs and Symptoms</h2>
            <ul>
              <li>Red, swollen, or tender gums</li>
              <li>Bleeding when brushing or flossing</li>
              <li>Persistent bad breath</li>
              <li>Loose or separating teeth</li>
              <li>Receding gums</li>
            </ul>
            
            <h2>Treatment Options</h2>
            <p>
              Treatment depends on the severity of the disease. Early stages can often be reversed with improved 
              oral hygiene and professional cleanings. More advanced cases may require deep cleaning procedures 
              or even surgery.
            </p>
          </div>
        </div>
      </ArticleTrackingWrapper>
      
      <Footer />
    </div>
  )
}
