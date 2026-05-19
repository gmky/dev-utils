<template>
  <div class="jwt-inspector">
    <div class="main-layout">
      <!-- LEFT: token input -->
      <div class="token-col">
        <div class="tool-card token-card">
          <div class="input-card-header">
            <label class="field-label">JWT Token</label>
            <div class="input-actions">
              <Tag v-if="token && isValid && verifyResult === 'valid'"        severity="success" value="Signature valid ✓" />
              <Tag v-else-if="token && isValid && verifyResult === 'invalid'" severity="danger"  value="Signature invalid ✗" />
              <Tag v-else-if="token && isValid && isSigned"                   severity="success" value="Re-signed ✓" />
              <Tag v-else-if="token && isValid && isDirty"                    severity="warn"    value="Modified" />
              <Tag v-else-if="token && isValid"                               severity="success" value="Valid JWT" />
              <Tag v-else-if="token && !isValid"                              severity="danger"  value="Invalid JWT" />
              <Button label="Clear" severity="secondary" size="small" text @click="clear" v-if="token" />
              <Button label="Paste" severity="secondary" size="small" text @click="paste" />
            </div>
          </div>
          <Textarea
            v-model="token"
            class="jwt-textarea"
            :class="{ 'is-invalid': token && !isValid }"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            @input="onTokenInput"
          />
        </div>
      </div>

      <!-- RIGHT: decoded sections -->
      <div class="decoded-col" :class="{ 'is-placeholder': !isValid }">
        <!-- Header -->
        <div class="tool-card">
          <div class="section-header">
            <span class="section-dot header-dot" />
            <span class="section-title">Header</span>
            <span v-if="headerError" class="json-error-badge">Invalid JSON</span>
            <Button icon="pi pi-copy" text rounded size="small" @click="copyText(headerJson)" v-tooltip="'Copy'" :disabled="!isValid" />
          </div>
          <Textarea
            v-model="headerJson"
            :rows="headerRows"
            class="json-editor"
            :class="{ 'is-invalid': headerError }"
            :readonly="!isValid"
            spellcheck="false"
            @input="onHeaderEdit"
          />
          <p v-if="headerError" class="error-msg">{{ headerError }}</p>
        </div>

        <!-- Payload -->
        <div class="tool-card">
          <div class="section-header">
            <span class="section-dot payload-dot" />
            <span class="section-title">Payload</span>
            <span v-if="payloadError" class="json-error-badge">Invalid JSON</span>
            <Button icon="pi pi-copy" text rounded size="small" @click="copyText(payloadJson)" v-tooltip="'Copy'" :disabled="!isValid" />
          </div>
          <Tabs value="json" class="payload-tabs">
            <TabList>
              <Tab value="json">JSON</Tab>
              <Tab value="claims">Claims</Tab>
            </TabList>
            <TabPanels>
              <TabPanel value="json">
                <Textarea
                  v-model="payloadJson"
                  :rows="payloadRows"
                  class="json-editor"
                  :class="{ 'is-invalid': payloadError }"
                  :readonly="!isValid"
                  spellcheck="false"
                  @input="onPayloadEdit"
                />
                <p v-if="payloadError" class="error-msg">{{ payloadError }}</p>
              </TabPanel>
              <TabPanel value="claims">
                <div v-if="claims.length" class="claims-list">
                  <div v-for="claim in claims" :key="claim.key" class="claim-row">
                    <span class="claim-key">{{ claim.key }}</span>
                    <span class="claim-value" :class="claim.type">{{ claim.display }}</span>
                    <Button icon="pi pi-copy" text rounded size="small" @click="copyText(claim.raw)" v-tooltip.left="'Copy value'" class="claim-copy" />
                  </div>
                </div>
                <p v-else class="empty-claims">No claims found.</p>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </div>

        <!-- Signature -->
        <div class="tool-card">
          <div class="section-header">
            <span class="section-dot signature-dot" />
            <span class="section-title">Signature</span>
            <Tag v-if="isDirty && !isSigned" severity="warn" value="Invalidated by edits" />
          </div>
          <p class="signature-value">{{ signature }}</p>
        </div>
      </div>
    </div>

    <!-- SECRET KEY (full width) -->
    <div v-if="isValid" class="tool-card secret-card">
        <div class="section-header">
          <i class="pi pi-shield section-icon" />
          <span class="section-title">Secret Key</span>
          <Tag :value="algorithm" severity="secondary" class="alg-tag" />
          <Tag v-if="!isHmac" severity="warn" value="HMAC only" v-tooltip="'Verify/re-sign is supported for HS256, HS384, HS512 only'" />
        </div>

        <div class="secret-row">
          <div class="secret-input-wrap">
            <InputText
              v-model="secretKey"
              :type="showSecret ? 'text' : 'password'"
              placeholder="your-secret-key"
              class="secret-input"
              :disabled="!isHmac"
              @input="resetVerify"
            />
            <button class="secret-toggle" @click="showSecret = !showSecret" type="button" v-tooltip="showSecret ? 'Hide' : 'Show'">
              <i class="pi" :class="showSecret ? 'pi-eye-slash' : 'pi-eye'" />
            </button>
          </div>

          <div class="secret-encoding">
            <label class="encoding-label">Secret is</label>
            <SelectButton
              v-model="secretEncoding"
              :options="encodingOptions"
              :disabled="!isHmac"
              @change="resetVerify"
              size="small"
            />
          </div>

          <Button
            label="Verify"
            icon="pi pi-check-circle"
            :disabled="!isHmac || !secretKey"
            :loading="verifying"
            severity="secondary"
            outlined
            @click="verify"
          />
          <Button
            label="Re-sign"
            icon="pi pi-sync"
            :disabled="!isHmac || !secretKey || !!headerError || !!payloadError"
            :loading="signing"
            severity="primary"
            @click="resign"
          />
        </div>

        <div v-if="verifyResult" class="verify-result" :class="verifyResult">
          <i class="pi" :class="verifyResult === 'valid' ? 'pi-check-circle' : 'pi-times-circle'" />
          <span v-if="verifyResult === 'valid'">Signature is <strong>valid</strong> for this secret.</span>
          <span v-else-if="verifyResult === 'invalid'">Signature is <strong>invalid</strong> — wrong secret or token has been tampered with.</span>
          <span v-else-if="verifyResult === 'error'">{{ verifyError }}</span>
        </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed } from 'vue'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import SelectButton from 'primevue/selectbutton'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

// ── placeholder defaults ──────────────────────────────────────────────────────

const PLACEHOLDER_HEADER    = JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2)
const PLACEHOLDER_PAYLOAD   = JSON.stringify({ sub: '1234567890', name: 'John Doe', iat: 1516239022 }, null, 2)
const PLACEHOLDER_SIGNATURE = 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

// ── state ────────────────────────────────────────────────────────────────────

const token      = ref('')
const isValid    = ref(false)
const isDirty    = ref(false)
const isSigned   = ref(false)
const signature  = ref(PLACEHOLDER_SIGNATURE)

const headerJson  = ref(PLACEHOLDER_HEADER)
const payloadJson = ref(PLACEHOLDER_PAYLOAD)
const headerError  = ref('')
const payloadError = ref('')

const secretKey      = ref('')
const showSecret     = ref(false)
const secretEncoding = ref('UTF-8')
const encodingOptions = ['UTF-8', 'Base64']

const verifyResult = ref(null)   // null | 'valid' | 'invalid' | 'error'
const verifyError  = ref('')
const verifying    = ref(false)
const signing      = ref(false)

// ── algorithm detection ───────────────────────────────────────────────────────

const HMAC_HASH = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }

const algorithm = computed(() => {
  try { return JSON.parse(headerJson.value)?.alg ?? 'unknown' } catch { return 'unknown' }
})

const isHmac = computed(() => algorithm.value in HMAC_HASH)

// ── base64url helpers ─────────────────────────────────────────────────────────

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=')
  return JSON.parse(atob(padded))
}

function b64urlEncode(obj) {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlEncodeRaw(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// ── WebCrypto ─────────────────────────────────────────────────────────────────

function secretBytes() {
  if (secretEncoding.value === 'Base64') {
    const b64 = secretKey.value.replace(/-/g, '+').replace(/_/g, '/')
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
  }
  return new TextEncoder().encode(secretKey.value)
}

async function importHmacKey(usage) {
  return crypto.subtle.importKey(
    'raw',
    secretBytes(),
    { name: 'HMAC', hash: HMAC_HASH[algorithm.value] },
    false,
    usage,
  )
}

async function hmacSign(signingInput) {
  const key = await importHmacKey(['sign'])
  const buf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingInput))
  return b64urlEncodeRaw(new Uint8Array(buf))
}

async function hmacVerify(signingInput, sigB64url) {
  const key = await importHmacKey(['verify'])
  const sigBytes = Uint8Array.from(
    atob(sigB64url.replace(/-/g, '+').replace(/_/g, '/').padEnd(sigB64url.length + ((4 - (sigB64url.length % 4)) % 4), '=')),
    (c) => c.charCodeAt(0),
  )
  return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(signingInput))
}

// ── signing input ─────────────────────────────────────────────────────────────

function currentSigningInput() {
  const encodedHeader  = b64urlEncode(JSON.parse(headerJson.value))
  const encodedPayload = b64urlEncode(JSON.parse(payloadJson.value))
  return `${encodedHeader}.${encodedPayload}`
}

// ── verify ────────────────────────────────────────────────────────────────────

async function verify() {
  verifyResult.value = null
  verifyError.value  = ''
  verifying.value    = true
  try {
    const signingInput = currentSigningInput()
    const ok = await hmacVerify(signingInput, signature.value)
    verifyResult.value = ok ? 'valid' : 'invalid'
  } catch (e) {
    verifyResult.value = 'error'
    verifyError.value  = e.message
  } finally {
    verifying.value = false
  }
}

// ── re-sign ───────────────────────────────────────────────────────────────────

async function resign() {
  signing.value = true
  verifyResult.value = null
  try {
    const signingInput = currentSigningInput()
    const newSig = await hmacSign(signingInput)
    signature.value = newSig
    token.value     = `${signingInput}.${newSig}`
    isDirty.value   = false
    isSigned.value  = true
  } catch (e) {
    verifyResult.value = 'error'
    verifyError.value  = e.message
  } finally {
    signing.value = false
  }
}

// ── token parse ───────────────────────────────────────────────────────────────

function onTokenInput() {
  isDirty.value  = false
  isSigned.value = false
  resetVerify()
  headerError.value  = ''
  payloadError.value = ''
  try {
    const parts = token.value.trim().split('.')
    if (parts.length !== 3) throw new Error()
    const header  = b64urlDecode(parts[0])
    const payload = b64urlDecode(parts[1])
    signature.value   = parts[2]
    headerJson.value  = JSON.stringify(header,  null, 2)
    payloadJson.value = JSON.stringify(payload, null, 2)
    isValid.value     = true
  } catch {
    isValid.value   = false
    signature.value = ''
    headerJson.value  = ''
    payloadJson.value = ''
  }
}

// ── edit handlers ─────────────────────────────────────────────────────────────

function onHeaderEdit() {
  headerError.value = ''
  try {
    JSON.parse(headerJson.value)
    rebuildToken()
  } catch (e) {
    headerError.value = e.message
  }
}

function onPayloadEdit() {
  payloadError.value = ''
  try {
    JSON.parse(payloadJson.value)
    rebuildToken()
  } catch (e) {
    payloadError.value = e.message
  }
}

function rebuildToken() {
  try {
    const signingInput = currentSigningInput()
    token.value    = `${signingInput}.${signature.value}`
    isDirty.value  = true
    isSigned.value = false
    resetVerify()
  } catch { /* surfaced per-field */ }
}

function resetVerify() {
  verifyResult.value = null
  verifyError.value  = ''
}

// ── claims ────────────────────────────────────────────────────────────────────

const TIME_CLAIMS = ['exp', 'iat', 'nbf']

const claims = computed(() => {
  try {
    return Object.entries(JSON.parse(payloadJson.value)).map(([key, val]) => {
      if (TIME_CLAIMS.includes(key) && typeof val === 'number') {
        const date = new Date(val * 1000)
        return { key, display: date.toLocaleString(), raw: String(val), type: key === 'exp' && date < new Date() ? 'claim-expired' : 'claim-time' }
      }
      return { key, display: String(val), raw: String(val), type: 'claim-default' }
    })
  } catch { return [] }
})

// ── helpers ───────────────────────────────────────────────────────────────────

const headerRows  = computed(() => Math.max(4, (headerJson.value.match(/\n/g)  || []).length + 1))
const payloadRows = computed(() => Math.max(4, (payloadJson.value.match(/\n/g) || []).length + 1))

function copyText(text) { navigator.clipboard.writeText(text) }

async function paste() {
  token.value = await navigator.clipboard.readText()
  onTokenInput()
}

function clear() {
  token.value = ''
  isValid.value = isDirty.value = isSigned.value = false
  signature.value  = PLACEHOLDER_SIGNATURE
  headerJson.value  = PLACEHOLDER_HEADER
  payloadJson.value = PLACEHOLDER_PAYLOAD
  headerError.value = payloadError.value = ''
  resetVerify()
}
</script>

<style scoped>
.jwt-inspector {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── input card ── */
.input-card { display: flex; flex-direction: column; gap: 0.625rem; }

.input-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-actions { display: flex; align-items: center; gap: 0.5rem; }

.field-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.jwt-textarea {
  width: 100%;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
  flex: 1;
  resize: none;
}

/* ── two-column main layout ── */
.main-layout {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 1.25rem;
  align-items: stretch;
}

.token-col {
  display: flex;
  flex-direction: column;
}

.token-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.decoded-col {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.decoded-col.is-placeholder {
  opacity: 0.45;
  pointer-events: none;
  user-select: none;
}

/* ── section header ── */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
}

.section-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.header-dot    { background: #f59e0b; }
.payload-dot   { background: #6366f1; }
.signature-dot { background: #10b981; }

.section-icon {
  font-size: 1rem;
  color: var(--accent);
}

.section-title {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-primary);
  flex: 1;
}

.alg-tag { font-family: monospace; font-size: 0.8rem; }

/* ── JSON editor ── */
.json-editor {
  width: 100%;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
  line-height: 1.6;
  resize: none;
  transition: border-color 0.15s;
}

.json-error-badge {
  font-size: 0.7rem;
  font-weight: 600;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 4px;
  padding: 0.1rem 0.4rem;
}

.is-invalid { border-color: #ef4444 !important; }
.error-msg  { font-size: 0.75rem; color: #ef4444; margin-top: 0.375rem; font-family: monospace; }

/* ── payload tabs ── */
.payload-tabs {
  --p-tabs-tab-padding: 0.5rem 0.875rem;
}

.payload-tabs :deep(.p-tabpanels) {
  padding: 0.875rem 0 0;
  background: transparent;
}

.payload-tabs :deep(.p-tablist) {
  background: transparent;
}

.empty-claims {
  font-size: 0.82rem;
  color: var(--text-secondary);
  padding: 0.5rem 0;
}

/* ── claims ── */
.claims-list { display: flex; flex-direction: column; gap: 0.375rem; }

.claim-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  background: var(--bg-page);
  border: 1px solid var(--border-color);
  font-size: 0.82rem;
}

.claim-copy { flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
.claim-row:hover .claim-copy { opacity: 1; }

.claim-key     { font-family: monospace; font-weight: 600; color: var(--text-secondary); min-width: 80px; flex-shrink: 0; }
.claim-value   { flex: 1; text-align: right; }
.claim-default { color: var(--text-primary); }
.claim-time    { color: #6366f1; }
.claim-expired { color: #ef4444; font-weight: 600; }

/* ── signature ── */
.signature-value {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.78rem;
  color: var(--text-secondary);
  word-break: break-all;
  line-height: 1.6;
}

/* ── secret card ── */
.secret-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.secret-input-wrap {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.secret-input { width: 100%; padding-right: 2.5rem; font-family: monospace; }

.secret-toggle {
  position: absolute;
  right: 0.625rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 0;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.secret-toggle:hover { color: var(--text-primary); }

.secret-encoding {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.encoding-label {
  font-size: 0.78rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

/* ── verify result ── */
.verify-result {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.875rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.verify-result .pi { font-size: 1.1rem; }

.verify-result.valid {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #059669;
}
.verify-result.valid .pi { color: #10b981; }

.verify-result.invalid {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.25);
  color: #dc2626;
}
.verify-result.invalid .pi { color: #ef4444; }

.verify-result.error {
  background: rgba(245, 158, 11, 0.08);
  border: 1px solid rgba(245, 158, 11, 0.25);
  color: #b45309;
}
</style>
