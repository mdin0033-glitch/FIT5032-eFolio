<template>
  <main class="container py-4">
    <nav class="d-flex flex-wrap gap-3 mb-3" aria-label="API documentation navigation">
      <router-link to="/home">Home</router-link><router-link to="/resources">Resources</router-link><router-link to="/events">Events</router-link>
    </nav>
    <h1>Public REST API</h1>
    <p>Read-only JSON endpoints for educational resources and community events. No authentication is required. Responses include selected public fields and never include user profiles, emails, passwords or administrator data.</p>
    <p>Some entries are coursework examples; their <code>sample</code> field is <code>true</code>.</p>
    <section v-for="endpoint in endpoints" :key="endpoint.key" class="card card-body my-4" :aria-labelledby="endpoint.key + '-title'">
      <h2 :id="endpoint.key + '-title'" class="h4">GET {{ endpoint.label }}</h2>
      <p>{{ endpoint.description }}</p>
      <p class="endpoint"><a v-if="endpoint.url" :href="endpoint.url" target="_blank" rel="noopener noreferrer">{{ endpoint.url }}</a><span v-else>Endpoint configuration is missing.</span></p>
      <p><strong>Public fields:</strong> {{ endpoint.fields }}.</p>
      <form class="row g-2 align-items-end" @submit.prevent="tryEndpoint(endpoint)">
        <div class="col-sm-7"><label :for="endpoint.key + '-category'" class="form-label">Category (optional, exact match)</label><input :id="endpoint.key + '-category'" v-model="queries[endpoint.key].category" class="form-control" maxlength="80" /></div>
        <div class="col-sm-3"><label :for="endpoint.key + '-limit'" class="form-label">Limit (1–100)</label><input :id="endpoint.key + '-limit'" v-model="queries[endpoint.key].limit" type="number" class="form-control" min="1" max="100" required /></div>
        <div class="col-sm-2"><button class="btn btn-primary w-100" :disabled="busy[endpoint.key] || !endpoint.url">{{ busy[endpoint.key] ? 'Loading…' : 'Try GET' }}</button></div>
      </form>
      <p v-if="errors[endpoint.key]" role="alert" class="alert alert-danger mt-3">{{ errors[endpoint.key] }}</p>
      <p v-if="busy[endpoint.key]" role="status">Calling the live endpoint…</p>
      <pre v-if="responses[endpoint.key]" class="mt-3 p-3 bg-light rounded" tabindex="0" :aria-label="endpoint.label + ' live JSON response'">{{ JSON.stringify(responses[endpoint.key], null, 2) }}</pre>
    </section>
    <h2 class="h4">Parameters and responses</h2>
    <p><code>limit</code> defaults to 20, with a maximum of 100. <code>category</code> filters by an exact category value. Pass a returned <code>nextCursor</code> as <code>cursor</code> to get the next page. IDs determine page order. An empty result returns HTTP 200 with an empty array and a null cursor.</p>
    <p>HTTP 400: invalid query. HTTP 405: unsupported method (only GET is accepted). HTTP 500: data service unavailable. CORS allows third-party websites to read these public endpoints. Responses may be cached for 60 seconds.</p>
  </main>
</template>
<script setup>
import { reactive } from 'vue'
import axios from 'axios'
const endpoints = [
  { key: 'resources', label: 'Resources', url: import.meta.env.VITE_PUBLIC_RESOURCES_URL, description: 'Retrieve public learning resources from the existing books collection.', fields: 'id, isbn, name, category, sample' },
  { key: 'events', label: 'Events', url: import.meta.env.VITE_PUBLIC_EVENTS_URL, description: 'Retrieve public community event listings from Firestore.', fields: 'id, title, category, location, date, status, sample' }
]
const queries = reactive({ resources: { category: '', limit: 5 }, events: { category: '', limit: 5 } })
const responses = reactive({})
const errors = reactive({})
const busy = reactive({})
async function tryEndpoint(endpoint) {
  if (busy[endpoint.key]) return
  busy[endpoint.key] = true
  errors[endpoint.key] = ''
  responses[endpoint.key] = null
  try {
    const query = queries[endpoint.key]
    const params = { limit: query.limit }
    if (query.category.trim()) params.category = query.category.trim()
    const { data } = await axios.get(endpoint.url, { params, timeout: 20000 })
    responses[endpoint.key] = data
  } catch (error) {
    errors[endpoint.key] = error.response?.status === 400 ? error.response.data.error : 'The endpoint could not be reached. Check your connection and try again.'
  } finally { busy[endpoint.key] = false }
}
</script>
<style scoped>
.endpoint, pre { overflow-wrap: anywhere; }
pre { max-height: 32rem; white-space: pre-wrap; }
</style>
