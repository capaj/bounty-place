import firebase from 'firebase'
import globalStore from './stores/global-store'
import geolocationWatcher from './stores/geolocation-watcher'

let config = {
  apiKey: 'AIzaSyATqCqBIQKq57sq7537U_qFV-zB8aB0Dpw',
  authDomain: 'bountyland-e8773.firebaseapp.com',
  databaseURL: 'https://bountyland-e8773.firebaseio.com',
  projectId: 'bountyland-e8773',
  storageBucket: 'bountyland-e8773.appspot.com',
  messagingSenderId: '761636885148'
}

export const firebaseApp = firebase.initializeApp(config)

export const db = firebaseApp.database()
export const auth = firebaseApp.auth()

export const storageKey = 'FIREBASE_AUTH'

// export const isAuthenticated = () => {
//   return !!auth.currentUser || !!localStorage.getItem(storageKey)
// }

export const isAuthenticated = () => {
  return !!globalStore.profile
}

export const facebookProvider = new firebase.auth.FacebookAuthProvider()

let stopGeoWatcher
export const login = (user) => {
  const {uid, displayName, email, photoURL} = user
  window.localStorage.setItem(storageKey, uid)
  db.ref('/users').child(uid).update({
    logged: true,
    displayName,
    email,
    photoURL,
    uid,
    lastTimeOnline: new Date()
  })
  globalStore.profile = user
  stopGeoWatcher = geolocationWatcher((coords) => {
    db.ref('/users').child(uid).update({
      coords: coords
    })
  })
}

export const logout = () => {
  window.localStorage.removeItem(storageKey)
  stopGeoWatcher && stopGeoWatcher()
  if (globalStore.profile) {
    db.ref('/users').child(globalStore.profile.uid).update({
      logged: false
    })
    auth.signOut()
      .then(globalStore.reset)
      .catch((message) => console.error('logout error: ', message))
  }
}

export const setUserOffline = () => {
  if (!globalStore.profile) return false
  db.ref('/users').child(globalStore.profile.uid).update({
    logged: false
  })
}

export const intervalOnline = setInterval(() => {
  if (!globalStore.profile) return false
  db.ref('/users').child(globalStore.profile.uid).update({
    lastTimeOnline: new Date()
  })
}, 10000)
