import { useState, useEffect } from 'react'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import LiveMap from './pages/LiveMap'
import AIDetection from './pages/AIDetection'
import Prediction from './pages/Prediction'
import RouteManagement from './pages/RouteManagement'
import Emergency from './pages/Emergency'
import Analytics from './pages/Analytics'

const PAGE_TITLES: Record<string, string> = {
  home:       'Overview',
  livemap:    'Live Crowd Map',
  detection:  'AI Detection',
  prediction: 'Crowd Prediction',
  routes:     'Smart Routes',
  emergency:  'Emergency Management',
  analytics:  'Analytics',
}

export default function App() {
  const [page, setPage] = useState('home')
  const [pageKey, setPageKey] = useState(0)
  const [mobileNav, setMobileNav] = useState(false)
  const [time, setTime] = useState(new Date())
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function navigate(p: string) {
    setPage(p)
    setPageKey(k => k + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function renderPage() {
    switch (page) {
      case 'home':       return <Home onNavigate={navigate} />
      case 'livemap':    return <LiveMap />
      case 'detection':  return <AIDetection />
      case 'prediction': return <Prediction />
      case 'routes':     return <RouteManagement />
      case 'emergency':  return <Emergency />
      case 'analytics':  return <Analytics />
      default:           return <Home onNavigate={navigate} />
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050d1c',
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.4s',
    }}>
      <NavBar current={page} onChange={navigate} mobileOpen={mobileNav} onMobileClose={() => setMobileNav(false)} />

      {/* Main content area */}
      <div style={{
        marginLeft: 'clamp(0px, 240px, 240px)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Top bar */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(5,13,28,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,212,255,0.1)',
          padding: '0 24px',
          height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Mobile hamburger + breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setMobileNav(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#94a3b8', fontSize: 20, padding: 4,
                display: 'none',
              }}
              className="max-[900px]:block"
            >☰</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4b6080' }}>PILGRIM AI</span>
              <span style={{ color: '#1e3a5f', fontSize: 12 }}>›</span>
              <span className="orbitron" style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.06em' }}>
                {PAGE_TITLES[page] ?? 'Overview'}
              </span>
            </div>
          </div>

          {/* Right: time + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Quick nav for desktop */}
            <div style={{ display: 'flex', gap: 1, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 3 }}>
              {['home','livemap','detection','prediction','routes','emergency','analytics'].map(p => {
                const ICONS: Record<string,string> = {home:'⬡',livemap:'◎',detection:'◉',prediction:'◈',routes:'◀',emergency:'⚠',analytics:'▤'}
                return (
                  <button
                    key={p}
                    onClick={() => navigate(p)}
                    title={PAGE_TITLES[p]}
                    style={{
                      width: 28, height: 28, borderRadius: 5, border: 'none', cursor: 'pointer',
                      background: page === p ? 'rgba(0,212,255,0.15)' : 'transparent',
                      color: page === p ? '#00d4ff' : '#4b6080',
                      fontSize: 12, fontFamily: 'Orbitron',
                      transition: 'all 0.15s',
                    }}
                  >{ICONS[p]}</button>
                )
              })}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#4b6080', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#00ff88' }}>●</span>
              <span>{time.toLocaleTimeString('en', { hour12: false })}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main
          key={pageKey}
          style={{
            flex: 1, padding: '28px 24px',
            animation: 'float-up 0.35s cubic-bezier(0.4,0,0.2,1) both',
            maxWidth: 1400,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {renderPage()}
        </main>

        {/* Footer */}
        <footer style={{
          padding: '14px 24px',
          borderTop: '1px solid rgba(0,212,255,0.07)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#1e3a5f' }}>
            PILGRIM FLOW AI — CROWD MANAGEMENT SYSTEM v4.2 © 2024
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {['AI Engine: ACTIVE', 'Cameras: 128/128', 'Uptime: 99.97%'].map(s => (
              <span key={s} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#1e3a5f' }}>{s}</span>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
