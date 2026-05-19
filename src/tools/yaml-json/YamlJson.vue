<template>
  <div class="yaml-json">
    <div class="main-layout">
      <!-- YAML pane -->
      <div class="pane-col">
        <div class="tool-card pane-card">
          <div class="pane-header">
            <span class="pane-label yaml-label">YAML</span>
            <div class="pane-actions">
              <Tag v-if="yamlError" severity="danger" class="error-tag" v-tooltip.bottom="yamlError">
                <i class="pi pi-exclamation-circle" /> Error
              </Tag>
              <Button icon="pi pi-copy" text rounded size="small" v-tooltip.top="'Copy'" @click="copy(yamlCode)" :disabled="!!yamlError || !yamlCode" />
              <Button icon="pi pi-upload" text rounded size="small" v-tooltip.top="'Paste from clipboard'" @click="pasteYaml" />
              <Button icon="pi pi-trash" text rounded size="small" v-tooltip.top="'Clear'" @click="clearAll" v-if="yamlCode || jsonCode" />
            </div>
          </div>
          <div class="cm-wrap" :class="{ 'cm-error': yamlError }">
            <Codemirror v-model="yamlCode" :extensions="yamlExtensions" :style="{ height: '100%' }" @update="onYamlUpdate" />
          </div>
        </div>
      </div>

      <!-- Arrow / swap -->
      <div class="arrow-col">
        <div class="arrow-btn-wrap">
          <button class="swap-btn" @click="swap" v-tooltip.top="'Swap'">
            <i class="pi pi-arrow-right-arrow-left" />
          </button>
        </div>
      </div>

      <!-- JSON pane -->
      <div class="pane-col">
        <div class="tool-card pane-card">
          <div class="pane-header">
            <span class="pane-label json-label">JSON</span>
            <div class="pane-actions">
              <Tag v-if="jsonError" severity="danger" class="error-tag" v-tooltip.bottom="jsonError">
                <i class="pi pi-exclamation-circle" /> Error
              </Tag>
              <Button icon="pi pi-copy" text rounded size="small" v-tooltip.top="'Copy'" @click="copy(jsonCode)" :disabled="!!jsonError || !jsonCode" />
              <Button icon="pi pi-upload" text rounded size="small" v-tooltip.top="'Paste from clipboard'" @click="pasteJson" />
            </div>
          </div>
          <div class="cm-wrap" :class="{ 'cm-error': jsonError }">
            <Codemirror v-model="jsonCode" :extensions="jsonExtensions" :style="{ height: '100%' }" @update="onJsonUpdate" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { yaml } from '@codemirror/lang-yaml'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import * as YAML from 'js-yaml'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const yamlCode = ref('')
const jsonCode = ref('')
const yamlError = ref('')
const jsonError = ref('')

// track the last value we set programmatically so we can ignore the echo-back
// that CodeMirror fires asynchronously after a programmatic content replacement
let lastYamlSet = ''
let lastJsonSet = ''

// ── CodeMirror setup ──────────────────────────────────────────────────────────

const baseTheme = EditorView.theme({
  '&': { fontSize: '0.82rem', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  '.cm-scroller': { lineHeight: '1.7', overflow: 'auto' },
  '.cm-content': { padding: '0.75rem' },
  '.cm-focused': { outline: 'none' },
})

const yamlExtensions = computed(() => [
  yaml(),
  baseTheme,
  ...(themeStore.isDark ? [oneDark] : []),
])

const jsonExtensions = computed(() => [
  json(),
  baseTheme,
  ...(themeStore.isDark ? [oneDark] : []),
])

// ── conversion ────────────────────────────────────────────────────────────────

function yamlToJson(src) {
  const parsed = YAML.load(src, { json: true })
  return JSON.stringify(parsed, null, 2)
}

function jsonToYaml(src) {
  const parsed = JSON.parse(src)
  return YAML.dump(parsed, { indent: 2, lineWidth: -1, noRefs: true })
}

// ── update handlers ───────────────────────────────────────────────────────────

function onYamlUpdate(viewUpdate) {
  if (!viewUpdate.docChanged) return
  // ignore if this update was caused by us setting yamlCode programmatically
  if (yamlCode.value === lastYamlSet) return
  const src = yamlCode.value.trim()
  if (!src) { lastJsonSet = ''; jsonCode.value = ''; yamlError.value = ''; return }
  try {
    const converted = yamlToJson(src)
    lastJsonSet = converted
    jsonCode.value = converted
    yamlError.value = ''
    jsonError.value = ''
  } catch (e) {
    yamlError.value = e.message
  }
}

function onJsonUpdate(viewUpdate) {
  if (!viewUpdate.docChanged) return
  // ignore if this update was caused by us setting jsonCode programmatically
  if (jsonCode.value === lastJsonSet) return
  const src = jsonCode.value.trim()
  if (!src) { lastYamlSet = ''; yamlCode.value = ''; jsonError.value = ''; return }
  try {
    const converted = jsonToYaml(src)
    lastYamlSet = converted
    yamlCode.value = converted
    jsonError.value = ''
    yamlError.value = ''
  } catch (e) {
    jsonError.value = e.message
  }
}

// ── swap ──────────────────────────────────────────────────────────────────────

function swap() {
  const prevYaml = yamlCode.value
  const prevJson = jsonCode.value
  try {
    if (jsonCode.value.trim()) {
      const newYaml = jsonToYaml(jsonCode.value)
      const newJson = yamlToJson(newYaml)
      lastYamlSet = newYaml
      lastJsonSet = newJson
      yamlCode.value = newYaml
      jsonCode.value = newJson
      yamlError.value = ''
      jsonError.value = ''
    }
  } catch {
    lastYamlSet = prevJson
    lastJsonSet = prevYaml
    yamlCode.value = prevJson
    jsonCode.value = prevYaml
  }
}

// ── clipboard ─────────────────────────────────────────────────────────────────

function copy(text) { navigator.clipboard.writeText(text) }

async function pasteYaml() {
  yamlCode.value = await navigator.clipboard.readText()
  onYamlUpdate({ docChanged: true })
}

async function pasteJson() {
  jsonCode.value = await navigator.clipboard.readText()
  onJsonUpdate({ docChanged: true })
}

function clearAll() {
  yamlCode.value = ''
  jsonCode.value = ''
  yamlError.value = ''
  jsonError.value = ''
}
</script>

<style scoped>
.yaml-json {
  height: calc(100vh - var(--header-height) - 3.5rem);
  display: flex;
  flex-direction: column;
}

.main-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: 0;
  min-height: 0;
}

/* ── pane ── */
.pane-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.pane-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  min-height: 0;
}

.pane-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.pane-label {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  flex: 1;
}

.yaml-label { color: #f59e0b; }
.json-label { color: #6366f1; }

.pane-actions {
  display: flex;
  align-items: center;
  gap: 0.125rem;
}

.error-tag {
  font-size: 0.72rem;
  cursor: default;
}

/* ── CodeMirror wrapper ── */
.cm-wrap {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.15s;
}

.cm-wrap :deep(.cm-editor) {
  height: 100%;
  background: var(--bg-page);
  border-radius: 8px;
}

.cm-wrap :deep(.cm-editor.cm-focused) {
  outline: none;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 25%, transparent);
}

.cm-wrap :deep(.cm-scroller) { border-radius: 8px; }

.cm-error { border-color: #ef4444 !important; }

/* ── arrow / swap ── */
.arrow-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-btn-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.swap-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.swap-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, transparent);
}
</style>
