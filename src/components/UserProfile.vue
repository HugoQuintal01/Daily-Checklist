<script lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export default {
  setup() {
    const auth = useAuthStore();
    const displayName = ref('');
    const email = ref('');
    const newPassword = ref('');
    const confirmPassword = ref('');
    const isEditing = ref(false);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const success = ref<string | null>(null);

    // Additional user information
    const phoneNumber = ref('');
    const bio = ref('');

    // Notification preferences
    const showNotificationToggle = ref(false);

    const loadUserData = async () => {
      if (!auth.user) {
        // Clear fields if no user
        displayName.value = '';
        email.value = '';
        phoneNumber.value = '';
        bio.value = '';
        // Clear notification state
        showNotificationToggle.value = false;
        return;
      }
      
      // Load basic profile from auth state
      displayName.value = auth.user.displayName || '';
      email.value = auth.user.email || '';
      
      // Load additional user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', auth.user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        phoneNumber.value = data.phoneNumber || '';
        bio.value = data.bio || '';
        // Load notification preference from Firestore or localStorage
        // For now, let's use localStorage for simplicity
        showNotificationToggle.value = localStorage.getItem(`notificationsEnabled_${auth.user.uid}`) === 'true';
      } else {
         // Clear additional fields if no firestore doc (shouldn't happen if registration works)
        phoneNumber.value = '';
        bio.value = '';
        showNotificationToggle.value = false;
      }
    };

    const saveProfile = async () => {
      if (!auth.user) return;
      
      loading.value = true;
      error.value = null;
      success.value = null;
      
      try {
        // Update basic profile in Firebase Auth
        if (displayName.value !== auth.user.displayName) {
          await updateProfile(auth.user, {
            displayName: displayName.value.trim()
          });
        }
        
        // Update email in Firebase Auth if changed
        if (email.value !== auth.user.email) {
           // Note: Updating email requires re-authentication for security
           // For simplicity, we'll just update it here, but in a real app
           // you'd need to prompt the user to re-authenticate first.
          await updateEmail(auth.user, email.value);
        }
        
        // Update password in Firebase Auth only if both fields are filled
        if (newPassword.value && confirmPassword.value) {
          if (newPassword.value !== confirmPassword.value) {
            throw new Error('Passwords do not match');
          }
           // Note: Updating password also requires re-authentication
          await updatePassword(auth.user, newPassword.value);
        }
        
        // Save additional user data to Firestore
        await setDoc(doc(db, 'users', auth.user.uid), {
          phoneNumber: phoneNumber.value.trim() || null, // Store as null if empty
          bio: bio.value.trim() || null, // Store as null if empty
          updatedAt: new Date()
        }, { merge: true });
        
        // Reload user data to reflect changes immediately
        await loadUserData();

        success.value = 'Profile updated successfully';
        isEditing.value = false;
        
        // Clear password fields after successful update
        newPassword.value = '';
        confirmPassword.value = '';
      } catch (err: any) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const handleToggleNotifications = async () => {
      if (!auth.user) return;

      const isEnabled = !showNotificationToggle.value;

      if (isEnabled) {
        // Request notification permission if enabling
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          localStorage.setItem(`notificationsEnabled_${auth.user.uid}`, 'true');
          showNotificationToggle.value = true;
        } else {
          alert('Permission denied for notifications. Please enable them in your browser settings.');
          showNotificationToggle.value = false;
        }
      } else {
        // Disable notifications
        localStorage.setItem(`notificationsEnabled_${auth.user.uid}`, 'false');
        showNotificationToggle.value = false;
      }
    };

    const cancelEdit = () => {
      isEditing.value = false;
      // Optionally reset fields to original values
      if (auth.user) {
         displayName.value = auth.user.displayName || '';
         email.value = auth.user.email || '';
         // Note: We don't reload other data here, assuming it hasn't changed externally
      }
      newPassword.value = '';
      confirmPassword.value = '';
    };

    // Watch for auth user changes and load data
    watch(() => auth.user, loadUserData, { immediate: true });

    // Add a watcher for loading state in case needed for UI feedback
    watch(() => auth.loading, (isLoading) => {
      if (!isLoading && !auth.user) {
        // User logged out, clear data
        loadUserData(); // loadUserData handles clearing when user is null
      }
    });

    return {
      auth,
      displayName,
      email,
      newPassword,
      confirmPassword,
      isEditing,
      loading,
      error,
      success,
      phoneNumber,
      bio,
      showNotificationToggle,
      loadUserData,
      saveProfile,
      handleToggleNotifications,
      cancelEdit,
    };
  },
};
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Profile</h2>
      <button
        v-if="!isEditing && auth.user"
        @click="isEditing = true"
        class="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
      >
        Edit Profile
      </button>
    </div>

    <div v-if="auth.loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading profile...</p>
    </div>

    <div v-else-if="!auth.user" class="text-center py-8 text-gray-600">
      Please log in to view your profile.
    </div>

    <div v-else>
      <div v-if="success" class="mb-6 p-4 bg-green-100 text-green-800 rounded-md border border-green-200">
        {{ success }}
      </div>
       <div v-if="error" class="mb-6 p-4 bg-red-100 text-red-800 rounded-md border border-red-200">
        {{ error }}
      </div>

      <div v-if="isEditing" class="space-y-6">
        <!-- Basic Info -->
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700">Display Name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
            placeholder="Your name"
          />
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
            placeholder="your@email.com"
          />
        </div>

        <!-- Additional Info -->
        <div class="pt-4 border-t border-gray-200">
           <h3 class="text-lg font-medium text-gray-800 mb-3">Additional Information</h3>
            <div class="space-y-4">
              <div>
                <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  id="phoneNumber"
                  v-model="phoneNumber"
                  type="tel"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div>
                <label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  id="bio"
                  v-model="bio"
                  rows="4"
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
                  placeholder="Tell us about yourself"
                />
              </div>
            </div>
        </div>

         <!-- Notifications Toggle -->
        <div class="pt-4 border-t border-gray-200">
           <h3 class="text-lg font-medium text-gray-800 mb-3">Notifications</h3>
            <div class="flex items-center justify-between">
               <label for="notificationToggle" class="flex items-center cursor-pointer">
                  <div class="relative">
                     <input
                        id="notificationToggle"
                        type="checkbox"
                        class="sr-only"
                        :checked="showNotificationToggle"
                        @change="handleToggleNotifications"
                     >
                     <div :class="showNotificationToggle ? 'bg-primary-600' : 'bg-gray-200'" class="block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out"></div>
                     <div :class="showNotificationToggle ? 'translate-x-6' : 'translate-x-1'" class="dot absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out shadow"></div>
                  </div>
                  <div class="ml-3 text-gray-800 font-medium">
                     Enable Browser Notifications
                  </div>
               </label>
            </div>
        </div>

        <!-- Change Password -->
        <div class="pt-4 border-t border-gray-200">
          <h3 class="text-lg font-medium text-gray-800 mb-3">Change Password</h3>
          <div class="space-y-4">
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="newPassword"
                v-model="newPassword"
                type="password"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
                placeholder="Enter new password"
              />
            </div>
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
           <button
              type="button"
              @click="cancelEdit"
              class="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:text-sm transition-colors duration-200"
            >
              Cancel
            </button>
           <button
              type="button"
              @click="saveProfile"
              :disabled="loading"
              class="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"></path>
              </svg>
              Save Profile
            </button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <!-- Basic Info -->
        <div>
           <h3 class="text-lg font-medium text-gray-800 mb-1">Basic Information</h3>
           <p class="text-gray-700"><strong>Display Name:</strong> {{ auth.user.displayName || 'N/A' }}</p>
           <p class="text-gray-700"><strong>Email:</strong> {{ auth.user.email || 'N/A' }}</p>
        </div>

        <!-- Additional Info -->
        <div class="pt-4 border-t border-gray-200">
           <h3 class="text-lg font-medium text-gray-800 mb-1">Additional Information</h3>
            <p class="text-gray-700"><strong>Phone Number:</strong> {{ phoneNumber || 'N/A' }}</p>
            <p class="text-gray-700"><strong>Bio:</strong> {{ bio || 'N/A' }}</p>
        </div>

        <!-- Notifications -->
         <div class="pt-4 border-t border-gray-200">
           <h3 class="text-lg font-medium text-gray-800 mb-1">Notifications</h3>
            <p class="text-gray-700"><strong>Browser Notifications:</strong> {{ showNotificationToggle ? 'Enabled' : 'Disabled' }}</p>
             <button
                @click="handleToggleNotifications"
                class="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                {{ showNotificationToggle ? 'Disable Notifications' : 'Enable Notifications' }}
              </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom toggle switch styling */
.dot {
  left: 0.25rem;
}
input:checked + .block {
  background-color: #4f46e5;
}
input:checked + .block + .dot {
  transform: translateX(1.5rem);
}
</style> 