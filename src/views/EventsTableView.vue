<template>
  <main class="container table-page py-4">
    <nav aria-label="Event page navigation" class="d-flex flex-wrap gap-3 mb-4">
      <router-link to="/home">Home</router-link>
      <router-link to="/resources">Education resources</router-link>
    </nav>
    <h1>Community Events</h1>
    <p>Environmental learning activities in Melbourne. Coursework example events illustrate the application; their dates and statuses are sample data, not real bookings.</p>
    <InteractiveDataTable table-id="events-table" title="Community Events" filename="climatelearn-events" :columns="columns" :rows="tableRows" :loading="loading" :error="error" @refresh="load" />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import InteractiveDataTable from '../components/InteractiveDataTable.vue'
import { useFirestoreTable } from '../composables/useFirestoreTable'
const { rows, loading, error, load } = useFirestoreTable('events')
const columns = [
  { key: 'title', label: 'Event title' },
  { key: 'category', label: 'Category' },
  { key: 'location', label: 'Location' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' }
]
const tableRows = computed(() => rows.value.map(row => ({ ...row, source: row.sample ? 'Coursework example' : 'Community listing' })))
</script>

<style scoped>
.table-page { min-width: 0; }
:global(#app:has(.table-page)) { display: block; width: 100%; }
:global(body:has(.table-page)) { display: block; }
</style>
