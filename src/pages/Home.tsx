import { useState, useEffect, useRef } from 'react'
import PilgrimCanvas from '../components/PilgrimCanvas'

interface Props { onNavigate: (page: string) => void }

const FEATURE_CARDS = [
  { icon: '◉', title: 'AI Vision Detection', desc: '128 CCTV cameras with real-time person detection and crowd density analysis.', color: '#00d4ff' },
  { icon: '◈', title: 'Predictive Analytics', desc: 'Machine learning models predict crowd surges 15–30 minutes in advance.', color: '#00ff88' },
  { icon: '◀', title: 'Smart Routing', desc: 'Automatic gate-flow optimization reduces congestion by up to 73%.', color: '#ffd700' },
  { icon: '⚠', title: 'Emergency Response', desc: 'Automated emergency protocols with <90 second response activation.', color: '#ff7b2e' },
]

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const from = ref.current
    function step(now: number) {
      const p = Math.min((now - start) / 1400, 1)
      const e = 1 - Math.pow(1 - p, 3)
      const v = Math.round(from + (target - from) * e)
      setVal(v)
      if (p < 1) requestAnimationFrame(step)
      else ref.current = target
    }
    requestAnimationFrame(step)
  }, [target])
  return <>{prefix}{val.toLocaleString()}{suffix}</>
}

export default function Home({ onNavigate }: Props) {
  const [stats, setStats] = useState({ total: 12458, gates: [62, 91, 38, 55] })
  const [live, setLive] = useState({ total: 12458, gates: [62, 91, 38, 55] })
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setTimeout(() => setMounted(true), 80) }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setLive(prev => ({
        total: prev.total + Math.round((Math.random() - 0.4) * 15),
        gates: prev.gates.map(g => Math.max(5, Math.min(99, g + Math.round((Math.random()-0.4)*3))))
      }))
    }, 3500)
    return () => clearInterval(t)
  }, [])

  function gateColor(pct: number) {
    if (pct < 50) return '#00ff88'
    if (pct < 75) return '#ffd700'
    if (pct < 90) return '#ff7b2e'
    return '#ff1744'
  }

  return (
    <div style={{ opacity: mounted ? 1 : 0, transition: 'opacity 0.5s' }}>
      {/* Hero */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div className="float-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="badge badge-green">● LIVE MONITORING</span>
              <span className="badge badge-blue">AI ACTIVE</span>
            </div>
            <h1 className="orbitron glow-blue" style={{ fontSize: 'clamp(22px, 3vw, 38px)', fontWeight: 800, margin: 0, lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              AI-POWERED PILGRIM<br />CROWD MANAGEMENT
            </h1>
            <p style={{ color: '#94a3b8', maxWidth: 440, marginTop: 10, fontSize: 14, lineHeight: 1.6 }}>
              Real-time monitoring, predictive analytics, and autonomous crowd-flow optimization for large-scale pilgrimage events.
            </p>
          </div>

          {/* Live gate stats */}
          <div className="glass float-up d3" style={{ padding: '18px 22px', minWidth: 240 }}>
            <div style={{ fontFamily: 'Orbitron', fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 12 }}>LIVE GATE STATUS</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 26, fontWeight: 500, color: '#00d4ff', marginBottom: 4, lineHeight: 1 }}>
              <AnimatedCounter target={live.total} />
            </div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4b6080', marginBottom: 14 }}>Current Pilgrims</div>
            {['G1 West','G2 East','G3 South','G4 North'].map((label, i) => {
              const pct = live.gates[i] ?? 50
              const color = gateColor(pct)
              return (
                <div key={label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#94a3b8' }}>{label}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color }}>{pct}%</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.8s ease, background 0.5s ease', boxShadow: `0 0 6px ${color}` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Canvas */}
        <div className="glass" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
          <div style={{ position: 'absolute', top: 10, left: 14, zIndex: 5, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-blue">◉ CAMERA NETWORK</span>
            <span className="badge badge-green">✓ 128/128 ONLINE</span>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 5 }}>
            <span className="badge badge-green blink">● LIVE</span>
          </div>
          <PilgrimCanvas onStats={s => setStats(s)} />
          <div className="scan-line-v" style={{ zIndex: 4 }} />

          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 10, left: 14, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['🟢','Low'],['🟡','Medium'],['🟠','High'],['🔴','Critical']].map(([dot, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'JetBrains Mono', fontSize: 9, color: '#94a3b8' }}>
                <span>{dot}</span><span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 32 }}>
        {FEATURE_CARDS.map((card, i) => (
          <div key={card.title} className={`glass float-up d${i+1}`} style={{ padding: 20, cursor: 'default', transition: 'border-color 0.2s' }}>
            <div style={{ fontSize: 22, marginBottom: 10, color: card.color, fontFamily: 'Orbitron' }}>{card.icon}</div>
            <div className="orbitron" style={{ fontSize: 12, fontWeight: 600, color: card.color, letterSpacing: '0.05em', marginBottom: 6 }}>{card.title}</div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.55 }}>{card.desc}</div>
          </div>
        ))}
      </div>

      {/* Explore section */}
      <div className="glass" style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <div>
            <div className="orbitron" style={{ fontSize: 13, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.08em', marginBottom: 4 }}>EXPLORE THE SYSTEM</div>
            <div style={{ color: '#94a3b8', fontSize: 13 }}>Dive into each module to see how AI manages pilgrim safety</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {[
            {id:'livemap', label:'Live Crowd Map', desc:'Interactive real-time map', color:'#00d4ff'},
            {id:'detection', label:'AI Detection', desc:'CCTV person detection', color:'#00ff88'},
            {id:'prediction', label:'Crowd Forecast', desc:'15–30 min predictions', color:'#ffd700'},
            {id:'routes', label:'Smart Routes', desc:'Automated flow routing', color:'#ff7b2e'},
            {id:'emergency', label:'Emergency Mode', desc:'Rapid response protocols', color:'#ff1744'},
            {id:'analytics', label:'Analytics', desc:'Historical & live data', color:'#a78bfa'},
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`,
                borderRadius: 8, cursor: 'pointer', color: item.color, textAlign: 'left',
                transition: 'all 0.15s', fontFamily: 'inherit',
              }}
            >
              <div style={{ flex: 1 }}>
                <div className="orbitron" style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#4b6080', fontFamily: 'JetBrains Mono' }}>{item.desc}</div>
              </div>
              <span style={{ fontSize: 14, opacity: 0.6 }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom system stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          {label:'Cameras Online', value:'128', unit:'/ 128', color:'#00ff88'},
          {label:'AI Accuracy', value:'99.2', unit:'%', color:'#00d4ff'},
          {label:'Avg Response', value:'1.4', unit:'sec', color:'#ffd700'},
          {label:'Incidents Prevented', value:'47', unit:' today', color:'#a78bfa'},
          {label:'Gates Managed', value:'16', unit:' active', color:'#ff7b2e'},
          {label:'Pilgrims Served', value:'2.8M', unit:' today', color:'#00ff88'},
        ].map((s, i) => (
          <div key={s.label} className={`glass float-up d${(i%6)+1}`} style={{ padding: '16px 18px' }}>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label.toUpperCase()}</div>
            <div className="orbitron" style={{ fontSize: 22, fontWeight: 700, color: s.color }}>
              {s.value}<span style={{ fontSize: 13, fontWeight: 400, color: '#4b6080' }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
