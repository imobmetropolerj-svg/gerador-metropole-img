import { useEffect, useRef, useState } from 'react'
import { loadAssets, renderArt, exportPng } from './render.js'
import capiImg from './assets/capi.png'
import logoImg from './assets/logo.png'

const EMPTY = { tipo: 'venda', titulo: '', tipoImovel: '', bairro: '', cidade: '', valor: '', condominio: '', iptu: '', area: '', quartos: '', suites: '', banheiros: '', vagas: '', diferenciais: '' }
const STEPS = ['Modalidade', 'Dados', 'Fotos', 'Pré-visualização', 'Exportação']
const KEY = 'metropole-corretor'
const loadBroker = () => { try { return { corretor: '', telefone: '', creci: '', ...JSON.parse(localStorage.getItem(KEY)) } } catch { return { corretor: '', telefone: '', creci: '' } } }

function Preview({ d, fotos, fmt, A, tick }) {
  const ref = useRef()
  useEffect(() => {
    if (!A || !ref.current) return
    const id = requestAnimationFrame(() => renderArt(ref.current, fmt, { ...d, fotos }, A))
    return () => cancelAnimationFrame(id)
  }, [d, fotos, fmt, A, tick])
  return <canvas ref={ref} className={'art ' + fmt} />
}

function Photos({ fotos, setFotos }) {
  const names = ['Foto 1 — principal', 'Foto 2 — secundária', 'Foto 3 — complementar', 'Foto 4 — complementar']
  const set = (i, fn) => setFotos((f) => f.map((x, j) => (j === i ? fn(x) : x)))
  function pick(i, file) {
    if (!file) return
    const url = URL.createObjectURL(file), img = new Image()
    img.onload = () => set(i, (old) => { if (old) URL.revokeObjectURL(old.url); return { img, url, zoom: 1, px: 0.5, py: 0.5 } })
    img.onerror = () => alert('Não foi possível abrir esta imagem.')
    img.src = url
  }
  return (
    <div className="slots">
      {fotos.map((p, i) => (
        <div className="slot" key={i}>
          <strong>{names[i]}</strong>
          {p ? (
            <>
              <img src={p.url} alt="" className="thumb" />
              {[['zoom', 'Zoom', 1, 3, 0.05], ['px', 'Horizontal', 0, 1, 0.01], ['py', 'Vertical', 0, 1, 0.01]].map(([k, l, mn, mx, st]) => (
                <label key={k} className="rng">{l}<input type="range" min={mn} max={mx} step={st} value={p[k]} onChange={(e) => set(i, (o) => ({ ...o, [k]: +e.target.value }))} /></label>
              ))}
              <div className="row">
                <label className="btn ghost">Substituir<input hidden type="file" accept="image/*" onChange={(e) => { pick(i, e.target.files[0]); e.target.value = '' }} /></label>
                <button className="btn ghost" onClick={() => set(i, (o) => { URL.revokeObjectURL(o.url); return null })}>Remover</button>
              </div>
            </>
          ) : (
            <label className="drop">+ Selecionar imagem<input hidden type="file" accept="image/*" onChange={(e) => { pick(i, e.target.files[0]); e.target.value = '' }} /></label>
          )}
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const [step, setStep] = useState(0)
  const [d, setD] = useState({ ...EMPTY, ...loadBroker() })
  const [fotos, setFotos] = useState([null, null, null, null])
  const [A, setA] = useState(null)
  const [fmt, setFmt] = useState('vertical')
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState(false)
  useEffect(() => { loadAssets().then(setA).catch(() => alert('Erro ao carregar os arquivos da marca.')) }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify({ corretor: d.corretor, telefone: d.telefone, creci: d.creci })) } catch {} }, [d.corretor, d.telefone, d.creci])

  const up = (k) => (e) => setD((o) => ({ ...o, [k]: e.target.value }))
  const f = (l, k, o = {}) => (
    <label className={'fld ' + (o.wide ? 'wide' : '')}>{l}
      {o.area ? <textarea rows={3} value={d[k]} onChange={up(k)} placeholder={o.ph} /> : <input type={o.type || 'text'} min="0" inputMode={o.type === 'number' ? 'numeric' : undefined} value={d[k]} onChange={up(k)} placeholder={o.ph} />}
    </label>
  )
  const hasMain = !!fotos[0]
  const name = 'metropole-' + (d.tipo === 'venda' ? 'venda' : 'locacao')
  const data = { ...d, fotos }
  async function dl(which) {
    setBusy(true)
    try {
      for (const [i, fm] of which.entries()) { if (i) await new Promise((r) => setTimeout(r, 500)); await exportPng(fm, data, A, name) }
    } finally { setBusy(false) }
  }
  const reset = () => { setStep(1); setD({ ...EMPTY, ...loadBroker() }); setFotos([null, null, null, null]) }

  if (step === 0)
    return (
      <main className="home">
        <img src={logoImg} alt="Imobiliária Metrópole" className="hlogo" />
        <h1>GERADOR DE ARTES METRÓPOLE</h1>
        <p>Padronize suas divulgações e apresente seus imóveis com qualidade profissional.</p>
        <button className="btn red big" onClick={() => setStep(1)}>CRIAR NOVA ARTE</button>
        <img src={capiImg} alt="Capi" className="hcapi" />
      </main>
    )

  const side = (
    <aside className="side">
      <div className="tabs">{['vertical', 'square'].map((x) => <button key={x} className={fmt === x ? 'on' : ''} onClick={() => setFmt(x)}>{x === 'vertical' ? 'Vertical 9:16' : 'Quadrado 1:1'}</button>)}</div>
      <Preview d={d} fotos={fotos} fmt={fmt} A={A} tick={tick} />
    </aside>
  )

  return (
    <div className="app">
      <header>
        <img src={logoImg} alt="Metrópole" />
        <ol>{STEPS.map((s, i) => <li key={s} className={step === i + 1 ? 'on' : step > i + 1 ? 'done' : ''}><span>{i + 1}</span><em>{s}</em></li>)}</ol>
      </header>

      {step === 1 && (
        <section className="panel center">
          <h2>Qual é a modalidade do anúncio?</h2>
          <div className="choice">
            {[['venda', 'VENDA', 'Imóvel à venda'], ['locacao', 'LOCAÇÃO', 'Imóvel para alugar']].map(([v, t, s]) => (
              <button key={v} className={d.tipo === v ? 'on' : ''} onClick={() => { setD((o) => ({ ...o, tipo: v })); setStep(2) }}><b>{t}</b><span>{s}</span></button>
            ))}
          </div>
        </section>
      )}

      {(step === 2 || step === 3) && (
        <div className="work">
          <section className="panel">
            {step === 2 ? (
              <>
                <h2>Dados do imóvel — {d.tipo === 'venda' ? 'Venda' : 'Locação'}</h2>
                <div className="grid">
                  {f('Título do anúncio', 'titulo', { wide: 1, ph: 'Ex.: Apartamento com vista livre' })}
                  {f('Tipo de imóvel', 'tipoImovel', { ph: 'Apartamento, Casa…' })}
                  {f(d.tipo === 'venda' ? 'Valor de venda' : 'Valor do aluguel (mensal)', 'valor', { ph: '850000' })}
                  {f('Bairro', 'bairro')}{f('Cidade', 'cidade')}
                  {f('Condomínio', 'condominio')}{f('IPTU', 'iptu')}
                  {f('Área (m²)', 'area')}{f('Quartos', 'quartos', { type: 'number' })}
                  {f('Suítes', 'suites', { type: 'number' })}{f('Banheiros', 'banheiros', { type: 'number' })}
                  {f('Vagas', 'vagas', { type: 'number' })}
                  {f('Diferenciais (separe por vírgula)', 'diferenciais', { wide: 1, area: 1, ph: 'Varanda gourmet, Piscina, Vista livre…' })}
                </div>
                <h3>Corretor <small>(salvo neste navegador)</small></h3>
                <div className="grid">{f('Nome', 'corretor', { wide: 1 })}{f('Telefone', 'telefone', { ph: '(21) 99999-9999' })}{f('CRECI', 'creci')}</div>
              </>
            ) : (
              <>
                <h2>Fotografias</h2>
                <p className="hint">Envie até 4 fotos. Ajuste o enquadramento de cada uma; o resultado aparece ao lado.</p>
                <Photos fotos={fotos} setFotos={setFotos} />
              </>
            )}
            <div className="nav">
              <button className="btn ghost" onClick={() => setStep(step - 1)}>Voltar</button>
              <button className="btn red" disabled={step === 3 && !hasMain} onClick={() => setStep(step + 1)}>{step === 3 ? (hasMain ? 'Ver pré-visualização' : 'Envie a foto 1') : 'Continuar'}</button>
            </div>
          </section>
          {side}
        </div>
      )}

      {(step === 4 || step === 5) && (
        <section className="panel wide">
          <h2>{step === 4 ? 'Pré-visualização' : 'Exportação'}</h2>
          <div className="previews">
            <figure><Preview d={d} fotos={fotos} fmt="vertical" A={A} tick={tick} /><figcaption>Vertical 1080 × 1920</figcaption></figure>
            <figure><Preview d={d} fotos={fotos} fmt="square" A={A} tick={tick} /><figcaption>Quadrado 1080 × 1080</figcaption></figure>
          </div>
          {step === 4 ? (
            <div className="nav">
              <button className="btn ghost" onClick={() => setStep(3)}>Voltar à edição</button>
              <button className="btn ghost" onClick={() => setTick((t) => t + 1)}>Gerar novamente</button>
              <button className="btn red" onClick={() => setStep(5)}>Ir para exportação</button>
            </div>
          ) : (
            <>
              <div className="nav">
                <button className="btn navy" disabled={busy} onClick={() => dl(['vertical'])}>BAIXAR ARTE VERTICAL</button>
                <button className="btn navy" disabled={busy} onClick={() => dl(['square'])}>BAIXAR ARTE QUADRADA</button>
                <button className="btn red" disabled={busy} onClick={() => dl(['vertical', 'square'])}>BAIXAR AS DUAS VERSÕES</button>
              </div>
              <div className="nav"><button className="btn ghost" onClick={() => setStep(4)}>Voltar</button><button className="btn ghost" onClick={reset}>Criar nova arte</button></div>
            </>
          )}
        </section>
      )}
    </div>
  )
}
