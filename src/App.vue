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
const isMobileMenuOpen = ref(false);

const toggleLoginForm = () => {
  showLoginForm.value = !showLoginForm.value;
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

const handleLogout = async () => {
  await auth.logout();
  router.push('/');
  isMobileMenuOpen.value = false;
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
          
          <!-- Mobile menu button -->
          <div class="flex items-center sm:hidden">
            <button
              @click="toggleMobileMenu"
              class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span class="sr-only">Open main menu</span>
              <svg
                class="h-6 w-6"
                :class="{ 'hidden': isMobileMenuOpen, 'block': !isMobileMenuOpen }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                class="h-6 w-6"
                :class="{ 'block': isMobileMenuOpen, 'hidden': !isMobileMenuOpen }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Desktop menu -->
          <div class="hidden sm:flex sm:items-center sm:space-x-4">
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

      <!-- Mobile menu -->
      <div
        class="sm:hidden"
        :class="{ 'block': isMobileMenuOpen, 'hidden': !isMobileMenuOpen }"
      >
        <div class="pt-2 pb-3 space-y-1 bg-white shadow-lg rounded-b-lg">
          <template v-if="auth.loading">
            <div class="px-4 py-3 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </div>
          </template>
          <template v-else-if="auth.user">
            <!-- User Info Section -->
            <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                  <div class="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <span class="text-lg font-medium text-primary-600">
                      {{ (auth.user.displayName || auth.user.email || '?')[0].toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {{ auth.user.displayName || 'User' }}
                  </p>
                  <p class="text-sm text-gray-500 truncate">
                    {{ auth.user.email }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Menu Items -->
            <div class="mt-1">
              <router-link
                v-if="auth.isAdmin"
                to="/admin"
                class="flex items-center px-4 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors duration-200"
                @click="isMobileMenuOpen = false"
              >
                <svg class="mr-3 h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin Panel
              </router-link>

              <button
                @click="handleLogout"
                class="w-full flex items-center px-4 py-3 text-base font-medium text-red-600 hover:text-red-900 hover:bg-red-50 transition-colors duration-200"
              >
                <svg class="mr-3 h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </template>
          <template v-else>
            <button
              v-if="!showLoginForm"
              @click="toggleLoginForm"
              class="w-full flex items-center px-4 py-3 text-base font-medium text-primary-600 hover:text-primary-900 hover:bg-primary-50 transition-colors duration-200"
            >
              <svg class="mr-3 h-6 w-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </button>
          </template>
        </div>
      </div>
    </nav>

    <!-- Login Modal -->
    <div 
      v-if="showLoginForm" 
      class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
      @click.self="toggleLoginForm"
    >
      <div 
        class="bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out"
        :class="showLoginForm ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
      >
        <!-- Header -->
        <div class="relative px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Welcome Back</h2>
          <p class="mt-1 text-sm text-gray-500">Sign in to your account or create a new one</p>
          <button
            @click="toggleLoginForm"
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full p-1"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-4">
          <LoginForm @close="toggleLoginForm" />
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 rounded-b-lg border-t border-gray-200">
          <p class="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
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
