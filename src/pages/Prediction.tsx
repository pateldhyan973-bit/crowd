import { useState, useEffect } from 'react'

// Generate synthetic crowd data for 24h
function genData(baseVal: number, noise: number, len: number) {
  return Array.from({length: len}, (_, i) => {
    const hour = i / (len / 24)
    // Morning peak ~8-10am, main peak ~14-16, evening ~19-21
    const wave = Math.sin((hour-8)*0.5) * 0.3 + Math.sin((hour-14)*0.6) * 0.5 + Math.sin((hour-19)*0.4)*0.2
    return Math.max(5, baseVal + wave * baseVal * 0.6 + (Math.random()-0.5)*noise)
  })
}

const HOURS = Array.from({length:48},(_,i) => {
  const h = Math.floor(i/2)
  const m = i%2 === 0 ? '00' : '30'
  return `${String(h).padStart(2,'0')}:${m}`
})

const HISTORICAL = genData(850, 80, 48)
const PREDICTED = HISTORICAL.map((v,i) => i >= 28 ? v + (Math.random()-0.4)*120 : null)

const ZONE_FORECASTS = [
  {zone:'Gate 2 East',    risk:'HIGH',     time:'15 min', pct:88, msg:'Congestion likely — redirect to Gate 3'},
  {zone:'Temple Plaza',   risk:'MEDIUM',   time:'22 min', pct:61, msg:'Density rising, monitor closely'},
  {zone:'South Queue',    risk:'LOW',      time:'35 min', pct:32, msg:'Normal flow expected'},
  {zone:'North Entry',    risk:'CRITICAL', time:'8 min',  pct:95, msg:'IMMEDIATE: close inbound, open alternate'},
]

function riskColor(risk: string) {
  return {CRITICAL:'#ff1744',HIGH:'#ff7b2e',MEDIUM:'#ffd700',LOW:'#00ff88'}[risk] ?? '#94a3b8'
}

interface LineChartProps {
  data: (number|null)[]
  labels: string[]
  width?: number
  height?: number
  color?: string
  fill?: string
  predicted?: boolean
  currentIdx?: number
}

function LineChart({ data, labels, height=200, color='#00d4ff', fill, currentIdx=28 }: LineChartProps) {
  const validData = data.filter(v => v !== null) as number[]
  const maxV = Math.max(...validData) * 1.1
  const minV = 0
  const W = 100, H = 100 // SVG viewBox units
  const pad = { top: 5, right: 4, bottom: 16, left: 8 }
  const innerW = W - pad.left - pad.right
  const innerH = H - pad.top - pad.bottom

  const points = data.map((v, i) => {
    const x = pad.left + (i / (data.length-1)) * innerW
    const y = v === null ? null : pad.top + innerH - ((v - minV) / (maxV - minV)) * innerH
    return { x, y }
  })

  const histPoints = points.filter((_,i) => i <= currentIdx && points[i].y !== null)
  const predPoints = points.filter((_,i) => i >= currentIdx && points[i].y !== null)

  const toPath = (pts: typeof points) => {
    if (pts.length < 2) return ''
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  }

  const histFill = histPoints.length > 1 ? `${toPath(histPoints)} L ${histPoints[histPoints.length-1].x} ${pad.top+innerH} L ${histPoints[0].x} ${pad.top+innerH} Z` : ''
  const predFill = predPoints.length > 1 ? `${toPath(predPoints)} L ${predPoints[predPoints.length-1].x} ${pad.top+innerH} L ${predPoints[0].x} ${pad.top+innerH} Z` : ''

  // Y axis labels
  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: pad.top + innerH - f * innerH,
    val: Math.round((minV + f*(maxV-minV))).toLocaleString()
  }))

  // X axis labels (every 6 hours)
  const xTicks = [0, 6, 12, 18, 23, 29, 35, 41, 47].filter(i => i < data.length)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: height, overflow: 'visible' }}>
      <defs>
        <linearGradient id="histFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
        <linearGradient id="predFill" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.2"/>
          <stop offset="100%" stopColor="#ffd700" stopOpacity="0.02"/>
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map(yl => (
        <line key={yl.val} x1={pad.left} y1={yl.y} x2={W-pad.right} y2={yl.y}
          stroke="rgba(255,255,255,0.05)" strokeWidth="0.3"/>
      ))}

      {/* Current time marker */}
      {(() => {
        const cx = pad.left + (currentIdx / (data.length-1)) * innerW
        return <line x1={cx} y1={pad.top} x2={cx} y2={pad.top+innerH} stroke="rgba(0,212,255,0.4)" strokeWidth="0.4" strokeDasharray="1 1"/>
      })()}

      {/* Historical fill */}
      {histFill && <path d={histFill} fill="url(#histFill)"/>}
      {/* Predicted fill */}
      {predFill && <path d={predFill} fill="url(#predFill)"/>}

      {/* Historical line */}
      {histPoints.length > 1 && (
        <path d={toPath(histPoints)} fill="none" stroke={color} strokeWidth="0.6" strokeLinejoin="round"/>
      )}
      {/* Predicted line */}
      {predPoints.length > 1 && (
        <path d={toPath(predPoints)} fill="none" stroke="#ffd700" strokeWidth="0.6" strokeDasharray="1.5 1" strokeLinejoin="round"/>
      )}

      {/* Y labels */}
      {yLabels.map(yl => (
        <text key={yl.val} x={pad.left - 1} y={yl.y + 0.5} textAnchor="end" fontSize="3" fill="#4b6080" fontFamily="JetBrains Mono">{yl.val}</text>
      ))}

      {/* X labels */}
      {xTicks.map(i => {
        const x = pad.left + (i / (data.length-1)) * innerW
        return (
          <text key={i} x={x} y={H-1} textAnchor="middle" fontSize="2.5" fill="#4b6080" fontFamily="JetBrains Mono">
            {labels[i]}
          </text>
        )
      })}

      {/* "NOW" label */}
      {(() => {
        const cx = pad.left + (currentIdx / (data.length-1)) * innerW
        return (
          <text x={cx} y={pad.top-1} textAnchor="middle" fontSize="2.8" fill="#00d4ff" fontFamily="Orbitron">NOW</text>
        )
      })()}
    </svg>
  )
}

export default function Prediction() {
  const [liveData, setLiveData] = useState(HISTORICAL)
  const [liveForecasts, setLiveForecasts] = useState(ZONE_FORECASTS)
  const [currentIdx, setCurrentIdx] = useState(28)
  const [aiMsg, setAiMsg] = useState('Analyzing crowd patterns...')

  const AI_MESSAGES = [
    'High crowd density predicted at Gate 2 in 15 minutes.',
    'North Entry approaching critical levels — recommend closure.',
    'Temple Plaza flow will peak in 22 minutes. Prepare overflow routes.',
    'East corridor density declining — normal flow resuming.',
    'Gate 3 surge detected. Activating diversion to Gate 1 & 4.',
  ]
  const [msgIdx, setMsgIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setLiveData(prev => {
        const next = [...prev]
        next[currentIdx] = Math.max(50, next[currentIdx] + (Math.random()-0.4)*30)
        return next
      })
      setLiveForecasts(prev => prev.map(f => ({
        ...f,
        pct: Math.max(5, Math.min(98, f.pct + Math.round((Math.random()-0.45)*3))),
        time: `${Math.max(1, parseInt(f.time)-1)} min`,
      })))
    }, 3000)
    return () => clearInterval(t)
  }, [currentIdx])

  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx(i => (i+1) % AI_MESSAGES.length)
      setAiMsg(AI_MESSAGES[(msgIdx+1) % AI_MESSAGES.length])
    }, 4500)
    return () => clearInterval(t)
  }, [msgIdx])

  const combinedData = liveData.map((v, i) => i >= 28 ? PREDICTED[i] : v)

  return (
    <div>
      <div className="float-up" style={{ marginBottom: 24 }}>
        <div className="orbitron glow-blue" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>AI CROWD FORECAST</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#4b6080' }}>PREDICTIVE ANALYTICS · 30-MINUTE LOOKAHEAD · MACHINE LEARNING MODEL</div>
      </div>

      {/* AI message banner */}
      <div className="glass-hi alert-drop" style={{ padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,212,255,0.15)', border: '1px solid rgba(0,212,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>⬡</div>
        <div style={{ flex: 1 }}>
          <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 3 }}>AI FORECAST MESSAGE</div>
          <div style={{ fontFamily: 'Inter', fontSize: 14, color: '#e2e8f0', transition: 'all 0.5s' }}>{aiMsg}</div>
        </div>
        <span className="badge badge-blue blink">● LIVE</span>
      </div>

      {/* Main chart */}
      <div className="glass float-up d2" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div className="orbitron" style={{ fontSize: 12, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.05em' }}>TOTAL PILGRIM COUNT — 24H</div>
            <div style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4b6080', marginTop: 2 }}>Historical data + AI prediction</div>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            {[{color:'#00d4ff',dash:false,label:'Historical'},{color:'#ffd700',dash:true,label:'Predicted'}].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 20, height: 2, background: l.color, opacity: 0.8, borderTop: l.dash ? `1px dashed ${l.color}` : undefined }} />
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#94a3b8' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <LineChart data={combinedData} labels={HOURS} height={200} color="#00d4ff" currentIdx={28} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Zone forecasts */}
        <div className="glass float-up d3" style={{ padding: 20 }}>
          <div className="orbitron" style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.06em', marginBottom: 14 }}>ZONE RISK FORECAST</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liveForecasts.map(f => {
              const col = riskColor(f.risk)
              return (
                <div key={f.zone} style={{ padding: '12px 14px', borderRadius: 8, background: `${col}08`, border: `1px solid ${col}30` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div className="orbitron" style={{ fontSize: 11, fontWeight: 600, color: col }}>{f.zone}</div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginTop: 2 }}>In {f.time}</div>
                    </div>
                    <span className={`badge badge-${f.risk === 'CRITICAL' ? 'red' : f.risk === 'HIGH' ? 'orange' : f.risk === 'MEDIUM' ? 'yellow' : 'green'} ${f.risk === 'CRITICAL' ? 'blink' : ''}`}>
                      {f.risk}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${f.pct}%`, background: col, borderRadius: 2, transition: 'width 0.8s', boxShadow: `0 0 6px ${col}` }} />
                  </div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#94a3b8' }}>{f.msg}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 30-min mini charts per gate */}
        <div className="glass float-up d4" style={{ padding: 20 }}>
          <div className="orbitron" style={{ fontSize: 11, fontWeight: 700, color: '#00d4ff', letterSpacing: '0.06em', marginBottom: 14 }}>GATE PREDICTIONS — NEXT 30 MIN</div>
          {['Gate 1 West','Gate 2 East','Gate 3 South','Gate 4 North'].map((gate, gi) => {
            const baseVals = [0.45, 0.85, 0.38, 0.92]
            const base = baseVals[gi]
            const miniData = Array.from({length:30},(_,i) => {
              const v = base + Math.sin(i*0.4+gi)*0.15 + (Math.random()-0.5)*0.08
              return Math.max(0.05, Math.min(0.99, v))
            })
            const col = base > 0.8 ? '#ff1744' : base > 0.6 ? '#ff7b2e' : '#00ff88'
            const maxV = Math.max(...miniData)
            const minV = Math.min(...miniData)
            const pts = miniData.map((v,i) => {
              const x = (i / (miniData.length-1)) * 100
              const y = 100 - ((v-minV)/(maxV-minV+0.01)) * 100
              return `${x},${y}`
            }).join(' ')
            return (
              <div key={gate} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#94a3b8' }}>{gate}</span>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: col }}>{Math.round(base*100)}%</span>
                </div>
                <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: 28 }}>
                  <polyline points={pts} fill="none" stroke={col} strokeWidth="1.5" strokeLinejoin="round"/>
                  <line x1="66" y1="0" x2="66" y2="30" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="2 2"/>
                  <text x="67" y="8" fontSize="4" fill="rgba(255,255,255,0.3)" fontFamily="JetBrains Mono">NOW</text>
                </svg>
              </div>
            )
          })}
        </div>
      </div>

      {/* Model info */}
      <div className="glass float-up d5" style={{ padding: 18 }}>
        <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 12 }}>AI MODEL SPECIFICATIONS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {[
            {label:'Model Type', value:'LSTM + Transformer'},
            {label:'Training Data', value:'3.2M crowd events'},
            {label:'Accuracy (15min)', value:'94.7%'},
            {label:'Accuracy (30min)', value:'89.2%'},
            {label:'Update Frequency', value:'Every 60 sec'},
            {label:'Input Features', value:'48 variables'},
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginBottom: 3 }}>{s.label}</div>
              <div className="orbitron" style={{ fontSize: 12, color: '#e2e8f0' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
