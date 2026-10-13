import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyARTVY2SNB2aC67dwZ_tuO8TavnkvnVdVo',
  authDomain: 'fit5032-3db1a.firebaseapp.com',
  projectId: 'fit5032-3db1a',
  storageBucket: 'fit5032-3db1a.firebasestorage.app',
  messagingSenderId: '185430813380',
  appId: '1:185430813380:web:b00e254d3c88723a7e3791'
}

initializeApp(firebaseConfig)

const db = getFirestore()

export default db
