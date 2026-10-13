<template>
  <main class="container py-4">
    <nav class="d-flex flex-wrap gap-3 mb-3" aria-label="Admin dashboard navigation">
      <router-link to="/home">Home</router-link>
      <router-link to="/resources">Resources</router-link>
      <router-link to="/events">Events</router-link>
      <router-link to="/api-docs">Public API documentation</router-link>
    </nav>
    <h1>Admin Dashboard</h1>
    <p>Manage ClimateLearn Melbourne using statistics read from Firestore. Coursework example entries are included and labelled below.</p>
    <button class="btn btn-outline-primary mb-3" :disabled="loading" @click="load">{{ loading ? 'Loading…' : 'Refresh statistics' }}</button>
    <p v-if="loading" role="status">Loading secure administrator statistics…</p>
    <p v-if="error" role="alert" class="alert alert-danger">{{ error }}</p>
    <template v-if="stats">
      <div class="row g-3 mb-4" aria-label="Dashboard totals">
        <div v-for="item in totals" :key="item.label" class="col-12 col-sm-4">
          <section class="card card-body h-100"><h2 class="h5">{{ item.label }}</h2><p class="display-6 mb-0" :data-stat="item.key">{{ item.value ?? 'Unavailable' }}</p></section>
        </div>
      </div>
      <p class="small">Includes {{ stats.sampleTotals.resources }} coursework example resources and {{ stats.sampleTotals.events }} coursework example events. User statistics contain only a count.</p>
      <p v-if="stats.totals.users === null" role="status">The authentication service did not provide a user count. Resource and event statistics remain available.</p>
      <div class="row g-4 mb-4">
        <div class="col-12 col-lg-6"><FirestoreChart chart-id="resources-chart" title="Resources by category" :items="stats.resourcesByCategory" /></div>
        <div class="col-12 col-lg-6"><FirestoreChart chart-id="events-chart" title="Events by status" :items="stats.eventsByStatus" /></div>
      </div>
      <div class="row g-4">
        <section class="col-12 col-lg-6" aria-labelledby="recent-resources">
          <h2 id="recent-resources" class="h4">Recently added resources</h2>
          <ul class="list-group"><li v-for="row in stats.recentResources" :key="row.id" class="list-group-item">{{ row.name }} <span v-if="row.sample" class="badge text-bg-secondary">Coursework example</span><br /><small>Added {{ formatDate(row.createdAt) }}</small></li></ul>
          <p v-if="!stats.recentResources.length">No resources available.</p>
        </section>
        <section class="col-12 col-lg-6" aria-labelledby="recent-events">
          <h2 id="recent-events" class="h4">Recently added events</h2>
          <ul class="list-group"><li v-for="row in stats.recentEvents" :key="row.id" class="list-group-item">{{ row.title }} <span v-if="row.sample" class="badge text-bg-secondary">Coursework example</span><br /><small>{{ row.status }} · Added {{ formatDate(row.createdAt) }}</small></li></ul>
          <p v-if="!stats.recentEvents.length">No events available.</p>
        </section>
      </div>
      <p class="small mt-4">Statistics fetched {{ formatDate(stats.fetchedAt) }}.</p>
    </template>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { getFunctions, httpsCallable } from 'firebase/functions'
import FirestoreChart from '../components/FirestoreChart.vue'
const loading = ref(false)
const error = ref('')
const stats = ref(null)
const totals = computed(() => [
  { key: 'resources', label: 'Resources', value: stats.value?.totals.resources },
  { key: 'events', label: 'Events', value: stats.value?.totals.events },
  { key: 'users', label: 'Registered users', value: stats.value?.totals.users }
])
const formatDate = value => new Date(value).toLocaleString('en-AU')
async function load() {
  if (loading.value) return
  loading.value = true
  error.value = ''
  try {
    const getStats = httpsCallable(getFunctions(undefined, 'australia-southeast2'), 'getAdminStatistics')
    const result = await getStats()
    stats.value = result.data
  } catch (err) {
    error.value = err.code === 'functions/permission-denied' || err.code === 'functions/unauthenticated'
      ? 'Administrator access is required. Sign in with an administrator account.'
      : 'Statistics could not be loaded. Check your connection and try Refresh statistics.'
  } finally { loading.value = false }
}
onMounted(load)
</script>
