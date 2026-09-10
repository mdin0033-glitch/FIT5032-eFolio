<template>
  <div class="container mt-5 text-center">
    <h2>Welcome</h2>

    <p v-if="currentUser">
      Logged in as:
      <strong>{{ currentUser.username }}</strong>
    </p>

    <button
      class="btn btn-danger"
      @click="logout"
    >
      Logout
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const currentUser = ref(
  JSON.parse(localStorage.getItem('currentUser'))
)

const logout = () => {
  localStorage.removeItem('currentUser')
  router.push('/login')
}
</script>