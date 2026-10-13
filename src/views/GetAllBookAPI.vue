<template>
  <main class="container my-5">
    <router-link to="/home">Home</router-link>
    <h1 class="my-4">GetAllBookAPI</h1>
    <p v-if="loading" role="status">Loading books...</p>
    <p v-if="error" class="alert alert-danger" role="alert">{{ error }}</p>
    <pre v-if="data !== null">{{ JSON.stringify(data, null, 2) }}</pre>
    <button class="btn btn-primary" :disabled="loading" @click="loadBooks">Retry</button>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

const getAllBooksUrl = import.meta.env.VITE_GET_ALL_BOOKS_URL?.trim()
const data = ref(null)
const loading = ref(false)
const error = ref('')

async function loadBooks() {
  loading.value = true
  data.value = null
  error.value = ''
  try {
    if (!getAllBooksUrl) {
      throw new Error('Set VITE_GET_ALL_BOOKS_URL in .env and restart the dev server.')
    }
    const response = await axios.get(getAllBooksUrl, { timeout: 15000 })
    if (!Array.isArray(response.data.books)) throw new Error('Invalid books response.')
    data.value = response.data
  } catch (err) {
    error.value = `Unable to load books: ${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(loadBooks)
</script>
