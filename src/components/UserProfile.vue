<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

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

// Watch for auth user changes and load data
watch(() => auth.user, loadUserData, { immediate: true });

// Add a watcher for loading state in case needed for UI feedback
watch(() => auth.loading, (isLoading) => {
  if (!isLoading && !auth.user) {
    // User logged out, clear data
    loadUserData(); // loadUserData handles clearing when user is null
  }
});

</script>

<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-xl font-semibold">Profile</h2>
      <button
        v-if="!isEditing && auth.user"
        @click="isEditing = true"
        class="text-sm text-primary-600 hover:text-primary-700"
      >
        Edit
      </button>
    </div>

    <div v-if="auth.loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading profile...</p>
    </div>

    <div v-else-if="!auth.user" class="text-center py-4 text-gray-600">
      Please log in to view your profile.
    </div>

    <div v-else>
      <div v-if="success" class="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
        {{ success }}
      </div>
       <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
        {{ error }}
      </div>

      <div v-if="isEditing" class="space-y-4">
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700">Display Name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
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
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label for="phoneNumber" class="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            id="phoneNumber"
            v-model="phoneNumber"
            type="tel"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="+1 (555) 000-0000"
          />
        </div>

        <div>
          <label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
          <textarea
            id="bio"
            v-model="bio"
            rows="3"
            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="Tell us about yourself"
          />
        </div>

         <!-- Notifications Toggle (within edit mode for simplicity) -->
        <div class="border-t pt-4">
           <h3 class="text-lg font-medium mb-3">Notifications</h3>
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
                     <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
                     <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                  </div>
                  <div class="ml-3 text-gray-700 font-medium">
                     Enable Browser Notifications
                  </div>
               </label>
            </div>
        </div>

        <div class="border-t pt-4">
          <h3 class="text-lg font-medium mb-3">Change Password</h3>
          <div class="space-y-4">
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="newPassword"
                v-model="newPassword"
                type="password"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Leave blank to keep current password"
              />
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <div v-if="error" class="text-sm text-red-600">
          {{ error }}
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="isEditing = false"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            :disabled="loading"
          >
            Cancel
          </button>
          <button
            @click="saveProfile"
            class="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            :disabled="loading"
          >
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div>
          <p class="text-sm text-gray-500">Display Name</p>
          <p class="font-medium">{{ auth.user?.displayName || displayName || 'Not set' }}</p>
        </div>
        
        <div>
          <p class="text-sm text-gray-500">Email</p>
          <p class="font-medium">{{ auth.user?.email || email || 'Not set' }}</p>
        </div>

        <div v-if="phoneNumber">
          <p class="text-sm text-gray-500">Phone Number</p>
          <p class="font-medium">{{ phoneNumber }}</p>
        </div>

        <div v-if="bio">
          <p class="text-sm text-gray-500">Bio</p>
          <p class="font-medium whitespace-pre-line">{{ bio }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom toggle switch styling */
.dot {
  transform: translateX(0);
}
input:checked ~ .dot {
  transform: translateX(100%);
  background-color: #48bb78; /* Tailwind green-500 */
}
input:checked ~ .block {
    background-color: #63b3ed; /* Tailwind blue-400 */
}
</style> 