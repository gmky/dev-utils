<template>
  <div class="regex-tester">

    <!-- Pattern bar -->
    <div class="tool-card pattern-bar">
      <div class="pattern-row">
        <span class="delimiter">/</span>
        <input
          v-model="pattern"
          class="pattern-input"
          placeholder="[A-Z]\w+"
          spellcheck="false"
        />
        <span class="delimiter">/</span>
        <div class="flag-group">
          <button
            v-for="f in availableFlags"
            :key="f.value"
            class="flag-btn"
            :class="{ active: flags.includes(f.value) }"
            @click="toggleFlag(f.value)"
            v-tooltip.bottom="f.label"
          >{{ f.value }}</button>
        </div>
        <div class="pattern-status">
          <Tag v-if="patternError"                     severity="danger"  :value="'Invalid: ' + patternError" />
          <Tag v-else-if="pattern && matches.length"   severity="success" :value="matches.length + (matches.length === 1 ? ' match' : ' matches')" />
          <Tag v-else-if="pattern && !matches.length"  severity="secondary" value="No matches" />
        </div>
      </div>
    </div>

    <!-- Test area + matches -->
    <div class="main-layout">
      <!-- Left: input + highlighted preview -->
      <div class="left-col">
        <div class="tool-card test-card">
          <div class="card-header">
            <label class="field-label">Test String</label>
            <Button label="Clear" severity="secondary" size="small" text @click="testString = ''" v-if="testString" />
          </div>
          <textarea
            v-model="testString"
            class="test-input"
            placeholder="Paste or type test string here..."
            spellcheck="false"
          />
        </div>

        <div class="tool-card preview-card" v-if="testString">
          <label class="field-label">Highlighted</label>
          <div class="highlighted-output" v-html="highlightedHtml" />
        </div>
      </div>

      <!-- Right: matches -->
      <div class="right-col">
        <div class="tool-card matches-card">
          <label class="field-label">
            Matches
            <span v-if="matches.length" class="match-count">{{ matches.length }}</span>
          </label>

          <div v-if="!pattern" class="empty-state">Enter a pattern to see matches.</div>
          <div v-else-if="patternError" class="empty-state error-text">Fix the pattern to see matches.</div>
          <div v-else-if="!matches.length" class="empty-state">No matches in the test string.</div>

          <div v-else class="matches-list">
            <div v-for="(m, i) in matches" :key="i" class="match-item">
              <div class="match-header">
                <span class="match-num">#{{ i + 1 }}</span>
                <code class="match-val">{{ m[0] || '(empty)' }}</code>
                <span class="match-pos">index {{ m.index }}</span>
              </div>
              <div v-if="m.length > 1" class="match-groups">
                <div v-for="(g, j) in m.slice(1)" :key="j" class="group-row">
                  <span class="group-label">Group {{ j + 1 }}</span>
                  <code class="group-val">{{ g ?? 'undefined' }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Guide -->
    <div class="tool-card guide-card">
      <div class="guide-header" @click="guideOpen = !guideOpen">
        <div class="guide-title">
          <i class="pi pi-book" />
          Quick Reference
        </div>
        <i class="pi" :class="guideOpen ? 'pi-chevron-up' : 'pi-chevron-down'" />
      </div>

      <div v-show="guideOpen" class="guide-body">
        <div v-for="section in guide" :key="section.title" class="guide-section">
          <div class="guide-section-title">{{ section.title }}</div>
          <div class="guide-rows">
            <div v-for="item in section.items" :key="item.pattern" class="guide-row">
              <code class="guide-pattern">{{ item.pattern }}</code>
              <span class="guide-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'

// ── state ─────────────────────────────────────────────────────────────────────

const pattern    = ref('')
const testString = ref('')
const flags      = ref(['g'])
const guideOpen  = ref(true)

const availableFlags = [
  { value: 'g', label: 'Global — find all matches' },
  { value: 'i', label: 'Case insensitive' },
  { value: 'm', label: 'Multiline — ^ and $ match line boundaries' },
  { value: 's', label: 'Dot-all — . matches newline' },
]

function toggleFlag(f) {
  flags.value = flags.value.includes(f)
    ? flags.value.filter((x) => x !== f)
    : [...flags.value, f]
}

// ── regex engine ───────────────────────────────────────────────────────────────

const patternError = computed(() => {
  if (!pattern.value) return ''
  try { new RegExp(pattern.value, flags.value.join('')); return '' }
  catch (e) { return e.message }
})

const regex = computed(() => {
  if (!pattern.value || patternError.value) return null
  // always include 'g' internally for exec loop; honour other flags
  const f = [...new Set([...flags.value, 'g'])].join('')
  return new RegExp(pattern.value, f)
})

const matches = computed(() => {
  if (!regex.value || !testString.value) return []
  const re = new RegExp(regex.value.source, regex.value.flags)
  const result = []
  let m
  while ((m = re.exec(testString.value)) !== null) {
    result.push(m)
    if (m[0].length === 0) re.lastIndex++ // avoid infinite loop on zero-width matches
    if (result.length > 500) break        // safety cap
  }
  return result
})

// ── highlighted HTML ──────────────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const highlightedHtml = computed(() => {
  const text = testString.value
  if (!regex.value || !matches.value.length) return escHtml(text)

  let html = ''
  let cursor = 0
  for (const m of matches.value) {
    html += escHtml(text.slice(cursor, m.index))
    html += `<mark class="hl">${escHtml(m[0] || '')}</mark>`
    cursor = m.index + m[0].length
  }
  html += escHtml(text.slice(cursor))
  return html
})

// ── guide ─────────────────────────────────────────────────────────────────────

const guide = [
  {
    title: 'Anchors',
    items: [
      { pattern: '^', desc: 'Start of string (or line in multiline mode)' },
      { pattern: '$', desc: 'End of string (or line in multiline mode)' },
      { pattern: '\\b', desc: 'Word boundary' },
      { pattern: '\\B', desc: 'Non-word boundary' },
    ],
  },
  {
    title: 'Character Classes',
    items: [
      { pattern: '.', desc: 'Any character except newline (use s flag for newline)' },
      { pattern: '\\d / \\D', desc: 'Digit [0-9] / Non-digit' },
      { pattern: '\\w / \\W', desc: 'Word char [a-zA-Z0-9_] / Non-word char' },
      { pattern: '\\s / \\S', desc: 'Whitespace / Non-whitespace' },
      { pattern: '[abc]', desc: 'Any one of a, b, or c' },
      { pattern: '[^abc]', desc: 'Any character except a, b, or c' },
      { pattern: '[a-z]', desc: 'Character in range a–z' },
    ],
  },
  {
    title: 'Quantifiers',
    items: [
      { pattern: '*', desc: '0 or more (greedy)' },
      { pattern: '+', desc: '1 or more (greedy)' },
      { pattern: '?', desc: '0 or 1 (greedy)' },
      { pattern: '{n}', desc: 'Exactly n times' },
      { pattern: '{n,}', desc: 'n or more times' },
      { pattern: '{n,m}', desc: 'Between n and m times' },
      { pattern: '*? +? ??', desc: 'Lazy (non-greedy) versions — match as few as possible' },
    ],
  },
  {
    title: 'Groups & Lookaround',
    items: [
      { pattern: '(...)', desc: 'Capturing group' },
      { pattern: '(?:...)', desc: 'Non-capturing group' },
      { pattern: '(?<name>...)', desc: 'Named capturing group' },
      { pattern: '(?=...)', desc: 'Positive lookahead — followed by' },
      { pattern: '(?!...)', desc: 'Negative lookahead — not followed by' },
      { pattern: '(?<=...)', desc: 'Positive lookbehind — preceded by' },
      { pattern: '(?<!...)', desc: 'Negative lookbehind — not preceded by' },
    ],
  },
  {
    title: 'Flags',
    items: [
      { pattern: 'g', desc: 'Global — find all matches, not just the first' },
      { pattern: 'i', desc: 'Case insensitive' },
      { pattern: 'm', desc: 'Multiline — ^ and $ match start/end of each line' },
      { pattern: 's', desc: 'Dot-all — . also matches \\n' },
    ],
  },
  {
    title: 'Common Patterns',
    items: [
      { pattern: '\\d{4}-\\d{2}-\\d{2}', desc: 'ISO date (e.g. 2024-05-17)' },
      { pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.]+', desc: 'Email address' },
      { pattern: 'https?://[^\\s]+', desc: 'URL starting with http or https' },
      { pattern: '#[0-9a-fA-F]{3,6}', desc: 'Hex color code' },
      { pattern: '\\b\\d{1,3}(\\.\\d{1,3}){3}\\b', desc: 'IPv4 address' },
    ],
  },
]
</script>

<style scoped>
.regex-tester {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── pattern bar ── */
.pattern-bar { padding: 0.875rem 1.25rem; }

.pattern-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.delimiter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.4rem;
  color: var(--text-secondary);
  line-height: 1;
  user-select: none;
}

.pattern-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 1rem;
  color: var(--text-primary);
  caret-color: var(--accent);
}

.pattern-input::placeholder { color: var(--text-secondary); opacity: 0.5; }

.flag-group {
  display: flex;
  gap: 0.25rem;
}

.flag-btn {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.flag-btn:hover { border-color: var(--accent); color: var(--accent); }
.flag-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.pattern-status { margin-left: auto; }

/* ── main layout ── */
.main-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.left-col, .right-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── test card ── */
.test-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.test-input {
  width: 100%;
  min-height: 180px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.75rem;
  background: var(--bg-page);
  color: var(--text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.82rem;
  line-height: 1.7;
  resize: vertical;
  outline: none;
  transition: border-color 0.15s;
}

.test-input:focus { border-color: var(--accent); }

/* ── highlighted preview ── */
.preview-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.highlighted-output {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.82rem;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 0.75rem;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
}

.highlighted-output :deep(.hl) {
  background: rgba(99, 102, 241, 0.25);
  color: var(--text-primary);
  border-radius: 3px;
  outline: 1px solid rgba(99, 102, 241, 0.5);
}

/* ── matches ── */
.matches-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 180px;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.match-count {
  background: var(--accent);
  color: #fff;
  border-radius: 10px;
  font-size: 0.7rem;
  padding: 0.05rem 0.45rem;
  font-weight: 700;
}

.empty-state {
  font-size: 0.85rem;
  color: var(--text-secondary);
  padding: 0.5rem 0;
}
.error-text { color: #ef4444; }

.matches-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 420px;
  overflow-y: auto;
}

.match-item {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.match-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-page);
}

.match-num {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
  min-width: 24px;
}

.match-val {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  color: var(--accent);
  word-break: break-all;
}

.match-pos {
  font-size: 0.72rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.match-groups {
  border-top: 1px solid var(--border-color);
  padding: 0.375rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.group-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
}

.group-label {
  color: var(--text-secondary);
  min-width: 56px;
}

.group-val {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
}

/* ── guide ── */
.guide-card { padding: 0; overflow: hidden; }

.guide-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.5rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}

.guide-header:hover { background: rgba(0, 0, 0, 0.02); }
.dark-mode .guide-header:hover { background: rgba(255, 255, 255, 0.03); }

.guide-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
}

.guide-title .pi { color: var(--accent); }

.guide-body {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0;
  border-top: 1px solid var(--border-color);
}

.guide-section {
  padding: 1rem 1.5rem;
  border-right: 1px solid var(--border-color);
}

.guide-section:last-child { border-right: none; }
.guide-section:nth-child(3) { border-right: none; }
.guide-section:nth-child(4),
.guide-section:nth-child(5),
.guide-section:nth-child(6) {
  border-top: 1px solid var(--border-color);
}

.guide-section-title {
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--accent);
  margin-bottom: 0.625rem;
}

.guide-rows { display: flex; flex-direction: column; gap: 0.375rem; }

.guide-row {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  font-size: 0.8rem;
}

.guide-pattern {
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.05rem 0.35rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.guide-desc { color: var(--text-secondary); line-height: 1.4; }
</style>
