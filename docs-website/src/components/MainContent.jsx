import React from 'react'
import { Copy, ChevronDown } from 'lucide-react'

export default function MainContent() {
  return (
    <main className="flex-1 bg-dark-content overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-400 mb-6">
          <span>API Reference</span>
          <span className="mx-2">&gt;</span>
          <span className="text-white">Getting Started</span>
        </nav>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-white">Getting Started</h1>
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg transition-colors text-gray-300 hover:text-white">
            <Copy size={16} />
            <span className="text-sm">Copy page</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Introduction */}
        <div className="space-y-4 text-gray-300 leading-relaxed mb-12">
          <p>
            The Healthcare API is designed to help developers build tools to automate healthcare staffing,
            patient management, and operational workflows for healthcare organizations.
          </p>
          <p>
            The API is organized around REST. It has predictable resource-oriented URLs; accepts JSON-encoded
            request bodies; returns JSON-encoded responses; and uses standard HTTP response codes, authentication,
            and verbs. To help maintain security, all requests must be made over HTTPS. Calls made over plain HTTP
            will fail.
          </p>
        </div>

        {/* Base URL Section */}
        <section className="mb-12" id="base-url">
          <h2 className="text-2xl font-bold text-white mb-4">Base URL</h2>
          <div className="bg-black/40 rounded-lg p-4 border border-gray-700/50">
            <code className="text-gray-100 font-mono text-sm">
              https://api.hremsoftconsulting.com
            </code>
          </div>
        </section>

        {/* Authentication Section */}
        <section className="mb-12" id="authentication">
          <h2 className="text-2xl font-bold text-white mb-4">Authentication</h2>
          <p className="text-gray-300 mb-4">
            Every operation on our REST API requires authentication using a JWT token. You can obtain a token
            by calling the <code className="px-2 py-1 bg-gray-700/50 rounded text-sm">/auth/login</code> endpoint
            with valid credentials. Detailed information can be found on our{' '}
            <a href="#authentication" className="text-blue-400 hover:text-blue-300 underline">
              Authentication page
            </a>.
          </p>
          
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold text-white mb-3">Example Request</h3>
            <pre className="bg-black/40 rounded p-4 overflow-x-auto">
              <code className="text-sm text-gray-100 font-mono">
{`POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password"
}

// Response
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "role": "admin",
  "privileges": ["read_patients", "write_patients"]
}`}
              </code>
            </pre>
          </div>

          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 mt-4">
            <h3 className="text-lg font-semibold text-white mb-3">Using the Token</h3>
            <p className="text-gray-300 mb-3">
              Include the JWT token in the <code className="px-2 py-1 bg-gray-700/50 rounded text-sm">Authorization</code> header
              for all subsequent requests:
            </p>
            <pre className="bg-black/40 rounded p-4 overflow-x-auto">
              <code className="text-sm text-gray-100 font-mono">
{`GET /users/
Authorization: Bearer eyJhbGc...`}
              </code>
            </pre>
          </div>
        </section>

        {/* Request Format */}
        <section className="mb-12" id="request-format">
          <h2 className="text-2xl font-bold text-white mb-4">Request Format</h2>
          <p className="text-gray-300 mb-4">
            All requests should include the following headers:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
            <li><code className="px-2 py-1 bg-gray-700/50 rounded text-sm">Content-Type: application/json</code></li>
            <li><code className="px-2 py-1 bg-gray-700/50 rounded text-sm">Authorization: Bearer &lt;token&gt;</code> (except for login)</li>
          </ul>
        </section>

        {/* Response Format */}
        <section className="mb-12" id="response-format">
          <h2 className="text-2xl font-bold text-white mb-4">Response Format</h2>
          <p className="text-gray-300 mb-4">
            All responses are returned in JSON format. Successful responses will have appropriate HTTP status codes
            (200, 201, etc.) and include the requested data.
          </p>
        </section>

        {/* Errors Section */}
        <section className="mb-12" id="errors">
          <h2 className="text-2xl font-bold text-white mb-4">Errors</h2>
          <p className="text-gray-300 mb-4">
            The Healthcare API uses conventional HTTP response codes to indicate the success or failure of an API request.
          </p>
          
          <div className="space-y-3">
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-sm font-mono">200</span>
                <div>
                  <p className="font-semibold text-white">OK</p>
                  <p className="text-gray-400 text-sm">Everything worked as expected.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm font-mono">400</span>
                <div>
                  <p className="font-semibold text-white">Bad Request</p>
                  <p className="text-gray-400 text-sm">The request was unacceptable, often due to missing a required parameter.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-sm font-mono">401</span>
                <div>
                  <p className="font-semibold text-white">Unauthorized</p>
                  <p className="text-gray-400 text-sm">No valid JWT token provided or token has expired.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-sm font-mono">403</span>
                <div>
                  <p className="font-semibold text-white">Forbidden</p>
                  <p className="text-gray-400 text-sm">The request is valid but you don't have permission to access the resource.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-sm font-mono">404</span>
                <div>
                  <p className="font-semibold text-white">Not Found</p>
                  <p className="text-gray-400 text-sm">The requested resource doesn't exist.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-sm font-mono">500</span>
                <div>
                  <p className="font-semibold text-white">Server Error</p>
                  <p className="text-gray-400 text-sm">Something went wrong on our end.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Rate Limiting */}
        <section className="mb-12" id="rate-limiting">
          <h2 className="text-2xl font-bold text-white mb-4">Rate Limiting</h2>
          <p className="text-gray-300">
            The API implements rate limiting to ensure fair usage. Rate limits are applied per API key and are
            designed to be generous for normal use cases. If you exceed the rate limit, you'll receive a
            429 Too Many Requests response.
          </p>
        </section>
      </div>
    </main>
  )
}

