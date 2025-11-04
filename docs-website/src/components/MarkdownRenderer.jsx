import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy } from 'lucide-react'

export default function MarkdownRenderer({ content }) {
  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
  }

  return (
    <div className="markdown-content prose prose-invert prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-4xl font-bold text-white mb-6 mt-8 border-b border-gray-700 pb-3" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-2xl font-bold text-white mb-4 mt-8" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xl font-semibold text-white mb-3 mt-6" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-lg font-semibold text-gray-200 mb-2 mt-4" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="text-gray-300 leading-relaxed mb-4" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a className="text-blue-400 hover:text-blue-300 underline" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4 ml-4" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4 ml-4" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="text-gray-300" {...props} />
          ),
          code: ({ node, inline, className, children, ...props }) => {
            const codeString = String(children).replace(/\n$/, '')
            
            if (inline) {
              return (
                <code className="px-2 py-0.5 bg-gray-700/50 rounded text-sm text-gray-100 font-mono" {...props}>
                  {children}
                </code>
              )
            }
            
            return (
              <div className="relative group mb-4">
                <button
                  onClick={() => copyCode(codeString)}
                  className="absolute right-2 top-2 p-2 bg-gray-700/50 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Copy code"
                >
                  <Copy size={14} className="text-gray-300" />
                </button>
                <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto border border-gray-700/50">
                  <code className={`text-sm text-gray-100 font-mono ${className}`} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            )
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-900/10 text-gray-300 italic" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-700 rounded-lg" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-800/50" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-700" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-gray-800/30" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-200 border-b border-gray-700" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-gray-300" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="border-gray-700 my-8" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-white" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-200" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

