<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h1 class="mb-4">Sign in</h1>

        <form @submit.prevent="signin">
          <div class="mb-3">
            <label class="form-label">Email</label>

            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="Email"
              required
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>

            <input
              v-model="password"
              type="password"
              class="form-control"
              placeholder="Password"
              required
            />
          </div>

          <div v-if="message" class="alert alert-danger">
            {{ message }}
          </div>

          <button type="submit" class="btn btn-primary">
            Sign in via Firebase
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

import {
  getAuth,
  signInWithEmailAndPassword
} from 'firebase/auth'

import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const message = ref('')

const router = useRouter()
const auth = getAuth()

const signin = async () => {
  message.value = ''

  try {
    await signInWithEmailAndPassword(
      auth,
      email.value,
      password.value
    )

    console.log('Firebase Sign in Successful!')
    console.log(auth.currentUser)

    localStorage.setItem(
      'currentUser',
      JSON.stringify({
        username: auth.currentUser.email,
        role: 'user'
      })
    )

    await router.push('/home')
  } catch (error) {
    console.error(error.code)
    message.value = `Firebase sign in failed: ${error.code}`
  }
}
</script>
