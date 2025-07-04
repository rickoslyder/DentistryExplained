import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 mb-6">
            Last updated: {new Date().toLocaleDateString('en-GB', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using Dentistry Explained ("the Service"), you accept and agree 
              to be bound by the terms and provision of this agreement. If you do not agree to 
              abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              Dentistry Explained provides educational content about dental health, oral care, 
              and related topics. Our service includes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Educational articles and resources</li>
              <li>AI-powered dental health assistant</li>
              <li>Dental practice directory</li>
              <li>Professional resources for dental practitioners</li>
              <li>User accounts and personalization features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Medical Disclaimer</h2>
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
              <p className="text-gray-800 font-semibold mb-2">Important:</p>
              <p className="text-gray-700">
                The information provided on Dentistry Explained is for educational purposes only 
                and is not intended as a substitute for professional medical advice, diagnosis, 
                or treatment. Always seek the advice of your dentist or other qualified health 
                provider with any questions you may have regarding a dental or medical condition.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.1 Registration</h3>
            <p className="text-gray-700 mb-4">
              To access certain features, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Be responsible for all activities under your account</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3">4.2 Professional Accounts</h3>
            <p className="text-gray-700 mb-4">
              Dental professionals may register for enhanced features. Professional registration 
              requires verification of credentials, including GDC registration number.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. User Conduct</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Use the Service for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Attempt to gain unauthorized access</li>
              <li>Upload malicious code or content</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              All content on Dentistry Explained, including text, graphics, logos, and software, 
              is the property of Dentistry Explained or its content suppliers and is protected 
              by intellectual property laws.
            </p>
            <p className="text-gray-700 mb-4">
              You may not reproduce, distribute, modify, or create derivative works without 
              our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. User-Generated Content</h2>
            <p className="text-gray-700 mb-4">
              By submitting content to our Service, you grant us a non-exclusive, worldwide, 
              royalty-free license to use, reproduce, and distribute such content in connection 
              with the Service.
            </p>
            <p className="text-gray-700 mb-4">
              You represent and warrant that you own or have the necessary rights to submit 
              the content and that it does not infringe any third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your use of our Service is also governed by our Privacy Policy. Please review 
              our Privacy Policy, which also governs the Site and informs users of our data 
              collection practices.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS 
              OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.
            </p>
            <p className="text-gray-700 mb-4">
              IN NO EVENT SHALL DENTISTRY EXPLAINED BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATING TO YOUR 
              USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless Dentistry Explained and its officers, 
              directors, employees, and agents from any claims, losses, or damages arising 
              from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to terminate or suspend your account and access to the 
              Service at our sole discretion, without notice, for conduct that we believe 
              violates these Terms or is harmful to other users, us, or third parties.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of 
              England and Wales, without regard to its conflict of law provisions. You agree 
              to submit to the exclusive jurisdiction of the courts located in London, United Kingdom.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users 
              of any material changes by posting the new Terms on this page. Your continued 
              use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
              <p>Email: legal@dentistryexplained.com</p>
              <p>Address: Dentistry Explained Ltd</p>
              <p>London, United Kingdom</p>
            </div>
          </section>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}