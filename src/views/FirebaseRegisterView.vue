<template>
  <main class="container my-5" style="max-width: 540px">
    <h1>Create an account</h1>
    <p>All fields are required. Existing Firebase accounts continue to work.</p>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <form @submit.prevent="register" :aria-busy="busy">
      <label for="register-email" class="form-label">Email</label>
      <input id="register-email" v-model="email" type="email" autocomplete="username" class="form-control mb-3" required :disabled="busy" />
      <label for="register-password" class="form-label">Password (at least eight characters)</label>
      <input id="register-password" v-model="password" type="password" autocomplete="new-password" class="form-control mb-3" minlength="8" required :disabled="busy" />
      <label for="register-confirm" class="form-label">Confirm password</label>
      <input id="register-confirm" v-model="confirmPassword" type="password" autocomplete="new-password" class="form-control mb-3" minlength="8" required :disabled="busy" />
      <button class="btn btn-primary" :disabled="busy">{{ busy ? 'Creating account…' : 'Create account' }}</button>
    </form>
    <p class="mt-3">Already registered? <router-link to="/login">Sign in</router-link></p>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { browserLocalPersistence, createUserWithEmailAndPassword, setPersistence } from 'firebase/auth'
import { auth } from '../firebase/auth'
import { authErrorMessage } from '../firebase/auth-errors'
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const busy = ref(false)
const router = useRouter()
async function register() {
  error.value = ''
  if (!email.value.trim() || password.value.length < 8 || password.value !== confirmPassword.value) {
    error.value = 'Enter a valid email and matching passwords of at least eight characters.'
    return
  }
  busy.value = true
  try {
    await setPersistence(auth, browserLocalPersistence)
    await createUserWithEmailAndPassword(auth, email.value.trim(), password.value)
    password.value = ''
    confirmPassword.value = ''
    await router.push('/home')
  } catch (err) { error.value = authErrorMessage(err.code) }
  finally { busy.value = false }
}
</script>
