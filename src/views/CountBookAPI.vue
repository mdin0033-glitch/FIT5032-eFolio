<template>
  <main class="container my-5">
    <router-link to="/home">Home</router-link>
    <h1 class="my-4">CountBookAPI</h1>
    <p v-if="loading" role="status">Loading book count...</p>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <pre v-if="data !== null">{{ JSON.stringify(data, null, 2) }}</pre>
    <button class="btn btn-primary" :disabled="loading" @click="loadCount">Retry</button>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

const countBooksUrl = import.meta.env.VITE_COUNT_BOOKS_URL?.trim()
const data = ref(null)
const loading = ref(false)
const error = ref('')

async function loadCount() {
  loading.value = true
  data.value = null
  error.value = ''
  try {
    if (!countBooksUrl) {
      throw new Error('Set VITE_COUNT_BOOKS_URL in .env and restart the dev server.')
    }
    const response = await axios.get(countBooksUrl, { timeout: 15000 })
    if (!Number.isInteger(response.data.count) || response.data.count < 0) {
      throw new Error('Invalid book count response.')
    }
    data.value = response.data
  } catch (err) {
    error.value = `Unable to load book count: ${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(loadCount)
</script>
