import { ChangeEvent, DragEvent, useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Download, FileImage, FileOutput, Files, ImageDown, LockKeyhole, Menu, Moon, Printer, RefreshCw, RotateCcw, Scissors, ShieldCheck, Sparkles, Sun, Type, Upload, X, Zap } from 'lucide-react'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'
import { degrees, PDFDocument, rgb } from 'pdf-lib'
import { getDocument, GlobalWorkerOptions, type PDFDocumentProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

type ToolId = 'dark-pdf' | 'merge' | 'compress' | 'image-pdf' | 'image-compress' | 'extract' | 'split' | 'pdf-image' | 'rotate' | 'watermark'
type PageId = 'privacy' | 'terms' | 'contact'

const tools: { id: ToolId; title: string; description: string; icon: typeof Moon; status?: string }[] = [
  { id: 'dark-pdf', title: 'Dark PDF to Light', description: 'Make dark lecture notes print-ready and use less ink.', icon: Moon },
  { id: 'merge', title: 'Merge PDFs', description: 'Combine chapters, assignments and test papers.', icon: Files },
  { id: 'compress', title: 'Compress PDF', description: 'Shrink documents for uploads and quick sharing.', icon: Zap },
  { id: 'image-pdf', title: 'Images to PDF', description: 'Turn scans, snapshots and handwritten notes into one PDF.', icon: FileImage },
  { id: 'image-compress', title: 'Compress Images', description: 'Reduce JPG, PNG, and WebP files to a target size.', icon: ImageDown },
  { id: 'extract', title: 'Extract Pages', description: 'Save only the pages you need from a large PDF.', icon: FileOutput },
  { id: 'split', title: 'Split PDF', description: 'Separate a PDF into smaller files by page range.', icon: Scissors },
  { id: 'pdf-image', title: 'PDF to Images', description: 'Export pages as high-quality JPG images.', icon: ImageDown },
  { id: 'rotate', title: 'Rotate PDF', description: 'Fix sideways pages before printing or sharing.', icon: RotateCcw },
  { id: 'watermark', title: 'Watermark PDF', description: 'Add a light ownership or draft label to every page.', icon: Type },
]

const appBase = import.meta.env.BASE_URL.replace(/\/$/, '')
const appPath = (path: string) => `${appBase}${path.startsWith('/') ? path : `/${path}`}` || '/'

function App() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null)
  const [activePage, setActivePage] = useState<PageId | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const path = window.location.pathname.startsWith(appBase) ? window.location.pathname.slice(appBase.length) || '/' : window.location.pathname
    if (path.startsWith('/tools/')) {
      const slug = path.split('/').pop()
      const match = tools.find((tool) => tool.id === slug)
      setActiveTool(match?.id ?? 'dark-pdf')
    } else if (path === '/privacy' || path === '/terms' || path === '/contact') {
      setActivePage(path.slice(1) as PageId)
    }
  }, [])

  useEffect(() => {
    const tool = activeTool ? tools.find((item) => item.id === activeTool) : null
    const pageTitle = activePage === 'privacy' ? 'Privacy Policy' : activePage === 'terms' ? 'Terms of Use' : activePage === 'contact' ? 'Contact PrintMyNotes' : ''
    document.title = tool ? `${tool.title} — Free, private PDF tool | PrintMyNotes` : pageTitle ? `${pageTitle} | PrintMyNotes` : 'PrintMyNotes — Private PDF tools for students'
    const description = tool ? `${tool.description} Process your files locally in your browser with PrintMyNotes.` : pageTitle ? `${pageTitle} for PrintMyNotes, a private browser-based PDF toolkit.` : 'Free private PDF tools for students: convert dark PDFs, merge, split, compress, and convert images without uploading files.'
    const meta = document.querySelector('meta[name="description"]')
    meta?.setAttribute('content', description)
  }, [activeTool, activePage])

  const openTool = (id: ToolId) => {
    setActiveTool(id)
    setActivePage(null)
    window.history.pushState({}, '', appPath(`/tools/${id}`))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMobileOpen(false)
  }

  const openPage = (page: PageId) => {
    setActivePage(page)
    setActiveTool(null)
    window.history.pushState({}, '', appPath(`/${page}`))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMobileOpen(false)
  }

  const goHome = () => {
    setActiveTool(null)
    setActivePage(null)
    window.history.pushState({}, '', appPath('/'))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setMobileOpen(false)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={goHome} aria-label="PrintMyNotes home">
          <span className="brand-mark"><Printer size={18} strokeWidth={2.7} /></span>
          <span>Print<span className="brand-accent">My</span>Notes</span>
        </button>
        <nav className={mobileOpen ? 'main-nav is-open' : 'main-nav'}>
          <button onClick={goHome}>Home</button>
          <button onClick={() => openTool('dark-pdf')}>Dark PDF tool</button>
          <button onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}>All tools</button>
          <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>FAQ</button>
        </nav>
        <button className="mobile-menu" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <button className="header-cta" onClick={() => openTool('dark-pdf')}>Try it free <ArrowRight size={16} /></button>
      </header>

      {activePage ? (
        <InfoPage page={activePage} onBack={goHome} />
      ) : activeTool ? (
        <ToolPage activeTool={activeTool} onBack={goHome} onSelect={openTool} />
      ) : (
        <Home onSelect={openTool} />
      )}

      <footer className="site-footer">
        <div className="footer-top">
          <button className="brand footer-brand" onClick={goHome}>
            <span className="brand-mark"><Printer size={18} strokeWidth={2.7} /></span>
            <span>Print<span className="brand-accent">My</span>Notes</span>
          </button>
          <p>Less ink. More learning. Built for the way students actually study.</p>
          <div className="footer-links"><button className="footer-link-button" onClick={() => openPage('privacy')}>Privacy</button><button className="footer-link-button" onClick={() => openPage('terms')}>Terms</button><button className="footer-link-button" onClick={() => openPage('contact')}>Contact</button></div>
        </div>
        <div className="footer-bottom"><span>© 2026 PrintMyNotes</span><span>Made with love by prtm · Files stay on your device</span></div>
      </footer>
    </div>
  )
}

function InfoPage({ page, onBack }: { page: PageId; onBack: () => void }) {
  const content = page === 'privacy' ? { label: 'LEGAL', title: 'Privacy that is easy to understand.', intro: 'PrintMyNotes is designed so document processing happens in your browser, not on our servers.', sections: [['Local processing', 'When you use the PDF tools, your selected files are read and processed in your browser. We do not receive, store, or inspect your PDF contents.'], ['Analytics and advertising', 'If analytics or advertising are enabled after launch, they will be limited to site performance and aggregate usage. We will not send filenames, page images, extracted text, or document contents to analytics providers. Where consent is required, the site will provide a choice and a way to revisit that choice.'], ['Your choices', 'You can close the tab at any time. Any in-memory document data and generated files remain on your device and can be removed by closing the page or clearing browser data.']] } : page === 'terms' ? { label: 'LEGAL', title: 'Simple terms for a free tool.', intro: 'Use PrintMyNotes for lawful personal, academic, and professional document work. You keep ownership of your files.', sections: [['Your responsibility', 'Check the downloaded output before printing, submitting, or sharing it. Browser support, large files, fonts, and complex PDFs can produce different results across devices.'], ['No warranty', 'The service is provided as-is. We work to make it reliable, but cannot guarantee that every PDF will convert perfectly or that the service will always be available.'], ['Acceptable use', 'Do not use the service to infringe copyright, evade security controls, process unlawful material, or attack the site.']] } : { label: 'CONTACT', title: 'Tell us what would make studying easier.', intro: 'We are building PrintMyNotes with students. Share a broken file type, a confusing step, or a tool you wish existed.', sections: [['Before launch', 'The public support address will be added after the production domain is selected. For now, keep a short list of example files and device/browser details when reporting a problem.'], ['What to include', 'Tell us which tool you used, your device and browser, approximate file size, and the step that failed. Never send private documents unless you have removed sensitive information.'], ['Roadmap', 'The next priorities are merge, split, compression, image conversion, page export, rotation, watermarking, print layouts, and an installable Android experience.']] }
  return <main className="info-page section-pad"><button className="back-link" onClick={onBack}>← Back to home</button><article className="info-card"><div className="section-kicker">{content.label}</div><h1>{content.title}</h1><p className="info-intro">{content.intro}</p>{content.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}</article></main>
}

function Home({ onSelect }: { onSelect: (id: ToolId) => void }) {
  return (
    <main>
      <section className="hero section-pad">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> Built for students who print</div>
          <h1>Print smarter.<br /><em>Study longer.</em></h1>
          <p className="hero-lead">Turn dark PDFs into clean, ink-saving notes in seconds. Free tools that work in your browser, without uploading a single file.</p>
          <div className="hero-actions"><button className="button button-primary" onClick={() => onSelect('dark-pdf')}>Convert a PDF <ArrowRight size={17} /></button><button className="text-button" onClick={() => document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' })}>Explore all tools <span>↓</span></button></div>
          <div className="trust-row"><span><ShieldCheck size={16} /> 100% private</span><span><Zap size={16} /> No sign-up</span><span><Check size={16} /> Free forever</span></div>
        </div>
        <div className="hero-visual">
          <div className="paper-shadow shadow-one" /><div className="paper-shadow shadow-two" />
          <div className="note-card dark-note"><div className="note-toolbar"><span /><span /><span /><small>chapter-04.pdf</small></div><div className="fake-formula">∫ f(x) dx = F(x) + C</div><div className="fake-lines"><i /><i /><i /><i /></div><div className="fake-diagram"><span className="axis-x" /><span className="axis-y" /><span className="curve" /></div></div>
          <div className="convert-badge"><span className="badge-icon"><Sun size={19} /></span><span><strong>Print-ready</strong><small>Uses up to 60% less ink</small></span></div>
          <div className="note-card light-note"><div className="note-toolbar"><span /><span /><span /><small>chapter-04-light.pdf</small></div><div className="light-formula">F = ma</div><div className="light-lines"><i /><i /><i /><i /><i /></div></div>
        </div>
      </section>

      <section className="stats-strip"><div><strong>0 bytes</strong><span>uploaded to our servers</span></div><div><strong>60%</strong><span>less ink on dark notes</span></div><div><strong>2 min</strong><span>saved per chapter</span></div><div><strong>5 tools</strong><span>for everyday study work</span></div></section>

      <section className="section-pad intro-section"><div className="section-kicker">WHY PRINTMYNOTES</div><h2>Your notes deserve better than<br /><span>a black rectangle on paper.</span></h2><p className="section-intro">We make the small, annoying parts of studying feel effortless — so you can spend your time learning, not wrestling with files.</p><div className="feature-grid"><Feature icon={<LockKeyhole />} title="Private by design" text="Your PDFs are processed locally in your browser. They are never sent, stored, or read by us." /><Feature icon={<Sparkles />} title="Made for real notes" text="Built for dark coaching slides, formula-heavy PDFs, handwritten scans, and everyday exam prep." /><Feature icon={<RefreshCw />} title="Simple every time" text="Drop a file, choose your output, download. No account, watermark, or confusing settings." /></div></section>

      <section className="tools-section section-pad" id="tools"><div className="section-kicker">THE TOOLKIT</div><div className="section-heading"><div><h2>Everything you need to<br /><span>get notes on paper.</span></h2></div><p>One calm workspace for the busy work around studying.</p></div><div className="tool-grid">{tools.map((tool) => <ToolCard key={tool.id} tool={tool} onSelect={onSelect} />)}</div></section>

      <section className="privacy-banner section-pad"><div className="privacy-icon"><ShieldCheck /></div><div><div className="section-kicker">YOUR FILES ARE YOURS</div><h2>Private from the first click.</h2><p>Everything happens inside your browser using local processing. Close the tab and your files are gone — because they never came to us.</p></div><button className="button button-light" onClick={() => onSelect('dark-pdf')}>See it in action <ArrowRight size={17} /></button></section>

      <section className="faq-section section-pad" id="faq"><div className="section-kicker">GOOD TO KNOW</div><h2>Questions, answered.</h2><div className="faq-list"><Faq q="Will my file be uploaded?" a="No. PrintMyNotes processes files locally in your browser. Your document contents never leave your device." /><Faq q="Does the dark PDF converter work on scanned notes?" a="Yes, as long as the scanned pages are inside a PDF. The converter works on what the page looks like, so it is useful for slides, scans, and image-based notes." /><Faq q="Is PrintMyNotes really free?" a="Yes. The core tools are free with no registration and no watermark. We may use carefully placed advertising to keep the service running." /><Faq q="What devices can I use?" a="Any modern phone, tablet, or computer with an up-to-date browser. For large PDFs, a laptop or desktop will be faster." /></div></section>
      <section className="final-cta section-pad"><div><div className="eyebrow"><span className="eyebrow-dot" /> Your next chapter starts here</div><h2>Make printing the<br /><em>easy part.</em></h2></div><button className="button button-primary" onClick={() => onSelect('dark-pdf')}>Convert my first PDF <ArrowRight size={17} /></button></section>
    </main>
  )
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <article className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article> }

function ToolCard({ tool, onSelect }: { tool: (typeof tools)[number]; onSelect: (id: ToolId) => void }) {
  const Icon = tool.icon
  return <button className={`tool-card ${tool.id === 'dark-pdf' ? 'is-featured' : ''}`} onClick={() => onSelect(tool.id)}><div className="tool-card-top"><div className="tool-icon"><Icon size={22} /></div>{tool.status ? <span className="tool-status">{tool.status}</span> : <ArrowRight size={20} className="tool-arrow" />}</div><h3>{tool.title}</h3><p>{tool.description}</p><span className="tool-link">{tool.status ? 'Get notified' : 'Open tool'} <ArrowRight size={14} /></span></button>
}

function Faq({ q, a }: { q: string; a: string }) { const [open, setOpen] = useState(false); return <div className={`faq-item ${open ? 'is-open' : ''}`}><button onClick={() => setOpen(!open)}><span>{q}</span><ChevronDown size={19} /></button>{open && <p>{a}</p>}</div> }

function ToolPage({ activeTool, onBack, onSelect }: { activeTool: ToolId; onBack: () => void; onSelect: (id: ToolId) => void }) {
  const tool = tools.find((item) => item.id === activeTool) ?? tools[0]
  const toolView = activeTool === 'dark-pdf' ? <PrintStudio /> : activeTool === 'merge' ? <MergeTool /> : activeTool === 'compress' ? <CompressTool /> : activeTool === 'image-pdf' ? <ImagePdfTool /> : activeTool === 'image-compress' ? <ImageCompressTool /> : activeTool === 'extract' ? <ExtractTool split={false} /> : activeTool === 'split' ? <ExtractTool split /> : activeTool === 'pdf-image' ? <PdfImageTool /> : activeTool === 'rotate' ? <RotateTool /> : <WatermarkTool />
  return <main className="tool-page section-pad"><button className="back-link" onClick={onBack}>← Back to home</button><div className="tool-page-header"><div><div className="section-kicker">PRINTMYNOTES TOOL</div><h1>{tool.title}</h1><p>{tool.description} <span className="privacy-inline"><ShieldCheck size={14} /> Local processing</span></p></div></div>{toolView}</main>
}

function DarkPdfConverter() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [threshold, setThreshold] = useState(18)
  const [previewUrl, setPreviewUrl] = useState('')
  const [pageCount, setPageCount] = useState(0)

  const loadFile = async (nextFile: File) => {
    if (nextFile.type !== 'application/pdf') { setError('Please choose a PDF file.'); return }
    setError(''); setLoading(true); setFile(nextFile)
    try {
      const bytes = await nextFile.arrayBuffer()
      const loadedPdf = await getDocument({ data: bytes }).promise
      setPdf(loadedPdf); setPageCount(loadedPdf.numPages)
      const page = await loadedPdf.getPage(1)
      const viewport = page.getViewport({ scale: 1.15 })
      const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
      setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85))
    } catch { setError('This PDF could not be opened. Try exporting it again from your notes app.'); setFile(null); setPdf(null) }
    finally { setLoading(false) }
  }

  const onInput = (event: ChangeEvent<HTMLInputElement>) => { const selected = event.target.files?.[0]; if (selected) void loadFile(selected) }
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); const dropped = event.dataTransfer.files?.[0]; if (dropped) void loadFile(dropped) }

  const download = async () => {
    if (!pdf || !file) return
    setLoading(true); setError('')
    try {
      let output: jsPDF | null = null
      for (let index = 1; index <= pdf.numPages; index += 1) {
        const page = await pdf.getPage(index); const viewport = page.getViewport({ scale: 1.45 })
        const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height
        const context = canvas.getContext('2d', { willReadFrequently: true })!
        await page.render({ canvasContext: context, viewport }).promise
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
        for (let i = 0; i < pixels.data.length; i += 4) {
          const luminance = 0.299 * pixels.data[i] + 0.587 * pixels.data[i + 1] + 0.114 * pixels.data[i + 2]
          const ink = Math.max(0, Math.min(255, ((255 - luminance - threshold) / (255 - threshold)) * 255))
          pixels.data[i] = 255 - ink; pixels.data[i + 1] = 255 - ink; pixels.data[i + 2] = 255 - ink
        }
        context.putImageData(pixels, 0, 0)
        const orientation = viewport.width > viewport.height ? 'landscape' : 'portrait'
        if (!output) output = new jsPDF({ orientation, unit: 'pt', format: [viewport.width, viewport.height] })
        else output.addPage([viewport.width, viewport.height], orientation)
        output.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, viewport.width, viewport.height)
      }
      output?.save(`${file.name.replace(/\.pdf$/i, '')}-print-ready.pdf`)
    } catch { setError('Something went wrong while creating the PDF. Please try a smaller file.'); }
    finally { setLoading(false) }
  }

  return <div className="converter-shell"><div className="converter-main"><div className="converter-intro"><span className="step-pill">01 <span>Upload your dark PDF</span></span><h2>Give your notes a lighter side.</h2><p>We’ll turn dark backgrounds white and preserve the formulas, diagrams, and text you need.</p></div>{!file ? <div className="dropzone" onDragOver={(event) => event.preventDefault()} onDrop={onDrop} onClick={() => inputRef.current?.click()}><input ref={inputRef} type="file" accept="application/pdf" onChange={onInput} hidden /><div className="upload-icon"><Upload size={23} /></div><h3>{loading ? 'Opening your PDF…' : 'Drop your PDF here'}</h3><p>or <span>browse files</span> from your device</p><small>PDF only · Your file stays in this browser</small></div> : <div className="preview-area"><div className="preview-toolbar"><div><strong>{file.name}</strong><span>{pageCount} {pageCount === 1 ? 'page' : 'pages'} · Ready to convert</span></div><button onClick={() => { setFile(null); setPdf(null); setPreviewUrl('') }} aria-label="Remove file"><X size={18} /></button></div><div className="preview-stage"><div className="preview-label original-label">ORIGINAL</div><img src={previewUrl} alt="First page preview" /><div className="preview-label result-label">PRINT-READY PREVIEW</div><div className="preview-result"><img src={previewUrl} alt="First page converted preview" style={{ filter: `invert(1) contrast(${1 + threshold / 100})` }} /></div></div></div>}{error && <p className="error-message">{error}</p>}</div><aside className="converter-side"><div className="side-step"><span className="step-pill">02 <span>Fine-tune</span></span><h3>Clean-up level</h3><p>Adjust how aggressively dark tones become white.</p><input type="range" min="0" max="60" value={threshold} onChange={(event) => setThreshold(Number(event.target.value))} /><div className="range-labels"><span>Keep detail</span><span>Whiter page</span></div></div><div className="side-step"><span className="step-pill">03 <span>Download</span></span><div className="download-card"><div className="download-card-icon"><Download size={19} /></div><div><strong>Your lighter PDF</strong><span>Ready to print and share</span></div></div><button className="button button-primary full-button" onClick={() => void download()} disabled={!pdf || loading}>{loading ? 'Preparing pages…' : 'Convert & download'} <Download size={16} /></button></div><div className="side-note"><ShieldCheck size={17} /><span>Nothing is uploaded. Processing happens on your device.</span></div></aside></div>
}

type PrintMode = 'clean' | 'grayscale' | 'invert' | 'force-white'
type PrintLayout = 1 | 2 | 4 | 6 | 8
type SheetOrientation = 'portrait' | 'landscape'
type ExportFormat = 'pdf' | 'jpg'
type ExportQuality = 'high' | 'medium' | 'low'
type PrintSettings = { mode: PrintMode; layout: PrintLayout; orientation: SheetOrientation; margin: number; spacing: number; border: boolean; pageNumbers: boolean; watermark: string; brightness: number; contrast: number; cleanup: number; format: ExportFormat; quality: ExportQuality }

const printDefaults: PrintSettings = { mode: 'force-white', layout: 1, orientation: 'portrait', margin: 24, spacing: 12, border: false, pageNumbers: false, watermark: '', brightness: 0, contrast: 1, cleanup: 145, format: 'pdf', quality: 'high' }

function PrintStudio() {
  const [file, setFile] = useState<File | null>(null); const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null); const [pageCount, setPageCount] = useState(0); const [pageRange, setPageRange] = useState(''); const [settings, setSettings] = useState<PrintSettings>(printDefaults); const [previewUrl, setPreviewUrl] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('')
  const updateSetting = <K extends keyof PrintSettings>(key: K, value: PrintSettings[K]) => setSettings((current) => ({ ...current, [key]: value }))
  const loadFile = async (nextFile: File) => { if (nextFile.type !== 'application/pdf') { setError('Please choose a PDF file.'); return } setLoading(true); setError(''); try { const loaded = await getDocument({ data: await nextFile.arrayBuffer() }).promise; setFile(nextFile); setPdf(loaded); setPageCount(loaded.numPages); setPageRange(`1-${loaded.numPages}`) } catch { setError('This PDF could not be opened. Try exporting it again from your notes app.') } finally { setLoading(false) } }
  useEffect(() => { let cancelled = false; if (!pdf) { setPreviewUrl(''); return } const renderPreview = async () => { try { const pages = parsePageSelection(pageRange || '1', pdf.numPages); const canvas = await buildPrintSheet(pdf, pages.slice(0, settings.layout), settings, true); if (!cancelled) setPreviewUrl(canvas.toDataURL('image/jpeg', .82)) } catch { if (!cancelled) setPreviewUrl('') } }; void renderPreview(); return () => { cancelled = true } }, [pdf, pageRange, settings])
  const exportDocument = async () => { if (!pdf || !file) return; setBusy(true); setError(''); try { const pages = parsePageSelection(pageRange || `1-${pdf.numPages}`, pdf.numPages); const sheets: HTMLCanvasElement[] = []; const grid = getSheetGrid(settings.layout, settings.orientation); for (let cursor = 0; cursor < pages.length; cursor += grid[0] * grid[1]) sheets.push(await buildPrintSheet(pdf, pages.slice(cursor, cursor + grid[0] * grid[1]), settings, false, cursor)); const quality = { high: .94, medium: .78, low: .58 }[settings.quality]; if (settings.format === 'jpg') { const zip = new JSZip(); sheets.forEach((sheet, index) => zip.file(`print-sheet-${String(index + 1).padStart(3, '0')}.jpg`, sheet.toDataURL('image/jpeg', quality).split(',')[1], { base64: true })); downloadBlob(await zip.generateAsync({ type: 'blob' }), `${file.name.replace(/\.pdf$/i, '')}-print-sheets.zip`) } else { const [width, height] = getSheetSize(settings.orientation); const output = new jsPDF({ orientation: settings.orientation, unit: 'pt', format: [width, height] }); sheets.forEach((sheet, index) => { if (index) output.addPage([width, height], settings.orientation); output.addImage(sheet.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, width, height) }); output.save(`${file.name.replace(/\.pdf$/i, '')}-a4-printable.pdf`) } } catch { setError('Check the page range and try a smaller quality setting or fewer pages.') } finally { setBusy(false) } }
  return <div className="converter-shell print-studio"><div className="converter-main"><div className="converter-intro"><span className="step-pill">01 <span>Upload and preview</span></span><h2>Make every page worth printing.</h2><p>Build an A4 print sheet from your class notes. Everything below stays in this browser.</p></div>{!file ? <div className="dropzone studio-dropzone"><div className="upload-icon"><Upload size={23} /></div><h3>{loading ? 'Opening your PDF…' : 'Drop your class notes here'}</h3><p>or <FilePicker accept="application/pdf" label="browse files" onChange={(picked) => { if (picked[0]) void loadFile(picked[0]) }} /></p><small>PDF only · No upload · Works on phone and desktop</small></div> : <><div className="studio-filebar"><div><strong>{file.name}</strong><span>{pageCount} pages · {formatBytes(file.size)}</span></div><button className="mini-button" onClick={() => { setFile(null); setPdf(null); setPreviewUrl('') }} aria-label="Choose another PDF"><X size={17} /></button></div><div className="studio-preview"><div className="preview-label">LIVE A4 PREVIEW</div>{previewUrl ? <img src={previewUrl} alt="Live print layout preview" /> : <div className="preview-loading">{loading ? 'Rendering preview…' : 'Set options to preview'}</div>}</div><div className="studio-tip"><Sparkles size={16} /><span>For dark coaching slides, start with <strong>Force white background</strong>, 2 slides per page, and medium quality.</span></div></>}</div><aside className="converter-side studio-controls"><span className="step-pill">02 <span>Print settings</span></span><ControlGroup label="Page range"><input className="text-field compact-field" value={pageRange} onChange={(event) => setPageRange(event.target.value)} placeholder={`1-${pageCount || 10}`} /><small className="field-help">Examples: <code>1-8</code> or <code>1, 3-5, 9</code></small></ControlGroup><ControlGroup label="Clean-up mode"><div className="control-grid">{([['force-white', 'White background'], ['grayscale', 'Greyscale'], ['invert', 'Invert colours'], ['clean', 'Keep colour']] as const).map(([value, label]) => <button key={value} className={`option-button ${settings.mode === value ? 'selected' : ''}`} onClick={() => updateSetting('mode', value)}>{label}</button>)}</div></ControlGroup><ControlGroup label="Slides per A4 page"><div className="control-grid layout-grid">{([1, 2, 4, 6, 8] as const).map((value) => <button key={value} className={`option-button ${settings.layout === value ? 'selected' : ''}`} onClick={() => updateSetting('layout', value)}>{value === 1 ? '1 slide' : `${value} slides`}</button>)}</div></ControlGroup><ControlGroup label="Paper"><div className="control-grid"><button className={`option-button ${settings.orientation === 'portrait' ? 'selected' : ''}`} onClick={() => updateSetting('orientation', 'portrait')}>A4 portrait</button><button className={`option-button ${settings.orientation === 'landscape' ? 'selected' : ''}`} onClick={() => updateSetting('orientation', 'landscape')}>A4 landscape</button></div></ControlGroup><ControlGroup label="Margins and spacing"><div className="range-control"><span>Margin <strong>{settings.margin} pt</strong></span><input type="range" min="0" max="60" value={settings.margin} onChange={(event) => updateSetting('margin', Number(event.target.value))} /></div><div className="range-control"><span>Between slides <strong>{settings.spacing} pt</strong></span><input type="range" min="0" max="36" value={settings.spacing} onChange={(event) => updateSetting('spacing', Number(event.target.value))} /></div></ControlGroup><ControlGroup label="Colour adjustment"><div className="range-control"><span>Brightness <strong>{settings.brightness}</strong></span><input type="range" min="-60" max="60" value={settings.brightness} onChange={(event) => updateSetting('brightness', Number(event.target.value))} /></div><div className="range-control"><span>Contrast <strong>{settings.contrast.toFixed(1)}×</strong></span><input type="range" min="0.6" max="1.8" step="0.1" value={settings.contrast} onChange={(event) => updateSetting('contrast', Number(event.target.value))} /></div><div className="range-control"><span>Background cleanup <strong>{settings.cleanup}</strong></span><input type="range" min="60" max="230" value={settings.cleanup} onChange={(event) => updateSetting('cleanup', Number(event.target.value))} /></div></ControlGroup><ControlGroup label="Finishing"><label className="check-row"><input type="checkbox" checked={settings.border} onChange={(event) => updateSetting('border', event.target.checked)} /> Add page borders</label><label className="check-row"><input type="checkbox" checked={settings.pageNumbers} onChange={(event) => updateSetting('pageNumbers', event.target.checked)} /> Add source page numbers</label><input className="text-field compact-field" value={settings.watermark} maxLength={32} onChange={(event) => updateSetting('watermark', event.target.value)} placeholder="Optional watermark text" /></ControlGroup><ControlGroup label="Export"><div className="control-grid"><button className={`option-button ${settings.format === 'pdf' ? 'selected' : ''}`} onClick={() => updateSetting('format', 'pdf')}>PDF A4</button><button className={`option-button ${settings.format === 'jpg' ? 'selected' : ''}`} onClick={() => updateSetting('format', 'jpg')}>JPG ZIP</button></div><div className="control-grid quality-grid-small">{(['high', 'medium', 'low'] as const).map((value) => <button key={value} className={`option-button ${settings.quality === value ? 'selected' : ''}`} onClick={() => updateSetting('quality', value)}>{value}</button>)}</div></ControlGroup><button className="button button-primary full-button" disabled={!pdf || busy} onClick={() => void exportDocument()}>{busy ? 'Preparing print sheets…' : 'Export printable notes'} <Download size={16} /></button><div className="side-note studio-note"><ShieldCheck size={17} /><span>We do not automatically strip embedded ownership watermarks. Only edit documents you have permission to modify.</span></div>{error && <p className="error-message">{error}</p>}</aside></div>
}

function ControlGroup({ label, children }: { label: string; children: React.ReactNode }) { return <div className="control-group"><label>{label}</label>{children}</div> }
function getSheetSize(orientation: SheetOrientation): [number, number] { return orientation === 'portrait' ? [595.28, 841.89] : [841.89, 595.28] }
function getSheetGrid(layout: PrintLayout, orientation: SheetOrientation): [number, number] { if (layout === 1) return [1, 1]; if (layout === 2) return orientation === 'portrait' ? [1, 2] : [2, 1]; if (layout === 4) return [2, 2]; if (layout === 6) return orientation === 'portrait' ? [2, 3] : [3, 2]; return orientation === 'portrait' ? [2, 4] : [4, 2] }
async function buildPrintSheet(pdf: PDFDocumentProxy, pageIndexes: number[], settings: PrintSettings, preview = false, _pageOffset = 0) { const [sheetWidth, sheetHeight] = getSheetSize(settings.orientation); const qualityScale = settings.quality === 'high' ? 1.65 : settings.quality === 'medium' ? 1.3 : 1; const canvas = document.createElement('canvas'); const outputScale = preview ? 1 : qualityScale; canvas.width = Math.round(sheetWidth * outputScale); canvas.height = Math.round(sheetHeight * outputScale); const context = canvas.getContext('2d')!; context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height); context.scale(outputScale, outputScale); const [columns, rows] = getSheetGrid(settings.layout, settings.orientation); const innerWidth = sheetWidth - settings.margin * 2; const innerHeight = sheetHeight - settings.margin * 2; const cellWidth = (innerWidth - settings.spacing * (columns - 1)) / columns; const cellHeight = (innerHeight - settings.spacing * (rows - 1)) / rows; for (let slot = 0; slot < pageIndexes.length; slot += 1) { const source = await renderStudentPage(pdf, pageIndexes[slot], settings, qualityScale); const ratio = Math.min(cellWidth / source.width, cellHeight / source.height); const width = source.width * ratio; const height = source.height * ratio; const column = slot % columns; const row = Math.floor(slot / columns); const x = settings.margin + column * (cellWidth + settings.spacing) + (cellWidth - width) / 2; const y = settings.margin + row * (cellHeight + settings.spacing) + (cellHeight - height) / 2; context.drawImage(source, x, y, width, height); if (settings.border) { context.strokeStyle = '#aab7aa'; context.lineWidth = .7; context.strokeRect(settings.margin + column * (cellWidth + settings.spacing), settings.margin + row * (cellHeight + settings.spacing), cellWidth, cellHeight) } if (settings.pageNumbers) { context.fillStyle = '#53645b'; context.font = '9px Arial'; context.fillText(`Page ${pageIndexes[slot] + 1}`, x + 3, y + height - 4) } } if (settings.watermark.trim()) { context.save(); context.fillStyle = 'rgba(60, 78, 67, .18)'; context.font = 'bold 26px Arial'; context.textAlign = 'center'; context.fillText(settings.watermark.trim(), sheetWidth / 2, sheetHeight / 2); context.restore() } return canvas }
async function renderStudentPage(pdf: PDFDocumentProxy, pageIndex: number, settings: PrintSettings, scale: number) { const page = await pdf.getPage(pageIndex + 1); const viewport = page.getViewport({ scale }); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(viewport.width)); canvas.height = Math.max(1, Math.round(viewport.height)); const context = canvas.getContext('2d', { willReadFrequently: true })!; await page.render({ canvasContext: context, viewport }).promise; const pixels = context.getImageData(0, 0, canvas.width, canvas.height); for (let i = 0; i < pixels.data.length; i += 4) { let red = pixels.data[i]; let green = pixels.data[i + 1]; let blue = pixels.data[i + 2]; const adjust = (value: number) => Math.max(0, Math.min(255, (value - 128) * settings.contrast + 128 + settings.brightness)); red = adjust(red); green = adjust(green); blue = adjust(blue); const luminance = .299 * red + .587 * green + .114 * blue; if (settings.mode === 'grayscale') { red = luminance; green = luminance; blue = luminance } else if (settings.mode === 'invert') { red = 255 - red; green = 255 - green; blue = 255 - blue } else if (settings.mode === 'force-white') { const ink = 255 - luminance; const white = ink >= settings.cleanup ? 255 : 0; red = white; green = white; blue = white } pixels.data[i] = red; pixels.data[i + 1] = green; pixels.data[i + 2] = blue } context.putImageData(pixels, 0, 0); return canvas }

function FilePicker({ accept, multiple = false, onChange, label = 'Choose files' }: { accept: string; multiple?: boolean; onChange: (files: File[]) => void; label?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  return <><input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden onChange={(event) => { onChange(Array.from(event.target.files ?? [])); event.currentTarget.value = '' }} /><button className="button button-primary" onClick={() => inputRef.current?.click()}><Upload size={16} /> {label}</button></>
}

function ToolWorkspace({ title, description, children, action, disabled = false, error = '' }: { title: string; description: string; children: React.ReactNode; action?: React.ReactNode; disabled?: boolean; error?: string }) {
  return <div className="converter-shell utility-shell"><div className="converter-main"><div className="converter-intro"><span className="step-pill">01 <span>Choose your files</span></span><h2>{title}</h2><p>{description}</p></div>{children}{error && <p className="error-message">{error}</p>}</div><aside className="converter-side"><div className="side-step"><span className="step-pill">02 <span>Privacy check</span></span><h3>Local by default</h3><p>Your files are read by this browser and are not uploaded to a server.</p><div className="side-note"><ShieldCheck size={17} /><span>Close the tab and your document data is gone.</span></div></div><div className="side-step"><span className="step-pill">03 <span>Finish</span></span>{action ?? <div className="side-note"><Check size={17} /><span>Choose files to enable the download button.</span></div>}</div></aside></div>
}

function FileList({ files, onRemove, onMove }: { files: File[]; onRemove: (index: number) => void; onMove?: (index: number, direction: -1 | 1) => void }) {
  return <div className="file-list">{files.map((file, index) => <div className="file-row" key={`${file.name}-${file.lastModified}-${index}`}><div className="file-row-icon"><FileOutput size={16} /></div><div className="file-row-info"><strong>{file.name}</strong><span>{formatBytes(file.size)}</span></div>{onMove && <div className="file-order"><button className="mini-button" disabled={index === 0} onClick={() => onMove(index, -1)} aria-label="Move file up">↑</button><button className="mini-button" disabled={index === files.length - 1} onClick={() => onMove(index, 1)} aria-label="Move file down">↓</button></div>}<button className="mini-button remove-file" onClick={() => onRemove(index)} aria-label={`Remove ${file.name}`}><X size={15} /></button></div>)}</div>
}

function MergeTool() {
  const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const merge = async () => { if (files.length < 2) return; setBusy(true); setError(''); try { const output = await PDFDocument.create(); for (const file of files) { const source = await PDFDocument.load(await file.arrayBuffer()); const pages = await output.copyPages(source, source.getPageIndices()); pages.forEach((page) => output.addPage(page)) } downloadBlob(new Blob([await output.save()], { type: 'application/pdf' }), 'printmynotes-merged.pdf') } catch { setError('One of these PDFs could not be read. Remove it and try exporting it again.') } finally { setBusy(false) } }
  return <ToolWorkspace title="Put every chapter in order." description="Add two or more PDFs, arrange them, and download one clean document." error={error} action={<button className="button button-primary full-button" disabled={files.length < 2 || busy} onClick={() => void merge()}>{busy ? 'Merging…' : 'Merge & download'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="application/pdf" multiple label="Add PDF files" onChange={(picked) => setFiles((current) => [...current, ...picked])} /><span>{files.length ? `${files.length} files selected` : 'Select at least 2 PDFs'}</span></div>{files.length ? <FileList files={files} onRemove={(index) => setFiles(files.filter((_, item) => item !== index))} onMove={(index, direction) => { const next = [...files]; const target = index + direction; [next[index], next[target]] = [next[target], next[index]]; setFiles(next) }} /> : <div className="empty-utility"><Files size={24} /><p>Your PDFs will appear here in the order they’ll be merged.</p></div>}</ToolWorkspace>
}

function CompressTool() {
  const [file, setFile] = useState<File | null>(null); const [quality, setQuality] = useState<'small' | 'balanced' | 'quality'>('balanced'); const [targetKB, setTargetKB] = useState(''); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(''); const [error, setError] = useState('')
  const compress = async () => { if (!file) return; setBusy(true); setError(''); setProgress('Reading pages…'); try { const settings = { small: { scale: .72, jpeg: .58 }, balanced: { scale: 1, jpeg: .74 }, quality: { scale: 1.3, jpeg: .88 } }[quality]; const requested = Number(targetKB); const output = requested > 0 ? await compressPdfToTarget(file, requested * 1024, Math.min(settings.scale, 1.25), setProgress) : await rasterizePdf(file, settings.scale, settings.jpeg); downloadBlob(output, `${file.name.replace(/\.pdf$/i, '')}-${requested > 0 ? `under-${requested}kb` : quality}.pdf`); setProgress(`Finished · ${formatBytes(output.size)}`) } catch { setError('This PDF could not be compressed in the browser. Try a smaller target or fewer pages.') } finally { setBusy(false) } }
  return <ToolWorkspace title="Make a smaller file." description="Choose a quality preset or enter a target size for an exam portal, email, or upload limit. Everything stays local." error={error} action={<button className="button button-primary full-button" disabled={!file || busy} onClick={() => void compress()}>{busy ? 'Compressing…' : 'Compress & download'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="application/pdf" label={file ? 'Replace PDF' : 'Choose a PDF'} onChange={(picked) => setFile(picked[0] ?? null)} />{file && <span>{file.name} · {formatBytes(file.size)}</span>}</div><label className="field-label" htmlFor="pdf-target-kb">Target file size (optional)</label><div className="target-row"><input id="pdf-target-kb" className="text-field" type="number" min="50" max="50000" value={targetKB} onChange={(event) => setTargetKB(event.target.value)} placeholder="Example: 500" /><span>KB</span></div><small className="field-help">The result will aim for this size. Complex pages may need a slightly larger target.</small><div className="quality-grid">{(['small', 'balanced', 'quality'] as const).map((preset) => <button key={preset} className={`quality-card ${quality === preset ? 'selected' : ''}`} onClick={() => setQuality(preset)}><strong>{preset === 'small' ? 'Smallest' : preset === 'balanced' ? 'Balanced' : 'Best quality'}</strong><span>{preset === 'small' ? 'Best for strict limits' : preset === 'balanced' ? 'Recommended for notes' : 'Keep more detail'}</span></button>)}</div>{progress && <p className="progress-message">{progress}</p>}</ToolWorkspace>
}

function ImageCompressTool() {
  const [files, setFiles] = useState<File[]>([]); const [targetKB, setTargetKB] = useState('300'); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(''); const [error, setError] = useState('')
  const compress = async () => { if (!files.length || Number(targetKB) < 10) return; setBusy(true); setError(''); try { const zip = files.length > 1 ? new JSZip() : null; for (const [index, file] of files.entries()) { setProgress(`Compressing ${index + 1} of ${files.length}…`); const blob = await compressImageToTarget(file, Number(targetKB) * 1024); const name = `${file.name.replace(/\.[^.]+$/, '')}-compressed.jpg`; if (zip) zip.file(name, blob); else downloadBlob(blob, name) } if (zip) downloadBlob(await zip.generateAsync({ type: 'blob' }), 'printmynotes-compressed-images.zip'); setProgress(`Finished · target ${targetKB} KB per image`) } catch { setError('One image could not be compressed. Try JPG, PNG, or WebP files.') } finally { setBusy(false) } }
  return <ToolWorkspace title="Shrink images to a known size." description="Enter the approximate maximum size needed for an upload, form, or message. PNG and WebP files export as JPG for reliable size control." error={error} action={<button className="button button-primary full-button" disabled={!files.length || busy} onClick={() => void compress()}>{busy ? 'Compressing…' : 'Compress images'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="image/jpeg,image/png,image/webp" multiple label="Choose images" onChange={(picked) => setFiles(picked)} />{files.length > 0 && <span>{files.length} image{files.length === 1 ? '' : 's'} selected</span>}</div><label className="field-label" htmlFor="image-target-kb">Target size per image</label><div className="target-row"><input id="image-target-kb" className="text-field" type="number" min="10" max="20000" value={targetKB} onChange={(event) => setTargetKB(event.target.value)} /><span>KB</span></div><small className="field-help">For forms, 200–500 KB is usually a practical starting point.</small>{files.length ? <FileList files={files} onRemove={(index) => setFiles(files.filter((_, item) => item !== index))} /> : <div className="empty-utility"><ImageDown size={24} /><p>Your selected images will be exported as compressed JPG files.</p></div>}{progress && <p className="progress-message">{progress}</p>}</ToolWorkspace>
}

function ImagePdfTool() {
  const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const createPdf = async () => { if (!files.length) return; setBusy(true); setError(''); try { const output = new jsPDF({ unit: 'pt', format: 'a4' }); for (const [index, file] of files.entries()) { const url = URL.createObjectURL(file); const image = await readImage(url); if (index) output.addPage('a4', 'portrait'); const margin = 28; const maxWidth = 540; const maxHeight = 785; const ratio = Math.min(maxWidth / image.width, maxHeight / image.height); const width = image.width * ratio; const height = image.height * ratio; output.addImage(url, file.type.includes('png') ? 'PNG' : 'JPEG', (595 - width) / 2, (842 - height) / 2, width, height); URL.revokeObjectURL(url) } output.save('printmynotes-images.pdf') } catch { setError('One image could not be decoded. Try JPG, PNG, or WebP files from your device.') } finally { setBusy(false) } }
  return <ToolWorkspace title="Turn snapshots into one PDF." description="Combine scans, handwritten notes, and whiteboard photos into a print-ready document." error={error} action={<button className="button button-primary full-button" disabled={!files.length || busy} onClick={() => void createPdf()}>{busy ? 'Creating PDF…' : 'Create PDF'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="image/jpeg,image/png,image/webp" multiple label="Add images" onChange={(picked) => setFiles((current) => [...current, ...picked])} /><span>{files.length ? `${files.length} image${files.length === 1 ? '' : 's'} selected` : 'JPG, PNG, WebP'}</span></div>{files.length ? <FileList files={files} onRemove={(index) => setFiles(files.filter((_, item) => item !== index))} /> : <div className="empty-utility"><FileImage size={24} /><p>Add images to make a single shareable PDF.</p></div>}</ToolWorkspace>
}

function ExtractTool({ split }: { split: boolean }) {
  const [file, setFile] = useState<File | null>(null); const [range, setRange] = useState('1-3'); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const extract = async () => { if (!file) return; setBusy(true); setError(''); try { const source = await PDFDocument.load(await file.arrayBuffer()); const pages = parsePageSelection(range, source.getPageCount()); if (!pages.length) throw new Error('range'); if (split) { const zip = new JSZip(); for (const [index, pageIndex] of pages.entries()) { const one = await PDFDocument.create(); const [page] = await one.copyPages(source, [pageIndex]); one.addPage(page); zip.file(`page-${String(index + 1).padStart(3, '0')}.pdf`, await one.save()) } downloadBlob(await zip.generateAsync({ type: 'blob' }), `${file.name.replace(/\.pdf$/i, '')}-pages.zip`) } else { const output = await PDFDocument.create(); const selected = await output.copyPages(source, pages); selected.forEach((page) => output.addPage(page)); downloadBlob(new Blob([await output.save()], { type: 'application/pdf' }), `${file.name.replace(/\.pdf$/i, '')}-extracted.pdf`) } } catch { setError('Check the page range and make sure the PDF is not password protected.') } finally { setBusy(false) } }
  return <ToolWorkspace title={split ? 'Break a PDF into parts.' : 'Keep only the pages you need.'} description={split ? 'Choose pages and download a ZIP containing one PDF per selected page.' : 'Enter page numbers or ranges, then download a focused PDF.'} error={error} action={<button className="button button-primary full-button" disabled={!file || busy} onClick={() => void extract()}>{busy ? 'Preparing…' : split ? 'Split & download' : 'Extract & download'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="application/pdf" label={file ? 'Replace PDF' : 'Choose a PDF'} onChange={(picked) => setFile(picked[0] ?? null)} />{file && <span>{file.name}</span>}</div><label className="field-label" htmlFor="page-range">Page selection</label><input id="page-range" className="text-field" value={range} onChange={(event) => setRange(event.target.value)} placeholder="Example: 1, 3-5, 8" /><small className="field-help">Use commas and ranges, for example <code>1, 3-5, 8</code>.</small></ToolWorkspace>
}

function PdfImageTool() {
  const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const convert = async () => { if (!file) return; setBusy(true); setError(''); try { const pdf = await getDocument({ data: await file.arrayBuffer() }).promise; const zip = new JSZip(); for (let index = 1; index <= pdf.numPages; index += 1) { const page = await pdf.getPage(index); const viewport = page.getViewport({ scale: 1.7 }); const canvas = document.createElement('canvas'); canvas.width = viewport.width; canvas.height = viewport.height; await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise; const base64 = canvas.toDataURL('image/jpeg', .92).split(',')[1]; zip.file(`page-${String(index).padStart(3, '0')}.jpg`, base64, { base64: true }) } downloadBlob(await zip.generateAsync({ type: 'blob' }), `${file.name.replace(/\.pdf$/i, '')}-images.zip`) } catch { setError('This PDF could not be rendered as images. Try exporting it again.') } finally { setBusy(false) } }
  return <ToolWorkspace title="Take every page as an image." description="Export PDF pages as high-quality JPGs in one ZIP file for slides, messages, or image editing." error={error} action={<button className="button button-primary full-button" disabled={!file || busy} onClick={() => void convert()}>{busy ? 'Rendering pages…' : 'Export JPGs'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="application/pdf" label={file ? 'Replace PDF' : 'Choose a PDF'} onChange={(picked) => setFile(picked[0] ?? null)} />{file && <span>{file.name} · ready</span>}</div><div className="empty-utility"><ImageDown size={24} /><p>Each page will be rendered locally at a print-friendly resolution.</p></div></ToolWorkspace>
}

function parsePageSelection(value: string, pageCount: number) { const output: number[] = []; for (const part of value.split(',')) { const cleaned = part.trim(); if (!cleaned) continue; const [startText, endText] = cleaned.split('-'); const start = Number(startText); const end = endText ? Number(endText) : start; if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start || end > pageCount) throw new Error('range'); for (let page = start; page <= end; page += 1) if (!output.includes(page - 1)) output.push(page - 1) } return output }
function formatBytes(bytes: number) { if (!bytes) return '0 B'; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}` }
function downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url) }
async function renderPdfCanvases(file: File, scale: number, onProgress?: (message: string) => void) { const pdf = await getDocument({ data: await file.arrayBuffer() }).promise; const canvases: HTMLCanvasElement[] = []; for (let index = 1; index <= pdf.numPages; index += 1) { onProgress?.(`Rendering page ${index} of ${pdf.numPages}…`); const page = await pdf.getPage(index); const viewport = page.getViewport({ scale }); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(viewport.width)); canvas.height = Math.max(1, Math.round(viewport.height)); await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise; canvases.push(canvas) } return canvases }
function canvasesToPdf(canvases: HTMLCanvasElement[], quality: number) { if (!canvases.length) return new Blob([], { type: 'application/pdf' }); const first = canvases[0]; const firstOrientation = first.width > first.height ? 'landscape' : 'portrait'; const output = new jsPDF({ orientation: firstOrientation, unit: 'pt', format: [first.width, first.height] }); canvases.forEach((canvas, index) => { const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait'; if (index) output.addPage([canvas.width, canvas.height], orientation); output.addImage(canvas.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, canvas.width, canvas.height) }); return new Blob([output.output('arraybuffer')], { type: 'application/pdf' }) }
async function rasterizePdf(file: File, scale: number, quality: number, onProgress?: (message: string) => void) { return canvasesToPdf(await renderPdfCanvases(file, scale, onProgress), quality) }
async function compressPdfToTarget(file: File, targetBytes: number, scale: number, onProgress: (message: string) => void) { const canvases = await renderPdfCanvases(file, scale, onProgress); const qualities = [.92, .82, .72, .62, .52, .42, .32, .24, .16]; let best = canvasesToPdf(canvases, qualities[qualities.length - 1]); for (const quality of qualities) { onProgress(`Trying quality ${Math.round(quality * 100)}%…`); const candidate = canvasesToPdf(canvases, quality); if (candidate.size < best.size) best = candidate; if (candidate.size <= targetBytes) return candidate } return best }
async function compressImageToTarget(file: File, targetBytes: number) { const url = URL.createObjectURL(file); try { const image = await readImageElement(url); let scale = Math.min(1, 2400 / Math.max(image.naturalWidth, image.naturalHeight)); let best: Blob | null = null; for (let attempt = 0; attempt < 6; attempt += 1) { const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale)); canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height); for (const quality of [.92, .82, .72, .62, .52, .42, .32, .24, .16]) { const blob = await canvasToBlob(canvas, quality); if (!best || blob.size < best.size) best = blob; if (blob.size <= targetBytes) return blob } scale *= .8 } if (!best) throw new Error('image'); return best } finally { URL.revokeObjectURL(url) } }
function canvasToBlob(canvas: HTMLCanvasElement, quality: number) { return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('canvas')), 'image/jpeg', quality)) }
function readImageElement(url: string) { return new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url }) }
function readImage(url: string) { return new Promise<{ width: number; height: number }>((resolve, reject) => { const image = new Image(); image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight }); image.onerror = reject; image.src = url }) }

function RotateTool() {
  const [file, setFile] = useState<File | null>(null); const [rotation, setRotation] = useState<90 | 180 | 270>(90); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const rotate = async () => { if (!file) return; setBusy(true); setError(''); try { const pdf = await PDFDocument.load(await file.arrayBuffer()); pdf.getPages().forEach((page) => page.setRotation(degrees(rotation))); downloadBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), `${file.name.replace(/\.pdf$/i, '')}-rotated.pdf`) } catch { setError('This PDF could not be rotated. Try exporting it again from the source app.') } finally { setBusy(false) } }
  return <ToolWorkspace title="Turn sideways pages the right way." description="Rotate every page in 90-degree steps, locally, before you print or share." error={error} action={<button className="button button-primary full-button" disabled={!file || busy} onClick={() => void rotate()}>{busy ? 'Rotating…' : 'Rotate & download'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="application/pdf" label={file ? 'Replace PDF' : 'Choose a PDF'} onChange={(picked) => setFile(picked[0] ?? null)} />{file && <span>{file.name}</span>}</div><div className="quality-grid rotate-options">{([90, 180, 270] as const).map((value) => <button className={`quality-card ${rotation === value ? 'selected' : ''}`} key={value} onClick={() => setRotation(value)}><strong>{value}° clockwise</strong><span>Apply to every page</span></button>)}</div></ToolWorkspace>
}

function WatermarkTool() {
  const [file, setFile] = useState<File | null>(null); const [label, setLabel] = useState('DRAFT'); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const watermark = async () => { if (!file || !label.trim()) return; setBusy(true); setError(''); try { const pdf = await PDFDocument.load(await file.arrayBuffer()); pdf.getPages().forEach((page) => { const { width } = page.getSize(); page.drawText(label.trim().slice(0, 32), { x: width / 2 - 70, y: 48, size: 18, opacity: .28, color: rgb(.28, .42, .34) }) }); downloadBlob(new Blob([await pdf.save()], { type: 'application/pdf' }), `${file.name.replace(/\.pdf$/i, '')}-watermarked.pdf`) } catch { setError('This PDF could not be watermarked. Try exporting it again from the source app.') } finally { setBusy(false) } }
  return <ToolWorkspace title="Mark every page in one click." description="Add a subtle draft, class, or ownership label to a PDF without uploading it." error={error} action={<button className="button button-primary full-button" disabled={!file || !label.trim() || busy} onClick={() => void watermark()}>{busy ? 'Adding label…' : 'Watermark & download'} <Download size={16} /></button>}><div className="utility-controls"><FilePicker accept="application/pdf" label={file ? 'Replace PDF' : 'Choose a PDF'} onChange={(picked) => setFile(picked[0] ?? null)} />{file && <span>{file.name}</span>}</div><label className="field-label" htmlFor="watermark-label">Watermark text</label><input id="watermark-label" className="text-field" value={label} maxLength={32} onChange={(event) => setLabel(event.target.value)} placeholder="DRAFT" /><small className="field-help">Keep it short so the mark stays readable on phone screens and paper.</small></ToolWorkspace>
}

function ComingSoon({ tool, onSelect }: { tool: (typeof tools)[number]; onSelect: (id: ToolId) => void }) { return <div className="coming-soon"><div className="coming-icon"><tool.icon size={30} /></div><h2>{tool.title} is next.</h2><p>We’re building this tool with the same local-first promise. Start with the dark PDF converter today, or explore the rest of the toolkit.</p><button className="button button-primary" onClick={() => onSelect('dark-pdf')}>Open dark PDF converter <ArrowRight size={16} /></button></div> }

export default App
