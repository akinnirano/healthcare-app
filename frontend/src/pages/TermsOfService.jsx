import React from 'react'
import FooterBlue from '../components/FooterBlue'

export default function TermsOfService() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-sky-50 to-white">
      {/* Header navigation */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-b from-rose-50/80 to-rose-100/60 px-4 py-3 ring-1 ring-rose-100 backdrop-blur shadow-inner">
          <a href="/" className="text-lg font-semibold">Healthcare Staffing</a>
          <nav className="hidden gap-6 text-sm sm:flex">
            <a href="/" className="hover:text-gray-900">Home</a>
            <a href="/services" className="hover:text-gray-900">Our Services</a>
            <a href="/practitioner/register" className="hover:text-gray-900">Join Our Team</a>
            <a href="/contact" className="hover:text-gray-900">Contact Us</a>
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <a href="/contact" className="rounded-lg bg-sky-600 px-3 py-2 text-xs text-white shadow-sm transition hover:bg-sky-700">Request Care</a>
            <a href="/login" className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs shadow-sm transition hover:border-rose-300">Client Portal / Staff Login</a>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="rounded-2xl bg-white p-6 sm:p-10 shadow-sm ring-1 ring-gray-100">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-sky-600 border-b-3 border-sky-600 pb-3 mb-4">
            Terms of Service
          </h1>
          <p className="text-gray-600 italic mb-8">Last Updated: {lastUpdated}</p>
          
          <div className="prose prose-sky max-w-none">
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              By accessing and using the Healthcare Management Platform, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">2. Use License</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Permission is granted to temporarily use the Healthcare Management Platform for personal and commercial healthcare management purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose without explicit permission</li>
              <li>Attempt to decompile or reverse engineer any software</li>
              <li>Remove any copyright or other proprietary notations</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">4. User Conduct</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to use the platform only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the platform.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">5. Healthcare Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              All healthcare information provided through the platform is for management and coordination purposes only. It does not constitute medical advice, diagnosis, or treatment.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">6. Payment Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Payment for services is processed according to the terms agreed upon in your service agreement. All fees are non-refundable unless otherwise stated.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">7. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The platform and its original content, features, and functionality are owned by HREM Soft Consulting and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              In no event shall HREM Soft Consulting or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the platform.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may terminate or suspend your account and access to the platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">If you have any questions about these Terms of Service, please contact us at:</p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Email: <a href="mailto:support@hremsoftconsulting.com" className="text-sky-600 hover:text-sky-700 underline">support@hremsoftconsulting.com</a>
            </p>
          </div>
        </div>
      </section>

      <FooterBlue />
    </main>
  )
}

