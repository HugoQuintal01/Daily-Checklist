import { defineStore } from 'pinia';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Define the admin email using an environment variable
// Make sure to define VITE_ADMIN_EMAIL in your .env file
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    isAdmin: false,
    loading: true
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
  },

  actions: {
    async init() {
      const auth = getAuth();
      return new Promise<void>((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          this.user = user;
          // Check if user email matches the admin email from environment variables
          this.isAdmin = user?.email === ADMIN_EMAIL;
          this.loading = false;
          resolve();
        });
      });
    },

    async login(email: string, password: string) {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      this.user = userCredential.user;
      // Check if user email matches the admin email from environment variables
      this.isAdmin = userCredential.user.email === ADMIN_EMAIL;
      
      return userCredential;
    },

    async register(email: string, password: string) {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      this.user = userCredential.user;
       // Check if user email matches the admin email from environment variables
      this.isAdmin = userCredential.user.email === ADMIN_EMAIL;
      // Create user document
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        createdAt: new Date(),
        isAdmin: false // New users are not admins by default
      });
      return userCredential;
    },

    async logout() {
      const auth = getAuth();
      await signOut(auth);
      this.user = null;
      this.isAdmin = false;
    }
  }
}); 