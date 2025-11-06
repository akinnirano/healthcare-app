import React, { useState } from 'react'
import { useDocsAuth } from '../context/DocsAuthContext'
import { Copy, Check, RefreshCw } from 'lucide-react'

export default function ApiKeyManagement() {
  const { apiKey, user, regenerateApiKey } = useDocsAuth()
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const handleCopy = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRegenerate = async () => {
    if (!confirm('Are you sure? This will invalidate your current API key.')) {
      return
    }

    setRegenerating(true)
    try {
      await regenerateApiKey()
      alert('API key regenerated successfully!')
    } catch (error) {
      alert('Failed to regenerate API key: ' + error.message)
    } finally {
      setRegenerating(false)
    }
  }

  const maskKey = (key) => {
    if (!key || key.length < 12) return key
    return `${key.substring(0, 8)}${'•'.repeat(20)}${key.substring(key.length - 8)}`
  }

  return (
    <main className="flex-1 bg-dark-content overflow-y-auto">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-gray-400 mb-6">
          <span>API Reference</span>
          <span className="mx-2">&gt;</span>
          <span className="text-white">API Key Management</span>
        </nav>

        {/* Page Title */}
        <h1 className="text-4xl font-bold text-white mb-8">API Key Management</h1>

        {/* User Info */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Account Information</h2>
          <div className="space-y-2 text-gray-300">
            <p><span className="text-gray-400">User ID:</span> {user?.id}</p>
            <p><span className="text-gray-400">Email:</span> {user?.email || 'Not available'}</p>
            <p><span className="text-gray-400">Role:</span> {user?.role || 'Not specified'}</p>
          </div>
        </div>

        {/* API Key Card */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Your API Key</h2>
              <p className="text-gray-400 text-sm">
                Use this key to authenticate API requests. Keep it secure and never share it publicly.
              </p>
            </div>
            <button
              onClick={() => setShowKey(!showKey)}
              className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-gray-300 rounded transition"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>

          {apiKey ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 font-mono text-sm text-gray-300 break-all">
                {showKey ? apiKey : maskKey(apiKey)}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      <span>Copy Key</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw size={16} className={regenerating ? 'animate-spin' : ''} />
                  <span>{regenerating ? 'Regenerating...' : 'Regenerate'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-yellow-400">
              No API key found. Please contact support.
            </div>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">How to Use Your API Key</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-teal-400 font-semibold mb-2">Authentication Header</h3>
              <p className="text-sm mb-2">Include your API key in the Authorization header:</p>
              <pre className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm overflow-x-auto">
<code>{`Authorization: Bearer YOUR_API_KEY`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-teal-400 font-semibold mb-2">Example Request (cURL)</h3>
              <pre className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm overflow-x-auto">
<code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.hremsoftconsulting.com/users/`}</code>
              </pre>
            </div>

            <div>
              <h3 className="text-teal-400 font-semibold mb-2">Example Request (JavaScript)</h3>
              <pre className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-sm overflow-x-auto">
<code>{`const response = await fetch('https://api.hremsoftconsulting.com/users/', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});`}</code>
              </pre>
            </div>

            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-6">
              <h3 className="text-red-400 font-semibold mb-2">⚠️ Security Warning</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-300">
                <li>Never commit API keys to version control</li>
                <li>Don't expose API keys in client-side code</li>
                <li>Use environment variables for API keys</li>
                <li>Regenerate immediately if compromised</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}


