<template>
  <section :aria-label="title" :aria-busy="loading">
    <div class="d-flex flex-wrap align-items-end gap-2 mb-3">
      <div class="flex-grow-1">
        <label :for="tableId + '-search'" class="form-label">Search all columns</label>
        <input :id="tableId + '-search'" v-model="search" class="form-control" type="search" placeholder="Search this table" :disabled="loading" />
      </div>
      <button type="button" class="btn btn-outline-secondary" :disabled="loading" @click="reset">Reset filters and sorting</button>
      <button type="button" class="btn btn-outline-primary" :disabled="loading" @click="$emit('refresh')">Refresh data</button>
    </div>

    <fieldset class="border rounded p-3 mb-3" :disabled="loading">
      <legend class="float-none w-auto fs-6 px-2">Search individual columns</legend>
      <div class="row g-3">
        <div v-for="column in columns" :key="column.key" class="col-12 col-sm-6 col-lg-4">
          <label :for="tableId + '-filter-' + column.key" class="form-label">{{ column.label }}</label>
          <input :id="tableId + '-filter-' + column.key" v-model="filters[column.key]" class="form-control" type="search" :placeholder="'Filter ' + column.label" />
        </div>
      </div>
    </fieldset>

    <p class="small">Filters and sorting are saved on this browser.</p>
    <p v-if="storageError" role="alert" class="alert alert-warning">Browser storage is unavailable. Your table preferences cannot be saved.</p>
    <p v-if="loading" role="status" class="alert alert-info">Loading live Firestore data…</p>
    <p v-if="error" role="alert" class="alert alert-danger">{{ error }}</p>
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <button type="button" class="btn btn-success" :disabled="loading || !filtered.length || exporting" @click="exportData('csv')">Export CSV</button>
      <button type="button" class="btn btn-outline-success" :disabled="loading || !filtered.length || exporting" @click="exportData('pdf')">{{ exporting ? 'Preparing export…' : 'Export PDF' }}</button>
      <span class="small">Exports include all {{ filtered.length }} matching records, across all pages.</span>
    </div>
    <p v-if="exportMessage" role="status" class="alert alert-success">{{ exportMessage }}</p>
    <p v-if="exportError" role="alert" class="alert alert-danger">{{ exportError }}</p>

    <div class="table-responsive" tabindex="0" :aria-label="title + ' table; scroll horizontally on small screens'">
      <table :id="tableId" class="table table-striped table-hover align-middle">
        <caption class="caption-top">{{ title }}. Click a column heading to sort. Ten rows per page.</caption>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" scope="col" :aria-sort="sortKey === column.key ? sortDirection : 'none'">
              <button type="button" class="sort-button" :aria-label="'Sort by ' + column.label + (sortKey === column.key ? ', currently ' + sortDirection : '')" @click="sortBy(column.key)">
                {{ column.label }} <span aria-hidden="true">{{ sortKey === column.key ? (sortDirection === 'ascending' ? '↑' : '↓') : '↕' }}</span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in visibleRows" :key="row.id">
            <td v-for="column in columns" :key="column.key">{{ cellText(row[column.key]) || '—' }}</td>
          </tr>
          <tr v-if="!loading && !visibleRows.length">
            <td :colspan="columns.length">{{ rows.length ? 'No records match your search. Reset the filters to try again.' : 'No records are available yet.' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <nav class="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3" :aria-label="title + ' pagination'">
      <p class="mb-0" role="status">{{ filtered.length ? start + 1 : 0 }}–{{ Math.min(start + pageSize, filtered.length) }} of {{ filtered.length }} records · Page {{ page }} of {{ pageCount }}</p>
      <div class="d-flex gap-2">
        <button type="button" class="btn btn-outline-primary" :disabled="page === 1 || loading" @click="page--">Previous</button>
        <button type="button" class="btn btn-outline-primary" :disabled="page === pageCount || loading" @click="page++">Next</button>
      </div>
    </nav>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { cellText, filterRows, sortRows } from '../utils/table-data'
import { downloadCsv, downloadPdf } from '../utils/table-export'
import { readSaved, writeSaved, tablePreferences } from '../utils/browser-storage'

const props = defineProps({
  tableId: { type: String, required: true },
  title: { type: String, required: true },
  filename: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  loading: Boolean,
  error: { type: String, default: '' }
})
defineEmits(['refresh'])
const pageSize = 10
const storageKey = 'climatelearn:table:' + props.tableId
const saved = tablePreferences(readSaved(storageKey), props.columns)
const search = ref(saved.search)
const filters = reactive(saved.filters)
const sortKey = ref(saved.sortKey)
const sortDirection = ref(saved.sortDirection)
const storageError = ref(false)
const page = ref(1)
const exporting = ref(false)
const exportMessage = ref('')
const exportError = ref('')
const filtered = computed(() => sortRows(filterRows(props.rows, props.columns, search.value, filters), sortKey.value, sortDirection.value))
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const start = computed(() => (page.value - 1) * pageSize)
const visibleRows = computed(() => filtered.value.slice(start.value, start.value + pageSize))
watch([search, filters, sortKey, sortDirection], () => {
  page.value = 1; exportMessage.value = ''; exportError.value = ''
  storageError.value = !writeSaved(storageKey, { search: search.value, filters: { ...filters }, sortKey: sortKey.value, sortDirection: sortDirection.value })
}, { deep: true })
watch(pageCount, count => { page.value = Math.min(page.value, count) })
function sortBy(key) {
  sortDirection.value = sortKey.value === key && sortDirection.value === 'ascending' ? 'descending' : 'ascending'
  sortKey.value = key
}
function reset() {
  search.value = ''
  Object.keys(filters).forEach(key => { filters[key] = '' })
  sortKey.value = props.columns[0].key
  sortDirection.value = 'ascending'
  page.value = 1
}
async function exportData(format) {
  exporting.value = true
  exportMessage.value = ''
  exportError.value = ''
  // Freeze the filtered dataset so async PDF loading cannot change the export.
  const data = filtered.value.map(row => ({ ...row }))
  const filename = props.filename + '-' + new Date().toISOString().slice(0, 10)
  try {
    if (format === 'csv') downloadCsv(props.columns, data, filename)
    else await downloadPdf(props.columns, data, props.title, filename)
    exportMessage.value = format.toUpperCase() + ' download prepared for ' + data.length + ' matching records.'
  } catch {
    exportError.value = 'The export could not be prepared. Please try again.'
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.sort-button { border: 0; padding: .35rem 0; background: transparent; color: #14532d; font-weight: 700; text-align: left; }
.sort-button:focus-visible, button:focus-visible, input:focus-visible, .table-responsive:focus-visible { outline: 3px solid #14532d; outline-offset: 3px; }
td { max-width: 30rem; overflow-wrap: anywhere; }
</style>
