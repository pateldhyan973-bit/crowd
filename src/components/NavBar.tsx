interface NavBarProps {
  current: string
  onChange: (page: string) => void
  mobileOpen: boolean
  onMobileClose: () => void
}

const NAV_ITEMS = [
  { id: 'home',      icon: '⬡', label: 'Overview' },
  { id: 'livemap',   icon: '◎', label: 'Live Crowd Map' },
  { id: 'detection', icon: '◉', label: 'AI Detection' },
  { id: 'prediction',icon: '◈', label: 'Crowd Prediction' },
  { id: 'routes',    icon: '◀', label: 'Smart Routes' },
  { id: 'emergency', icon: '⚠', label: 'Emergency Mgmt' },
  { id: 'analytics', icon: '▤', label: 'Analytics' },
]

export default function NavBar({ current, onChange, mobileOpen, onMobileClose }: NavBarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 99, display: 'block' }}
          className="lg:hidden"
        />
      )}

      <nav
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
          background: 'rgba(5,13,28,0.97)',
          borderRight: '1px solid rgba(0,212,255,0.13)',
          backdropFilter: 'blur(24px)',
          zIndex: 100,
          display: 'flex', flexDirection: 'column',
          transform: mobileOpen ? 'translateX(0)' : undefined,
          transition: 'transform 0.3s ease',
        }}
        className={`${mobileOpen ? '' : 'max-[900px]:-translate-x-full'}`}
      >
        {/* Logo */}
        <div style={{ padding: '28px 20px 20px', borderBottom: '1px solid rgba(0,212,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(0,212,255,0.3), rgba(0,255,136,0.2))',
              border: '1px solid rgba(0,212,255,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, flexShrink: 0,
            }}>⬡</div>
            <div>
              <div style={{ fontFamily: 'Orbitron', fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.1em', lineHeight: 1 }}>PILGRIM AI</div>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginTop: 3, letterSpacing: '0.08em' }}>CROWD MANAGEMENT</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
            <span className="dot-green blink" />
            <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00ff88' }}>SYSTEM ACTIVE</span>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(item => {
            const active = current === item.id
            return (
              <button
                key={item.id}
                onClick={() => { onChange(item.id); onMobileClose() }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: active ? 'rgba(0,212,255,0.12)' : 'transparent',
                  borderLeft: active ? '2px solid #00d4ff' : '2px solid transparent',
                  color: active ? '#00d4ff' : '#94a3b8',
                  fontSize: 13, fontFamily: 'Inter', fontWeight: active ? 500 : 400,
                  width: '100%', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontFamily: 'Orbitron', fontSize: 13,
                  color: active ? '#00d4ff' : '#4b6080',
                  flexShrink: 0, width: 18, textAlign: 'center',
                }}>{item.icon}</span>
                <span>{item.label}</span>
                {active && <span style={{ marginLeft: 'auto', width: 4, height: 4, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 8px #00d4ff' }} />}
              </button>
            )
          })}
        </div>

        {/* Bottom status */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(0,212,255,0.1)' }}>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginBottom: 8, letterSpacing: '0.06em' }}>SYSTEM STATUS</div>
          {[['AI Engine', '#00ff88'], ['Camera Network', '#00ff88'], ['Alert System', '#ffd700']].map(([label, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4b6080' }}>{label}</span>
              <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: color as string }}>●</span>
            </div>
          ))}
        </div>
      </nav>
    </>
  )
}
