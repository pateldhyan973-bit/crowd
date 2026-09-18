import { useState, useEffect, useRef } from 'react'
import PilgrimCanvas from '../components/PilgrimCanvas'

const STEPS = [
  { id:1, label:'DETECTION',     icon:'◉', desc:'AI detects critical density — Zone 2 at 97%', color:'#ff7b2e', duration:2500 },
  { id:2, label:'ALERT',         icon:'⚠', desc:'All staff notified. Alert broadcast to pilgrims.', color:'#ff7b2e', duration:2000 },
  { id:3, label:'HALT ENTRY',    icon:'⊗', desc:'Gates 2 & 4 closed. Incoming flow stopped.', color:'#ff1744', duration:2000 },
  { id:4, label:'OPEN EXITS',    icon:'⊕', desc:'Emergency exits E1, E2, E3, E4 unlocked.', color:'#ffd700', duration:2000 },
  { id:5, label:'EVACUATE',      icon:'◀', desc:'Evacuation arrows activated. Pilgrims guided out.', color:'#ffd700', duration:2500 },
  { id:6, label:'SECURE ZONE',   icon:'⬡', desc:'Security deployed. Medical teams on standby.', color:'#00ff88', duration:2500 },
  { id:7, label:'NORMALIZED',    icon:'✓', desc:'Density reduced. Zone cleared. System monitoring.', color:'#00ff88', duration:3000 },
]

interface Notification { id:number; text:string; color:string; time:string }

export default function Emergency() {
  const [active, setActive] = useState(false)
  const [stepIdx, setStepIdx] = useState(-1)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState({ density:97, pilgrims:1240, timeToNormal:'—' })
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const notifId = useRef(0)

  function addNotif(text: string, color: string) {
    const now = new Date()
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    setNotifications(prev => [{id: notifId.current++, text, color, time}, ...prev.slice(0,9)])
  }

  function startEmergency() {
    if (active) return
    setActive(true)
    setStepIdx(0)
    setNotifications([])
    setStats({ density:97, pilgrims:1240, timeToNormal:'Est. 8 min' })

    const stepMessages = [
      ['⚠ ALERT: Critical density detected in Zone 2 — AI triggering emergency protocol', '#ff1744'],
      ['📢 BROADCAST: Evacuation announcement initiated on all PA systems', '#ff7b2e'],
      ['🔒 GATES 2 & 4: Entry halted. Redirecting 1,240 pilgrims', '#ff7b2e'],
      ['🚪 EMERGENCY EXITS: E1, E2, E3, E4 unlocked and lit', '#ffd700'],
      ['➡ EVACUATION FLOW: Pilgrims being guided via Exits E1, E3', '#ffd700'],
      ['🛡 SECURITY: 12 officers deployed. Medical team alerted at M1, M2', '#a78bfa'],
      ['✅ ZONE CLEARED: Density normalized. All clear signal issued.', '#00ff88'],
    ] as [string,string][]

    let elapsed = 0
    STEPS.forEach((step, i) => {
      const t = setTimeout(() => {
        setStepIdx(i)
        addNotif(stepMessages[i][0], stepMessages[i][1])
        setStats(prev => ({
          density: Math.max(20, prev.density - (i+1)*8),
          pilgrims: Math.max(200, prev.pilgrims - (i+1)*100),
          timeToNormal: i >= 4 ? `${Math.max(0, 7-i)} min` : prev.timeToNormal,
        }))
      }, elapsed)
      timerRef.current.push(t)
      elapsed += step.duration
    })

    const resetTimer = setTimeout(() => {
      setActive(false)
      setStepIdx(-1)
    }, elapsed + 2000)
    timerRef.current.push(resetTimer)
  }

  function reset() {
    timerRef.current.forEach(clearTimeout)
    timerRef.current = []
    setActive(false)
    setStepIdx(-1)
    setNotifications([])
    setStats({ density:97, pilgrims:1240, timeToNormal:'—' })
  }

  useEffect(() => () => timerRef.current.forEach(clearTimeout), [])

  const currentStep = STEPS[stepIdx]

  const FACILITIES = [
    { icon:'🏥', label:'Medical Center', x:'72%', y:'62%', color:'#ff7b2e' },
    { icon:'🛡', label:'Security Post 1', x:'30%', y:'62%', color:'#ff1744' },
    { icon:'🛡', label:'Security Post 2', x:'70%', y:'62%', color:'#ff1744' },
    { icon:'🚪', label:'Emergency Exit W', x:'12%', y:'50%', color:'#ffd700' },
    { icon:'🚪', label:'Emergency Exit S', x:'50%', y:'88%', color:'#ffd700' },
  ]

  return (
    <div>
      <div className="float-up" style={{ marginBottom: 24 }}>
        <div className="orbitron glow-red" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>EMERGENCY MANAGEMENT</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#4b6080' }}>AUTOMATED EMERGENCY RESPONSE · AI-GUIDED EVACUATION</div>
      </div>

      {/* Trigger buttons */}
      <div className="glass float-up d1" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <button
          onClick={startEmergency}
          disabled={active}
          style={{
            fontFamily: 'Orbitron', fontSize: 12, fontWeight: 800, letterSpacing: '0.1em',
            padding: '12px 28px', borderRadius: 6, border: 'none', cursor: active ? 'not-allowed' : 'pointer',
            background: active ? 'rgba(255,23,68,0.2)' : '#ff1744',
            color: active ? '#ff1744' : '#fff',
            transition: 'all 0.2s',
            boxShadow: active ? '0 0 20px rgba(255,23,68,0.3)' : '0 0 24px rgba(255,23,68,0.5)',
          }}
        >
          {active ? '⚠ EMERGENCY ACTIVE' : '⚠ TRIGGER EMERGENCY'}
        </button>
        {active && (
          <button onClick={reset} style={{
            fontFamily: 'Orbitron', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
            padding: '8px 18px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.15)',
            background: 'transparent', color: '#94a3b8', cursor: 'pointer',
          }}>RESET</button>
        )}
        {!active && stepIdx >= 0 && (
          <span className="badge badge-green">✓ DRILL COMPLETE</span>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            {label:'Zone Density', value:`${stats.density}%`, color: stats.density > 80 ? '#ff1744' : '#00ff88'},
            {label:'Pilgrims in Zone', value:stats.pilgrims.toLocaleString(), color:'#ffd700'},
            {label:'Time to Normal', value:stats.timeToNormal, color:'#00d4ff'},
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080' }}>{s.label}</div>
              <div className="orbitron" style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step progress */}
      <div className="glass float-up d2" style={{ padding: 18, marginBottom: 20 }}>
        <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 14 }}>EMERGENCY RESPONSE PROTOCOL</div>
        <div style={{ display: 'flex', gap: 0, alignItems: 'center', overflowX: 'auto' }}>
          {STEPS.map((step, i) => {
            const done = stepIdx > i
            const active_s = stepIdx === i
            const pending = stepIdx < i
            return (
              <div key={step.id} style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
                <div style={{
                  display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center',
                  padding:'10px 12px', borderRadius:8, minWidth:90,
                  background: active_s ? `${step.color}18` : done ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active_s ? step.color : done ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.05)'}`,
                  transition:'all 0.4s',
                  boxShadow: active_s ? `0 0 16px ${step.color}44` : 'none',
                }}>
                  <div style={{ fontSize:16, color: active_s ? step.color : done ? '#00ff88' : '#4b6080', marginBottom:4, fontFamily:'Orbitron' }}>
                    {done ? '✓' : step.icon}
                  </div>
                  <div className="orbitron" style={{ fontSize:8, fontWeight:700, color: active_s ? step.color : done ? '#00ff88' : '#4b6080', letterSpacing:'0.06em' }}>{step.label}</div>
                </div>
                {i < STEPS.length-1 && (
                  <div style={{ color: done ? '#00ff88' : '#1e3a5f', margin:'0 3px', fontSize:14, transition:'color 0.4s' }}>›</div>
                )}
              </div>
            )
          })}
        </div>
        {currentStep && (
          <div className="alert-drop" style={{ marginTop:14, padding:'12px 16px', borderRadius:8, background:`${currentStep.color}12`, border:`1px solid ${currentStep.color}35` }}>
            <div className="orbitron" style={{ fontSize:11, color:currentStep.color, marginBottom:3 }}>STEP {currentStep.id}: {currentStep.label}</div>
            <div style={{ fontFamily:'JetBrains Mono', fontSize:11, color:'#94a3b8' }}>{currentStep.desc}</div>
          </div>
        )}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:16 }}>
        {/* Map view */}
        <div className="glass" style={{ padding:0, overflow:'hidden', position:'relative' }}>
          <PilgrimCanvas emergency={active && stepIdx >= 2} />
          {/* Facility overlays */}
          {active && stepIdx >= 5 && FACILITIES.map(f => (
            <div key={f.label} className="alert-drop" style={{
              position:'absolute', left:f.x, top:f.y, transform:'translate(-50%,-50%)',
              padding:'4px 8px', borderRadius:4, background:f.color+'22', border:`1px solid ${f.color}66`,
              fontFamily:'JetBrains Mono', fontSize:9, color:f.color,
              display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
              backdropFilter:'blur(4px)', zIndex:10,
            }}>
              <span>{f.icon}</span><span>{f.label}</span>
            </div>
          ))}
          {active && stepIdx >= 3 && (
            <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'rgba(255,23,68,0.05)', zIndex:5 }} className="blink" />
          )}
        </div>

        {/* Notifications */}
        <div className="glass" style={{ padding:16, overflowY:'auto', maxHeight:460 }}>
          <div className="orbitron" style={{ fontSize:10, color:'#4b6080', letterSpacing:'0.1em', marginBottom:12 }}>SYSTEM NOTIFICATIONS</div>
          {notifications.length === 0 ? (
            <div style={{ fontFamily:'JetBrains Mono', fontSize:10, color:'#4b6080', textAlign:'center', padding:'20px 0' }}>
              No active alerts — trigger emergency to begin
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {notifications.map((n, i) => (
                <div key={n.id} className="alert-drop" style={{
                  padding:'8px 10px', borderRadius:6,
                  background:`${n.color}10`, border:`1px solid ${n.color}30`,
                  animationDelay:`${i*0.05}s`,
                }}>
                  <div style={{ fontFamily:'JetBrains Mono', fontSize:8, color:'#4b6080', marginBottom:2 }}>{n.time}</div>
                  <div style={{ fontFamily:'Inter', fontSize:11, color:'#e2e8f0', lineHeight:1.4 }}>{n.text}</div>
                </div>
              ))}
            </div>
          )}

          {/* Emergency contacts */}
          <div style={{ marginTop:16, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="orbitron" style={{ fontSize:9, color:'#4b6080', letterSpacing:'0.1em', marginBottom:10 }}>EMERGENCY CONTACTS</div>
            {[
              {label:'Police Control', value:'100', color:'#ff1744'},
              {label:'Medical Team', value:'108', color:'#ff7b2e'},
              {label:'Fire Service', value:'101', color:'#ffd700'},
              {label:'Temple Admin', value:'EXT 204', color:'#00d4ff'},
            ].map(c => (
              <div key={c.label} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontFamily:'JetBrains Mono', fontSize:9, color:'#4b6080' }}>{c.label}</span>
                <span className="orbitron" style={{ fontSize:10, fontWeight:700, color:c.color }}>{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
