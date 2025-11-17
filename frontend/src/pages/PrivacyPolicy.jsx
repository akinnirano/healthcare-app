import React from 'react'
import FooterBlue from '../components/FooterBlue'

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-gray-600 italic mb-8">Last Updated: {lastUpdated}</p>
          
          <div className="prose prose-sky max-w-none">
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Welcome to the Healthcare Management Platform. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">2. Information We Collect</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>Personal identification information (name, email address, phone number)</li>
              <li>Professional information (license numbers, certifications, skills)</li>
              <li>Location data (for staff tracking and assignment purposes)</li>
              <li>Health information (for patient care and service delivery)</li>
              <li>Payment and billing information</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and manage payroll</li>
              <li>Send you notifications and updates</li>
              <li>Comply with legal obligations</li>
              <li>Ensure the safety and security of our platform</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">4. Information Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">We do not sell your personal information. We may share your information only in the following circumstances:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With service providers who assist in our operations</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4 ml-4">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Object to processing of your information</li>
              <li>Data portability</li>
            </ul>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">7. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed mb-4">If you have questions about this Privacy Policy, please contact us at:</p>
            <p className="text-gray-700 leading-relaxed mb-4">
              Email: <a href="mailto:privacy@hremsoftconsulting.com" className="text-sky-600 hover:text-sky-700 underline">privacy@hremsoftconsulting.com</a>
            </p>
            
            <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </div>
        </div>
      </section>

      <FooterBlue />
    </main>
  )
}

