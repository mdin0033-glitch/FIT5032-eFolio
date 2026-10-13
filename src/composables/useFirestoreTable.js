import { onMounted, ref, watch } from 'vue'
import { collection, getDocsFromServer } from 'firebase/firestore'
import db from '../firebase/init'
import { useOnlineStatus } from './useOnlineStatus'
import { readSaved, writeSaved } from '../utils/browser-storage'

export function useFirestoreTable(collectionName) {
  const rows = ref([])
  const loading = ref(false)
  const error = ref('')
  const notice = ref('')
  const online = useOnlineStatus()
  const cacheKey = 'climatelearn:cache:' + collectionName
  const allowed = collectionName === 'books'
    ? ['id', 'isbn', 'name', 'category', 'sample']
    : ['id', 'title', 'category', 'location', 'date', 'status', 'sample']
  function publicRow(row) {
    const result = {}
    for (const key of allowed) {
      const value = row[key]
      if (value?.toDate) result[key] = value.toDate().toISOString()
      else if (['string', 'number', 'boolean'].includes(typeof value)) result[key] = value
    }
    return result
  }
  function useCache() {
    const saved = readSaved(cacheKey, value => value && typeof value.savedAt === 'string' && Number.isFinite(Date.parse(value.savedAt)) &&
      Array.isArray(value.rows) && value.rows.every(row => row && typeof row.id === 'string'))
    if (!saved) return false
    rows.value = saved.rows.map(publicRow)
    notice.value = 'Showing saved ' + collectionName + ' data from ' + new Date(saved.savedAt).toLocaleString('en-AU') + '. It may be out of date.'
    return true
  }
  async function load() {
    if (loading.value) return
    error.value = ''
    notice.value = ''
    if (!online.value) {
      if (!useCache()) {
        rows.value = []
        error.value = 'You are offline and no saved data is available. Connect and choose Refresh data.'
      }
      return
    }
    loading.value = true
    try {
      const snapshot = await getDocsFromServer(collection(db, collectionName))
      rows.value = snapshot.docs.map(document => publicRow({ ...document.data(), id: document.id }))
      if (!writeSaved(cacheKey, { savedAt: new Date().toISOString(), rows: rows.value })) {
        notice.value = 'Live data loaded, but browser storage is unavailable. This data cannot be saved for offline use.'
      }
    } catch {
      if (!useCache()) error.value = 'Unable to load ' + collectionName + '. Check your connection, then choose Refresh data.'
      else error.value = 'Live data could not be refreshed. The saved snapshot is shown below.'
    } finally { loading.value = false }
  }
  watch(online, value => { if (value) load() })
  onMounted(load)
  return { rows, loading, error, notice, load }
}
