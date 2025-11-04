import React from 'react'

const sections = [
  { title: 'Base URL', href: '#base-url', active: true },
  { title: 'Authentication', href: '#authentication' },
  { title: 'Request Format', href: '#request-format' },
  { title: 'Response Format', href: '#response-format' },
  { title: 'Errors', href: '#errors' },
  { title: 'Rate Limiting', href: '#rate-limiting' },
]

export default function OnThisPage() {
  return (
    <aside className="w-56 h-[calc(100vh-4rem)] overflow-y-auto border-l border-gray-700/50 sticky top-16 hidden xl:block">
      <div className="p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          On This Page
        </h3>
        <nav className="space-y-2">
          {sections.map((section) => (
            <a
              key={section.title}
              href={section.href}
              className={`block text-sm py-1 transition-colors ${
                section.active
                  ? 'text-blue-400 font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {section.title}
            </a>
          ))}
        </nav>
      </div>
    </aside>
  )
}

