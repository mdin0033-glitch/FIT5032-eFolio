<template>
  <main class="container my-5">
    <router-link to="/home">Home</router-link>
    <h1 class="my-4">Book Counter</h1>
    <button class="btn btn-primary" :disabled="loading" @click="getBookCount">
      {{ loading ? 'Loading...' : 'Get Book Count' }}
    </button>
    <p v-if="count !== null" class="mt-4">Total number of books: {{ count }}</p>
    <p v-if="error" class="alert alert-danger mt-4" role="alert">{{ error }}</p>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const countBooksUrl = import.meta.env.VITE_COUNT_BOOKS_URL?.trim()
const count = ref(null)
const loading = ref(false)
const error = ref('')

async function getBookCount() {
  loading.value = true
  error.value = ''
  count.value = null
  try {
    if (!countBooksUrl) {
      throw new Error('Set VITE_COUNT_BOOKS_URL in .env and restart the dev server.')
    }
    const { data } = await axios.get(countBooksUrl, { timeout: 15000 })
    if (!Number.isInteger(data.count) || data.count < 0) throw new Error('Invalid book count response.')
    count.value = data.count
  } catch (err) {
    error.value = `Unable to get book count: ${err.message}`
  } finally {
    loading.value = false
  }
}
</script>
