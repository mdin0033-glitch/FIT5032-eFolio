<template>
  <section class="card card-body mt-4" aria-labelledby="favourites-title">
    <h2 id="favourites-title" class="h4">Favourite resources</h2>
    <p>Your favourites are saved on this browser. Saved resource data can be viewed while this app remains open offline.</p>
    <div class="d-flex flex-wrap gap-2 align-items-end">
      <div class="flex-grow-1">
        <label class="form-label" for="favourite-choice">Choose a resource</label>
        <select id="favourite-choice" v-model="selected" class="form-select"><option value="">Select a resource</option><option v-for="row in rows" :key="row.id" :value="row.id">{{ row.name }}</option></select>
      </div>
      <button class="btn btn-outline-primary" type="button" :disabled="!selected || favourites.includes(selected)" @click="add">Add favourite</button>
    </div>
    <p v-if="storageError" role="alert" class="alert alert-warning mt-3">Browser storage is unavailable. Favourites cannot be saved after leaving this page.</p>
    <p class="mt-3" role="status">{{ favourites.length }} favourites saved.</p>
    <ul class="list-group">
      <li v-for="id in favourites" :key="id" class="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2">
        <span>{{ rows.find(row => row.id === id)?.name || 'Resource not present in the current data' }}</span>
        <button type="button" class="btn btn-outline-danger btn-sm" :aria-label="'Remove favourite ' + (rows.find(row => row.id === id)?.name || id)" @click="remove(id)">Remove</button>
      </li>
    </ul>
    <p v-if="!favourites.length">No favourites yet. Choose a resource to keep it here.</p>
  </section>
</template>
<script setup>
import { ref, watch } from 'vue'
import { readSaved, writeSaved } from '../utils/browser-storage'
defineProps({ rows: { type: Array, required: true } })
const key = 'climatelearn:favourites'
const favourites = ref(readSaved(key, value => Array.isArray(value) && value.length <= 100 && value.every(id => typeof id === 'string')) || [])
const selected = ref('')
const storageError = ref(false)
function add() { if (selected.value && !favourites.value.includes(selected.value) && favourites.value.length < 100) favourites.value.push(selected.value) }
function remove(id) { favourites.value = favourites.value.filter(value => value !== id) }
watch(favourites, value => { storageError.value = !writeSaved(key, value) }, { deep: true })
</script>
