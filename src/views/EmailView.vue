<template>
  <main class="container my-5" style="max-width: 760px">
    <router-link to="/home">Home</router-link>
    <h1 class="my-4">Send an education resource</h1>
    <p>Send one PDF, TXT or CSV attachment, up to 2 MiB. All fields are required.</p>
    <p v-if="!authUser" class="alert alert-info" role="status">
      <router-link to="/FireLogin">Sign in with Firebase</router-link> to send email.
    </p>
    <section v-else-if="!authUser.emailVerified" class="alert alert-info" aria-label="Account verification">
      <p>Please verify your Firebase account email before sending resources.</p>
      <button class="btn btn-outline-primary me-2" :disabled="busy" @click="requestVerification">Send verification link</button>
      <button class="btn btn-outline-secondary" :disabled="busy" @click="refreshAccount">I have verified my email</button>
    </section>
    <p v-if="error" id="email-error" class="alert alert-danger" role="alert">{{ error }}</p>
    <p v-if="success" class="alert alert-success" role="status">{{ success }}</p>
    <form @submit.prevent="sendEmail" :aria-busy="busy">
      <div class="mb-3">
        <label for="email-recipient" class="form-label">Recipient email (required)</label>
        <input id="email-recipient" v-model="recipient" type="email" autocomplete="email" class="form-control" maxlength="254" required :disabled="busy" />
      </div>
      <div class="mb-3">
        <label for="email-subject" class="form-label">Subject (required)</label>
        <input id="email-subject" v-model="subject" class="form-control" maxlength="150" required :disabled="busy" />
      </div>
      <div class="mb-3">
        <label for="email-message" class="form-label">Message (required)</label>
        <textarea id="email-message" v-model="message" class="form-control" rows="6" maxlength="10000" required :disabled="busy" />
      </div>
      <div class="mb-4">
        <label for="email-attachment" class="form-label">Attachment (required)</label>
        <input id="email-attachment" ref="fileInput" type="file" class="form-control" accept=".pdf,.txt,.csv" required :disabled="busy" aria-describedby="attachment-help" @change="selectFile" />
        <p id="attachment-help" class="form-text">PDF, UTF-8 TXT or CSV. Maximum 2 MiB; empty files are not accepted.</p>
        <p v-if="attachment">Selected: {{ attachment.name }} ({{ Math.ceil(attachment.size / 1024) }} KiB)</p>
      </div>
      <button class="btn btn-primary" :disabled="busy || !authUser?.emailVerified">
        {{ busy ? 'Please wait…' : 'Send email with attachment' }}
      </button>
    </form>
  </main>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { getAuth, onAuthStateChanged, reload, sendEmailVerification } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'

const auth = getAuth()
const authUser = ref(auth.currentUser)
const recipient = ref('')
const subject = ref('')
const message = ref('')
const attachment = ref(null)
const fileInput = ref(null)
const busy = ref(false)
const error = ref('')
const success = ref('')
let unsubscribe
onMounted(() => { unsubscribe = onAuthStateChanged(auth, user => { authUser.value = user }) })
onUnmounted(() => unsubscribe?.())

function selectFile(event) {
  error.value = ''
  success.value = ''
  const file = event.target.files?.[0]
  attachment.value = null
  if (!file) return
  if (!/\.(pdf|txt|csv)$/i.test(file.name) || !file.size || file.size > 2 * 1024 * 1024) {
    error.value = 'Select a non-empty PDF, TXT or CSV file no larger than 2 MiB.'
    event.target.value = ''
    return
  }
  attachment.value = file
}

function encodeFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = () => reject(new Error('Unable to read the selected attachment.'))
    reader.readAsDataURL(file)
  })
}

async function sendEmail() {
  error.value = ''
  success.value = ''
  if (!auth.currentUser?.emailVerified) { error.value = 'Sign in and verify your Firebase account email first.'; return }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(recipient.value.trim()) ||
      !subject.value.trim() || /[\r\n]/.test(subject.value) || !message.value.trim() || !attachment.value) {
    error.value = 'Enter a valid recipient, subject, message and attachment.'
    return
  }
  busy.value = true
  try {
    const content = await encodeFile(attachment.value)
    // Firebase automatically attaches the signed-in user's ID token to this callable.
    const send = httpsCallable(getFunctions(undefined, 'australia-southeast2'), 'sendEmailWithAttachment', { timeout: 40000 })
    const result = await send({ recipient: recipient.value.trim(), subject: subject.value.trim(), message: message.value.trim(),
      attachment: { name: attachment.value.name, content } })
    if (result.data.accepted !== true) throw new Error('The email service did not confirm acceptance.')
    success.value = result.data.message
    recipient.value = ''
    subject.value = ''
    message.value = ''
    attachment.value = null
    fileInput.value.value = ''
  } catch (err) {
    error.value = err.message || 'Unable to send the email. Please try again later.'
  } finally { busy.value = false }
}

async function requestVerification() {
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    await sendEmailVerification(auth.currentUser)
    success.value = 'Verification link sent. Check your inbox, follow the link, then refresh your account here.'
  } catch { error.value = 'Unable to send the verification link. Wait a moment and try again.' }
  finally { busy.value = false }
}

async function refreshAccount() {
  busy.value = true
  error.value = ''
  try {
    await reload(auth.currentUser)
    await auth.currentUser.getIdToken(true)
    authUser.value = { ...auth.currentUser, emailVerified: auth.currentUser.emailVerified }
    success.value = auth.currentUser.emailVerified ? 'Account verified. You can now send a resource.' : 'Verification is not complete yet.'
  } catch { error.value = 'Unable to refresh your account. Please sign in again.' }
  finally { busy.value = false }
}
</script>
