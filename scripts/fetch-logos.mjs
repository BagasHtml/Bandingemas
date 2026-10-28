// Mengunduh logo asli tiap perantara dari situs resminya (R-23: aset nyata,
// bukan karangan). Menghasilkan public/logos/* dan src/lib/logos.ts.
// Jalankan ulang dengan: node scripts/fetch-logos.mjs
import { mkdir, writeFile } from 'node:fs/promises'

const UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

// Kandidat domain per sumber: urlHomepage dari API + tebakan brand root
const SOURCES = {
  anekalogam: ['https://www.anekalogam.co.id'],
  bankbsi: ['https://www.bankbsi.co.id'],
  brankaslm: ['https://brankaslm.com'],
  cermati: ['https://www.cermati.com'],
  emasku: ['https://emasku.id', 'https://www.emasku.co.id'],
  galeri24: ['https://galeri24.co.id'],
  'hargaemas-com': ['https://www.hargaemas.com'],
  'hargaemas-net': ['https://harga-emas.net'],
  'hargaemas-org': ['https://harga-emas.org'],
  hartadinataabadi: ['https://hartadinataabadi.co.id', 'https://hartadinataabadi.com'],
  indogold: ['https://www.indogold.id'],
  kursdolar: ['https://kurs.dollar.web.id'],
  lakuemas: ['https://www.lakuemas.com'],
  logammulia: ['https://www.logammulia.com'],
  pegadaian: ['https://www.pegadaian.co.id', 'https://sahabat.pegadaian.co.id'],
  sakumas: ['https://sakumas.asastapayment.com', 'https://sakumas.co.id'],
  sampoernagold: ['https://sampoernagold.com'],
  treasury: ['https://treasury.id'],
}

async function fetchBuf(url, timeout = 9000) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'image/*,text/html,*/*' },
    signal: AbortSignal.timeout(timeout),
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function imgExt(buf) {
  if (buf.length < 12) return null
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png'
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg'
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00) return 'ico'
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP')
    return 'webp'
  if (buf.subarray(0, 200).toString().includes('<svg')) return 'svg'
  return null
}

function extractIconUrls(html, baseUrl) {
  const links = []
  for (const tag of html.match(/<link[^>]+>/gi) ?? []) {
    if (!/rel=["'][^"']*icon[^"']*["']/i.test(tag)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (!href || href.startsWith('data:')) continue
    const sizes = tag.match(/sizes=["']([^"']+)["']/i)?.[1] ?? ''
    const size = parseInt(sizes.match(/(\d+)x\d+/)?.[1] ?? '0')
    const apple = /apple-touch-icon/i.test(tag)
    links.push({ href, score: (apple ? 1000 : 0) + size })
  }
  links.sort((a, b) => b.score - a.score)
  return links.slice(0, 4).map((l) => new URL(l.href, baseUrl).href)
}

async function logoFor(homepages) {
  for (const homepage of homepages) {
    // 1) Ikon terbaik dari HTML beranda
    try {
      const html = (await fetchBuf(homepage)).toString('utf8')
      for (const iconUrl of extractIconUrls(html, homepage)) {
        try {
          const buf = await fetchBuf(iconUrl)
          const ext = imgExt(buf)
          if (ext && buf.length > 500) return { buf, ext, via: iconUrl }
        } catch {}
      }
    } catch {}
    // 2) Jalur umum
    for (const path of ['/apple-touch-icon.png', '/favicon-32x32.png', '/favicon.ico']) {
      try {
        const buf = await fetchBuf(new URL(path, homepage).href)
        const ext = imgExt(buf)
        if (ext && buf.length > 500) return { buf, ext, via: path }
      } catch {}
    }
    // 3) Fallback favicon Google dari hostname
    try {
      const host = new URL(homepage).hostname
      const buf = await fetchBuf(`https://www.google.com/s2/favicons?domain=${host}&sz=128`)
      const ext = imgExt(buf)
      if (ext && buf.length > 100) return { buf, ext, via: 'google-s2' }
    } catch {}
  }
  return null
}

await mkdir('public/logos', { recursive: true })
const mapping = {}

for (const [name, homepages] of Object.entries(SOURCES)) {
  const result = await logoFor(homepages)
  if (result) {
    const file = `public/logos/${name}.${result.ext}`
    await writeFile(file, result.buf)
    mapping[name] = `/logos/${name}.${result.ext}`
    console.log(`OK   ${name.padEnd(18)} ${String(result.buf.length).padStart(6)} B  ${result.via}`)
  } else {
    console.log(`FAIL ${name}`)
  }
}

const ts = `// Dibuat otomatis oleh scripts/fetch-logos.mjs; jangan edit manual.
// Logo asli tiap perantara, diunduh dari situs resminya.
export const LOGOS: Record<string, string> = ${JSON.stringify(mapping, null, 2)}
`
await writeFile('src/lib/logos.ts', ts)
console.log(`\n${Object.keys(mapping).length}/${Object.keys(SOURCES).length} logo tersimpan; src/lib/logos.ts dibuat.`)
