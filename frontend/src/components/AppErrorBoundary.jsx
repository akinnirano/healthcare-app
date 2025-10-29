import React from 'react'

export default class AppErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error){
    return { hasError: true, error }
  }
  componentDidCatch(error, info){
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info)
  }
  render(){
    if (this.state.hasError){
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h2>
          <pre style={{ marginTop: 12, background: '#fff1f2', color: '#9f1239', padding: 12, borderRadius: 8, overflow: 'auto' }}>
            {String(this.state.error)}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}


