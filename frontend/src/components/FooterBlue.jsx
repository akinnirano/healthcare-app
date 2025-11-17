import React from 'react'
import stethoBg from '../../images/stetothoscope.webp'

export default function FooterBlue(){
  return (
    <footer className="relative mt-10 isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-sky-50/90" />
      <div className="absolute inset-0 -z-20 bg-center bg-cover opacity-20" style={{ backgroundImage: `url(${stethoBg})` }} />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-4">
          <a href="/privacy-policy" className="text-sm text-sky-800 hover:text-sky-900 underline">Privacy Policy</a>
          <a href="/terms-of-service" className="text-sm text-sky-800 hover:text-sky-900 underline">Terms of Service</a>
        </div>
        <p className="text-sm text-sky-800 text-center">© {new Date().getFullYear()} Healthcare Staffing Platform. All rights reserved.</p>
      </div>
    </footer>
  )
}
