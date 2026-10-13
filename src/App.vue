<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <p class="container mt-3 small" role="status" aria-live="polite"><strong>{{ online ? 'Online' : 'Offline' }}</strong><span v-if="!online"> — use saved resources and preferences. Network actions need a connection.</span></p>
  <p v-if="navigationError" class="container alert alert-warning" role="alert">{{ navigationError }} <button v-if="online" type="button" class="btn btn-outline-primary btn-sm ms-2" @click="reloadPage">Reload page</button></p>
  <div id="main-content" tabindex="-1">
    <router-view />
  </div>
  <footer class="container mt-5 pb-3 small">
    <router-link to="/accessibility">Accessibility</router-link>
  </footer>
</template>

<script setup>
import { useOnlineStatus } from './composables/useOnlineStatus'
import { navigationError } from './composables/navigationFeedback'
const online = useOnlineStatus()
const reloadPage = () => window.location.reload()
</script>
