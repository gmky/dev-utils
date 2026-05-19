<template>
  <div class="unicode-converter">
    <!-- Input -->
    <div class="tool-card input-card">
      <div class="input-header">
        <label class="field-label">Input</label>
        <div class="input-actions">
          <Button label="Paste" severity="secondary" size="small" text @click="paste" />
          <Button label="Clear" severity="secondary" size="small" text @click="input = ''" v-if="input" />
        </div>
      </div>
      <Textarea
        v-model="input"
        class="input-textarea"
        rows="3"
        placeholder="Type or paste characters here…"
        spellcheck="false"
        auto-resize
      />
      <div v-if="input" class="char-info">
        {{ [...input].length }} code point{{ [...input].length !== 1 ? 's' : '' }}
        · {{ input.length }} UTF-16 unit{{ input.length !== 1 ? 's' : '' }}
      </div>
    </div>

    <!-- Outputs -->
    <div v-if="input" class="outputs-grid">

      <!-- Characters -->
      <div class="output-item full-width">
        <div class="output-header">
          <span class="output-label">Characters</span>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.characters)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.characters" readonly spellcheck="false" />
      </div>

      <!-- HTML / XML -->
      <div class="output-item full-width">
        <div class="output-header">
          <span class="output-label">HTML / XML</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.html.escapeInvisible" />Escape invisible</label>
            <label class="opt"><input type="checkbox" v-model="opts.html.convertBidi" />Convert bidi controls</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.html)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.html" readonly spellcheck="false" />
      </div>

      <!-- Hex NCRs -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">Hex NCRs</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.hexNcr.showAscii" />Show ASCII</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.hexNcr)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.hexNcr" readonly spellcheck="false" />
      </div>

      <!-- Decimal NCRs -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">Decimal NCRs</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.decNcr.showAscii" />Show ASCII</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.decNcr)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.decNcr" readonly spellcheck="false" />
      </div>

      <!-- JS / Java / C -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">JS / Java / C</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.js.showAscii" />Show ASCII</label>
            <label class="opt"><input type="checkbox" v-model="opts.js.es6" />ES6</label>
            <label class="opt"><input type="checkbox" v-model="opts.js.newlineEtc" />\n etc</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.js)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.js" readonly spellcheck="false" />
      </div>

      <!-- Rust / Ruby -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">Rust / Ruby</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.rust.showAscii" />Show ASCII</label>
            <label class="opt"><input type="checkbox" v-model="opts.rust.newlineEtc" />\n etc</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.rust)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.rust" readonly spellcheck="false" />
      </div>

      <!-- CSS -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">CSS</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.css.showAscii" />Show ASCII</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.css)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.css" readonly spellcheck="false" />
      </div>

      <!-- Perl / UTR#18 -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">Perl / UTR#18</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.perl.showAscii" />Show ASCII</label>
            <label class="opt"><input type="checkbox" v-model="opts.perl.newlineEtc" />\n etc</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.perl)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.perl" readonly spellcheck="false" />
      </div>

      <!-- Percent encoding -->
      <div class="output-item full-width">
        <div class="output-header">
          <span class="output-label">Percent encoding (URI)</span>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.percent)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.percent" readonly spellcheck="false" />
      </div>

      <!-- U+hex -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">U+ hex</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.uHex.showAscii" />Show ASCII</label>
            <label class="opt"><input type="checkbox" v-model="opts.uHex.separate" />Separate</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.uHex)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.uHex" readonly spellcheck="false" />
      </div>

      <!-- 0x... -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">0x… hex</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.hex0x.showAscii" />Show ASCII</label>
            <label class="opt"><input type="checkbox" v-model="opts.hex0x.separate" />Separate</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.hex0x)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.hex0x" readonly spellcheck="false" />
      </div>

      <!-- UTF-8 -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">UTF-8 code units</span>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.utf8)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.utf8" readonly spellcheck="false" />
      </div>

      <!-- UTF-16 -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">UTF-16 code units</span>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.utf16)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.utf16" readonly spellcheck="false" />
      </div>

      <!-- Hex / UTF-32 -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">Hex / UTF-32</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.hex32.keepAscii" />Keep ASCII</label>
            <label class="opt opt-row">
              Pad
              <select v-model.number="opts.hex32.pad" class="opt-select">
                <option :value="4">4</option>
                <option :value="6">6</option>
                <option :value="8">8</option>
              </select>
            </label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.hex32)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.hex32" readonly spellcheck="false" />
      </div>

      <!-- Decimal -->
      <div class="output-item">
        <div class="output-header">
          <span class="output-label">Decimal</span>
          <div class="opts">
            <label class="opt"><input type="checkbox" v-model="opts.decimal.keepAscii" />Keep ASCII</label>
          </div>
          <Button icon="pi pi-copy" text rounded size="small" @click="copyText(results.decimal)" v-tooltip.top="'Copy'" />
        </div>
        <textarea class="output-textarea" :value="results.decimal" readonly spellcheck="false" />
      </div>

    </div>

    <!-- Empty state -->
    <div v-else class="tool-card empty-card">
      <i class="pi pi-language empty-icon" />
      <p class="empty-text">Enter text above to see all Unicode representations.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'

const input = ref('')

// ── per-format options ────────────────────────────────────────────────────────

const opts = reactive({
  html:    { escapeInvisible: true, convertBidi: false },
  hexNcr:  { showAscii: true },
  decNcr:  { showAscii: true },
  js:      { es6: true, showAscii: true, newlineEtc: false },
  rust:    { showAscii: true, newlineEtc: false },
  css:     { showAscii: true },
  perl:    { showAscii: true, newlineEtc: false },
  uHex:    { showAscii: true, separate: true },
  hex0x:   { showAscii: true, separate: true },
  hex32:   { keepAscii: false, pad: 4 },
  decimal: { keepAscii: false },
})

// ── helpers ───────────────────────────────────────────────────────────────────

function codePoints() { return [...input.value].map(ch => ch.codePointAt(0)) }

const SEP = '  '

const NAMED_ESC = { 0x09: '\\t', 0x0A: '\\n', 0x0D: '\\r' }
const BIDI_CPS  = new Set([0x200E, 0x200F, 0x202A, 0x202B, 0x202C, 0x202D, 0x202E, 0x2066, 0x2067, 0x2068, 0x2069])
const INVIS_CPS = cp => (cp < 0x20 && cp !== 0x09 && cp !== 0x0A && cp !== 0x0D) || cp === 0x7F ||
                        (cp >= 0x80 && cp <= 0x9F) || cp === 0x00AD || BIDI_CPS.has(cp)

const HTML_NAMED = { 34: '&quot;', 38: '&amp;', 39: '&apos;', 60: '&lt;', 62: '&gt;' }

function htmlEntity(cp, escInvis, convertBidi) {
  if (convertBidi && BIDI_CPS.has(cp)) return `<bdi>&#x${cp.toString(16).toUpperCase()};</bdi>`
  if (escInvis && INVIS_CPS(cp)) return `&#x${cp.toString(16).toUpperCase()};`
  if (HTML_NAMED[cp]) return HTML_NAMED[cp]
  if (cp < 128) return String.fromCodePoint(cp)
  return `&#x${cp.toString(16).toUpperCase()};`
}

function hexPad(n, len) { return n.toString(16).toUpperCase().padStart(len, '0') }

function utf8Bytes(str) {
  return Array.from(new TextEncoder().encode(str))
    .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ')
}

function utf16Units(cps) {
  const u = []
  for (const cp of cps) {
    if (cp <= 0xFFFF) { u.push(hexPad(cp, 4)) }
    else {
      const n = cp - 0x10000
      u.push(hexPad(0xD800 + (n >> 10), 4))
      u.push(hexPad(0xDC00 + (n & 0x3FF), 4))
    }
  }
  return u.join(' ')
}

function minHexLen(cp) { return Math.max(4, cp.toString(16).length) }

// ── conversions ───────────────────────────────────────────────────────────────

const results = computed(() => {
  if (!input.value) return {}
  const cps = codePoints()
  const str = input.value
  const o   = opts

  // ASCII helpers
  const asciiChar = cp => String.fromCodePoint(cp)
  const isPrint   = cp => cp >= 0x20 && cp <= 0x7E

  /* Hex NCRs */
  const hexNcr = cps.map(cp =>
    (o.hexNcr.showAscii && isPrint(cp)) ? asciiChar(cp) : `&#x${cp.toString(16).toUpperCase()};`
  ).join('')

  /* Decimal NCRs */
  const decNcr = cps.map(cp =>
    (o.decNcr.showAscii && isPrint(cp)) ? asciiChar(cp) : `&#${cp};`
  ).join('')

  /* JS / Java / C */
  const js = cps.map(cp => {
    if (o.js.showAscii && isPrint(cp)) return asciiChar(cp)
    if (o.js.newlineEtc && NAMED_ESC[cp]) return NAMED_ESC[cp]
    if (o.js.es6) return cp > 0xFFFF ? `\\u{${cp.toString(16).toUpperCase()}}` : `\\u{${cp.toString(16).toUpperCase()}}`
    if (cp <= 0xFFFF) return `\\u${hexPad(cp, 4)}`
    const n = cp - 0x10000
    return `\\u${hexPad(0xD800 + (n >> 10), 4)}\\u${hexPad(0xDC00 + (n & 0x3FF), 4)}`
  }).join('')

  /* Rust / Ruby */
  const rust = cps.map(cp => {
    if (o.rust.showAscii && isPrint(cp)) return asciiChar(cp)
    if (o.rust.newlineEtc && NAMED_ESC[cp]) return NAMED_ESC[cp]
    return `\\u{${cp.toString(16).toUpperCase()}}`
  }).join('')

  /* CSS */
  const css = cps.map(cp =>
    (o.css.showAscii && isPrint(cp)) ? asciiChar(cp) : `\\${cp.toString(16).toUpperCase()}`
  ).join('')

  /* Perl / UTR#18 */
  const perl = cps.map(cp => {
    if (o.perl.showAscii && isPrint(cp)) return asciiChar(cp)
    if (o.perl.newlineEtc && NAMED_ESC[cp]) return NAMED_ESC[cp]
    return `\\x{${cp.toString(16).toUpperCase()}}`
  }).join('')

  /* U+ hex */
  const uHex = cps.map(cp =>
    (o.uHex.showAscii && isPrint(cp)) ? asciiChar(cp) : `U+${hexPad(cp, minHexLen(cp))}`
  ).join(o.uHex.separate ? SEP : '')

  /* 0x... */
  const hex0x = cps.map(cp =>
    (o.hex0x.showAscii && isPrint(cp)) ? asciiChar(cp) : `0x${hexPad(cp, minHexLen(cp))}`
  ).join(o.hex0x.separate ? SEP : '')

  /* Hex / UTF-32 */
  const hex32 = cps.map(cp =>
    (o.hex32.keepAscii && isPrint(cp)) ? asciiChar(cp) : cp.toString(16).toUpperCase().padStart(o.hex32.pad, '0')
  ).join(SEP)

  /* Decimal */
  const decimal = cps.map(cp =>
    (o.decimal.keepAscii && isPrint(cp)) ? asciiChar(cp) : String(cp)
  ).join(SEP)

  return {
    characters: str,
    html:    cps.map(cp => htmlEntity(cp, o.html.escapeInvisible, o.html.convertBidi)).join(''),
    hexNcr, decNcr, js, rust, css, perl,
    percent: encodeURIComponent(str),
    uHex, hex0x,
    utf8:  utf8Bytes(str),
    utf16: utf16Units(cps),
    hex32, decimal,
  }
})

function copyText(text) { navigator.clipboard.writeText(text ?? '') }
async function paste() { input.value = await navigator.clipboard.readText() }
</script>

<style scoped>
.unicode-converter {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── input ── */
.input-card { display: flex; flex-direction: column; gap: 0.625rem; }

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-actions { display: flex; gap: 0.25rem; }

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-textarea {
  width: 100%;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.9rem;
  resize: vertical;
}

.char-info { font-size: 0.75rem; color: var(--text-secondary); }

/* ── empty state ── */
.empty-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
}
.empty-icon { font-size: 2rem; color: var(--text-secondary); opacity: 0.4; }
.empty-text { font-size: 0.875rem; color: var(--text-secondary); }

/* ── outputs grid ── */
.outputs-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.output-item {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 0.875rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.output-item.full-width { grid-column: 1 / -1; }

/* ── output header ── */
.output-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  row-gap: 0.25rem;
}

.output-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin-right: 0.25rem;
}

/* ── inline options ── */
.opts {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  flex-wrap: wrap;
}

.opt {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
}

.opt input[type="checkbox"] {
  width: 13px;
  height: 13px;
  accent-color: var(--accent);
  cursor: pointer;
}

.opt-row {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}

.opt-select {
  height: 20px;
  font-size: 0.72rem;
  padding: 0 0.3rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-page);
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
}
.opt-select:focus { border-color: var(--accent); }

/* ── output textarea ── */
.output-textarea {
  width: 100%;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 7px;
  padding: 0.625rem 0.75rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  color: var(--text-primary);
  line-height: 1.65;
  resize: vertical;
  outline: none;
  min-height: 56px;
}
.output-textarea:focus { border-color: var(--accent); }
</style>
