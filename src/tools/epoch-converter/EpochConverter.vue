<template>
  <div class="epoch-converter">
    <!-- Current time banner -->
    <div class="tool-card current-time-card">
      <div class="current-time-row">
        <div>
          <div class="field-label">Current Unix Timestamp</div>
          <div class="current-epoch">{{ currentEpoch }}</div>
        </div>
        <div>
          <div class="field-label">UTC</div>
          <div class="current-human">{{ currentUtc }}</div>
        </div>
        <div>
          <div class="field-label">Local</div>
          <div class="current-human">{{ currentLocal }}</div>
        </div>
        <Button icon="pi pi-copy" text rounded v-tooltip="'Copy epoch'" @click="copyText(String(currentEpoch))" />
      </div>
    </div>

    <div class="converters-grid">
      <!-- Epoch → Human -->
      <div class="tool-card">
        <div class="card-title">
          <i class="pi pi-arrow-right" />
          Epoch to Human-Readable
        </div>

        <div class="field-group">
          <label class="field-label">Unix Timestamp</label>
          <div class="input-row">
            <InputText v-model="epochInput" placeholder="e.g. 1716000000" class="flex-1" @input="epochToHuman" />
            <Button label="Now" size="small" severity="secondary" outlined @click="setNowEpoch" />
          </div>
        </div>

        <div v-if="epochResult" class="result-grid">
          <div class="result-row" v-for="row in epochResult" :key="row.label">
            <span class="result-label">{{ row.label }}</span>
            <span class="result-value">{{ row.value }}</span>
            <Button icon="pi pi-copy" text rounded size="small" @click="copyText(row.value)" v-tooltip="'Copy'" />
          </div>
        </div>

        <Message v-if="epochError" severity="error">{{ epochError }}</Message>
      </div>

      <!-- Human → Epoch -->
      <div class="tool-card">
        <div class="card-title">
          <i class="pi pi-arrow-left" />
          Human-Readable to Epoch
        </div>

        <div class="field-group">
          <label class="field-label">Date & Time</label>
          <div class="input-row">
            <InputText v-model="humanInput" placeholder="e.g. 2024-05-17T12:00:00" class="flex-1" @input="humanToEpoch" />
            <Button label="Now" size="small" severity="secondary" outlined @click="setNowHuman" />
          </div>
        </div>

        <div v-if="humanResult" class="result-grid">
          <div class="result-row" v-for="row in humanResult" :key="row.label">
            <span class="result-label">{{ row.label }}</span>
            <span class="result-value">{{ row.value }}</span>
            <Button icon="pi pi-copy" text rounded size="small" @click="copyText(row.value)" v-tooltip="'Copy'" />
          </div>
        </div>

        <Message v-if="humanError" severity="error">{{ humanError }}</Message>
      </div>
    </div>

    <!-- Quick reference -->
    <div class="tool-card">
      <div class="card-title"><i class="pi pi-info-circle" /> Quick Reference</div>
      <div class="ref-grid">
        <div class="ref-item" v-for="item in quickRef" :key="item.label">
          <span class="ref-label">{{ item.label }}</span>
          <span class="ref-epoch">{{ item.epoch }}</span>
          <span class="ref-date">{{ item.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Message from 'primevue/message'

const epochInput = ref('')
const epochResult = ref(null)
const epochError = ref('')
const humanInput = ref('')
const humanResult = ref(null)
const humanError = ref('')

const currentEpoch = ref(Math.floor(Date.now() / 1000))
const currentUtc = ref('')
const currentLocal = ref('')

let ticker = null

function updateCurrent() {
  const now = new Date()
  currentEpoch.value = Math.floor(now.getTime() / 1000)
  currentUtc.value = now.toUTCString()
  currentLocal.value = now.toLocaleString()
}

onMounted(() => {
  updateCurrent()
  ticker = setInterval(updateCurrent, 1000)
})
onUnmounted(() => clearInterval(ticker))

function formatEpochResults(ts) {
  const d = new Date(ts * 1000)
  return [
    { label: 'UTC', value: d.toUTCString() },
    { label: 'ISO 8601', value: d.toISOString() },
    { label: 'Local', value: d.toLocaleString() },
    { label: 'Relative', value: relativeTime(d) },
    { label: 'Milliseconds', value: String(ts * 1000) },
  ]
}

function epochToHuman() {
  epochError.value = ''
  epochResult.value = null
  const raw = epochInput.value.trim()
  if (!raw) return
  let ts = Number(raw)
  if (isNaN(ts)) { epochError.value = 'Not a valid number'; return }
  if (raw.length === 13) ts = Math.floor(ts / 1000)
  const d = new Date(ts * 1000)
  if (isNaN(d.getTime())) { epochError.value = 'Timestamp out of range'; return }
  epochResult.value = formatEpochResults(ts)
}

function humanToEpoch() {
  humanError.value = ''
  humanResult.value = null
  const raw = humanInput.value.trim()
  if (!raw) return
  const d = new Date(raw)
  if (isNaN(d.getTime())) { humanError.value = 'Could not parse date string'; return }
  const ts = Math.floor(d.getTime() / 1000)
  humanResult.value = [
    { label: 'Unix (seconds)', value: String(ts) },
    { label: 'Unix (ms)', value: String(ts * 1000) },
    { label: 'UTC', value: d.toUTCString() },
    { label: 'ISO 8601', value: d.toISOString() },
    { label: 'Relative', value: relativeTime(d) },
  ]
}

function relativeTime(date) {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000)
  if (Math.abs(diff) < 60) return `${Math.abs(diff)}s ${diff >= 0 ? 'ago' : 'from now'}`
  if (Math.abs(diff) < 3600) return `${Math.floor(Math.abs(diff) / 60)}m ${diff >= 0 ? 'ago' : 'from now'}`
  if (Math.abs(diff) < 86400) return `${Math.floor(Math.abs(diff) / 3600)}h ${diff >= 0 ? 'ago' : 'from now'}`
  return `${Math.floor(Math.abs(diff) / 86400)}d ${diff >= 0 ? 'ago' : 'from now'}`
}

function setNowEpoch() {
  epochInput.value = String(Math.floor(Date.now() / 1000))
  epochToHuman()
}

function setNowHuman() {
  humanInput.value = new Date().toISOString().slice(0, 19)
  humanToEpoch()
}

function copyText(text) {
  navigator.clipboard.writeText(text)
}

const quickRef = computed(() => {
  const now = Math.floor(Date.now() / 1000)
  const items = [
    { label: 'Now', epoch: now },
    { label: '1 hour ago', epoch: now - 3600 },
    { label: '24 hours ago', epoch: now - 86400 },
    { label: '7 days ago', epoch: now - 7 * 86400 },
    { label: '30 days ago', epoch: now - 30 * 86400 },
    { label: 'Unix epoch start', epoch: 0 },
  ]
  return items.map((i) => ({
    ...i,
    epoch: String(i.epoch),
    date: new Date(i.epoch * 1000).toUTCString(),
  }))
})
</script>

<style scoped>
.epoch-converter {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.current-time-card {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-color: transparent;
  color: #fff;
}

.current-time-row {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.current-epoch {
  font-size: 1.75rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', monospace;
  letter-spacing: -0.02em;
  color: #fff;
}

.current-time-card .field-label {
  color: rgba(255, 255, 255, 0.7);
}

.current-human {
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
  margin-top: 2px;
}

.converters-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  margin-bottom: 1.25rem;
}

.card-title .pi {
  color: var(--accent);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
}

.input-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.flex-1 { flex: 1; }

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.82rem;
}

.result-label {
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 100px;
  flex-shrink: 0;
}

.result-value {
  flex: 1;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-primary);
  word-break: break-all;
}

.ref-grid {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.ref-item {
  display: grid;
  grid-template-columns: 140px 140px 1fr;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.82rem;
}

.ref-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.ref-epoch {
  font-family: monospace;
  color: var(--accent);
}

.ref-date {
  color: var(--text-primary);
}
</style>
