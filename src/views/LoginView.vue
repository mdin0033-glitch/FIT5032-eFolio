<template>
  <div class="container mt-5">
    <div class="row justify-content-center">
      <div class="col-md-6">

        <h2 class="text-center mb-4">Login</h2>

        <form @submit.prevent="login">

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
            Login
          </button>

        </form>

        <p class="text-center mt-3">
          Don't have an account?

          <router-link to="/register">
            Register
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

const login = () => {

  // Admin account
  if (
    username.value === 'admin' &&
    password.value === 'Admin123!'
  ) {
    const adminUser = {
      username: 'admin',
      role: 'admin'
    }

    localStorage.setItem(
      'currentUser',
      JSON.stringify(adminUser)
    )

    router.push('/home')
    return
  }

  // Normal registered user
  const storedUser =
    localStorage.getItem('registeredUser')

  if (!storedUser) {
    message.value = 'No registered user found.'
    return
  }

  const user = JSON.parse(storedUser)

  if (
    username.value === user.username &&
    password.value === user.password
  ) {
    localStorage.setItem(
      'currentUser',
      JSON.stringify(user)
    )

    router.push('/home')
  } else {
    message.value =
      'Invalid username or password.'
  }
}
</script>