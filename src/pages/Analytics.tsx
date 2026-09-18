import { useState, useEffect } from 'react'

function genHourly(peak: number) {
  const base = [30,22,18,14,12,14,35,75,95,90,80,85,92,88,82,78,90,96,88,72,55,40,32,28]
  return base.map(v => Math.round(v * peak / 100 + (Math.random()-0.5)*5))
}

const TODAY = genHourly(2850)
const YESTERDAY = genHourly(2200)
const LAST_WEEK = genHourly(1950)

function BarChart({ data, max, color='#00d4ff', height=80 }: {data:number[];max:number;color?:string;height?:number}) {
  return (
    <svg viewBox={`0 0 ${data.length*12} ${height}`} style={{width:'100%',height,display:'block'}} preserveAspectRatio="none">
      {data.map((v, i) => {
        const barH = (v/max)*height
        const x = i*12+1
        const col = v/max > 0.85 ? '#ff1744' : v/max > 0.65 ? '#ff7b2e' : v/max > 0.45 ? '#ffd700' : color
        return (
          <g key={i}>
            <rect x={x} y={height-barH} width={10} height={barH} rx="1.5"
              fill={col} opacity="0.8"/>
            {i % 4 === 0 && (
              <text x={x+5} y={height+6} textAnchor="middle" fontSize="5" fill="#4b6080" fontFamily="JetBrains Mono">
                {String(i).padStart(2,'0')}h
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function DonutChart({ pct, color, size=70, label }: {pct:number;color:string;size?:number;label?:string}) {
  const R = size*0.38, C = size/2
  const circumference = 2*Math.PI*R
  const stroke = circumference * (1 - pct/100)
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6"/>
      <circle cx={C} cy={C} r={R} fill="none" stroke={color}
        strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={stroke}
        strokeLinecap="round"
        transform={`rotate(-90 ${C} ${C})`}
        style={{transition:'stroke-dashoffset 1s ease'}}
      />
      <text x={C} y={C} textAnchor="middle" dominantBaseline="middle"
        fontSize={size*0.16} fontFamily="Orbitron" fontWeight="700" fill={color}>{pct}%</text>
      {label && (
        <text x={C} y={C+size*0.18} textAnchor="middle" dominantBaseline="middle"
          fontSize={size*0.1} fontFamily="JetBrains Mono" fill="#4b6080">{label}</text>
      )}
    </svg>
  )
}

function MultiLineChart({ datasets, height=120 }: { datasets:{data:number[];color:string;label:string}[]; height?:number }) {
  const allVals = datasets.flatMap(d=>d.data)
  const maxV = Math.max(...allVals)
  const len = datasets[0].data.length
  const W=100, H=100
  const pad={top:5,right:2,bottom:10,left:6}
  const iW=W-pad.left-pad.right, iH=H-pad.top-pad.bottom

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{width:'100%',height,display:'block'}}>
        {[0.25,0.5,0.75,1].map(f=>(
          <line key={f} x1={pad.left} y1={pad.top+iH*(1-f)} x2={W-pad.right} y2={pad.top+iH*(1-f)}
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.4"/>
        ))}
        {datasets.map(ds=>{
          const pts = ds.data.map((v,i)=>{
            const x = pad.left + (i/(len-1))*iW
            const y = pad.top + iH - (v/maxV)*iH
            return `${x},${y}`
          }).join(' ')
          return <polyline key={ds.label} points={pts} fill="none" stroke={ds.color} strokeWidth="0.7" strokeLinejoin="round" opacity="0.9"/>
        })}
        {[0,6,12,18,23].map(i=>(
          <text key={i} x={pad.left+(i/(len-1))*iW} y={H-0.5} textAnchor="middle" fontSize="2.5" fill="#4b6080" fontFamily="JetBrains Mono">
            {String(i).padStart(2,'0')}h
          </text>
        ))}
      </svg>
      <div style={{display:'flex',gap:12,marginTop:6}}>
        {datasets.map(ds=>(
          <div key={ds.label} style={{display:'flex',alignItems:'center',gap:4}}>
            <div style={{width:16,height:2,background:ds.color,borderRadius:1}}/>
            <span style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#94a3b8'}}>{ds.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Analytics() {
  const [period, setPeriod] = useState<'today'|'week'|'month'>('today')
  const [kpis, setKpis] = useState({ total:2847310, incidents:3, avgWait:2.8, accuracy:99.2 })

  useEffect(()=>{
    const t=setInterval(()=>{
      setKpis(prev=>({
        total: prev.total + Math.round((Math.random()-0.3)*12),
        incidents: prev.incidents,
        avgWait: Math.max(1.0, Math.min(8.0, prev.avgWait + (Math.random()-0.5)*0.1)),
        accuracy: Math.max(97, Math.min(99.9, prev.accuracy + (Math.random()-0.5)*0.1)),
      }))
    }, 2500)
    return ()=>clearInterval(t)
  },[])

  const GATE_UTILS = [
    {gate:'Gate 1 West', pct:68, peak:'09:30–11:00', color:'#00d4ff'},
    {gate:'Gate 2 East', pct:91, peak:'14:00–16:30', color:'#ff1744'},
    {gate:'Gate 3 South', pct:44, peak:'08:00–09:30', color:'#00ff88'},
    {gate:'Gate 4 North', pct:38, peak:'10:30–12:00', color:'#a78bfa'},
  ]

  const INCIDENTS = [
    {time:'14:32', zone:'East Courtyard', type:'High Density', severity:'CRITICAL', resolved:false},
    {time:'13:15', zone:'Gate 2 East',    type:'Congestion',   severity:'HIGH',     resolved:true},
    {time:'11:47', zone:'Temple Plaza',   type:'Flow Block',   severity:'MEDIUM',   resolved:true},
    {time:'10:02', zone:'South Waiting',  type:'High Count',   severity:'HIGH',     resolved:true},
  ]

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:24}}>
        <div className="float-up">
          <div className="orbitron glow-blue" style={{fontSize:20,fontWeight:700,letterSpacing:'0.05em',marginBottom:4}}>ANALYTICS DASHBOARD</div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:11,color:'#4b6080'}}>HISTORICAL DATA · PERFORMANCE METRICS · SYSTEM HEALTH</div>
        </div>
        <div style={{display:'flex',gap:6}}>
          {(['today','week','month'] as const).map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{
              fontFamily:'Orbitron',fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',
              padding:'5px 14px',borderRadius:20,border:'none',cursor:'pointer',
              background:period===p?'#00d4ff':'rgba(255,255,255,0.05)',
              color:period===p?'#000':'#94a3b8',transition:'all 0.2s',
            }}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:24}}>
        {[
          {label:'Total Pilgrims Today', value:kpis.total.toLocaleString(), sub:'↑ 12% vs yesterday', color:'#00d4ff'},
          {label:'Peak Hour Count', value:'3,120', sub:'Occurred at 14:15', color:'#ffd700'},
          {label:'Incidents Handled', value:kpis.incidents.toString(), sub:'2 critical, 1 resolved', color:'#ff7b2e'},
          {label:'Avg Wait Time', value:`${kpis.avgWait.toFixed(1)} min`, sub:'↓ 0.4 min vs last week', color:'#00ff88'},
          {label:'AI Accuracy', value:`${kpis.accuracy.toFixed(1)}%`, sub:'Person detection', color:'#a78bfa'},
          {label:'System Uptime', value:'99.97%', sub:'28d continuous', color:'#00d4ff'},
        ].map((k,i)=>(
          <div key={k.label} className={`glass float-up d${i+1}`} style={{padding:'16px 18px'}}>
            <div style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#4b6080',letterSpacing:'0.08em',marginBottom:6}}>{k.label.toUpperCase()}</div>
            <div className="orbitron" style={{fontSize:24,fontWeight:700,color:k.color,lineHeight:1,marginBottom:4}}>{k.value}</div>
            <div style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#4b6080'}}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {/* Hourly traffic */}
        <div className="glass float-up d2" style={{padding:20}}>
          <div className="orbitron" style={{fontSize:11,fontWeight:700,color:'#00d4ff',marginBottom:4}}>HOURLY CROWD TRAFFIC</div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#4b6080',marginBottom:14}}>Today (pilgrims / 100)</div>
          <BarChart data={TODAY.map(v=>Math.round(v/100))} max={Math.max(...TODAY)/100+5} height={90}/>
        </div>

        {/* Multi-day comparison */}
        <div className="glass float-up d3" style={{padding:20}}>
          <div className="orbitron" style={{fontSize:11,fontWeight:700,color:'#00d4ff',marginBottom:4}}>DAILY COMPARISON</div>
          <div style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#4b6080',marginBottom:14}}>Hourly density %</div>
          <MultiLineChart datasets={[
            {data:TODAY.map(v=>Math.round(v/30)),color:'#00d4ff',label:'Today'},
            {data:YESTERDAY.map(v=>Math.round(v/30)),color:'#ffd700',label:'Yesterday'},
            {data:LAST_WEEK.map(v=>Math.round(v/30)),color:'rgba(0,212,255,0.3)',label:'Last week'},
          ]} height={100}/>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
        {/* Gate utilization donuts */}
        <div className="glass float-up d4" style={{padding:20}}>
          <div className="orbitron" style={{fontSize:11,fontWeight:700,color:'#00d4ff',marginBottom:14}}>GATE UTILIZATION</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            {GATE_UTILS.map(g=>(
              <div key={g.gate} style={{textAlign:'center'}}>
                <DonutChart pct={g.pct} color={g.color} size={80} label={g.gate.split(' ')[1]}/>
                <div style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#94a3b8',marginTop:4}}>{g.gate}</div>
                <div style={{fontFamily:'JetBrains Mono',fontSize:8,color:'#4b6080'}}>Peak: {g.peak}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Incident log */}
        <div className="glass float-up d5" style={{padding:20}}>
          <div className="orbitron" style={{fontSize:11,fontWeight:700,color:'#00d4ff',marginBottom:14}}>INCIDENT LOG</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {INCIDENTS.map(inc=>{
              const col = inc.severity==='CRITICAL'?'#ff1744':inc.severity==='HIGH'?'#ff7b2e':'#ffd700'
              return (
                <div key={inc.time} style={{
                  padding:'10px 12px',borderRadius:6,
                  background:`${col}08`, border:`1px solid ${col}25`,
                  opacity: inc.resolved ? 0.55 : 1, transition:'opacity 0.3s',
                }}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                    <span className="orbitron" style={{fontSize:10,fontWeight:600,color:col}}>{inc.type}</span>
                    <span className={`badge badge-${inc.severity==='CRITICAL'?'red':inc.severity==='HIGH'?'orange':'yellow'} ${inc.severity==='CRITICAL'&&!inc.resolved?'blink':''}`}>{inc.severity}</span>
                  </div>
                  <div style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#94a3b8'}}>{inc.zone}</div>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:3}}>
                    <span style={{fontFamily:'JetBrains Mono',fontSize:8,color:'#4b6080'}}>{inc.time}</span>
                    <span style={{fontFamily:'JetBrains Mono',fontSize:8,color:inc.resolved?'#00ff88':'#ff7b2e'}}>
                      {inc.resolved?'✓ Resolved':'⚠ Active'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* System health */}
      <div className="glass float-up d6" style={{padding:20}}>
        <div className="orbitron" style={{fontSize:11,fontWeight:700,color:'#00d4ff',marginBottom:14}}>SYSTEM HEALTH METRICS</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:16}}>
          {[
            {label:'Camera Network',   pct:100, color:'#00ff88'},
            {label:'AI Engine CPU',    pct:64,  color:'#ffd700'},
            {label:'AI Engine GPU',    pct:88,  color:'#ff7b2e'},
            {label:'Database I/O',     pct:23,  color:'#00ff88'},
            {label:'Alert System',     pct:100, color:'#00ff88'},
            {label:'Network Uptime',   pct:100, color:'#00ff88'},
          ].map(s=>(
            <div key={s.label}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}>
                <span style={{fontFamily:'JetBrains Mono',fontSize:9,color:'#94a3b8'}}>{s.label}</span>
                <span className="orbitron" style={{fontSize:10,fontWeight:600,color:s.color}}>{s.pct}%</span>
              </div>
              <div style={{height:4,background:'rgba(255,255,255,0.06)',borderRadius:2}}>
                <div style={{height:'100%',width:`${s.pct}%`,background:s.color,borderRadius:2,boxShadow:`0 0 6px ${s.color}88`,transition:'width 1s ease'}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
