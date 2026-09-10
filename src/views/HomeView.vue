<template>
  <div class="container mt-5 text-center">

    <h2>Welcome</h2>

    <div v-if="currentUser">

      <p>
        Logged in as:
        <strong>{{ currentUser.username }}</strong>
      </p>

      <p>
        Role:
        <strong>{{ currentUser.role }}</strong>
      </p>

      <router-link
        v-if="currentUser.role === 'admin'"
        to="/admin"
        class="btn btn-primary me-2"
      >
        Admin Dashboard
      </router-link>

      <button
        class="btn btn-danger"
        @click="logout"
      >
        Logout
      </button>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentUser = ref(
  JSON.parse(
    localStorage.getItem('currentUser')
  )
)

const logout = () => {
  localStorage.removeItem('currentUser')
  router.push('/login')
}
</script>