import React from 'react'
import FooterBlue from '../components/FooterBlue'

export default function Services(){
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-sky-50 to-white">
      <header className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-b from-rose-50/80 to-rose-100/60 px-4 py-3 ring-1 ring-rose-100 backdrop-blur shadow-inner">
          <a href="/" className="text-lg font-semibold">Healthcare Staffing</a>
          <nav className="hidden gap-6 text-sm sm:flex">
            <a href="/" className="hover:text-gray-900">Home</a>
            <a href="/index" className="hover:text-gray-900">About Us</a>
            <a href="/services" className="hover:text-gray-900">Our Services</a>
            <a href="/practitioner/register" className="hover:text-gray-900">Join Our Team</a>
            <a href="/index" className="hover:text-gray-900">Clients / Partners</a>
            <a href="/contact" className="hover:text-gray-900">Contact Us</a>
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <a href="tel:+15555555555" className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs shadow-sm transition hover:border-300">Call Now</a>
            <a href="/contact" className="rounded-lg bg-sky-600 px-3 py-2 text-xs text-white shadow-sm transition hover:bg-sky-700">Request Care</a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-12">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-900">Our Healthcare Services</h1>
          <p className="mt-4 text-gray-600">Flexible, reliable, and compassionate care for families and facilities.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard icon="🤝" title="Personal Support Services" desc="Certified PSWs for hygiene, companionship, meal prep, mobility assistance."/>
          <ServiceCard icon="🩺" title="Nursing Services" desc="RNs/RPNs for wound care, medications, post-surgery care."/>
          <ServiceCard icon="👨‍⚕️" title="Physician & Medical Visits" desc="On-call doctors for home/facility and telemedicine visits."/>
          <ServiceCard icon="🧑‍🦽" title="Physiotherapy & Rehab" desc="In-home physiotherapy and recovery programs."/>
          <ServiceCard icon="🧠" title="Specialized Care" desc="Dementia, palliative, disability support."/>
          <ServiceCard icon="🏥" title="Staffing for Institutions" desc="Short- and long-term placements for clinics and facilities."/>
        </div>
        <div className="mt-10 text-center">
          <a href="/contact" className="inline-flex items-center rounded-lg bg-sky-600 px-5 py-3 text-white shadow hover:bg-sky-700">Request Care or Staff</a>
        </div>
      </section>

      <FooterBlue />
    </main>
  )
}

function ServiceCard({ icon, title, desc }){
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition hover:shadow">
      <div className="mb-3 text-3xl">{icon}</div>
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}
