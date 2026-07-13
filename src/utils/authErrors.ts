import { FirebaseError } from 'firebase/app'

export function isFirebaseAuthError(err: unknown): err is FirebaseError {
  return err instanceof FirebaseError
}

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/user-not-found': 'No account found for that email.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
}

export function describeAuthError(err: FirebaseError): string {
  return MESSAGES[err.code] ?? 'Something went wrong. Please try again.'
}
