import { useState, useEffect } from 'react'

const AREAS = [
  { id:'temple',    x:340, y:185, w:220, h:140, label:'Main Temple',      color:'#00d4ff', fixed: true  },
  { id:'court_n',   x:210, y:125, w:480, h:70,  label:'North Courtyard',  color:'#00ff88', fixed: false },
  { id:'court_s',   x:210, y:315, w:480, h:70,  label:'South Courtyard',  color:'#00ff88', fixed: false },
  { id:'court_e',   x:550, y:185, w:140, h:140, label:'East Courtyard',   color:'#ffd700', fixed: false },
  { id:'court_w',   x:210, y:185, w:140, h:140, label:'West Courtyard',   color:'#ffd700', fixed: false },
  { id:'park_w',    x:30,  y:100, w:140, h:200, label:'West Parking',     color:'#94a3b8', fixed: false },
  { id:'park_e',    x:730, y:100, w:140, h:200, label:'East Parking',     color:'#94a3b8', fixed: false },
  { id:'food',      x:30,  y:340, w:100, h:80,  label:'Food & Water',     color:'#a78bfa', fixed: false },
  { id:'medical',   x:770, y:340, w:100, h:80,  label:'Medical Center',   color:'#ff7b2e', fixed: false },
  { id:'wait_n',    x:340, y:30,  w:220, h:65,  label:'North Waiting',    color:'#00d4ff', fixed: false },
  { id:'wait_s',    x:340, y:455, w:220, h:65,  label:'South Waiting',    color:'#00d4ff', fixed: false },
  { id:'queue_w',   x:30,  y:200, w:100, h:120, label:'West Queue',       color:'#4b6080', fixed: false },
  { id:'queue_e',   x:770, y:200, w:100, h:120, label:'East Queue',       color:'#4b6080', fixed: false },
  { id:'security1', x:175, y:340, w:36,  h:36,  label:'Security Post 1',  color:'#ff1744', fixed: false },
  { id:'security2', x:689, y:340, w:36,  h:36,  label:'Security Post 2',  color:'#ff1744', fixed: false },
  { id:'exit1',     x:175, y:450, w:36,  h:36,  label:'Emergency Exit',   color:'#ff7b2e', fixed: false },
  { id:'exit2',     x:689, y:450, w:36,  h:36,  label:'Emergency Exit',   color:'#ff7b2e', fixed: false },
]

const GATES = [
  { id:'g1', x:174, y:255, label:'Gate 1', dir:'W' },
  { id:'g2', x:730, y:255, label:'Gate 2', dir:'E' },
  { id:'g3', x:450, y:455, label:'Gate 3', dir:'S' },
  { id:'g4', x:450, y:125, label:'Gate 4', dir:'N' },
]

const INIT_DENSITIES: Record<string, number> = {
  court_n: 0.55, court_s: 0.38, court_e: 0.82, court_w: 0.44,
  wait_n: 0.3, wait_s: 0.65, queue_w: 0.28, queue_e: 0.9,
}

function densityToColor(d: number) {
  if (d === undefined || d < 0.35) return '#00ff88'
  if (d < 0.6) return '#ffd700'
  if (d < 0.82) return '#ff7b2e'
  return '#ff1744'
}

function densityLabel(d: number) {
  if (d === undefined || d < 0.35) return 'LOW'
  if (d < 0.6) return 'MEDIUM'
  if (d < 0.82) return 'HIGH'
  return 'CRITICAL'
}

// Animated pilgrim dots on SVG paths
const PILGRIM_PATHS = [
  { d: 'M 450 30 L 450 185', key: 'north' },
  { d: 'M 450 470 L 450 325', key: 'south' },
  { d: 'M 174 255 L 350 255', key: 'west' },
  { d: 'M 726 255 L 550 255', key: 'east' },
]

export default function LiveMap() {
  const [densities, setDensities] = useState(INIT_DENSITIES)
  const [selected, setSelected] = useState<string | null>(null)
  const [layer, setLayer] = useState<'density' | 'flow' | 'alerts'>('density')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setDensities(prev => {
        const next = { ...prev }
        for (const k of Object.keys(next)) {
          next[k] = Math.max(0.05, Math.min(0.98, next[k] + (Math.random() - 0.48) * 0.04))
        }
        return next
      })
      setTick(t => t + 1)
    }, 2500)
    return () => clearInterval(t)
  }, [])

  const selectedArea = AREAS.find(a => a.id === selected)
  const selectedDensity = selected ? (densities[selected] ?? 0.2) : null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div className="float-up">
          <div className="orbitron glow-blue" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>LIVE CROWD MAP</div>
          <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#4b6080' }}>INTERACTIVE TEMPLE COMPLEX · CLICK ZONES TO INSPECT</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(['density','flow','alerts'] as const).map(l => (
            <button key={l} onClick={() => setLayer(l)} style={{
              fontFamily: 'Orbitron', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
              padding: '5px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              textTransform: 'uppercase',
              background: layer === l ? '#00d4ff' : 'rgba(255,255,255,0.05)',
              color: layer === l ? '#000' : '#94a3b8',
              transition: 'all 0.2s',
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        {/* SVG Map */}
        <div className="glass" style={{ padding: 0, overflow: 'hidden', position: 'relative', aspectRatio: '9/5.5' }}>
          <svg viewBox="0 0 900 550" style={{ width: '100%', height: '100%', display: 'block' }}>
            <defs>
              <filter id="glow-f">
                <feGaussianBlur stdDeviation="3" result="blur"/>
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>

            {/* Background */}
            <rect width="900" height="550" fill="#060e20"/>
            {/* Grid */}
            {Array.from({length:22},(_,i)=><line key={`gx${i}`} x1={i*40} y1={0} x2={i*40} y2={550} stroke="rgba(0,212,255,0.04)" strokeWidth="1"/>)}
            {Array.from({length:14},(_,i)=><line key={`gy${i}`} x1={0} y1={i*40} x2={900} y2={i*40} stroke="rgba(0,212,255,0.04)" strokeWidth="1"/>)}

            {/* Ground areas */}
            <rect x="130" y="60" width="640" height="440" rx="4" fill="rgba(0,212,255,0.02)" stroke="rgba(0,212,255,0.25)" strokeWidth="1.5"/>

            {/* Density zone overlay */}
            {AREAS.filter(a => !a.fixed && densities[a.id] !== undefined).map(area => {
              const d = densities[area.id]
              const col = densityToColor(d)
              return (
                <rect key={area.id} x={area.x} y={area.y} width={area.w} height={area.h}
                  rx="3" fill={`${col}22`} stroke={`${col}66`} strokeWidth="1"
                  style={{ transition: 'fill 1s, stroke 1s' }}
                />
              )
            })}

            {/* Paths with animated dashes */}
            {PILGRIM_PATHS.map(p => (
              <line key={p.key}
                x1={p.d.split(' ')[1]} y1={p.d.split(' ')[2]}
                x2={p.d.split(' ')[4]} y2={p.d.split(' ')[5]}
                stroke="rgba(0,212,255,0.3)" strokeWidth="2" strokeDasharray="8 5"
                style={{ strokeDashoffset: `${-(tick*3)%13}px`, transition: 'stroke-dashoffset 0.5s linear' }}
              />
            ))}

            {/* Moving pilgrim dots */}
            {Array.from({length:8}).map((_, i) => {
              const offset = (tick * 2 + i * 55) % 160
              const paths_px = [
                {x1:450,y1:95, x2:450,y2:185},
                {x1:450,y1:390,x2:450,y2:325},
                {x1:174,y1:255,x2:350,y2:255},
                {x1:726,y1:255,x2:550,y2:255},
              ]
              const pathIdx = i % 4
              const ph = paths_px[pathIdx]
              const frac = (offset % 160) / 160
              const px = ph.x1 + (ph.x2 - ph.x1) * frac
              const py = ph.y1 + (ph.y2 - ph.y1) * frac
              return (
                <g key={i}>
                  <circle cx={px} cy={py} r="4" fill="rgba(0,212,255,0.5)" filter="url(#glow-f)"/>
                  <circle cx={px} cy={py} r="2" fill="#00d4ff"/>
                </g>
              )
            })}

            {/* Area rectangles (clickable) */}
            {AREAS.map(area => {
              const d = densities[area.id] ?? 0.2
              const col = area.fixed ? area.color : densityToColor(d)
              const isSelected = selected === area.id
              return (
                <g key={area.id} onClick={() => setSelected(selected === area.id ? null : area.id)} style={{ cursor: 'pointer' }}>
                  <rect x={area.x} y={area.y} width={area.w} height={area.h} rx="3"
                    fill={isSelected ? `${col}22` : 'transparent'}
                    stroke={isSelected ? col : `${col}55`}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ transition: 'all 0.2s' }}
                  />
                  {area.w > 60 && (
                    <text x={area.x + area.w/2} y={area.y + area.h/2}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={col} fontSize={area.w > 100 ? 10 : 8}
                      fontFamily="JetBrains Mono" fontWeight="500"
                      style={{ pointerEvents: 'none' }}
                    >{area.label}</text>
                  )}
                  {area.w <= 60 && (
                    <text x={area.x + area.w/2} y={area.y + area.h/2}
                      textAnchor="middle" dominantBaseline="middle"
                      fill={col} fontSize="9" fontFamily="Orbitron"
                      style={{ pointerEvents: 'none' }}
                    >{area.id === 'security1' || area.id === 'security2' ? '⚑' : '⊕'}</text>
                  )}
                </g>
              )
            })}

            {/* Gates */}
            {GATES.map(g => {
              const d = densities[g.id === 'g1' ? 'court_w' : g.id === 'g2' ? 'court_e' : g.id === 'g3' ? 'court_s' : 'court_n'] ?? 0.3
              const col = densityToColor(d)
              return (
                <g key={g.id} filter="url(#glow-f)">
                  <circle cx={g.x} cy={g.y} r="10" fill={`${col}22`} stroke={col} strokeWidth="1.5"/>
                  <circle cx={g.x} cy={g.y} r="4" fill={col}/>
                  <text x={g.x} y={g.y - 16} textAnchor="middle" fill={col}
                    fontSize="10" fontFamily="Orbitron" fontWeight="700">{g.label}</text>
                </g>
              )
            })}

            {/* Emergency exits arrows */}
            {[{x:175,y:468},{x:725,y:468}].map((e,i) => (
              <g key={i}>
                <text x={e.x} y={e.y} textAnchor="middle" fill="#ff7b2e" fontSize="18">⬇</text>
              </g>
            ))}

            {/* Scan line */}
            <rect x="0" y={((tick * 3.5) % 550)} width="900" height="2"
              fill="url(#scanGrad)" opacity="0.4"/>
            <defs>
              <linearGradient id="scanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="transparent"/>
                <stop offset="50%" stopColor="#00d4ff"/>
                <stop offset="100%" stopColor="transparent"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Selected zone detail */}
          {selected && selectedArea ? (
            <div className="glass-hi slide-left" style={{ padding: 18 }}>
              <div className="orbitron" style={{ fontSize: 11, fontWeight: 700, color: selectedArea.fixed ? selectedArea.color : densityToColor(selectedDensity ?? 0), letterSpacing: '0.08em', marginBottom: 8 }}>
                {selectedArea.label.toUpperCase()}
              </div>
              {selectedDensity !== null && (
                <>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4b6080' }}>DENSITY</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: densityToColor(selectedDensity) }}>{densityLabel(selectedDensity)}</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${selectedDensity*100}%`, background: densityToColor(selectedDensity), borderRadius: 3, boxShadow: `0 0 8px ${densityToColor(selectedDensity)}`, transition: 'width 0.8s' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      ['Occupancy', `${Math.round(selectedDensity*100)}%`],
                      ['Est. Count', `${Math.round(selectedDensity*800)}`],
                      ['Capacity', `800`],
                      ['Status', densityLabel(selectedDensity)],
                    ].map(([k,v]) => (
                      <div key={k}>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginBottom: 2 }}>{k}</div>
                        <div className="orbitron" style={{ fontSize: 14, color: '#e2e8f0' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="glass" style={{ padding: 18, textAlign: 'center' }}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4b6080', marginBottom: 4 }}>Click a zone to inspect</div>
              <div style={{ fontSize: 24 }}>◎</div>
            </div>
          )}

          {/* Zone density list */}
          <div className="glass" style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
            <div className="orbitron" style={{ fontSize: 10, fontWeight: 700, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 12 }}>ZONE DENSITIES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(densities).map(([id, d]) => {
                const area = AREAS.find(a => a.id === id)
                if (!area) return null
                const color = densityToColor(d)
                return (
                  <div key={id} onClick={() => setSelected(id)} style={{ cursor: 'pointer', padding: '6px 8px', borderRadius: 6, background: selected === id ? 'rgba(0,212,255,0.07)' : 'transparent', transition: 'background 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#94a3b8' }}>{area.label}</span>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color }}>{Math.round(d*100)}%</span>
                    </div>
                    <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${d*100}%`, background: color, borderRadius: 2, transition: 'width 1s ease, background 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="glass" style={{ padding: 14 }}>
            <div className="orbitron" style={{ fontSize: 9, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 8 }}>DENSITY LEGEND</div>
            {[['#00ff88','< 35%','Low','Safe flow'],['#ffd700','35-60%','Medium','Monitor'],['#ff7b2e','60-82%','High','Restrict'],['#ff1744','> 82%','Critical','Evacuate']].map(([c,r,l,a]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0, boxShadow: `0 0 6px ${c}` }} />
                <div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: c }}>{l}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginLeft: 6 }}>{r}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
