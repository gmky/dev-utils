<template>
  <div class="cron-parser">
    <!-- Input row -->
    <div class="tool-card input-card">
      <div class="input-row">
        <div class="input-wrap">
          <label class="field-label">Cron Expression</label>
          <InputText
            v-model="expression"
            placeholder="e.g. 0 9 * * 1-5   or   0 0 9 * * MON-FRI"
            class="cron-input"
            @input="parse"
            spellcheck="false"
          />
        </div>
        <div class="mode-wrap">
          <label class="field-label">Format</label>
          <SelectButton v-model="mode" :options="modeOptions" option-label="label" option-value="value" />
        </div>
        <Button icon="pi pi-times" text rounded size="small" v-tooltip.top="'Clear'" @click="clear" v-if="expression" class="clear-btn" />
      </div>

      <div v-if="parseError" class="error-banner">
        <i class="pi pi-exclamation-triangle" />
        {{ parseError }}
      </div>
    </div>

    <!-- Result -->
    <div v-if="result && !parseError" class="tool-card result-card">
      <div class="human-readable">
        <i class="pi pi-calendar result-icon" />
        <span class="result-text">{{ result.summary }}</span>
        <Button icon="pi pi-copy" text rounded size="small" v-tooltip.top="'Copy'" @click="copy(result.summary)" class="copy-btn" />
      </div>

      <!-- Field breakdown -->
      <div class="field-grid">
        <div v-for="f in result.fields" :key="f.name" class="field-chip">
          <span class="chip-label">{{ f.name }}</span>
          <span class="chip-value">{{ f.raw }}</span>
          <span class="chip-desc">{{ f.desc }}</span>
        </div>
      </div>

      <!-- Next runs -->
      <div class="next-runs" v-if="result.nextRuns.length">
        <div class="next-title">Next 5 occurrences</div>
        <div class="run-list">
          <div v-for="(d, i) in result.nextRuns" :key="i" class="run-item">
            <span class="run-num">{{ i + 1 }}</span>
            <span class="run-date">{{ d }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick reference -->
    <div class="tool-card ref-card">
      <div class="ref-header" @click="showRef = !showRef">
        <span class="ref-title">Quick Reference</span>
        <i :class="['pi', showRef ? 'pi-chevron-up' : 'pi-chevron-down']" />
      </div>
      <div v-if="showRef" class="ref-body">
        <div class="ref-cols">
          <div class="ref-col">
            <div class="ref-sub">Standard (5 fields)</div>
            <code class="ref-fmt">MIN HOUR DOM MON DOW</code>
            <table class="ref-table">
              <tr><td>Field</td><td>Range</td><td>Special chars</td></tr>
              <tr><td>Minute</td><td>0–59</td><td>, - * /</td></tr>
              <tr><td>Hour</td><td>0–23</td><td>, - * /</td></tr>
              <tr><td>Day of month</td><td>1–31</td><td>, - * / ? L W</td></tr>
              <tr><td>Month</td><td>1–12 / JAN–DEC</td><td>, - * /</td></tr>
              <tr><td>Day of week</td><td>0–7 / SUN–SAT</td><td>, - * / ? L #</td></tr>
            </table>
          </div>
          <div class="ref-col">
            <div class="ref-sub">Spring Boot (6 fields)</div>
            <code class="ref-fmt">SEC MIN HOUR DOM MON DOW</code>
            <table class="ref-table">
              <tr><td>Field</td><td>Range</td><td>Special chars</td></tr>
              <tr><td>Second</td><td>0–59</td><td>, - * /</td></tr>
              <tr><td>Minute</td><td>0–59</td><td>, - * /</td></tr>
              <tr><td>Hour</td><td>0–23</td><td>, - * /</td></tr>
              <tr><td>Day of month</td><td>1–31</td><td>, - * / ? L W</td></tr>
              <tr><td>Month</td><td>1–12 / JAN–DEC</td><td>, - * /</td></tr>
              <tr><td>Day of week</td><td>1–7 / SUN–SAT</td><td>, - * / ? L #</td></tr>
            </table>
          </div>
          <div class="ref-col">
            <div class="ref-sub">Common examples</div>
            <table class="ref-table examples-table">
              <tr v-for="ex in examples" :key="ex.expr" @click="useExample(ex)" class="ex-row">
                <td><code>{{ ex.expr }}</code></td>
                <td>{{ ex.label }}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'

// ── state ─────────────────────────────────────────────────────────────────────

const expression = ref('')
const mode = ref('auto')
const parseError = ref('')
const result = ref(null)
const showRef = ref(false)

const modeOptions = [
  { label: 'Auto', value: 'auto' },
  { label: 'Standard', value: 'standard' },
  { label: 'Spring Boot', value: 'spring' },
]

const examples = [
  { expr: '* * * * *',           label: 'Every minute' },
  { expr: '0 * * * *',           label: 'Every hour' },
  { expr: '0 9 * * *',           label: 'Every day at 9 AM' },
  { expr: '0 9 * * 1-5',         label: 'Weekdays at 9 AM' },
  { expr: '0 0 * * 0',           label: 'Every Sunday midnight' },
  { expr: '*/15 * * * *',        label: 'Every 15 minutes' },
  { expr: '0 9,17 * * 1-5',      label: 'Weekdays at 9 AM & 5 PM' },
  { expr: '0 0 1 * *',           label: 'First day of every month' },
  { expr: '0 0 1 1 *',           label: 'Once a year (Jan 1)' },
  { expr: '0 0 9 * * MON-FRI',   label: 'Spring: weekdays at 9 AM' },
  { expr: '0 */30 * * * *',      label: 'Spring: every 30 minutes' },
  { expr: '0 0 0 L * ?',         label: 'Spring: last day of month' },
  { expr: '0 0 10 ? * 2#1',      label: 'Spring: 1st Monday of month' },
]

// ── constants ─────────────────────────────────────────────────────────────────

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTH_MAP = { JAN:1,FEB:2,MAR:3,APR:4,MAY:5,JUN:6,JUL:7,AUG:8,SEP:9,OCT:10,NOV:11,DEC:12 }
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const DAY_MAP = { SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6 }
const ORDINALS = ['first','second','third','fourth','fifth']

// ── parsing helpers ───────────────────────────────────────────────────────────

function normalizeDay(v) {
  const s = String(v).toUpperCase()
  if (s in DAY_MAP) return DAY_MAP[s]
  const n = parseInt(v)
  return isNaN(n) ? null : (n === 7 ? 0 : n) // 7 = Sunday alias
}

function normalizeMonth(v) {
  const s = String(v).toUpperCase()
  if (s in MONTH_MAP) return MONTH_MAP[s]
  const n = parseInt(v)
  return isNaN(n) ? null : n
}

function expandField(raw, min, max, normalize) {
  const values = new Set()
  for (const part of raw.split(',')) {
    if (part === '*' || part === '?') {
      for (let i = min; i <= max; i++) values.add(i)
      continue
    }
    if (part.includes('/')) {
      const [range, step] = part.split('/')
      const s = parseInt(step)
      let start = min, end = max
      if (range !== '*' && range !== '?') {
        if (range.includes('-')) {
          const [a, b] = range.split('-')
          start = normalize ? normalize(a) : parseInt(a)
          end   = normalize ? normalize(b) : parseInt(b)
        } else {
          start = normalize ? normalize(range) : parseInt(range)
          end   = max
        }
      }
      for (let i = start; i <= end; i += s) values.add(i)
      continue
    }
    if (part.includes('-')) {
      const [a, b] = part.split('-')
      const start = normalize ? normalize(a) : parseInt(a)
      const end   = normalize ? normalize(b) : parseInt(b)
      for (let i = start; i <= end; i++) values.add(i)
      continue
    }
    if (part.toUpperCase() === 'L') { values.add('L'); continue }
    if (part.includes('W') && !part.includes('MON')) { values.add(part); continue }
    if (part.includes('#')) { values.add(part); continue }
    const n = normalize ? normalize(part) : parseInt(part)
    if (n !== null && !isNaN(n)) values.add(n)
  }
  return [...values].sort((a, b) => {
    if (typeof a === 'string') return 1
    if (typeof b === 'string') return -1
    return a - b
  })
}

// ── field description ─────────────────────────────────────────────────────────

function describeUnit(raw, unit, min, max, names, normalize) {
  const r = raw.trim().toUpperCase()
  if (r === '*' || r === '?') return `every ${unit}`

  if (r.startsWith('*/') || r.startsWith('0/')) {
    const step = parseInt(r.split('/')[1])
    return `every ${step} ${unit}${step > 1 ? 's' : ''}`
  }

  if (r.includes('/')) {
    const [range, step] = r.split('/')
    const s = parseInt(step)
    let start = min
    if (range !== '*') start = normalize ? normalize(range) : parseInt(range)
    const startName = names ? names[start] || start : start
    return `every ${s} ${unit}${s > 1 ? 's' : ''} starting at ${startName}`
  }

  if (r === 'L') return `last ${unit} of month`

  if (r.includes('#')) {
    const [dow, nth] = r.split('#')
    const dayNum = normalizeDay(dow)
    const dayName = dayNum !== null ? DAYS[dayNum] : dow
    return `on the ${ORDINALS[parseInt(nth) - 1] || nth} ${dayName} of the month`
  }

  if (r.includes('W')) {
    const dom = parseInt(r)
    return `nearest weekday to the ${dom}${ordSuffix(dom)} of the month`
  }

  const expanded = expandField(raw, min, max, normalize)
  if (expanded.length === (max - min + 1)) return `every ${unit}`

  if (names) {
    const named = expanded.map(v => (typeof v === 'number' && names[v]) ? names[v] : v)
    return named.join(', ')
  }
  return expanded.join(', ')
}

function ordSuffix(n) {
  if (n % 100 >= 11 && n % 100 <= 13) return 'th'
  return ['th','st','nd','rd','th'][Math.min(n % 10, 4)]
}

function describeSecond(raw) { return describeUnit(raw, 'second', 0, 59, null, null) }
function describeMinute(raw) { return describeUnit(raw, 'minute', 0, 59, null, null) }
function describeHour(raw)   { return describeUnit(raw, 'hour',   0, 23, null, null) }
function describeMonth(raw)  { return describeUnit(raw, 'month',  1, 12, MONTHS, normalizeMonth) }
function describeDOM(raw)    {
  if (raw === 'L') return 'last day of month'
  return describeUnit(raw, 'day of month', 1, 31, null, null)
}
function describeDOW(raw)    { return describeUnit(raw, 'day', 0, 6, DAYS, normalizeDay) }

// ── summary builder ───────────────────────────────────────────────────────────

function buildSummary(fields, isSpring) {
  const { sec, min, hour, dom, mon, dow } = fields
  const parts = []

  // time part
  const minDesc  = describeMinute(min)
  const hourDesc = describeHour(hour)
  const secDesc  = isSpring ? describeSecond(sec) : null

  const everyMin  = min  === '*' || min  === '?'
  const everyHour = hour === '*' || hour === '?'
  const everySec  = !isSpring || sec === '*' || sec === '?'

  if (!everyMin && !everyHour) {
    const hrs = expandField(hour, 0, 23, null)
    const mins = expandField(min, 0, 59, null)
    const times = hrs.flatMap(h => mins.map(m => fmt2(h) + ':' + fmt2(m)))
    let timeStr = 'at ' + times.join(', ')
    if (isSpring && !everySec) {
      const secs = expandField(sec, 0, 59, null)
      timeStr += ':' + secs.map(fmt2).join('/')
    }
    parts.push(timeStr)
  } else if (!everyMin) {
    parts.push('at minute ' + minDesc + (isSpring && !everySec ? ' second ' + secDesc : ''))
  } else if (!everyHour) {
    parts.push('every minute of hour ' + hourDesc)
  } else {
    if (isSpring && !everySec) {
      parts.push('at second ' + secDesc + ' of every minute')
    } else if (isSpring && min.startsWith('*/')) {
      parts.push(describeMinute(min))
    } else {
      parts.push('every minute')
    }
  }

  // day/month part
  const everyDOM = dom === '*' || dom === '?'
  const everyDOW = dow === '*' || dow === '?'
  const everyMon = mon === '*' || mon === '?'

  if (!everyDOW) {
    const dowStr = describeDOW(dow)
    parts.push('on ' + dowStr)
  } else if (!everyDOM) {
    parts.push('on the ' + describeDOM(dom))
  }

  if (!everyMon) {
    parts.push('in ' + describeMonth(mon))
  }

  return parts.join(', ')
}

function fmt2(n) { return String(n).padStart(2, '0') }

// ── next runs ─────────────────────────────────────────────────────────────────

function computeNextRuns(fields, isSpring, count = 5) {
  try {
    const { sec, min, hour, dom, mon, dow } = fields

    const secs  = isSpring ? expandField(sec,  0, 59, null) : [0]
    const mins  = expandField(min,  0, 59, null).filter(v => typeof v === 'number')
    const hours = expandField(hour, 0, 23, null).filter(v => typeof v === 'number')
    const doms  = expandField(dom,  1, 31, null).filter(v => typeof v === 'number')
    const mons  = expandField(mon,  1, 12, normalizeMonth).filter(v => typeof v === 'number')
    const dows  = expandField(dow,  0,  6, normalizeDay).filter(v => typeof v === 'number')

    const anySecs  = secs.length === 0 ? (isSpring ? null : true) : null
    const anyDOW   = dow === '*' || dow === '?'
    const anyDOM   = dom === '*' || dom === '?'

    if (!mins.length || !hours.length || !mons.length) return []

    const results = []
    const now = new Date()
    let cursor = new Date(now)
    cursor.setMilliseconds(0)
    cursor.setSeconds((isSpring ? cursor.getSeconds() : 0) + 1)

    const MAX_ITER = 100000
    let iter = 0

    while (results.length < count && iter++ < MAX_ITER) {
      const mo = cursor.getMonth() + 1
      if (!mons.includes(mo)) { advanceMonth(cursor); continue }

      const d = cursor.getDate()
      const dayOfWeek = cursor.getDay()
      const domOk = anyDOM || doms.includes(d)
      const dowOk = anyDOW || dows.includes(dayOfWeek)

      // spring: if both dom and dow are specified (not ?), either can match
      const dayOk = (!anyDOM && !anyDOW) ? (domOk || dowOk) : (domOk && dowOk)

      if (!dayOk) { advanceDay(cursor); continue }

      const h = cursor.getHours()
      if (!hours.includes(h)) { advanceHour(cursor); continue }

      const m = cursor.getMinutes()
      if (!mins.includes(m)) { advanceMinute(cursor); continue }

      if (isSpring) {
        const s = cursor.getSeconds()
        const secList = expandField(sec, 0, 59, null).filter(v => typeof v === 'number')
        if (!secList.includes(s)) { cursor.setSeconds(s + 1); continue }
      }

      results.push(cursor.toLocaleString('en-US', {
        weekday: 'short', year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: isSpring ? '2-digit' : undefined,
        hour12: false,
      }))

      if (isSpring) cursor.setSeconds(cursor.getSeconds() + 1)
      else cursor.setMinutes(cursor.getMinutes() + 1)
    }
    return results
  } catch { return [] }
}

function advanceMonth(d) { d.setDate(1); d.setHours(0,0,0,0); d.setMonth(d.getMonth() + 1) }
function advanceDay(d)   { d.setHours(0,0,0,0); d.setDate(d.getDate() + 1) }
function advanceHour(d)  { d.setMinutes(0,0,0); d.setHours(d.getHours() + 1) }
function advanceMinute(d){ d.setSeconds(0,0); d.setMinutes(d.getMinutes() + 1) }

// ── main parse ────────────────────────────────────────────────────────────────

function parse() {
  const raw = expression.value.trim()
  if (!raw) { result.value = null; parseError.value = ''; return }

  const tokens = raw.split(/\s+/)

  let isSpring
  if (mode.value === 'spring')   isSpring = true
  else if (mode.value === 'standard') isSpring = false
  else {
    // auto-detect: 6 tokens → spring boot
    isSpring = tokens.length === 6
  }

  const expected = isSpring ? 6 : 5
  if (tokens.length !== expected) {
    const other = isSpring ? 5 : 6
    if (tokens.length === other) {
      parseError.value = `Detected ${tokens.length} fields. Switch mode to ${tokens.length === 6 ? 'Spring Boot' : 'Standard'} or set Auto.`
    } else {
      parseError.value = `Expected ${expected} fields but got ${tokens.length}.`
    }
    result.value = null
    return
  }

  let sec, min, hour, dom, mon, dow
  if (isSpring) { [sec, min, hour, dom, mon, dow] = tokens }
  else          { sec = '0'; [min, hour, dom, mon, dow] = tokens }

  const fields = { sec, min, hour, dom, mon, dow }

  // build per-field descriptions
  const fieldDefs = isSpring
    ? [
        { name: 'Second',       raw: sec,  desc: describeSecond(sec)  },
        { name: 'Minute',       raw: min,  desc: describeMinute(min)  },
        { name: 'Hour',         raw: hour, desc: describeHour(hour)   },
        { name: 'Day of month', raw: dom,  desc: describeDOM(dom)     },
        { name: 'Month',        raw: mon,  desc: describeMonth(mon)   },
        { name: 'Day of week',  raw: dow,  desc: describeDOW(dow)     },
      ]
    : [
        { name: 'Minute',       raw: min,  desc: describeMinute(min)  },
        { name: 'Hour',         raw: hour, desc: describeHour(hour)   },
        { name: 'Day of month', raw: dom,  desc: describeDOM(dom)     },
        { name: 'Month',        raw: mon,  desc: describeMonth(mon)   },
        { name: 'Day of week',  raw: dow,  desc: describeDOW(dow)     },
      ]

  try {
    const summary  = buildSummary(fields, isSpring)
    const nextRuns = computeNextRuns(fields, isSpring)
    result.value = { summary: capitalize(summary), fields: fieldDefs, nextRuns }
    parseError.value = ''
  } catch (e) {
    parseError.value = 'Could not parse expression: ' + e.message
    result.value = null
  }
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

// ── actions ───────────────────────────────────────────────────────────────────

function clear() { expression.value = ''; result.value = null; parseError.value = '' }
function copy(text) { navigator.clipboard.writeText(text) }
function useExample(ex) { expression.value = ex.expr; parse() }

watch(mode, parse)
</script>

<style scoped>
.cron-parser {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* ── input card ── */
.input-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.input-row {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.mode-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cron-input {
  width: 100%;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.95rem;
}

.clear-btn {
  margin-bottom: 2px;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: color-mix(in srgb, #ef4444 12%, transparent);
  border: 1px solid color-mix(in srgb, #ef4444 35%, transparent);
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  color: #ef4444;
  font-size: 0.85rem;
}

/* ── result card ── */
.result-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.human-readable {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent) 25%, transparent);
  border-radius: 10px;
  padding: 0.75rem 1rem;
}

.result-icon { color: var(--accent); font-size: 1.1rem; flex-shrink: 0; }

.result-text {
  flex: 1;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-primary);
}

.copy-btn { flex-shrink: 0; }

/* ── field chips ── */
.field-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.field-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.3rem 0.65rem;
  font-size: 0.8rem;
}

.chip-label {
  font-weight: 700;
  color: var(--text-secondary);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.chip-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, transparent);
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  flex-shrink: 0;
}

.chip-desc {
  color: var(--text-primary);
}

/* ── next runs ── */
.next-runs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.next-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.run-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.run-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0.65rem;
  background: var(--bg-page);
  border-radius: 6px;
  font-size: 0.85rem;
}

.run-num {
  width: 1.2rem;
  text-align: right;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.run-date {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
}

/* ── reference ── */
.ref-card { padding: 0; overflow: hidden; }

.ref-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.ref-header:hover { background: color-mix(in srgb, var(--accent) 5%, transparent); }

.ref-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-secondary);
}

.ref-body {
  padding: 0 1rem 1rem;
  border-top: 1px solid var(--border-color);
}

.ref-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding-top: 0.75rem;
}

.ref-sub {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 0.35rem;
}

.ref-fmt {
  display: block;
  font-size: 0.8rem;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 0.3rem 0.6rem;
  margin-bottom: 0.5rem;
  color: var(--accent);
}

.ref-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.ref-table tr { border-bottom: 1px solid var(--border-color); }
.ref-table tr:first-child { font-weight: 700; color: var(--text-secondary); }
.ref-table td { padding: 0.3rem 0.25rem; color: var(--text-primary); vertical-align: top; }
.ref-table td:first-child { white-space: nowrap; }

.examples-table tr.ex-row {
  cursor: pointer;
  transition: background 0.12s;
}

.examples-table tr.ex-row:hover { background: color-mix(in srgb, var(--accent) 8%, transparent); }
.examples-table td { padding: 0.3rem 0.4rem; }
.examples-table code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: var(--accent);
}

@media (max-width: 768px) {
  .ref-cols { grid-template-columns: 1fr; }
  .input-row { flex-direction: column; align-items: stretch; }
}
</style>
