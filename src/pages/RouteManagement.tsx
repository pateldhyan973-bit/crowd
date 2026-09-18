import { useState, useEffect } from 'react'

const GATES = [
  { id:'g1', label:'Gate 1\nWest', x:60,  y:240, normal:'west',     color:'#00d4ff' },
  { id:'g2', label:'Gate 2\nEast', x:760, y:240, normal:'east',     color:'#ffd700' },
  { id:'g3', label:'Gate 3\nMain', x:410, y:460, normal:'south',    color:'#00ff88' },
  { id:'g4', label:'Gate 4\nNorth',x:410, y:40,  normal:'north',    color:'#a78bfa' },
]

const ROUTES = {
  west:  [{x:60,y:240},{x:200,y:240},{x:300,y:240},{x:380,y:250}],
  east:  [{x:760,y:240},{x:620,y:240},{x:520,y:240},{x:460,y:250}],
  east_div:[{x:760,y:240},{x:760,y:120},{x:620,y:60},{x:450,y:60},{x:450,y:130}],
  south: [{x:410,y:460},{x:410,y:380},{x:410,y:320},{x:420,y:270}],
  north: [{x:410,y:40},{x:410,y:120},{x:420,y:200},{x:420,y:240}],
}

interface RouteState {
  g1: 'normal'|'diverted'|'closed'
  g2: 'normal'|'diverted'|'closed'
  g3: 'normal'|'diverted'|'closed'
  g4: 'normal'|'diverted'|'closed'
}

function polylinePoints(pts: {x:number;y:number}[]) {
  return pts.map(p => `${p.x},${p.y}`).join(' ')
}

export default function RouteManagement() {
  const [mode, setMode] = useState<'normal'|'congested'|'emergency'>('normal')
  const [tick, setTick] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [flowPcts, setFlowPcts] = useState({ g1:58, g2:62, g3:44, g4:30 })
  const [log, setLog] = useState<string[]>(['[14:02] System initialized. All gates nominal.'])

  useEffect(() => {
    const t = setInterval(() => setTick(i => i+1), 100)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setFlowPcts(prev => ({
        g1: Math.max(5, Math.min(95, prev.g1 + (Math.random()-0.45)*3)),
        g2: mode === 'congested' ? Math.min(98, prev.g2 + 1.5) : Math.max(5, Math.min(95, prev.g2 + (Math.random()-0.4)*3)),
        g3: Math.max(5, Math.min(95, prev.g3 + (Math.random()-0.5)*2)),
        g4: mode === 'emergency' ? 5 : Math.max(5, Math.min(95, prev.g4 + (Math.random()-0.5)*2)),
      }))
    }, 1500)
    return () => clearInterval(t)
  }, [mode])

  function triggerMode(newMode: typeof mode) {
    setAnimating(true)
    setMode(newMode)
    const msgs = {
      congested: '[14:' + String(Math.floor(Math.random()*59)).padStart(2,'0') + '] ⚠ Gate 2 congestion detected. AI activating diversion via North path.',
      emergency: '[14:' + String(Math.floor(Math.random()*59)).padStart(2,'0') + '] 🚨 EMERGENCY: All gates rerouted. Evacuation protocol ALPHA active.',
      normal:    '[14:' + String(Math.floor(Math.random()*59)).padStart(2,'0') + '] ✓ System normalized. All gates restored to standard routing.',
    }
    setLog(prev => [msgs[newMode], ...prev.slice(0, 8)])
    setTimeout(() => setAnimating(false), 1200)
  }

  const g2Color = mode === 'congested' ? '#ff1744' : mode === 'emergency' ? '#ff7b2e' : '#ffd700'
  const dashOffset = -(tick * 0.4) % 14

  const routeForGate = (gid: string) => {
    if (mode === 'emergency') return gid === 'g2' ? 'east_div' : (ROUTES as any)[GATES.find(g=>g.id===gid)!.normal]
    if (mode === 'congested' && gid === 'g2') return ROUTES.east_div
    return (ROUTES as any)[GATES.find(g=>g.id===gid)!.normal]
  }

  const routeColor = (gid: string) => {
    if (mode === 'emergency') return '#ff7b2e'
    if (mode === 'congested' && gid === 'g2') return '#00ff88'
    const pct = (flowPcts as any)[gid]
    if (pct > 80) return '#ff1744'
    if (pct > 60) return '#ffd700'
    return '#00d4ff'
  }

  const RECOMMENDATIONS = {
    normal: [
      {action:'MONITOR', detail:'All gates operating within safe thresholds', color:'#00ff88'},
      {action:'OPTIMIZE', detail:'Gate 1 flow can increase by 15% — adjust barriers', color:'#00d4ff'},
    ],
    congested: [
      {action:'DIVERT NOW', detail:'Redirect Gate 2 inbound to Gate 4 North path', color:'#ff7b2e'},
      {action:'ALERT STAFF', detail:'Deploy 2 officers to Gate 2 East immediately', color:'#ffd700'},
      {action:'CLOSE ZONE', detail:'Temporarily halt entry to East Courtyard', color:'#ff1744'},
    ],
    emergency: [
      {action:'LOCK DOWN', detail:'All entry gates closed. Emergency exits only', color:'#ff1744'},
      {action:'EVACUATE', detail:'Open all emergency exits now — guide to south exits', color:'#ff7b2e'},
      {action:'CALL MEDICAL', detail:'Alert medical teams at posts M1, M2, M3', color:'#ffd700'},
    ],
  }

  return (
    <div>
      <div className="float-up" style={{ marginBottom: 24 }}>
        <div className="orbitron glow-blue" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>SMART ROUTE MANAGEMENT</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#4b6080' }}>AI-POWERED FLOW OPTIMIZATION · AUTOMATIC CONGESTION DIVERSION</div>
      </div>

      {/* Mode controls */}
      <div className="glass float-up d1" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em' }}>SIMULATE SCENARIO:</span>
        {([['normal','Normal Flow','#00ff88'],['congested','Gate 2 Congestion','#ffd700'],['emergency','Emergency Mode','#ff1744']] as const).map(([m,label,color]) => (
          <button key={m} onClick={() => triggerMode(m)} style={{
            fontFamily: 'Orbitron', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '8px 18px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: mode === m ? color : 'rgba(255,255,255,0.05)',
            color: mode === m ? (m === 'normal' ? '#000' : '#000') : '#94a3b8',
            transition: 'all 0.25s',
            boxShadow: mode === m ? `0 0 16px ${color}66` : 'none',
          }}>{label}</button>
        ))}
        {animating && <span className="badge badge-blue blink">UPDATING...</span>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 20 }}>
        {/* Route diagram */}
        <div className="glass" style={{ padding: 0, overflow: 'hidden' }}>
          <svg viewBox="0 0 840 520" style={{ width:'100%', display:'block' }}>
            <rect width="840" height="520" fill="#060e20"/>
            {/* Grid */}
            {Array.from({length:21},(_,i)=><line key={`x${i}`} x1={i*40} y1={0} x2={i*40} y2={520} stroke="rgba(0,212,255,0.04)" strokeWidth="1"/>)}
            {Array.from({length:13},(_,i)=><line key={`y${i}`} x1={0} y1={i*40} x2={840} y2={i*40} stroke="rgba(0,212,255,0.04)" strokeWidth="1"/>)}

            {/* Temple complex */}
            <rect x="120" y="80" width="600" height="360" rx="4" fill="rgba(0,212,255,0.02)" stroke="rgba(0,212,255,0.2)" strokeWidth="1"/>
            <rect x="200" y="140" width="440" height="240" rx="3" fill="rgba(0,212,255,0.02)" stroke="rgba(0,212,255,0.12)" strokeWidth="1"/>
            {/* Temple */}
            <rect x="330" y="190" width="180" height="120" rx="4" fill="rgba(0,20,50,0.9)" stroke="rgba(0,212,255,0.6)" strokeWidth="2"/>
            <text x="420" y="254" textAnchor="middle" dominantBaseline="middle" fill="#00d4ff" fontSize="13" fontFamily="Orbitron" fontWeight="700">TEMPLE</text>

            {/* Routes */}
            {GATES.map(g => {
              const routePts = routeForGate(g.id)
              const col = routeColor(g.id)
              const isDiverted = mode === 'congested' && g.id === 'g2'
              return (
                <g key={g.id}>
                  <polyline
                    points={polylinePoints(routePts)}
                    fill="none" stroke={col} strokeWidth="2.5"
                    strokeDasharray="8 5"
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke 0.8s, opacity 0.5s' }}
                    opacity={mode === 'emergency' ? 0.4 : 1}
                  />
                  {/* Arrows */}
                  {routePts.slice(0,-1).map((pt: {x:number;y:number}, i: number) => {
                    const next = routePts[i+1]
                    const angle = Math.atan2(next.y-pt.y, next.x-pt.x)
                    const mx = (pt.x+next.x)/2, my = (pt.y+next.y)/2
                    return (
                      <g key={i} transform={`translate(${mx},${my}) rotate(${angle*180/Math.PI})`}>
                        <polygon points="6,0 -4,-3 -4,3" fill={col} opacity="0.8"/>
                      </g>
                    )
                  })}
                </g>
              )
            })}

            {/* Gate circles */}
            {GATES.map(g => {
              const pct = (flowPcts as any)[g.id]
              const col = mode === 'congested' && g.id === 'g2' ? '#ff1744' :
                         mode === 'emergency' ? '#ff7b2e' :
                         pct > 80 ? '#ff1744' : pct > 60 ? '#ffd700' : '#00ff88'
              const isDiverted = mode === 'congested' && g.id === 'g2'
              return (
                <g key={g.id}>
                  {/* Pulse ring for congested */}
                  {isDiverted && (
                    <circle cx={g.x} cy={g.y} r={22} fill="none" stroke="#ff1744" strokeWidth="1" opacity={0.4 + Math.sin(tick*0.1)*0.3}/>
                  )}
                  <circle cx={g.x} cy={g.y} r={18} fill={`${col}15`} stroke={col} strokeWidth="1.5"/>
                  <circle cx={g.x} cy={g.y} r={8} fill={col} opacity="0.9"/>
                  {g.label.split('\n').map((l, i) => (
                    <text key={l} x={g.x} y={g.y + 28 + i*12} textAnchor="middle" fill={col} fontSize="9" fontFamily="Orbitron" fontWeight="700">{l}</text>
                  ))}
                  <text x={g.x} y={g.y-26} textAnchor="middle" fill={col} fontSize="9" fontFamily="JetBrains Mono">{pct}%</text>
                </g>
              )
            })}

            {/* Congestion warning tag */}
            {mode === 'congested' && (
              <g>
                <rect x="630" y="195" width="140" height="50" rx="4" fill="rgba(255,23,68,0.15)" stroke="#ff1744" strokeWidth="1"/>
                <text x="700" y="215" textAnchor="middle" fill="#ff1744" fontSize="9" fontFamily="Orbitron" fontWeight="700">⚠ GATE 2</text>
                <text x="700" y="230" textAnchor="middle" fill="#ff7b2e" fontSize="8" fontFamily="JetBrains Mono">HIGH CONGESTION</text>
                <text x="700" y="242" textAnchor="middle" fill="#ffd700" fontSize="7" fontFamily="JetBrains Mono">→ DIVERTED TO NORTH</text>
              </g>
            )}

            {mode === 'emergency' && (
              <>
                <rect width="840" height="520" fill={`rgba(255,23,68,${0.04 + Math.sin(tick*0.1)*0.03})`}/>
                <text x="420" y="490" textAnchor="middle" fill="#ff1744" fontSize="12" fontFamily="Orbitron" fontWeight="800" opacity={0.7 + Math.sin(tick*0.15)*0.3}>⚠ EMERGENCY PROTOCOL ACTIVE — EVACUATE IMMEDIATELY</text>
              </>
            )}

            {/* Scan */}
            <rect x="0" y={((tick*2)%520)} width="840" height="1.5" fill="rgba(0,212,255,0.25)"/>
          </svg>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Status */}
          <div className="glass" style={{ padding: 16 }}>
            <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 12 }}>GATE STATUS</div>
            {GATES.map(g => {
              const pct = (flowPcts as any)[g.id]
              const isDiverted = mode === 'congested' && g.id === 'g2'
              const color = mode === 'emergency' ? '#ff7b2e' : isDiverted ? '#ff1744' : pct > 80 ? '#ff1744' : pct > 60 ? '#ffd700' : '#00ff88'
              const status = mode === 'emergency' ? 'CLOSED' : isDiverted ? 'DIVERTED' : pct > 80 ? 'HIGH' : 'NORMAL'
              return (
                <div key={g.id} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} className={isDiverted ? 'blink' : ''} />
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#94a3b8' }}>{g.label.replace('\n',' ')}</span>
                    </div>
                    <span className={`badge badge-${isDiverted||pct>80?'red':pct>60?'yellow':'green'}`}>{status}</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:color, borderRadius:2, transition:'width 0.8s,background 0.5s', boxShadow:`0 0 6px ${color}` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* AI Recommendations */}
          <div className="glass" style={{ padding: 16, flex: 1 }}>
            <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 12 }}>AI RECOMMENDATIONS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(RECOMMENDATIONS[mode] || []).map((r, i) => (
                <div key={r.action} className="alert-drop" style={{
                  padding: '10px 12px', borderRadius: 6,
                  background: `${r.color}10`, border: `1px solid ${r.color}35`,
                  animationDelay: `${i*0.1}s`,
                }}>
                  <div className="orbitron" style={{ fontSize: 10, fontWeight: 700, color: r.color, letterSpacing: '0.08em', marginBottom: 3 }}>{r.action}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#94a3b8' }}>{r.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Action log */}
          <div className="glass" style={{ padding: 14, maxHeight: 160, overflowY: 'auto' }}>
            <div className="orbitron" style={{ fontSize: 9, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 8 }}>ACTION LOG</div>
            {log.map((entry, i) => (
              <div key={i} style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: i === 0 ? '#94a3b8' : '#4b6080', marginBottom: 4, lineHeight: 1.5 }}>{entry}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Before/After comparison */}
      <div className="glass float-up" style={{ padding: 20 }}>
        <div className="orbitron" style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.05em', marginBottom: 14 }}>
          SCENARIO COMPARISON — {mode.toUpperCase()} MODE
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {mode === 'normal' && [
            {label:'Avg Wait Time', before:'4.2 min', after:'2.8 min', better:true},
            {label:'Gate Utilization', before:'67%', after:'58%', better:true},
            {label:'Congestion Events', before:'12/day', after:'2/day', better:true},
            {label:'Pilgrim Throughput', before:'1,200/hr', after:'2,100/hr', better:true},
          ].map(c => <CompareCard key={c.label} {...c} />)}
          {mode === 'congested' && [
            {label:'Gate 2 Density', before:'92%', after:'54% (diverted)', better:true},
            {label:'Incident Risk', before:'HIGH', after:'MEDIUM', better:true},
            {label:'Flow Restored', before:'N/A', after:'< 4 min', better:true},
            {label:'Pilgrims Rerouted', before:'0', after:'1,240', better:true},
          ].map(c => <CompareCard key={c.label} {...c} />)}
          {mode === 'emergency' && [
            {label:'Response Time', before:'Manual: 12min', after:'AI: 45sec', better:true},
            {label:'Evacuation Speed', before:'Uncoordinated', after:'Systematic', better:true},
            {label:'Coverage', before:'3 exits open', after:'All 8 exits', better:true},
            {label:'Staff Notified', before:'Delayed', after:'Instant', better:true},
          ].map(c => <CompareCard key={c.label} {...c} />)}
        </div>
      </div>
    </div>
  )
}

function CompareCard({label,before,after,better}: {label:string;before:string;after:string;better:boolean}) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)' }}>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#ff7b2e', marginBottom: 3 }}>Without AI: {before}</div>
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#00ff88' }}>With AI: {after}</div>
    </div>
  )
}
