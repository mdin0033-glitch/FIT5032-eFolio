<template>
  <main class="container table-page py-4">
    <nav aria-label="Resource page navigation" class="d-flex flex-wrap gap-3 mb-4">
      <router-link to="/home">Home</router-link>
      <router-link to="/events">Community events</router-link>
      <router-link to="/add-book">Add a book</router-link>
      <router-link to="/email">Send a resource</router-link>
    </nav>
    <h1>Environmental Education Resources</h1>
    <p>Explore climate literacy learning materials. ISBN is the existing library catalogue field. Items marked Coursework example are demonstration resources, not published books.</p>
    <p v-if="notice" role="status" class="alert alert-info">{{ notice }}</p>
    <InteractiveDataTable table-id="resources-table" title="Environmental Education Resources" filename="climatelearn-resources" :columns="columns" :rows="tableRows" :loading="loading" :error="error" @refresh="load" />
    <FavouriteResources :rows="rows" />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import InteractiveDataTable from '../components/InteractiveDataTable.vue'
import FavouriteResources from '../components/FavouriteResources.vue'
import { useFirestoreTable } from '../composables/useFirestoreTable'
const { rows, loading, error, notice, load } = useFirestoreTable('books')
const columns = [
  { key: 'isbn', label: 'ISBN' },
  { key: 'name', label: 'Resource name' },
  { key: 'category', label: 'Category' },
  { key: 'source', label: 'Source' },
  { key: 'id', label: 'Document ID' }
]
const tableRows = computed(() => rows.value.map(row => ({ ...row, category: row.category || 'Uncategorised', source: row.sample ? 'Coursework example' : 'Library entry' })))
</script>

<style scoped>
.table-page { min-width: 0; }
:global(#app:has(.table-page)) { display: block; width: 100%; }
:global(body:has(.table-page)) { display: block; }
</style>
