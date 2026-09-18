import { useState, useEffect, useRef } from 'react'

interface BBox { id:number; x:number; y:number; w:number; h:number; label:string; conf:number; life:number }
interface CamStats { id:string; name:string; count:number; density:number; status:string }

const CAMS: CamStats[] = [
  {id:'CAM-01', name:'South Gate Entrance', count:124, density:0.62, status:'active'},
  {id:'CAM-02', name:'East Courtyard',      count:89,  density:0.45, status:'active'},
  {id:'CAM-03', name:'Temple Plaza',        count:312, density:0.91, status:'alert'},
  {id:'CAM-04', name:'North Corridor',      count:44,  density:0.22, status:'active'},
  {id:'CAM-05', name:'West Gate',           count:156, density:0.78, status:'warning'},
  {id:'CAM-06', name:'Medical Zone',        count:12,  density:0.06, status:'active'},
]

const PIPELINE = [
  { label:'CCTV Camera', sublabel:'128 cameras, 4K stream', icon:'◉', color:'#00d4ff' },
  { label:'AI Detection', sublabel:'YOLOv9 person detection', icon:'⬡', color:'#a78bfa' },
  { label:'Crowd Count', sublabel:'±2 person accuracy', icon:'◈', color:'#00ff88' },
  { label:'Density Map', sublabel:'10×10 grid analysis', icon:'◰', color:'#ffd700' },
  { label:'Risk Score', sublabel:'0–100 danger index', icon:'⚠', color:'#ff7b2e' },
  { label:'Alert/Action', sublabel:'Automated response', icon:'▶', color:'#ff1744' },
]

export default function AIDetection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({ bboxes: [] as BBox[], dots: [] as {x:number;y:number;vx:number;vy:number}[], tick: 0, rafId: 0, uid: 0 })
  const [selected, setSelected] = useState<CamStats>(CAMS[0])
  const [liveCams, setLiveCams] = useState(CAMS)
  const [detCount, setDetCount] = useState(124)
  const [pipeStep, setPipeStep] = useState(0)

  // Pipeline animation loop
  useEffect(() => {
    const t = setInterval(() => setPipeStep(s => (s + 1) % PIPELINE.length), 700)
    return () => clearInterval(t)
  }, [])

  // Live cam stat updates
  useEffect(() => {
    const t = setInterval(() => {
      setLiveCams(prev => prev.map(c => ({
        ...c,
        count: Math.max(1, c.count + Math.round((Math.random()-0.45)*6)),
        density: Math.max(0.02, Math.min(0.99, c.density + (Math.random()-0.48)*0.04)),
      })))
      setDetCount(prev => Math.max(80, prev + Math.round((Math.random()-0.4)*8)))
    }, 1800)
    return () => clearInterval(t)
  }, [])

  // Canvas CCTV simulation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext('2d')
    if (!rawCtx) return
    const ctx = rawCtx
    const s = stateRef.current

    const W = canvas.width = 520
    const H = canvas.height = 340

    // Init dots (simulated pilgrims)
    s.dots = Array.from({length:80}, () => ({
      x: 30 + Math.random() * (W-60),
      y: 30 + Math.random() * (H-60),
      vx: (Math.random()-0.5)*0.6,
      vy: (Math.random()-0.5)*0.6,
    }))

    function spawnBBox() {
      if (s.bboxes.length >= 8) return
      const x = 20 + Math.random() * (W - 100)
      const y = 20 + Math.random() * (H - 80)
      const w = 40 + Math.random() * 80
      const h = 40 + Math.random() * 60
      s.bboxes.push({
        id: s.uid++, x, y, w, h,
        label: Math.random() < 0.3 ? 'GROUP' : 'PERSON',
        conf: 0.85 + Math.random() * 0.14,
        life: 60 + Math.random() * 80,
      })
    }

    let bboxTimer = 0

    function draw() {
      s.tick++
      const t = s.tick

      ctx.fillStyle = '#040c1c'
      ctx.fillRect(0, 0, W, H)

      // Vignette
      const vig = ctx.createRadialGradient(W/2,H/2,H*0.3,W/2,H/2,H*0.75)
      vig.addColorStop(0, 'transparent')
      vig.addColorStop(1, 'rgba(0,0,0,0.6)')
      ctx.fillStyle = vig
      ctx.fillRect(0, 0, W, H)

      // Noise texture (simulate camera grain)
      if (t % 2 === 0) {
        for (let i = 0; i < 200; i++) {
          const nx = Math.random() * W
          const ny = Math.random() * H
          ctx.fillStyle = `rgba(255,255,255,${Math.random()*0.03})`
          ctx.fillRect(nx, ny, 1, 1)
        }
      }

      // Move and draw pilgrim dots
      for (const d of s.dots) {
        d.x += d.vx
        d.y += d.vy
        if (d.x < 10 || d.x > W-10) d.vx *= -1
        if (d.y < 10 || d.y > H-10) d.vy *= -1
        // Slight random walk
        d.vx += (Math.random()-0.5)*0.08
        d.vy += (Math.random()-0.5)*0.08
        d.vx = Math.max(-1, Math.min(1, d.vx))
        d.vy = Math.max(-1, Math.min(1, d.vy))

        // Person silhouette (tiny)
        ctx.fillStyle = 'rgba(200,210,240,0.55)'
        ctx.beginPath()
        ctx.arc(d.x, d.y, 2.5, 0, Math.PI*2)
        ctx.fill()
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.ellipse(d.x, d.y+4, 2.5, 1, 0, 0, Math.PI*2)
        ctx.fill()
      }

      // Bounding boxes
      bboxTimer++
      if (bboxTimer >= 25) { spawnBBox(); bboxTimer = 0 }

      for (const bb of s.bboxes) {
        if (bb.life <= 0) continue
        const alpha = Math.min(1, bb.life / 15) * (bb.label === 'GROUP' ? 0.9 : 0.75)
        const col = bb.label === 'GROUP' ? [255,215,0] : [0,255,136]

        // Box
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`
        ctx.lineWidth = 1.2
        ctx.setLineDash([5, 3])
        ctx.strokeRect(bb.x, bb.y, bb.w, bb.h)
        ctx.setLineDash([])

        // Corners
        const cl = 8
        ctx.lineWidth = 1.8
        for (const [cx, cy, sx, sy] of [
          [bb.x,bb.y,1,1],[bb.x+bb.w,bb.y,-1,1],
          [bb.x,bb.y+bb.h,1,-1],[bb.x+bb.w,bb.y+bb.h,-1,-1]
        ] as [number,number,number,number][]) {
          ctx.beginPath(); ctx.moveTo(cx,cy+sy*cl); ctx.lineTo(cx,cy); ctx.lineTo(cx+sx*cl,cy); ctx.stroke()
        }

        // Label
        ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`
        ctx.font = '8px JetBrains Mono'
        ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
        ctx.fillText(`${bb.label} ${Math.round(bb.conf*100)}%`, bb.x+2, bb.y-2)

        bb.life--
      }
      s.bboxes = s.bboxes.filter(bb => bb.life > 0)

      // AI grid overlay (heat analysis)
      const gridCols = 8, gridRows = 5
      const gw = W / gridCols, gh = H / gridRows
      for (let gi = 0; gi < gridCols; gi++) {
        for (let gj = 0; gj < gridRows; gj++) {
          const cellX = gi * gw, cellY = gj * gh
          const dotsInCell = s.dots.filter(d => d.x>=cellX && d.x<cellX+gw && d.y>=cellY && d.y<cellY+gh).length
          const density = dotsInCell / 5
          if (density > 0.2) {
            const r = density > 0.8 ? 255 : density > 0.5 ? 255 : 0
            const g = density > 0.8 ? 23 : density > 0.5 ? 150 : 255
            const b = density > 0.8 ? 68 : density > 0.5 ? 0 : 136
            ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(density*0.25, 0.2)})`
            ctx.fillRect(cellX, cellY, gw, gh)
            ctx.strokeStyle = `rgba(${r},${g},${b},${density*0.15})`
            ctx.lineWidth = 0.5
            ctx.strokeRect(cellX, cellY, gw, gh)
          }
        }
      }

      // Grid overlay
      ctx.strokeStyle = 'rgba(0,212,255,0.07)'
      ctx.lineWidth = 0.5
      for (let gi = 0; gi <= gridCols; gi++) {
        ctx.beginPath(); ctx.moveTo(gi*gw, 0); ctx.lineTo(gi*gw, H); ctx.stroke()
      }
      for (let gj = 0; gj <= gridRows; gj++) {
        ctx.beginPath(); ctx.moveTo(0, gj*gh); ctx.lineTo(W, gj*gh); ctx.stroke()
      }

      // Scan line
      const scanY = (t * 2) % H
      const sg = ctx.createLinearGradient(0, scanY-2, 0, scanY+2)
      sg.addColorStop(0,'transparent'); sg.addColorStop(0.5,`rgba(0,212,255,0.4)`); sg.addColorStop(1,'transparent')
      ctx.fillStyle = sg; ctx.fillRect(0, scanY-2, W, 4)

      // Crosshair center
      ctx.strokeStyle = 'rgba(0,212,255,0.2)'
      ctx.lineWidth = 1
      ctx.setLineDash([4,4])
      ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke()
      ctx.setLineDash([])

      // Corner brackets
      ctx.strokeStyle = 'rgba(0,212,255,0.6)'
      ctx.lineWidth = 1.5
      const bcl = 18
      for (const [bx,by,sx,sy] of [[0,0,1,1],[W,0,-1,1],[0,H,1,-1],[W,H,-1,-1]] as [number,number,number,number][]) {
        ctx.beginPath(); ctx.moveTo(bx,by+sy*bcl); ctx.lineTo(bx,by); ctx.lineTo(bx+sx*bcl,by); ctx.stroke()
      }

      // HUD text
      ctx.fillStyle = 'rgba(0,212,255,0.7)'
      ctx.font = 'bold 9px Orbitron'
      ctx.textAlign = 'left'; ctx.textBaseline = 'top'
      ctx.fillText(`REC  ${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`, 8, 8)
      ctx.textAlign = 'right'
      ctx.fillText(`${selected.id}  4K/30fps`, W-8, 8)
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
      ctx.fillStyle = 'rgba(0,255,136,0.8)'
      ctx.fillText(`${detCount} DETECTED`, 8, H-8)

      s.rafId = requestAnimationFrame(draw)
    }

    s.rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(s.rafId)
  }, [selected, detCount])

  return (
    <div>
      <div className="float-up" style={{ marginBottom: 24 }}>
        <div className="orbitron glow-blue" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>AI CROWD DETECTION</div>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 11, color: '#4b6080' }}>REAL-TIME PERSON DETECTION · DENSITY ANALYSIS · RISK PREDICTION</div>
      </div>

      {/* Pipeline */}
      <div className="glass float-up d1" style={{ padding: 18, marginBottom: 20 }}>
        <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 14 }}>AI PROCESSING PIPELINE</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
          {PIPELINE.map((step, i) => {
            const active = pipeStep === i
            const done = (pipeStep > i) || (pipeStep === 0 && i === PIPELINE.length-1)
            return (
              <div key={step.label} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                <div style={{
                  padding: '10px 14px', borderRadius: 8, textAlign: 'center', minWidth: 110,
                  background: active ? `rgba(${step.color === '#00d4ff' ? '0,212,255' : step.color === '#a78bfa' ? '167,139,250' : step.color === '#00ff88' ? '0,255,136' : step.color === '#ffd700' ? '255,215,0' : step.color === '#ff7b2e' ? '255,123,46' : '255,23,68'},0.15)` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? step.color : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.3s',
                  boxShadow: active ? `0 0 16px ${step.color}44` : 'none',
                }}>
                  <div style={{ fontSize: 18, color: active ? step.color : '#4b6080', marginBottom: 4, fontFamily: 'Orbitron' }}>{step.icon}</div>
                  <div className="orbitron" style={{ fontSize: 9, fontWeight: 700, color: active ? step.color : '#4b6080', letterSpacing: '0.06em' }}>{step.label}</div>
                  <div style={{ fontFamily: 'JetBrains Mono', fontSize: 8, color: '#4b6080', marginTop: 2 }}>{step.sublabel}</div>
                </div>
                {i < PIPELINE.length-1 && (
                  <div style={{ color: active ? step.color : '#1e3a5f', margin: '0 4px', fontSize: 16, flexShrink: 0, transition: 'color 0.3s' }}>›</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Camera view */}
        <div className="glass" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 8, left: 10, zIndex: 10, display: 'flex', gap: 6 }}>
            <span className="badge badge-red blink">● REC</span>
            <span className="badge badge-blue">{selected.id}</span>
          </div>
          <div style={{ position: 'absolute', top: 8, right: 10, zIndex: 10 }}>
            <span className="badge badge-green">AI ACTIVE</span>
          </div>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', height: 'auto', aspectRatio: '520/340' }}
          />
          {/* Bottom stats bar */}
          <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.5)', borderTop: '1px solid rgba(0,212,255,0.1)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {[
              {label:'Detected', value:`${detCount}`, color:'#00ff88'},
              {label:'Density', value:`${Math.round(selected.density*100)}%`, color:selected.density>0.8?'#ff1744':selected.density>0.6?'#ff7b2e':'#ffd700'},
              {label:'Risk Score', value:`${Math.round(selected.density*100)}`, color:'#a78bfa'},
              {label:'Latency', value:'14ms', color:'#00d4ff'},
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080' }}>{s.label}</div>
                <div className="orbitron" style={{ fontSize: 14, fontWeight: 600, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: camera list + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="glass" style={{ padding: 16 }}>
            <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 12 }}>CAMERA NETWORK</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {liveCams.map(cam => {
                const isSelected = selected.id === cam.id
                const statusColor = cam.status === 'alert' ? '#ff1744' : cam.status === 'warning' ? '#ffd700' : '#00ff88'
                return (
                  <div
                    key={cam.id}
                    onClick={() => setSelected(cam)}
                    style={{
                      padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                      background: isSelected ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? 'rgba(0,212,255,0.35)' : 'rgba(255,255,255,0.05)'}`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}`, flexShrink: 0 }} className={cam.status === 'alert' ? 'blink' : ''} />
                        <span className="orbitron" style={{ fontSize: 9, fontWeight: 700, color: isSelected ? '#00d4ff' : '#94a3b8' }}>{cam.id}</span>
                      </div>
                      <span style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: statusColor }}>{cam.count}</span>
                    </div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 9, color: '#4b6080', marginBottom: 4 }}>{cam.name}</div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                      <div style={{ height: '100%', width: `${cam.density*100}%`, background: cam.density>0.8?'#ff1744':cam.density>0.6?'#ff7b2e':'#00ff88', borderRadius: 1, transition: 'width 0.8s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* AI stats */}
          <div className="glass" style={{ padding: 16 }}>
            <div className="orbitron" style={{ fontSize: 10, color: '#4b6080', letterSpacing: '0.1em', marginBottom: 12 }}>AI PERFORMANCE</div>
            {[
              {label:'Detection Accuracy', value:'99.2%', color:'#00ff88'},
              {label:'False Positive Rate', value:'0.8%', color:'#00d4ff'},
              {label:'Processing Speed', value:'14ms', color:'#ffd700'},
              {label:'Cameras Active', value:'128/128', color:'#a78bfa'},
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: 10, color: '#4b6080' }}>{s.label}</span>
                <span className="orbitron" style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
