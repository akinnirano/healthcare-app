import React, { useState } from 'react'
import FooterBlue from '../components/FooterBlue'

export default function Contact(){
  const [form, setForm] = useState({ name: '', phone: '', email: '', service: '', datetime: '' })
  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value })
  const onSubmit = e => { e.preventDefault(); alert('Thank you. We will contact you shortly.'); setForm({ name:'', phone:'', email:'', service:'', datetime:'' }) }

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-white via-sky-50 to-white">
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
            <a href="tel:+15555555555" className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs shadow-sm transition hover:border-300">Call Now</a>
            <a href="/contact" className="rounded-lg bg-sky-600 px-3 py-2 text-xs text-white shadow-sm transition hover:bg-sky-700">Request Care</a>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 pb-12">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">Contact / Booking</h1>
            <p className="mt-3 text-gray-600">24/7 Helpline: <a className="text-sky-700" href="tel:+15555555555">+1 (555) 555-5555</a></p>
            <p className="mt-1 text-gray-600">Email: <a className="text-sky-700" href="mailto:support@healthcare.example">support@healthcare.example</a></p>
            <div className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-gray-100 shadow-sm">
              <form onSubmit={onSubmit} className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full name</label>
                  <input name="name" value={form.name} onChange={onChange} required className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input name="phone" value={form.phone} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input name="email" type="email" value={form.email} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Needed</label>
                  <input name="service" value={form.service} onChange={onChange} placeholder="PSW, Nursing, Physiotherapy, Staffing…" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Date/Time</label>
                  <input name="datetime" value={form.datetime} onChange={onChange} type="datetime-local" className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <button className="mt-2 rounded-lg bg-sky-600 px-5 py-2 text-white shadow hover:bg-sky-700">Submit Request</button>
              </form>
            </div>
          </div>
          <div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-gray-100 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">Service Areas</h2>
              <p className="mt-2 text-gray-600">GTA, Hamilton, Ottawa, and surrounding communities.</p>
              <div className="mt-4 h-64 w-full rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">Map Placeholder</div>
            </div>
          </div>
        </div>
      </section>

      <FooterBlue />
    </main>
  )
}
