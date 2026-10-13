<template>
  <section class="card card-body h-100" :aria-labelledby="chartId + '-title'">
    <h2 :id="chartId + '-title'" class="h4">{{ title }}</h2>
    <p class="small">Hover over a segment for its count. Use the legend buttons to show or hide categories.</p>
    <div v-if="items.length" class="chart-container">
      <canvas ref="canvas" :id="chartId" role="img" :aria-label="title + '. Counts and interactive legend are provided below.'"></canvas>
    </div>
    <p v-else>No data available.</p>
    <ul class="list-unstyled d-flex flex-wrap gap-2 mt-3" :aria-label="title + ' legend'">
      <li v-for="(item, index) in items" :key="item.label">
        <button class="btn btn-outline-dark btn-sm" type="button" :aria-pressed="!hidden.includes(index)" @click="toggle(index)">
          <span class="legend-swatch" :style="{ background: colours[index % colours.length] }" aria-hidden="true"></span>
          {{ item.label }}: {{ item.count }} {{ hidden.includes(index) ? '(hidden)' : '' }}
        </button>
      </li>
    </ul>
    <p class="visually-hidden" role="status">{{ hidden.length }} categories hidden from {{ title }}.</p>
    <details class="mt-2"><summary>View all counts as text</summary>
      <table class="table table-sm mt-2"><caption>{{ title }} — complete data, including hidden categories</caption><thead><tr><th scope="col">Category</th><th scope="col">Count</th></tr></thead><tbody><tr v-for="item in items" :key="item.label"><th scope="row">{{ item.label }}</th><td>{{ item.count }}</td></tr></tbody></table>
    </details>
  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import Chart from 'chart.js/auto'
const props = defineProps({ chartId: { type: String, required: true }, title: { type: String, required: true }, items: { type: Array, required: true } })
const canvas = ref(null)
const hidden = ref([])
const colours = ['#1766a3', '#2a7b43', '#8e4ba5', '#a04a17', '#8b6513', '#276d78', '#b12d60', '#5d6272']
let chart
async function render() {
  chart?.destroy()
  hidden.value = []
  await nextTick()
  if (!canvas.value || !props.items.length) return
  chart = new Chart(canvas.value, {
    type: 'doughnut',
    data: { labels: props.items.map(item => item.label), datasets: [{ label: props.title, data: props.items.map(item => item.count), backgroundColor: props.items.map((_, index) => colours[index % colours.length]), borderWidth: 2, hoverOffset: 8 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: context => context.label + ': ' + context.parsed } } } }
  })
}
function toggle(index) {
  if (!chart) return
  chart.toggleDataVisibility(index)
  hidden.value = hidden.value.includes(index) ? hidden.value.filter(value => value !== index) : [...hidden.value, index]
  chart.update()
}
onMounted(render)
watch(() => props.items, render, { deep: true })
onUnmounted(() => chart?.destroy())
</script>
<style scoped>
.chart-container { position: relative; height: 300px; }
.legend-swatch { display: inline-block; width: .75rem; height: .75rem; border-radius: 50%; margin-right: .35rem; }
</style>
