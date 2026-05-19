<template>
  <div class="json-beautifier">
    <div class="main-layout">
      <!-- LEFT: input -->
      <div class="col">
        <div class="tool-card editor-card">
          <div class="card-header">
            <label class="field-label">Input</label>
            <div class="actions">
              <Button label="Paste" severity="secondary" size="small" text @click="paste" />
              <Button label="Clear" severity="secondary" size="small" text @click="clear" v-if="input" />
            </div>
          </div>
          <div class="cm-wrap" :class="{ 'cm-invalid': error }">
            <Codemirror
              v-model="input"
              :extensions="inputExtensions"
              :style="{ height: '100%' }"
            />
          </div>
          <Message v-if="error" severity="error" :closable="false" class="error-message">
            {{ error }}
          </Message>
        </div>
      </div>

      <!-- RIGHT: output -->
      <div class="col">
        <div class="tool-card editor-card">
          <div class="card-header">
            <label class="field-label">Output</label>
            <div class="actions">
              <div class="indent-toggle">
                <label class="field-label">Indent</label>
                <SelectButton v-model="indent" :options="indentOptions" size="small" />
              </div>
              <Button icon="pi pi-copy" label="Copy" severity="secondary" size="small" text @click="copyOutput" :disabled="!output" />
            </div>
          </div>
          <div class="cm-wrap cm-readonly">
            <Codemirror
              v-model="output"
              :extensions="outputExtensions"
              :disabled="true"
              :style="{ height: '100%' }"
              placeholder="Beautified JSON will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Message from 'primevue/message'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

const input  = ref('')
const output = ref('')
const error  = ref('')
const indent = ref(2)
const indentOptions = [2, 4]

watch(input, process)
watch(indent, process)

const baseTheme = EditorView.theme({
  '&': { fontSize: '0.82rem', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  '.cm-scroller': { lineHeight: '1.7', overflow: 'auto' },
  '.cm-content': { padding: '0.75rem' },
  '.cm-focused': { outline: 'none' },
})

const inputExtensions = computed(() => [
  json(),
  baseTheme,
  ...(themeStore.isDark ? [oneDark] : []),
])

const outputExtensions = computed(() => [
  json(),
  baseTheme,
  EditorView.editable.of(false),
  ...(themeStore.isDark ? [oneDark] : []),
])

function process() {
  error.value  = ''
  output.value = ''
  const raw = input.value.trim()
  if (!raw) return
  try {
    output.value = JSON.stringify(JSON.parse(raw), null, indent.value)
  } catch (e) {
    error.value = e.message
  }
}

async function paste() {
  input.value = await navigator.clipboard.readText()
  process()
}

function clear() {
  input.value  = ''
  output.value = ''
  error.value  = ''
}

function copyOutput() {
  navigator.clipboard.writeText(output.value)
}
</script>

<style scoped>
.json-beautifier {
  display: flex;
  flex-direction: column;
  height: calc(100vh - var(--header-height) - 3.5rem);
}

.main-layout {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: stretch;
  min-height: 0;
}

.col {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.editor-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  min-height: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.indent-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* CodeMirror wrapper */
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
  border-color: var(--accent);
}

.cm-wrap :deep(.cm-scroller) {
  border-radius: 8px;
}

.cm-readonly :deep(.cm-editor) {
  background: var(--bg-page);
  opacity: 0.92;
}

.cm-invalid {
  border-color: #ef4444 !important;
}

.error-message {
  flex-shrink: 0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
}
</style>
