<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h2 class="text-center mb-4">Register</h2>

        <form @submit.prevent="register">

          <div class="mb-3">
            <label class="form-label">Username</label>
            <input
              v-model="username"
              type="text"
              class="form-control"
            />
          </div>

          <div class="mb-3">
            <label class="form-label">Password</label>
            <input
              v-model="password"
              type="password"
              class="form-control"
            />
          </div>

          <div
            v-if="message"
            class="alert alert-danger"
          >
            {{ message }}
          </div>

          <button
            type="submit"
            class="btn btn-primary w-100"
          >
            Register
          </button>

        </form>

        <p class="text-center mt-3">
          Already have an account?
          <router-link to="/login">
            Login
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const message = ref('')

const router = useRouter()

const register = () => {
  if (username.value.length < 3) {
    message.value = 'Username must be at least 3 characters.'
    return
  }

  if (password.value.length < 6) {
    message.value = 'Password must be at least 6 characters.'
    return
  }

  const user = {
    username: username.value,
    password: password.value,
    role: 'user'
  }

  localStorage.setItem('registeredUser', JSON.stringify(user))

  router.push('/login')
}
</script>