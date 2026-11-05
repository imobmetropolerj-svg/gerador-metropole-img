import capiUrl from './assets/capi.png'
import logoUrl from './assets/logo.png'
import paperUrl from './assets/paper.jpg'

const NAVY = '#12296b', RED = '#e1251b', FONT = 'Montserrat, "Segoe UI", Arial, sans-serif'
const load = (src) => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = src })
let cache
export async function loadAssets() {
  if (!cache) {
    const [capi, logo, paper] = await Promise.all([load(capiUrl), load(logoUrl), load(paperUrl)])
    await Promise.all(['500', '700', '800'].map((w) => document.fonts.load(`${w} 24px Montserrat`)))
    cache = { capi, logo, paper }
  }
  return cache
}

// Geometria extraída do layout oficial (vertical) e adaptação própria para o quadrado
const LAYOUT = {
  vertical: {
    W: 1080, H: 1920, logo: { h: 178, y: 18 }, capi: { x: 8, y: 1440, w: 395 },
    photos: [[108, 238, 862, 722, 26], [108, 976, 524, 370, 26], [675, 976, 297, 162, 22], [675, 1174, 297, 162, 22]],
    info: { x: 450, y: 1376, w: 590, h: 494, k: 0.92 },
  },
  square: {
    W: 1080, H: 1080, logo: { h: 112, y: 16 }, capi: { x: -6, y: 660, w: 346 },
    photos: [[40, 146, 560, 440, 22], [624, 146, 416, 282, 22], [624, 446, 200, 140, 18], [840, 446, 200, 140, 18]],
    info: { x: 360, y: 608, w: 680, h: 456, k: 0.88 },
  },
}

function rr(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath()
}
function drawPhoto(c, p, x, y, w, h, r, n) {
  c.save(); rr(c, x, y, w, h, r); c.clip()
  if (p && p.img) {
    const iw = p.img.naturalWidth, ih = p.img.naturalHeight
    const s = Math.max(w / iw, h / ih) * (p.zoom || 1), dw = iw * s, dh = ih * s
    c.drawImage(p.img, x - (dw - w) * (p.px ?? 0.5), y - (dh - h) * (p.py ?? 0.5), dw, dh)
  } else {
    c.fillStyle = '#e6ebf4'; c.fillRect(x, y, w, h)
    c.fillStyle = '#9aa7c2'; c.font = `700 ${Math.min(36, h / 6)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText(`FOTO ${n}`, x + w / 2, y + h / 2)
  }
  c.restore()
}
function wrap(c, t, maxW) {
  const out = []; let line = ''
  for (const w of t.split(/\s+/)) {
    const test = line ? line + ' ' + w : w
    if (c.measureText(test).width > maxW && line) { out.push(line); line = w } else line = test
  }
  if (line) out.push(line); return out
}
function fit(c, t, maxW) {
  if (c.measureText(t).width <= maxW) return t
  while (t.length > 1 && c.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}
export function money(v) {
  const s = String(v).replace(/R\$|\s/g, '')
  if (/^[\d.,]+$/.test(s)) {
    const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
    if (isFinite(n)) return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
  }
  return String(v)
}
const has = (v) => String(v ?? '').trim() !== ''
const cnt = (v) => has(v) && +v > 0
const pl = (n, a, b) => `${n} ${+n === 1 ? a : b}`

function chips(c, items, x, y, w, maxY, k) {
  const h = 44 * k, g = 10 * k; let cx = x, cy = y
  c.font = `700 ${22 * k}px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left'
  for (const it of items) {
    const cw = Math.min(c.measureText(it.t).width + 36 * k, w)
    if (cx + cw > x + w && cx > x) { cx = x; cy += h + g }
    if (cy + h > maxY) break
    rr(c, cx, cy, cw, h, h / 2)
    if (it.fill) { c.fillStyle = NAVY; c.fill(); c.fillStyle = '#fff' } else { c.lineWidth = 2 * k; c.strokeStyle = NAVY; c.stroke(); c.fillStyle = NAVY }
    c.fillText(fit(c, it.t, cw - 36 * k), cx + 18 * k, cy + h / 2 + k); cx += cw + g
  }
}

function drawInfo(c, d, { x, y, w, h, k }) {
  const sale = d.tipo === 'venda'; let cy = y
  c.textAlign = 'left'
  const label = sale ? 'IMÓVEL À VENDA' : 'IMÓVEL PARA ALUGAR'
  c.font = `800 ${30 * k}px ${FONT}`
  const bh = 54 * k, bw = c.measureText(label).width + 52 * k
  c.fillStyle = RED; rr(c, x, cy, bw, bh, bh / 2); c.fill()
  c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText(label, x + 26 * k, cy + bh / 2 + k); cy += bh + 18 * k
  c.textBaseline = 'top'
  if (has(d.titulo)) {
    c.font = `800 ${44 * k}px ${FONT}`; c.fillStyle = NAVY
    for (const l of wrap(c, d.titulo.trim(), w).slice(0, 2)) { c.fillText(l, x, cy); cy += 52 * k }
    cy += 2 * k
  }
  const loc = [d.tipoImovel, [d.bairro, d.cidade].filter(has).join(', ')].filter(has).join('  •  ')
  if (loc) { c.font = `500 ${27 * k}px ${FONT}`; c.fillStyle = '#4a5878'; c.fillText(fit(c, loc, w), x, cy); cy += 42 * k }
  if (has(d.valor)) {
    const txt = money(d.valor.trim()) + (sale ? '' : '/mês'); let fs = 72 * k
    c.font = `800 ${fs}px ${FONT}`
    while (c.measureText(txt).width > w && fs > 30) { fs -= 2; c.font = `800 ${fs}px ${FONT}` }
    c.fillStyle = RED; c.fillText(txt, x, cy); cy += 84 * k
  }
  const ci = [has(d.condominio) && `Condomínio ${money(d.condominio)}`, has(d.iptu) && `IPTU ${money(d.iptu)}`].filter(Boolean).join('   •   ')
  if (ci) { c.font = `700 ${25 * k}px ${FONT}`; c.fillStyle = NAVY; c.fillText(fit(c, ci, w), x, cy); cy += 42 * k }
  cy += 8 * k
  const items = []
  if (has(d.area)) items.push({ t: `${String(d.area).trim()} m²`, fill: 1 })
  if (cnt(d.quartos)) items.push({ t: pl(d.quartos, 'quarto', 'quartos'), fill: 1 })
  if (cnt(d.suites)) items.push({ t: pl(d.suites, 'suíte', 'suítes'), fill: 1 })
  if (cnt(d.banheiros)) items.push({ t: pl(d.banheiros, 'banheiro', 'banheiros'), fill: 1 })
  if (cnt(d.vagas)) items.push({ t: pl(d.vagas, 'vaga', 'vagas'), fill: 1 })
  String(d.diferenciais || '').split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean).forEach((t) => items.push({ t }))
  const footer = [d.corretor, d.telefone, has(d.creci) && `CRECI ${String(d.creci).replace(/^creci\s*/i, '')}`].filter(has).join('  •  ')
  chips(c, items, x, cy, w, y + h - (footer ? 44 * k : 0), k)
  if (footer) {
    c.textBaseline = 'alphabetic'; c.font = `500 ${21 * k}px ${FONT}`; c.fillStyle = '#6b7794'
    c.fillText(fit(c, footer, w), x, y + h - 4 * k)
  }
}

export function renderArt(canvas, fmt, d, A) {
  const G = LAYOUT[fmt]; canvas.width = G.W; canvas.height = G.H
  const c = canvas.getContext('2d'); c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'
  c.drawImage(A.paper, 0, 0, G.W, G.H)
  const lw = (G.logo.h * A.logo.width) / A.logo.height
  c.drawImage(A.logo, (G.W - lw) / 2, G.logo.y, lw, G.logo.h)
  G.photos.forEach((g, i) => drawPhoto(c, d.fotos[i], ...g, i + 1))
  const ch = (G.capi.w * A.capi.height) / A.capi.width
  c.drawImage(A.capi, G.capi.x, G.capi.y, G.capi.w, ch)
  drawInfo(c, d, G.info)
}

export async function exportPng(fmt, d, A, name) {
  const cv = document.createElement('canvas'); renderArt(cv, fmt, d, A)
  const blob = await new Promise((r) => cv.toBlob(r, 'image/png'))
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}-${fmt === 'vertical' ? '1080x1920' : '1080x1080'}.png`
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}
