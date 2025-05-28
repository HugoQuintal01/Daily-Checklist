<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from './stores/auth';
import { useChecklistStore } from './stores/checklist';
// import { useAdminStore } from './stores/admin'; // Admin store is not used directly in template/script
import { useRouter } from 'vue-router';
import LoginForm from './components/LoginForm.vue';
import { format, isAfter, setHours, setMinutes } from 'date-fns'; // Removed isSameDay, pt as they were unused
// import { pt } from 'date-fns/locale';

const auth = useAuthStore();
const checklist = useChecklistStore();
// const admin = useAdminStore(); // Removed unused admin variable
const router = useRouter();
const showLoginForm = ref(false);

const toggleLoginForm = () => {
  showLoginForm.value = !showLoginForm.value;
};

const handleLogout = async () => {
  await auth.logout();
  router.push('/');
};

const checkAndSendReminderNotification = async () => {
  // Only check if notifications are supported and granted
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not supported or permission not granted.');
    return;
  }

  // Only check if user is logged in and has notifications enabled
  if (!auth.user) {
     console.log('User not logged in.');
     return;
  }
  const notificationsEnabled = localStorage.getItem(`notificationsEnabled_${auth.user.uid}`) === 'true';
  if (!notificationsEnabled) {
     console.log('Notifications not enabled in profile.');
     return;
  }

  const now = new Date();
  // Define the reminder time (e.g., 11:00 PM Portugal time)
  // Note: This uses the client's system time zone.
   const reminderTime = setMinutes(setHours(now, 23), 0);


  // Check if it's after the reminder time today
  if (isAfter(now, reminderTime)) {
    // Check if a notification has already been sent today
    const lastNotificationDate = localStorage.getItem(`lastNotificationSent_${auth.user.uid}`);
    const today = format(now, 'yyyy-MM-dd');

     if (lastNotificationDate !== today) {

      // Fetch items if not already loaded
      if (checklist.items.length === 0 && !checklist.loading) {
         console.log('Fetching items before checking...');
         await checklist.fetchItems();
      }

      // Check for incomplete items
      const incompleteItems = checklist.items.filter(item => !item.completed);
      console.log(`Found ${incompleteItems.length} incomplete items.`);

      if (incompleteItems.length > 0) {
        const itemCount = incompleteItems.length;
        const title = 'Daily Checklist Reminder';
        const body = `You have ${itemCount} item${itemCount > 1 ? 's' : ''} left on your checklist.`;

        console.log('Sending notification...', { title, body });
        new Notification(title, { body });

        // Mark notification as sent for today
           localStorage.setItem(`lastNotificationSent_${auth.user.uid}`, today);


      } else {
         console.log('No incomplete items, no notification sent.');
      }
    } else {
       console.log('Notification already sent today.');
    }
  } else {
     console.log('Current time is before reminder time.');
  }
};

// Initialize auth state and open login form if not authenticated
onMounted(async () => {
  await auth.init();
  if (auth.user) {
    await checklist.fetchItems();
    showLoginForm.value = false;
    checkAndSendReminderNotification(); // Check on mount if time is right
  } else {
    showLoginForm.value = true;
  }

  // Add event listener for visibility change to check when tab becomes active
   document.addEventListener('visibilitychange', () => {
     if (document.visibilityState === 'visible') {
       checkAndSendReminderNotification();
     }
   });
});

// Watch for auth state changes and open login form if user logs out
watch(() => auth.user, async (newUser) => {
  if (newUser) {
    await checklist.fetchItems();
    showLoginForm.value = false;
    checkAndSendReminderNotification(); // Check on login if time is right
  } else if (!auth.loading) {
    // Only show login form if auth state is not loading
    showLoginForm.value = true;
    // Also clear last notification date for this user on logout
    if (auth.user) {
       localStorage.removeItem(`lastNotificationSent_${auth.user.uid}`);
    }
  }
});

// Watch for checklist items loading state to potentially trigger reminder check
 watch(() => checklist.loading, (isLoading) => {
   if (!isLoading && !checklist.error) {
      checkAndSendReminderNotification(); // Check after items are loaded
   }
 });

</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link 
              to="/" 
              class="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Daily Checklist
            </router-link>
          </div>
          
          <div class="flex items-center space-x-4">
            <template v-if="auth.loading">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
            </template>
            <template v-else-if="auth.user">
              <span class="text-gray-600">
                Welcome, {{ auth.user.displayName || auth.user.email }}
              </span>
              
              <router-link
                v-if="auth.isAdmin"
                to="/admin"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Admin Panel
              </router-link>
              <button
                @click="handleLogout"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                Logout
              </button>
            </template>
            <template v-else>
              <!-- Login button only shown if login form is not already open -->
              <button
                v-if="!showLoginForm"
                @click="toggleLoginForm"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Login
              </button>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <!-- Login Modal -->
    <div v-if="showLoginForm" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-900">Login or Register</h2>
          <button
            @click="toggleLoginForm"
            class="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <LoginForm @close="toggleLoginForm" />
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
