<template>
  <main class="container map-page py-4">
    <router-link to="/home">Home</router-link>
    <h1 class="mt-3">Community map</h1>
    <p>Find places in Melbourne and plan a route. Place search uses OpenStreetMap data; driving routes are estimates.</p>

    <form class="row g-2 align-items-end mb-3" @submit.prevent="searchPlaces">
      <div class="col-md-7">
        <label class="form-label" for="place-query">Search for a place</label>
        <input id="place-query" v-model="query" class="form-control" required minlength="3"
          placeholder="Monash University Clayton" autocomplete="off" />
      </div>
      <div class="col-md-3">
        <label class="form-label" for="place-purpose">Use result as</label>
        <select id="place-purpose" v-model="searchPurpose" class="form-select">
          <option value="destination">Destination</option>
          <option value="start">Starting point</option>
        </select>
      </div>
      <div class="col-md-2">
        <button class="btn btn-primary w-100" type="submit" :disabled="searchLoading">{{ searchLoading ? 'Searching…' : 'Search' }}</button>
      </div>
    </form>

    <p v-if="searchError" role="alert" class="alert alert-danger">{{ searchError }}</p>
    <p v-if="searchLoading" role="status">Searching places…</p>
    <p v-if="results.length" role="status" class="visually-hidden">{{ results.length }} places found. Select a result below.</p>
    <section v-if="results.length" aria-labelledby="results-title" class="mb-3">
      <h2 id="results-title" class="h5">Search results</h2>
      <ul class="list-group">
        <li v-for="place in results" :key="place.place_id" class="list-group-item">
          <button type="button" class="btn btn-link text-start p-0" @click="selectPlace(place)">
            {{ place.display_name }}
          </button>
        </li>
      </ul>
    </section>

    <div class="d-flex flex-wrap gap-2 mb-3">
      <button class="btn btn-outline-primary" type="button" :disabled="locationLoading" @click="useCurrentLocation">
        {{ locationLoading ? 'Locating…' : 'Use my location as start' }}
      </button>
      <button class="btn btn-success" type="button" :disabled="!start || !destination || routeLoading" @click="planRoute">
        {{ routeLoading ? 'Planning…' : 'Plan driving route' }}
      </button>
      <button class="btn btn-outline-secondary" type="button" @click="resetRoute">Reset route</button>
    </div>
    <p v-if="locationError" role="alert" class="alert alert-danger">{{ locationError }}</p>
    <p v-if="routeError" role="alert" class="alert alert-danger">{{ routeError }}</p>
    <div class="route-summary mb-3" role="status" aria-live="polite">
      <p class="mb-1"><strong>Start:</strong> {{ start?.label || 'Choose a starting point or use your location.' }}</p>
      <p class="mb-1"><strong>Destination:</strong> {{ destination?.label || 'Search and select a destination.' }}</p>
      <p v-if="routeSummary" class="mb-0"><strong>Driving route:</strong> {{ routeSummary.distance }} km, about {{ routeSummary.duration }} minutes.</p>
    </div>

    <div ref="mapElement" class="community-map" role="application"
      aria-label="Interactive map of Melbourne. Use the text controls above to search and plan a route." tabindex="0"></div>
    <p class="small mt-2">Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>. Place search: Nominatim. Routing: OSRM demo service. Routes are estimates; check local conditions before travelling.</p>
    <p class="small">The start, destination, distance and duration are also available as text above the map.</p>
  </main>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import axios from 'axios'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'

const mapElement = ref(null)
const query = ref('')
const searchPurpose = ref('destination')
const results = ref([])
const searchLoading = ref(false)
const locationLoading = ref(false)
const routeLoading = ref(false)
const searchError = ref('')
const locationError = ref('')
const routeError = ref('')
const routeSummary = ref(null)
const start = ref(null)
const destination = ref(null)
const cache = new Map()
const icon = L.icon({ iconUrl: markerIconUrl, shadowUrl: markerShadowUrl, iconSize: [25, 41], iconAnchor: [12, 41] })
let map
let startMarker
let destinationMarker
let routeLayer
let lastSearch = 0
let locationTimer
let locationRequestId = 0

function showMarker(point, kind) {
  const existing = kind === 'start' ? startMarker : destinationMarker
  if (existing) existing.remove()
  const marker = L.marker([point.lat, point.lon], { icon }).addTo(map)
  const popup = document.createElement('span')
  popup.textContent = `${kind === 'start' ? 'Start' : 'Destination'}: ${point.label}`
  marker.bindPopup(popup).openPopup()
  if (kind === 'start') startMarker = marker
  else destinationMarker = marker
  map.flyTo([point.lat, point.lon], 13)
  resetRoute()
}

async function searchPlaces() {
  const text = query.value.trim()
  searchError.value = ''
  results.value = []
  if (text.length < 3) {
    searchError.value = 'Enter at least three characters to search for a place.'
    return
  }
  searchLoading.value = true
  try {
    const cacheKey = text.toLowerCase()
    if (cache.has(cacheKey)) {
      results.value = cache.get(cacheKey)
    } else {
      const wait = Math.max(0, 1100 - (Date.now() - lastSearch))
      if (wait) await new Promise(resolve => setTimeout(resolve, wait))
      lastSearch = Date.now()
      const { data } = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: text, format: 'json', limit: 5, countrycodes: 'au' },
        headers: { 'Accept-Language': 'en' }, timeout: 15000
      })
      if (!Array.isArray(data)) throw new Error('Unexpected place search response')
      cache.set(cacheKey, data)
      results.value = data
    }
    if (!results.value.length) searchError.value = 'No places found. Try a more specific Melbourne location.'
  } catch {
    searchError.value = 'Place search is unavailable. Please try again shortly.'
  } finally {
    searchLoading.value = false
  }
}

function selectPlace(place) {
  const lat = Number(place.lat)
  const lon = Number(place.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return
  const point = { lat, lon, label: place.display_name }
  if (searchPurpose.value === 'start') start.value = point
  else destination.value = point
  if (searchPurpose.value === 'start') locationError.value = ''
  showMarker(point, searchPurpose.value)
  results.value = []
}

function useCurrentLocation() {
  locationError.value = ''
  if (!navigator.geolocation) {
    locationError.value = 'Your browser does not support location access. Search for a starting point instead.'
    return
  }
  locationLoading.value = true
  const requestId = ++locationRequestId
  locationTimer = window.setTimeout(() => {
    if (requestId !== locationRequestId) return
    locationRequestId++
    locationLoading.value = false
    locationError.value = 'Location request timed out. Try again or search for a starting point.'
  }, 35000)
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    if (requestId !== locationRequestId) return
    clearTimeout(locationTimer)
    const point = { lat: coords.latitude, lon: coords.longitude, label: 'My current location' }
    start.value = point
    showMarker(point, 'start')
    locationLoading.value = false
  }, error => {
    if (requestId !== locationRequestId) return
    clearTimeout(locationTimer)
    locationLoading.value = false
    locationError.value = error.code === 1
      ? 'Location permission was denied. Allow location access in your browser or search for a starting point.'
      : error.code === 3 ? 'Location timed out. Try again or search for a starting point.'
        : 'Your location is unavailable. Search for a starting point instead.'
  }, { timeout: 30000, maximumAge: 60000 })
}

async function planRoute() {
  if (!start.value || !destination.value) return
  routeError.value = ''
  routeLoading.value = true
  resetRoute()
  try {
    const coordinates = [start.value, destination.value].map(point => `${point.lon},${point.lat}`).join(';')
    const { data } = await axios.get(`https://router.project-osrm.org/route/v1/driving/${coordinates}`, {
      params: { overview: 'full', geometries: 'geojson' }, timeout: 20000
    })
    const route = data?.routes?.[0]
    if (data?.code !== 'Ok' || !route?.geometry || !Number.isFinite(route.distance) || !Number.isFinite(route.duration)) {
      throw new Error('No route found')
    }
    routeLayer = L.geoJSON(route.geometry, { style: { color: '#135db5', weight: 6, opacity: 0.9 } }).addTo(map)
    map.fitBounds(routeLayer.getBounds(), { padding: [30, 30] })
    routeSummary.value = { distance: (route.distance / 1000).toFixed(1), duration: Math.round(route.duration / 60) }
  } catch {
    routeError.value = 'A driving route could not be calculated. Check your places or try again later.'
  } finally {
    routeLoading.value = false
  }
}

function resetRoute() {
  if (routeLayer) routeLayer.remove()
  routeLayer = null
  routeSummary.value = null
  routeError.value = ''
}

onMounted(() => {
  map = L.map(mapElement.value, { scrollWheelZoom: false }).setView([-37.8136, 144.9631], 11)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
  }).addTo(map)
})
onUnmounted(() => {
  locationRequestId++
  clearTimeout(locationTimer)
  map?.remove()
})
</script>

<style scoped>
.community-map { width: 100%; height: min(60vh, 520px); min-height: 320px; border: 1px solid #6c757d; border-radius: 0.5rem; }
.route-summary { background: #f3f7fb; border: 1px solid #c6d8e8; border-radius: 0.5rem; padding: 1rem; }
.map-page { min-width: 0; }
</style>
