<template>
  <main class="container py-4">
    <router-link to="/home">Home</router-link>
    <h1 class="mt-3">Accessibility</h1>
    <p>ClimateLearn Melbourne aims to meet WCAG 2.1 Level AA. We support keyboard navigation, labelled forms, visible focus, text alternatives, readable error messages, and layouts that adapt to smaller screens and text zoom.</p>
    <h2>Using the site</h2>
    <p>Press Tab to move between links and controls, and Enter or Space to activate them. The “Skip to main content” link appears when you focus it. Search results and route details on the community map are provided in text as well as visually.</p>
    <h2>Known limitations</h2>
    <p>The map uses third-party map tiles and controls. Its main tasks—place search, selecting a result, and route planning—also work through the labelled text controls above the map. External weather, geocoding, and routing services may be temporarily unavailable.</p>
    <h2>Feedback</h2>
    <p>If something is difficult to use, <router-link to="/email">send us a message</router-link> describing the page and what happened. The email page requires an account.</p>
  </main>
</template>
