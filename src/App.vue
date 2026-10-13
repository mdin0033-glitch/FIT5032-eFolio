<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <div id="main-content" tabindex="-1">
    <router-view />
  </div>
  <footer class="container mt-5 pb-3 small">
    <router-link to="/accessibility">Accessibility</router-link>
  </footer>
</template>
