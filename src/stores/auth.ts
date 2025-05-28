import { defineStore } from 'pinia';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

// Define the admin email using an environment variable
// Make sure to define VITE_ADMIN_EMAIL in your .env file
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    loading: true, // Start as true to indicate initial check
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.email === ADMIN_EMAIL,
  },

  actions: {
    async init() {
      // This runs once on app startup
      if (!this.loading) return; // Prevent re-initialization if already done

      return new Promise<void>((resolve) => {
        const unsubscribe = onAuthStateChanged(getAuth(), async (firebaseUser) => {
          this.user = firebaseUser;
          this.loading = false;

          // Create or update user document in Firestore on initial load/login
          if (firebaseUser) {
             await this.createOrUpdateUserDoc(firebaseUser);
          }

          unsubscribe(); // Stop listening after the initial state is determined
          resolve();
        });
      });
    },

    async register(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const userCredential = await createUserWithEmailAndPassword(getAuth(), email, password);
        this.user = userCredential.user;
        await this.createOrUpdateUserDoc(this.user);
      } catch (e: any) {
        this.error = e.message;
        console.error('Registration failed:', e);
      } finally {
        this.loading = false;
      }
    },

    async login(email: string, password: string) {
      this.loading = true;
      this.error = null;
      try {
        const userCredential = await signInWithEmailAndPassword(getAuth(), email, password);
        this.user = userCredential.user;
         await this.createOrUpdateUserDoc(this.user);
      } catch (e: any) {
        this.error = e.message;
        console.error('Login failed:', e);
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      this.error = null;
      const userId = this.user?.uid; // Get user ID before logging out
      try {
        await signOut(getAuth());
        this.user = null;
        // Clear any user-specific local storage data on logout using the captured userId
        if (userId) {
          localStorage.removeItem('lastNotificationSent_' + userId);
          localStorage.removeItem('notificationsEnabled_' + userId);
        }
      } catch (e: any) {
        this.error = e.message;
        console.error('Logout failed:', e);
      } finally {
        this.loading = false;
      }
    },

     async createOrUpdateUserDoc(user: User) {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        // Fetch existing doc to avoid overwriting fields like phoneNumber, bio, etc.
        // Simplified: just set doc with merge true. Fetching doc here causes extra read.
        // A more robust approach for profile updates would be needed for other fields.
        const userData = {
           email: user.email || '',
           displayName: user.displayName || null,
           lastLogin: new Date(),
           // createdAt is only set on creation, not updated here
           // phoneNumber and bio are managed via profile view, not auth state change
        };
        await setDoc(userRef, userData, { merge: true });
     },

    // Example action to update user profile (display name and email)
    async updateProfile(displayName: string | null) {
        if (!this.user) return;

        this.loading = true;
        this.error = null;

        try {
            if (displayName !== null && this.user.displayName !== displayName) {
                await updateProfile(this.user, { displayName });
                // Do not modify this.user.displayName directly. Rely on onAuthStateChanged.
                // this.user.displayName = displayName;
            }
            // Removing email update logic here as it's more complex and not directly requested.

        } catch (e: any) {
             this.error = e.message;
             console.error('Profile update failed:', e);
        } finally {
             this.loading = false;
        }
    },

    // You might add actions here for password reset, email verification etc.
  }
}); 