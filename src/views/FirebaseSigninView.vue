<template>
  <main class="container my-5" style="max-width: 540px">
    <h1>Sign in</h1>
    <p>Use your existing Firebase account to access ClimateLearn Melbourne.</p>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <p v-if="success" class="alert alert-success" role="status">{{ success }}</p>
    <form @submit.prevent="signin" :aria-busy="busy">
      <label for="signin-email" class="form-label">Email (required)</label>
      <input id="signin-email" v-model="email" type="email" autocomplete="username" class="form-control mb-3" required :disabled="busy" />
      <label for="signin-password" class="form-label">Password (required)</label>
      <input id="signin-password" v-model="password" type="password" autocomplete="current-password" class="form-control mb-3" required :disabled="busy" />
      <button class="btn btn-primary me-2" :disabled="busy">{{ busy ? 'Please wait…' : 'Sign in' }}</button>
      <button type="button" class="btn btn-outline-secondary" :disabled="busy" @click="resetPassword">Reset password</button>
    </form>
    <p class="mt-3">New here? <router-link to="/register">Create an account</router-link></p>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { browserLocalPersistence, setPersistence, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/auth'
import { authErrorMessage } from '../firebase/auth-errors'
const email = ref('')
const password = ref('')
const error = ref('')
const success = ref('')
const busy = ref(false)
const router = useRouter()
const route = useRoute()
async function signin() {
  error.value = ''
  success.value = ''
  if (!email.value.trim() || !password.value) { error.value = 'Enter your email and password.'; return }
  busy.value = true
  try {
    await setPersistence(auth, browserLocalPersistence)
    await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    password.value = ''
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/home'
    await router.push(redirect.startsWith('/') && !redirect.startsWith('//') && router.resolve(redirect).matched.length ? redirect : '/home')
  } catch (err) { error.value = authErrorMessage(err.code) }
  finally { busy.value = false }
}
async function resetPassword() {
  error.value = ''
  success.value = ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { error.value = 'Enter your account email first.'; return }
  busy.value = true
  try {
    await sendPasswordResetEmail(auth, email.value.trim())
    success.value = 'If an account exists for this email, a reset link will arrive in its inbox.'
  } catch (err) { error.value = authErrorMessage(err.code) }
  finally { busy.value = false }
}
</script>
