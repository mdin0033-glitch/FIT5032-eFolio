<template>
  <main class="container my-5">
    <router-link to="/home">Home</router-link>
    <h1 class="my-4">Weather</h1>
    <form class="d-flex gap-2 mb-3" @submit.prevent="searchByCity">
      <label for="weather-city" class="visually-hidden">City and country</label>
      <input id="weather-city" v-model="city" class="form-control"
        placeholder="Clayton, AU" autocomplete="off" />
      <button class="btn btn-primary" :disabled="loading">Search</button>
    </form>
    <button class="btn btn-outline-primary" :disabled="loading" @click="getCurrentLocationWeather">
      Use Current Location
    </button>
    <p v-if="loading" class="mt-3" role="status">Loading weather...</p>
    <p v-if="error" class="alert alert-danger mt-3" role="alert">{{ error }}</p>
    <section v-if="weather" class="card card-body mt-4" aria-live="polite">
      <p>{{ source }}</p>
      <h2>{{ weather.name }}, {{ weather.sys.country }}</h2>
      <p class="fs-3">{{ weather.main.temp.toFixed(1) }} °C</p>
      <p>{{ weather.weather[0].description }}</p>
      <img :src="`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`"
        :alt="weather.weather[0].description" width="100" height="100" />
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY?.trim()
const city = ref('')
const weather = ref(null)
const source = ref('')
const loading = ref(false)
const error = ref('')

function checkApiKey() {
  if (apiKey) return true
  error.value = 'OpenWeatherMap API key is missing. Set VITE_OPENWEATHER_API_KEY in .env and restart the dev server.'
  return false
}

async function requestWeather(params, label) {
  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { ...params, appid: apiKey, units: 'metric' },
      timeout: 15000
    })
    if (!Number.isFinite(data.main?.temp) || !data.sys?.country || !data.weather?.[0]?.icon) {
      throw new Error('Incomplete weather response.')
    }
    weather.value = data
    source.value = label
  } catch (err) {
    // Do not log Axios errors: their request configuration includes the API key.
    const status = err.response?.status
    error.value = status === 404 ? 'City not found. Try Clayton, AU.'
      : status === 401 ? 'OpenWeatherMap API key is invalid or not active yet.'
      : status === 429 ? 'Weather request limit reached. Please try again later.'
      : 'Unable to retrieve weather. Please check your connection and try again.'
  } finally {
    loading.value = false
  }
}

async function searchByCity() {
  if (loading.value) return
  error.value = ''
  weather.value = null
  if (!checkApiKey()) return
  if (!city.value.trim()) {
    error.value = 'Please enter a city, for example Clayton, AU.'
    return
  }
  loading.value = true
  await requestWeather({ q: city.value.trim() }, 'City search')
}

function getCurrentLocationWeather() {
  if (loading.value) return
  error.value = ''
  weather.value = null
  if (!checkApiKey()) return
  if (!navigator.geolocation) {
    error.value = 'Your browser does not support location access. Please search by city.'
    return
  }
  loading.value = true
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => requestWeather({ lat: coords.latitude, lon: coords.longitude }, 'Current location weather'),
    (err) => {
      loading.value = false
      error.value = err.code === 1
        ? 'Location permission was denied. Allow location access in your browser or search by city.'
        : err.code === 3 ? 'Location request timed out. Please retry or search by city.'
        : 'Your location is unavailable. Please search by city.'
    },
    { timeout: 30000, maximumAge: 60000 }
  )
}

onMounted(getCurrentLocationWeather)
</script>
