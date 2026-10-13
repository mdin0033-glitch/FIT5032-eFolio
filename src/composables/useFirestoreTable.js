import { onMounted, ref } from 'vue'
import { collection, getDocs } from 'firebase/firestore'
import db from '../firebase/init'

export function useFirestoreTable(collectionName) {
  const rows = ref([])
  const loading = ref(false)
  const error = ref('')
  async function load() {
    loading.value = true
    error.value = ''
    try {
      const snapshot = await getDocs(collection(db, collectionName))
      rows.value = snapshot.docs.map(document => ({ ...document.data(), id: document.id }))
    } catch {
      error.value = 'Unable to load ' + collectionName + '. Check your connection, then choose Refresh data.'
    } finally {
      loading.value = false
    }
  }
  onMounted(load)
  return { rows, loading, error, load }
}
