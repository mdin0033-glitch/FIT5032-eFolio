import './init'
import { readonly, ref } from 'vue'
import { getAuth, onIdTokenChanged } from 'firebase/auth'

export const auth = getAuth()
const user = ref(null)
const admin = ref(false)
let resolveReady
export const authReady = new Promise(resolve => { resolveReady = resolve })

// Roles come from a signed Firebase token, never from editable LocalStorage.
onIdTokenChanged(auth, async currentUser => {
  user.value = currentUser
  admin.value = false
  if (currentUser) {
    try {
      const claims = (await currentUser.getIdTokenResult()).claims
      if (user.value?.uid === currentUser.uid) admin.value = claims.admin === true
    } catch { admin.value = false }
  }
  localStorage.removeItem('registeredUser')
  localStorage.removeItem('currentUser')
  resolveReady()
})

export const authUser = readonly(user)
export const isAdmin = readonly(admin)
