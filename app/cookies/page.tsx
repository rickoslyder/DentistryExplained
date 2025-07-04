import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Dentistry Explained',
  description: 'Learn about how Dentistry Explained uses cookies and similar technologies.',
}

export default function CookiesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
      
      <div className="prose prose-gray max-w-none">
        <p className="text-gray-600 text-lg mb-6">
          Last updated: July 1, 2025
        </p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            What Are Cookies?
          </h2>
          <p className="text-gray-600 mb-4">
            Cookies are small text files that are placed on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences and 
            understanding how you use our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            How We Use Cookies
          </h2>
          <p className="text-gray-600 mb-4">
            Dentistry Explained uses cookies for the following purposes:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Essential Cookies:</strong> Required for the website to function properly, including user authentication and security features.</li>
            <li><strong>Performance Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous analytics data.</li>
            <li><strong>Functionality Cookies:</strong> Remember your preferences such as reading level, theme settings, and language choices.</li>
            <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements and track campaign effectiveness (only with your consent).</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Types of Cookies We Use
          </h2>
          
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">1. Authentication Cookies</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Provider:</strong> Clerk<br />
                <strong>Purpose:</strong> Manage user sessions and authentication<br />
                <strong>Duration:</strong> Session or up to 30 days for "Remember me"
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">2. Analytics Cookies</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Provider:</strong> PostHog<br />
                <strong>Purpose:</strong> Understand user behavior and improve our service<br />
                <strong>Duration:</strong> Up to 1 year
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">3. Preference Cookies</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Provider:</strong> First-party<br />
                <strong>Purpose:</strong> Remember user preferences (theme, language, reading level)<br />
                <strong>Duration:</strong> 1 year
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">4. Session Cookies</h3>
              <p className="text-gray-600 text-sm mb-2">
                <strong>Provider:</strong> First-party<br />
                <strong>Purpose:</strong> Maintain state during your visit<br />
                <strong>Duration:</strong> Deleted when browser is closed
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Managing Cookies
          </h2>
          <p className="text-gray-600 mb-4">
            You can control and manage cookies in various ways:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or delete cookies. Check your browser's help section for instructions.</li>
            <li><strong>Cookie Preferences:</strong> You can update your cookie preferences at any time through our cookie consent banner.</li>
            <li><strong>Opt-Out Links:</strong> Some third-party services provide opt-out mechanisms for their cookies.</li>
          </ul>
          <p className="text-gray-600 mt-4">
            Please note that disabling certain cookies may impact the functionality of our website.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Third-Party Cookies
          </h2>
          <p className="text-gray-600 mb-4">
            Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. 
            Third-party providers include:
          </p>
          <ul className="list-disc pl-6 text-gray-600 space-y-2">
            <li>Clerk (Authentication)</li>
            <li>PostHog (Analytics)</li>
            <li>Stripe (Payment processing - Professional features only)</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Updates to This Policy
          </h2>
          <p className="text-gray-600 mb-4">
            We may update this Cookie Policy from time to time. We will notify you of any significant changes 
            by posting a notice on our website or sending you an email.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-gray-600 mb-4">
            If you have questions about our use of cookies, please contact us:
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-gray-600">
              Email: privacy@dentistryexplained.co.uk<br />
              Phone: 0800 123 4567<br />
              Address: Dentistry Explained Ltd, 123 Dental House, London, UK, W1A 1AA
            </p>
          </div>
        </section>

        <div className="mt-12 flex gap-4">
          <a
            href="/privacy"
            className="text-primary hover:underline"
          >
            Privacy Policy
          </a>
          <span className="text-gray-400">|</span>
          <a
            href="/terms"
            className="text-primary hover:underline"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </div>
  )
}