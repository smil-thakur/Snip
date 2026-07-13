import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import { firebaseAuth } from './config'

const googleProvider = new GoogleAuthProvider()

export function signInWithGoogle() {
  return signInWithPopup(firebaseAuth, googleProvider)
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password)
  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }
  return credential
}

export function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email, password)
}

export function signOutUser() {
  return signOut(firebaseAuth)
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(firebaseAuth, callback)
}
