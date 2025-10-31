import React, { useEffect, useState } from 'react'
import stethoBg from '../../images/stetothoscope.webp'
import FooterBlue from '../components/FooterBlue'

export default function Home(){
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-sky-50 to-white">
      {/* Watermark background */}
      <div className="pointer-events-none select-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${stethoBg})` }} />
        {/* Soft overlay for readability */}
        <div className="absolute inset-0 bg-white/70" />
        {/* Faint red accent */}
        <div className="absolute top-1/3 -left-24 h-64 w-64 sm:h-96 sm:w-96 rounded-full bg-rose-200 blur-3xl opacity-20" />
      </div>
      <div className="relative z-10">
      {/* Header navigation */}
      <header className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-b from-rose-50/80 to-rose-100/60 px-4 py-3 ring-1 ring-rose-100 backdrop-blur supports-[backdrop-filter]:bg-rose-50/50 shadow-inner">
          <a href="/" className="text-lg font-semibold text-800">Healthcare Staffing</a>
          <nav className="hidden gap-6 text-sm text-700 sm:flex">
            <a href="/" className="hover:text-gray-900">Home</a>
            <a href="/index" className="hover:text-gray-900">About Us</a>
            <a href="/services" className="hover:text-gray-900">Our Services</a>
            <a href="/practitioner/register" className="hover:text-gray-900">Join Our Team</a>
            <a href="/index" className="hover:text-gray-900">Clients / Partners</a>
            <a href="/contact" className="hover:text-gray-900">Contact Us</a>
            <a href="/patient/register" className="hover:text-gray-900">Book a Visit / Request Staff</a>
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <a href="tel:+15555555555" className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-700 shadow-sm transition hover:border-300">Call Now</a>
            <a href="/contact" className="rounded-lg bg-sky-600 px-3 py-2 text-xs text-white shadow-sm transition hover:bg-sky-700">Request Care</a>
            <a href="/practitioner/register" className="rounded-lg bg-cyan-600 px-3 py-2 text-xs text-white shadow-sm transition hover:bg-cyan-700">Hire a Worker</a>
            <a href="/login" className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs text-700 shadow-sm transition hover:border-300">Client Portal / Staff Login</a>
          </div>
        </div>
      </header>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-sky-100 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-cyan-100 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-12 sm:pt-16 pb-14 sm:pb-20">
          <div className="grid items-center gap-8 sm:gap-12 sm:grid-cols-2">
            <div className="mx-auto max-w-3xl text-center sm:text-left">
              <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Care That Comes to You – Compassionate Health Support Anytime, anywhere.</span>
              <h1 className="mt-6 text-3xl sm:text-6xl font-extrabold tracking-tight text-gray-900">
                Trusted Mobile Healthcare Solutions for Seniors and Vulnerable Individuals Across Ontario.
              </h1>
              <p className="mt-6 text-base sm:text-lg leading-8 text-gray-600">
                We connect retirement homes, private families, and care facilities with certified Nurses, PSWs, Doctors, and Therapists—anytime, anywhere.
              </p>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4">
                <a href="/contact" className="rounded-lg bg-sky-600 px-5 py-3 text-white shadow-sm transition hover:bg-sky-700 w-full sm:w-auto text-center">Request a Caregiver</a>
                <a href="/practitioner/register" className="rounded-lg border border-sky-200 bg-white px-5 py-3 text-sky-700 shadow-sm transition hover:border-sky-300 w-full sm:w-auto text-center">Hire Medical Staff</a>
                <a href="/practitioner/register" className="rounded-lg bg-cyan-600 px-5 py-3 text-white shadow-sm transition hover:bg-cyan-700 w-full sm:w-auto text-center">Join Our Team</a>
              </div>
            </div>
            <div>
              <Slider />
            </div>
          </div>
        </div>
      </section>

      {/* About Us */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900">Who We Are</h2>
          <p className="mt-4 text-gray-600">We are a licensed and insured mobile healthcare staffing and services company, committed to compassion, professionalism, dignity, and respect. Serving GTA, Hamilton, Ottawa and surrounding communities.</p>
        </div>
      </section>

      {/* Our Services */}
      <section id="features" className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900">Our Services</h2>
          <p className="mt-4 text-gray-600">Certified, vetted healthcare professionals across a full spectrum of care.</p>
        </div>
        <div className="mt-10 sm:mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon="🤝" title="Personal Support Services" desc="Certified PSWs for hygiene, companionship, meal prep, mobility assistance."/>
          <FeatureCard icon="🩺" title="Nursing Services" desc="RNs and RPNs for wound care, meds administration, and post-surgery care."/>
          <FeatureCard icon="👨‍⚕️" title="Physician & Medical Visits" desc="On-call doctors for home/facility visits and telemedicine."/>
          <FeatureCard icon="🧑‍🦽" title="Physiotherapy & Rehab" desc="In-home physio and post-hospital recovery programs."/>
          <FeatureCard icon="🧠" title="Specialized Care" desc="Dementia, palliative, disability support tailored to families."/>
          <FeatureCard icon="🏥" title="Staffing for Institutions" desc="Short- and long-term placements for facilities and clinics."/>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 sm:grid-cols-3">
          <StatCard label="24/7 Availability" value="Always On"/>
          <StatCard label="Vetted Professionals" value="300+"/>
          <StatCard label="Communities Served" value="15+"/>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-xl sm:text-3xl font-bold text-gray-900">Teams love our platform</h3>
          <p className="mt-4 text-gray-600">Real stories from operations and field staff.</p>
        </div>
        <div className="mt-8 sm:mt-10 grid gap-6 sm:grid-cols-2">
          <Testimonial
            quote="Approvals went from days to hours. Our coordinators finally have breathing room."
            author="Operations Manager"
          />
          <Testimonial
            quote="Clock-in with location is effortless. No more back-and-forth about hours."
            author="Registered Nurse"
          />
        </div>
      </section>

      {/* Join Our Team / CTA */}
      <section className="relative isolate mx-auto max-w-7xl overflow-hidden rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 px-4 sm:px-10 py-10 sm:py-14 shadow">
        <div className="mx-auto max-w-3xl text-center">
          <h3 className="text-xl sm:text-3xl font-bold text-white">Join Our Team</h3>
          <p className="mt-3 text-sky-100">We’re always looking for compassionate PSWs, RNs, and therapists. Flexible shifts. Supportive environment.</p>
          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <a href="/practitioner/register" className="rounded-lg bg-white px-5 py-3 font-medium text-sky-700 shadow hover:bg-sky-50 w-full sm:w-auto text-center">Apply Now</a>
            <a href="/contact" className="rounded-lg border border-white/60 bg-transparent px-5 py-3 font-medium text-white shadow hover:bg-white/10 w-full sm:w-auto text-center">Request Care</a>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 sm:h-72 sm:w-72 rounded-full bg-white/10 blur-3xl" />
      </section>

      <FooterBlue />
      </div>
    </main>
  )
}

function BannerCarousel(){
  const slides = [
    {
      title: 'Healthcare Agentic AI Staff Location Tracking',
      subtitle: 'Autonomous, privacy-conscious geo updates for accurate time & attendance.',
      primary: { href: '/Login', label: 'Staff Tracking' },
    },
    {
      title: 'End-to-End Shift for PSW, RN, OT, PT, etc. : Timesheet & Payroll Automation',
      subtitle: 'From assignment to invoice—all the workflows streamlined in one place.',
      primary: { href: '/Practitioner/register', label: 'Create Healthcare Practitioner' },
    },
  ]
  const [index, setIndex] = useState(0)
  const [anim, setAnim] = useState('opacity-0 translate-y-2')

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % slides.length), 6000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    setAnim('opacity-0 translate-y-2')
    const t = setTimeout(() => setAnim('opacity-100 translate-y-0'), 50)
    return () => clearTimeout(t)
  }, [index])

  const s = slides[index]
  return (
    <div>
      <h1 className={`mt-6 text-3xl sm:text-6xl font-extrabold tracking-tight text-gray-900 transition-all duration-500 ${anim}`}>
        {s.title}
      </h1>
      <p className={`mt-6 text-base sm:text-lg leading-8 text-gray-600 transition-all duration-500 ${anim}`}>
        {s.subtitle}
      </p>
      <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-3 sm:gap-4">
        <a href={s.primary?.href || '/login'} className="rounded-lg bg-sky-600 px-5 py-3 text-white shadow-sm transition hover:bg-sky-700 w-full sm:w-auto text-center">
          {s.primary?.label || 'Get Started'}
        </a>
        {s.secondary ? (
          <a href={s.secondary.href} className="rounded-lg border border-sky-200 bg-white px-5 py-3 text-sky-700 shadow-sm transition hover:border-sky-300 w-full sm:w-auto text-center">
            {s.secondary.label}
          </a>
        ) : (
          <a href="#features" className="rounded-lg border border-sky-200 bg-white px-5 py-3 text-sky-700 shadow-sm transition hover:border-sky-300 w-full sm:w-auto text-center">
            Learn more
          </a>
        )}
      </div>
      <div className="mt-4 flex items-center justify-center sm:justify-start gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            aria-label={`Headline ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 w-2 rounded-full ${i === index ? 'bg-sky-600' : 'bg-sky-200'} transition`}
          />
        ))}
      </div>
    </div>
  )
}

function StethoscopeWatermark(){
  return (
    <svg viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
      <g fill="none" stroke="#0ea5e9" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
        {/* Tubing */}
        <path d="M150 200 C 220 400, 420 420, 520 340 C 640 250, 700 300, 720 360 C 760 480, 900 520, 1040 420"/>
        {/* Chestpiece */}
        <circle cx="150" cy="200" r="40" />
        <circle cx="150" cy="200" r="20" />
        {/* Y-branch */}
        <path d="M760 360 C 780 320, 820 300, 860 320" />
        <path d="M760 360 C 780 400, 820 420, 860 400" />
        {/* Earpieces */}
        <circle cx="880" cy="310" r="18" />
        <circle cx="880" cy="410" r="18" />
      </g>
    </svg>
  )
}

function Slider(){
  const slides = [
    { id: 0, node: <HealthcareSVG1 /> },
    { id: 1, node: <HealthcareSVG2 /> },
    { id: 2, node: <HealthcareSVG3 /> },
  ]
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex(i => (i + 1) % slides.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const prev = () => setIndex((index - 1 + slides.length) % slides.length)
  const next = () => setIndex((index + 1) % slides.length)

  return (
    <div aria-live="polite" className="relative overflow-hidden rounded-2xl border border-sky-100 bg-white shadow">
      <div className="aspect-[16/10] sm:aspect-[4/3] flex items-center justify-center">
        {slides[index].node}
      </div>
      <button onClick={prev} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-sky-700 shadow hover:bg-white">
        <span className="sr-only">Previous</span>
        <ChevronLeftIcon />
      </button>
      <button onClick={next} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-sky-700 shadow hover:bg-white">
        <span className="sr-only">Next</span>
        <ChevronRightIcon />
      </button>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button key={s.id} onClick={() => setIndex(i)} aria-label={`Slide ${i + 1}`} className={`h-2 w-2 rounded-full ${i === index ? 'bg-sky-600' : 'bg-sky-200'} transition`}/>
        ))}
      </div>
    </div>
  )
}

function ChevronLeftIcon(){
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 19L8 12L15 5" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronRightIcon(){
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 5L16 12L9 19" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function HealthcareSVG1(){
  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full max-h-[220px] sm:max-h-[320px]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e0f2fe"/>
          <stop offset="100%" stopColor="#bae6fd"/>
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="90" fill="url(#grad1)" />
      <rect x="70" y="70" width="60" height="60" rx="8" fill="#0ea5e9" opacity="0.15" />
      <path d="M100 70 L100 130 M70 100 L130 100" stroke="#0284c7" strokeWidth="10" strokeLinecap="round"/>
    </svg>
  )
}

function HealthcareSVG2(){
  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full max-h-[220px] sm:max-h-[320px]" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="180" height="180" rx="24" fill="#ecfeff" />
      <path d="M60 120 C60 90, 110 90, 110 120 C110 140, 90 150, 75 140" fill="none" stroke="#06b6d4" strokeWidth="6"/>
      <circle cx="120" cy="80" r="14" fill="#06b6d4"/>
      <path d="M120 94 C120 115, 145 120, 155 120" stroke="#06b6d4" strokeWidth="6" fill="none"/>
    </svg>
  )
}

function HealthcareSVG3(){
  return (
    <svg viewBox="0 0 200 200" className="h-auto w-full max-h-[220px] sm:max-h-[320px]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#cffafe"/>
          <stop offset="100%" stopColor="#e0f2fe"/>
        </linearGradient>
      </defs>
      <rect x="20" y="50" width="160" height="100" rx="18" fill="url(#grad2)"/>
      <path d="M35 100 H75 L85 80 L100 120 L110 95 L120 105 H165" stroke="#0ea5e9" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="50" cy="75" r="6" fill="#0ea5e9"/>
      <circle cx="150" cy="123" r="6" fill="#0ea5e9"/>
    </svg>
  )
}

function FeatureCard({ icon, title, desc }){
  return (
    <div className="rounded-2xl border border-sky-100 bg-white p-6 shadow-sm transition hover:shadow">
      <div className="mb-3 text-3xl">{icon}</div>
      <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
      <p className="mt-2 text-sm text-gray-600">{desc}</p>
    </div>
  )
}

function StatCard({ label, value }){
  return (
    <div className="rounded-2xl bg-sky-50 p-6 text-center shadow-sm">
      <div className="text-sm font-medium text-sky-700">{label}</div>
      <div className="mt-2 text-3xl font-extrabold text-sky-900">{value}</div>
    </div>
  )
}

function Testimonial({ quote, author }){
  return (
    <figure className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <blockquote className="text-gray-700">“{quote}”</blockquote>
      <figcaption className="mt-4 text-sm font-medium text-gray-500">— {author}</figcaption>
    </figure>
  )
}
