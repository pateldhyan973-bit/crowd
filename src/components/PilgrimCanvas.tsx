import { useEffect, useRef, useCallback } from 'react'

interface Props {
  emergency?: boolean
  onStats?: (stats: { total: number; gates: number[] }) => void
}

interface Point { x: number; y: number }
interface Pilgrim {
  id: number; x: number; y: number
  path: Point[]; seg: number; t: number
  speed: number; alpha: number; done: boolean
  pathKey: string; hue: number
}

// Logical canvas space
const LW = 900, LH = 500

// Temple complex layout
const OUTER  = { x: 135, y: 65,  w: 630, h: 390 }
const INNER  = { x: 205, y: 125, w: 490, h: 270 }
const TEMPLE = { x: 340, y: 180, w: 220, h: 140 }
const SANCTUM= { x: 382, y: 205, w: 136, h: 90  }

// Paths (waypoints in logical coords)
const PATHS: Record<string, Point[]> = {
  south: [{x:450,y:510},{x:450,y:465},{x:450,y:400},{x:450,y:340},{x:450,y:265},{x:450,y:238}],
  west:  [{x:80,y:267},{x:135,y:267},{x:205,y:258},{x:295,y:250},{x:360,y:244},{x:450,y:238}],
  east:  [{x:820,y:267},{x:765,y:267},{x:695,y:258},{x:610,y:250},{x:540,y:244},{x:450,y:238}],
  east_div: [{x:820,y:267},{x:765,y:267},{x:820,y:145},{x:700,y:82},{x:550,y:68},{x:452,y:68},{x:450,y:128},{x:450,y:205},{x:450,y:238}],
  north: [{x:450,y:28},{x:450,y:65},{x:450,y:128},{x:450,y:200},{x:450,y:238}],
  // Emergency exits
  exit_west: [{x:450,y:238},{x:300,y:250},{x:205,y:260},{x:135,y:280},{x:60,y:300}],
  exit_south:[{x:450,y:238},{x:450,y:320},{x:450,y:400},{x:450,y:470},{x:450,y:520}],
}

// Zones for density coloring
const ZONES = [
  {id:'south',  x:392, y:310, w:116, h:200, cap:45,  label:'South Entry'},
  {id:'west',   x:125, y:228, w:250, h:86,  cap:38,  label:'West Corridor'},
  {id:'east',   x:525, y:228, w:250, h:86,  cap:38,  label:'East Corridor'},
  {id:'north',  x:394, y:58,  w:112, h:200, cap:30,  label:'North Entry'},
  {id:'plaza',  x:196, y:116, w:508, h:290, cap:170, label:'Temple Plaza'},
]

function densityRGB(d: number): [number,number,number] {
  if (d < 0.35) return [0, 255, 136]
  if (d < 0.6)  return [255, 215, 0]
  if (d < 0.82) return [255, 123, 46]
  return [255, 23, 68]
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

let _uid = 0

export default function PilgrimCanvas({ emergency = false, onStats }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef({
    pilgrims: [] as Pilgrim[],
    tick: 0,
    phase: 'normal' as 'normal' | 'congested' | 'emergency',
    phaseTimer: 0,
    densities: {} as Record<string, number>,
    smoothDensities: {} as Record<string, number>,
    bboxes: [] as {x:number;y:number;w:number;h:number;life:number}[],
    bboxTimer: 0,
    rafId: 0,
  })

  const spawn = useCallback((pathKey: string) => {
    const path = PATHS[pathKey]
    if (!path) return
    const p: Pilgrim = {
      id: _uid++, x: path[0].x, y: path[0].y,
      path, seg: 0, t: 0,
      speed: 0.012 + Math.random() * 0.008,
      alpha: 1, done: false, pathKey,
      hue: 180 + Math.random() * 40,
    }
    stateRef.current.pilgrims.push(p)
  }, [])

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, scale: number, tick: number) => {
    const s = stateRef.current
    const W = LW * scale, H = LH * scale
    const sc = (n: number) => n * scale

    ctx.clearRect(0, 0, W, H)

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H)
    bg.addColorStop(0, '#060e20')
    bg.addColorStop(1, '#040a18')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Subtle grid
    ctx.strokeStyle = 'rgba(0,212,255,0.04)'
    ctx.lineWidth = 1
    const gs = sc(40)
    for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke() }
    for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke() }

    // === Draw zone overlays ===
    for (const z of ZONES) {
      const d = s.smoothDensities[z.id] ?? 0
      const [r,g,b] = densityRGB(d)
      const alpha = 0.08 + d * 0.22
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.2 + d * 0.4})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(sc(z.x), sc(z.y), sc(z.w), sc(z.h), sc(3))
      ctx.fill(); ctx.stroke()
    }

    // === Outer wall ===
    ctx.strokeStyle = 'rgba(0,212,255,0.35)'
    ctx.lineWidth = sc(1.5)
    ctx.fillStyle = 'rgba(0,212,255,0.03)'
    ctx.beginPath()
    ctx.roundRect(sc(OUTER.x), sc(OUTER.y), sc(OUTER.w), sc(OUTER.h), sc(4))
    ctx.fill(); ctx.stroke()

    // Corner accents outer wall
    const cornerLen = sc(12)
    const corners = [
      [sc(OUTER.x), sc(OUTER.y)],
      [sc(OUTER.x+OUTER.w), sc(OUTER.y)],
      [sc(OUTER.x), sc(OUTER.y+OUTER.h)],
      [sc(OUTER.x+OUTER.w), sc(OUTER.y+OUTER.h)],
    ]
    ctx.strokeStyle = 'rgba(0,212,255,0.7)'
    ctx.lineWidth = sc(1.5)
    for (const [cx, cy] of corners) {
      const sx = cx === sc(OUTER.x) ? 1 : -1
      const sy = cy === sc(OUTER.y) ? 1 : -1
      ctx.beginPath(); ctx.moveTo(cx, cy + sy*cornerLen); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx*cornerLen, cy); ctx.stroke()
    }

    // === Inner wall ===
    ctx.strokeStyle = 'rgba(0,212,255,0.25)'
    ctx.lineWidth = sc(1)
    ctx.fillStyle = 'rgba(0,212,255,0.02)'
    ctx.beginPath()
    ctx.roundRect(sc(INNER.x), sc(INNER.y), sc(INNER.w), sc(INNER.h), sc(3))
    ctx.fill(); ctx.stroke()

    // === Temple body ===
    ctx.fillStyle = 'rgba(0,30,60,0.9)'
    ctx.strokeStyle = 'rgba(0,212,255,0.6)'
    ctx.lineWidth = sc(2)
    ctx.beginPath()
    ctx.roundRect(sc(TEMPLE.x), sc(TEMPLE.y), sc(TEMPLE.w), sc(TEMPLE.h), sc(4))
    ctx.fill(); ctx.stroke()

    // Temple glow
    const templeGlow = ctx.createRadialGradient(sc(450), sc(250), 0, sc(450), sc(250), sc(130))
    templeGlow.addColorStop(0, 'rgba(0,212,255,0.12)')
    templeGlow.addColorStop(1, 'transparent')
    ctx.fillStyle = templeGlow
    ctx.beginPath()
    ctx.ellipse(sc(450), sc(250), sc(130), sc(90), 0, 0, Math.PI*2)
    ctx.fill()

    // === Sanctum ===
    ctx.fillStyle = 'rgba(0,212,255,0.08)'
    ctx.strokeStyle = 'rgba(0,212,255,0.9)'
    ctx.lineWidth = sc(1.5)
    ctx.beginPath()
    ctx.roundRect(sc(SANCTUM.x), sc(SANCTUM.y), sc(SANCTUM.w), sc(SANCTUM.h), sc(3))
    ctx.fill(); ctx.stroke()

    // Temple text
    ctx.fillStyle = '#00d4ff'
    ctx.font = `bold ${sc(11)}px Orbitron, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('TEMPLE', sc(450), sc(248))
    ctx.font = `${sc(8)}px JetBrains Mono, monospace`
    ctx.fillStyle = 'rgba(0,212,255,0.6)'
    ctx.fillText('SACRED ZONE', sc(450), sc(264))

    // === Draw paths ===
    const pathsToDraw = s.phase === 'emergency'
      ? [['south','exit_south'], ['west','exit_west']] as const
      : s.phase === 'congested'
        ? [['south','south'],['west','west'],['east','east_div'],['north','north']] as const
        : [['south','south'],['west','west'],['east','east'],['north','north']] as const

    const pathLabels: Record<string, string> = {
      south:'G3 South', west:'G1 West', east_div:'G2 → Diverted ↗', east:'G2 East', north:'G4 North', exit_west:'Emergency Exit W', exit_south:'Emergency Exit S'
    }

    for (const [, pk] of pathsToDraw) {
      const pts = PATHS[pk]
      if (!pts || pts.length < 2) continue
      const isDiv = pk === 'east_div'
      const isEmg = pk.startsWith('exit')
      const isEast = pk === 'east'
      const d = s.smoothDensities['east'] ?? 0
      let r=0,g=212,b=255,a=0.5
      if (isDiv) { r=0;g=255;b=136;a=0.7 }
      else if (isEmg) { r=255;g=215;b=0;a=0.8 }
      else if (isEast && s.phase === 'congested') { r=255;g=23;b=68;a=0.8 }
      else if (pk === 'east' && d > 0.5) { r=255;g=123;b=46;a=0.6 }

      ctx.setLineDash([sc(8), sc(5)])
      ctx.lineDashOffset = -(tick * 0.4) % sc(13)
      ctx.strokeStyle = `rgba(${r},${g},${b},${a})`
      ctx.lineWidth = sc(1.5)
      ctx.beginPath()
      ctx.moveTo(sc(pts[0].x), sc(pts[0].y))
      for (let i=1; i<pts.length; i++) ctx.lineTo(sc(pts[i].x), sc(pts[i].y))
      ctx.stroke()
      ctx.setLineDash([])

      // Arrows along path
      const numArrows = Math.max(1, Math.floor(pts.length / 2))
      for (let i = 0; i < pts.length-1; i++) {
        const mx = (pts[i].x + pts[i+1].x) / 2
        const my = (pts[i].y + pts[i+1].y) / 2
        const angle = Math.atan2(pts[i+1].y - pts[i].y, pts[i+1].x - pts[i].x)
        const as = sc(5)
        ctx.save()
        ctx.translate(sc(mx), sc(my))
        ctx.rotate(angle)
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
        ctx.beginPath()
        ctx.moveTo(as, 0); ctx.lineTo(-as/2, -as/2); ctx.lineTo(-as/2, as/2)
        ctx.closePath(); ctx.fill()
        ctx.restore()
      }
    }

    // === Gate indicators ===
    const gateConfig = [
      { x:135, y:267, label:'G1', id:'west',  side:'left'  },
      { x:765, y:267, label:'G2', id:'east',  side:'right' },
      { x:450, y:465, label:'G3', id:'south', side:'bottom'},
      { x:450, y:65,  label:'G4', id:'north', side:'top'   },
    ]
    for (const g of gateConfig) {
      const d = s.smoothDensities[g.id] ?? 0
      const [r,gg,b] = densityRGB(d)
      const pct = Math.round(d * 100)

      // Gate circle
      ctx.beginPath()
      ctx.arc(sc(g.x), sc(g.y), sc(7), 0, Math.PI*2)
      ctx.fillStyle = `rgba(${r},${gg},${b},0.2)`
      ctx.fill()
      ctx.strokeStyle = `rgba(${r},${gg},${b},0.9)`
      ctx.lineWidth = sc(1.5)
      ctx.stroke()

      // Label
      const lx = g.side === 'left' ? sc(g.x - 14) : g.side === 'right' ? sc(g.x + 14) : sc(g.x)
      const ly = g.side === 'top' ? sc(g.y - 14) : g.side === 'bottom' ? sc(g.y + 14) : sc(g.y)
      ctx.font = `bold ${sc(9)}px Orbitron`
      ctx.textAlign = g.side === 'left' ? 'right' : g.side === 'right' ? 'left' : 'center'
      ctx.textBaseline = g.side === 'top' ? 'bottom' : g.side === 'bottom' ? 'top' : 'middle'
      ctx.fillStyle = `rgba(${r},${gg},${b},1)`
      ctx.fillText(`${g.label} ${pct}%`, lx, ly)
    }

    // === Pilgrims ===
    for (const p of s.pilgrims) {
      if (p.done && p.alpha <= 0) continue
      ctx.globalAlpha = p.alpha
      const r = sc(2.5)
      // Pilgrim glow
      const grad = ctx.createRadialGradient(sc(p.x), sc(p.y), 0, sc(p.x), sc(p.y), r*2.5)
      grad.addColorStop(0, `hsla(${p.hue},100%,85%,0.9)`)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.beginPath(); ctx.arc(sc(p.x), sc(p.y), r*2.5, 0, Math.PI*2); ctx.fill()
      // Core dot
      ctx.fillStyle = `hsla(${p.hue},80%,90%,1)`
      ctx.beginPath(); ctx.arc(sc(p.x), sc(p.y), r, 0, Math.PI*2); ctx.fill()
      ctx.globalAlpha = 1
    }

    // === AI detection bounding boxes ===
    for (const bb of s.bboxes) {
      if (bb.life <= 0) continue
      const bbAlpha = Math.min(1, bb.life / 20) * 0.8
      ctx.strokeStyle = `rgba(0,255,136,${bbAlpha})`
      ctx.lineWidth = sc(1)
      ctx.setLineDash([sc(4), sc(2)])
      ctx.strokeRect(sc(bb.x), sc(bb.y), sc(bb.w), sc(bb.h))
      ctx.setLineDash([])
      // corner brackets
      const cl = sc(5)
      ctx.strokeStyle = `rgba(0,255,136,${bbAlpha*1.2})`
      ctx.lineWidth = sc(1.5)
      for (const [bx, by, sx, sy] of [[sc(bb.x),sc(bb.y),1,1],[sc(bb.x+bb.w),sc(bb.y),-1,1],[sc(bb.x),sc(bb.y+bb.h),1,-1],[sc(bb.x+bb.w),sc(bb.y+bb.h),-1,-1]] as [number,number,number,number][]) {
        ctx.beginPath(); ctx.moveTo(bx, by+sy*cl); ctx.lineTo(bx, by); ctx.lineTo(bx+sx*cl, by); ctx.stroke()
      }
      // Count label
      ctx.fillStyle = `rgba(0,255,136,${bbAlpha})`
      ctx.font = `${sc(7)}px JetBrains Mono`
      ctx.textAlign = 'left'; ctx.textBaseline = 'bottom'
      const cnt = Math.floor(bb.w * bb.h / (sc(60)*sc(60)))
      ctx.fillText(`${cnt} detected`, sc(bb.x)+2, sc(bb.y)-2)
    }

    // === Scan line ===
    const scanPos = (tick * 2.5) % H
    const scanGrad = ctx.createLinearGradient(0, scanPos - sc(3), 0, scanPos + sc(3))
    scanGrad.addColorStop(0, 'transparent')
    scanGrad.addColorStop(0.5, `rgba(0,212,255,${0.15 + Math.sin(tick*0.05)*0.05})`)
    scanGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = scanGrad
    ctx.fillRect(0, scanPos - sc(3), W, sc(6))

    // === Emergency overlay ===
    if (s.phase === 'emergency') {
      // Red danger flash
      const flashAlpha = 0.08 + Math.sin(tick * 0.15) * 0.06
      ctx.fillStyle = `rgba(255,23,68,${flashAlpha})`
      ctx.fillRect(0, 0, W, H)
      // Warning text
      ctx.fillStyle = `rgba(255,23,68,${0.8 + Math.sin(tick*0.2)*0.2})`
      ctx.font = `bold ${sc(14)}px Orbitron`
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillText('⚠ EMERGENCY MODE ACTIVE', W/2, sc(8))
    }

    // === Congestion overlay ===
    if (s.phase === 'congested') {
      ctx.fillStyle = `rgba(255,23,68,${0.06 + Math.sin(tick*0.1)*0.04})`
      ctx.beginPath()
      ctx.roundRect(sc(525), sc(228), sc(250), sc(86), sc(3))
      ctx.fill()
      ctx.fillStyle = `rgba(255,23,68,${0.7 + Math.sin(tick*0.2)*0.3})`
      ctx.font = `bold ${sc(8)}px Orbitron`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('⚠ HIGH DENSITY — DIVERTING', sc(650), sc(271))
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rawCtx = canvas.getContext('2d')
    if (!rawCtx) return
    const ctx: CanvasRenderingContext2D = rawCtx

    const s = stateRef.current

    let lastDpr = 0
    const resize = () => {
      const container = canvas.parentElement
      if (!container) return
      const dpr = window.devicePixelRatio || 1
      const cw = container.clientWidth
      const ch = Math.round(cw * LH / LW)
      canvas.width  = cw * dpr
      canvas.height = ch * dpr
      canvas.style.width  = cw + 'px'
      canvas.style.height = ch + 'px'
      ctx.scale(dpr, dpr)
      lastDpr = dpr
    }
    resize()
    const ro = new ResizeObserver(resize)
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const spawnSchedule: Record<string, number> = { south: 0, west: 0, east: 0, north: 0 }

    function tick() {
      s.tick++
      const t = s.tick

      // Phase management (normal 350 → congested 200 → normal ...)
      s.phaseTimer++
      if (!emergency) {
        if (s.phase === 'normal'     && s.phaseTimer > 350) { s.phase = 'congested'; s.phaseTimer = 0 }
        if (s.phase === 'congested'  && s.phaseTimer > 220) { s.phase = 'normal';    s.phaseTimer = 0 }
      } else {
        s.phase = 'emergency'
      }

      // Spawn pilgrims
      const gateInterval = s.phase === 'emergency' ? 999 : 15
      for (const [gid, pathKey] of [['south','south'],['west','west'],['north','north']] as const) {
        spawnSchedule[gid] = (spawnSchedule[gid] ?? 0) + 1
        if (spawnSchedule[gid] >= gateInterval && s.pilgrims.filter(p=>p.pathKey.startsWith(gid)).length < 35) {
          spawn(pathKey)
          if (Math.random() < 0.4) spawn(pathKey)
          spawnSchedule[gid] = 0
        }
      }
      // East gate - use diverted path when congested
      spawnSchedule['east'] = (spawnSchedule['east'] ?? 0) + 1
      if (spawnSchedule['east'] >= gateInterval) {
        const pk = s.phase === 'congested' ? 'east_div' : 'east'
        if (s.pilgrims.filter(p=>p.pathKey.startsWith('east')).length < 40) {
          spawn(pk)
          if (Math.random() < 0.4) spawn(pk)
        }
        spawnSchedule['east'] = 0
      }

      // Emergency exit spawning
      if (s.phase === 'emergency' && t % 20 === 0) {
        spawn('exit_south'); spawn('exit_west')
      }

      // Move pilgrims
      for (const p of s.pilgrims) {
        if (p.done) { p.alpha -= 0.04; continue }
        p.t += p.speed
        while (p.t >= 1 && p.seg < p.path.length - 2) { p.t -= 1; p.seg++ }
        if (p.seg >= p.path.length - 2) {
          const last = p.path[p.path.length - 1]
          const prev = p.path[p.path.length - 2]
          p.x = lerp(prev.x, last.x, Math.min(1, p.t))
          p.y = lerp(prev.y, last.y, Math.min(1, p.t))
          if (p.t >= 1) p.done = true
        } else {
          p.x = lerp(p.path[p.seg].x, p.path[p.seg+1].x, p.t)
          p.y = lerp(p.path[p.seg].y, p.path[p.seg+1].y, p.t)
        }
      }
      s.pilgrims = s.pilgrims.filter(p => !(p.done && p.alpha <= 0))

      // Calculate zone densities
      for (const z of ZONES) {
        const count = s.pilgrims.filter(p => p.x >= z.x && p.x <= z.x+z.w && p.y >= z.y && p.y <= z.y+z.h).length
        s.densities[z.id] = count / z.cap
      }
      // Smooth densities
      for (const z of ZONES) {
        const target = s.densities[z.id] ?? 0
        const current = s.smoothDensities[z.id] ?? 0
        s.smoothDensities[z.id] = lerp(current, target, 0.08)
      }

      // Generate AI detection bboxes
      s.bboxTimer++
      if (s.bboxTimer >= 90) {
        s.bboxTimer = 0
        // Pick a random zone to add a detection box
        const zone = ZONES[Math.floor(Math.random() * ZONES.length)]
        if ((s.smoothDensities[zone.id] ?? 0) > 0.1) {
          const padding = 15
          s.bboxes.push({
            x: zone.x + padding, y: zone.y + padding,
            w: zone.w - padding*2, h: zone.h - padding*2,
            life: 60
          })
        }
      }
      for (const bb of s.bboxes) bb.life--
      s.bboxes = s.bboxes.filter(bb => bb.life > 0)

      // Stats callback
      if (t % 20 === 0 && onStats) {
        const total = s.pilgrims.length * 120 + 8000
        const gates = ZONES.map(z => Math.round((s.smoothDensities[z.id] ?? 0) * 100))
        onStats({ total, gates })
      }

      // Draw
      const container = canvasRef.current?.parentElement
      if (!container) return
      const scale = container.clientWidth / LW
      drawScene(ctx, scale, t)

      s.rafId = requestAnimationFrame(tick)
    }

    s.rafId = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(s.rafId)
      ro.disconnect()
    }
  }, [emergency, spawn, drawScene, onStats])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', borderRadius: 12 }}
    />
  )
}
