<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useAuthStore } from './stores/auth';
import { useChecklistStore } from './stores/checklist';
// import { useAdminStore } from './stores/admin'; // Admin store is not used directly in template/script
import { useRouter } from 'vue-router';
import LoginForm from './components/LoginForm.vue';
import { format, isAfter, setHours, setMinutes } from 'date-fns'; // Removed isSameDay, pt as they were unused
// import { pt } from 'date-fns/locale';
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/vue';

const auth = useAuthStore();
const checklist = useChecklistStore();
// const admin = useAdminStore(); // Removed unused admin variable
const router = useRouter();
const showLoginForm = ref(false);
const isMobileMenuOpen = ref(false);
const isUserMenuOpen = ref(false);

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
  isUserMenuOpen.value = false;
};

const navigateToProfile = () => {
  router.push('/profile');
  isUserMenuOpen.value = false;
};

const checkAndSendReminderNotification = async () => {
  // Check if notifications are supported
  if (!('Notification' in window)) {
    // Only log once when notifications are not supported
    if (!localStorage.getItem('notificationsNotSupportedLogged')) {
      console.log('Notifications are not supported in this browser.');
      localStorage.setItem('notificationsNotSupportedLogged', 'true');
    }
    return;
  }

  // Check notification permission
  if (Notification.permission !== 'granted') {
    // Only log once when permission is not granted
    if (!localStorage.getItem('notificationsPermissionNotGrantedLogged')) {
      console.log('Notification permission not granted.');
      localStorage.setItem('notificationsPermissionNotGrantedLogged', 'true');
    }
    return;
  }

  // Only check if user is logged in and has notifications enabled
  if (!auth.user) {
    return;
  }
  const notificationsEnabled = localStorage.getItem(`notificationsEnabled_${auth.user.uid}`) === 'true';
  if (!notificationsEnabled) {
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
    <nav class="bg-white shadow-lg border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-20">
          <div class="flex items-center">
            <router-link 
              to="/" 
              class="flex items-center space-x-3 text-2xl font-bold text-primary-600 hover:text-primary-700 transition-all duration-300 group"
            >
              <div class="relative">
                <div class="absolute -inset-1 bg-primary-100 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 relative" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 4.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V4.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.616a1 1 0 01.894-1.79l1.599.8L9 4.323V3a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <span class="bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Daily Checklist</span>
            </router-link>
          </div>
          
          <!-- Mobile menu button -->
          <div class="flex items-center sm:hidden">
            <button
              @click="toggleMobileMenu"
              class="inline-flex items-center justify-center p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-300"
            >
              <span class="sr-only">Open main menu</span>
              <svg
                class="h-7 w-7"
                :class="{ 'hidden': isMobileMenuOpen, 'block': !isMobileMenuOpen }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                class="h-7 w-7"
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
          <div class="hidden sm:flex sm:items-center sm:space-x-6">
            <template v-if="auth.loading">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </template>
            <template v-else-if="auth.user">
              <div class="flex items-center space-x-6">
                <router-link
                  to="/history"
                  class="group relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 transition-colors duration-300"
                >
                  <span class="absolute inset-0 bg-primary-50 rounded-lg transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 relative" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                  </svg>
                  <span class="relative">History</span>
                </router-link>

                <router-link
                  v-if="auth.isAdmin"
                  to="/admin"
                  class="group relative inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 shadow-md hover:shadow-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                  </svg>
                  Admin Panel
                </router-link>

                <!-- User Menu -->
                <Menu as="div" class="relative">
                  <MenuButton
                    class="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div class="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
                      <span class="text-lg font-medium text-white">
                        {{ (auth.user.displayName || auth.user.email || '?')[0].toUpperCase() }}
                      </span>
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-medium text-gray-900">
                        {{ auth.user.displayName || 'User' }}
                      </span>
                      <span class="text-xs text-gray-500">
                        {{ auth.user.email }}
                      </span>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </MenuButton>

                  <transition
                    enter-active-class="transition duration-100 ease-out"
                    enter-from-class="transform scale-95 opacity-0"
                    enter-to-class="transform scale-100 opacity-100"
                    leave-active-class="transition duration-75 ease-in"
                    leave-from-class="transform scale-100 opacity-100"
                    leave-to-class="transform scale-95 opacity-0"
                  >
                    <MenuItems
                      class="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                    >
                      <div class="py-1">
                        <MenuItem v-slot="{ active }">
                          <button
                            @click="navigateToProfile"
                            :class="[
                              active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                              'flex w-full items-center px-4 py-2 text-sm'
                            ]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                            </svg>
                            Profile
                          </button>
                        </MenuItem>

                        <MenuItem v-slot="{ active }">
                          <button
                            @click="handleLogout"
                            :class="[
                              active ? 'bg-gray-100 text-red-600' : 'text-red-600',
                              'flex w-full items-center px-4 py-2 text-sm'
                            ]"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clip-rule="evenodd" />
                            </svg>
                            Logout
                          </button>
                        </MenuItem>
                      </div>
                    </MenuItems>
                  </transition>
                </Menu>
              </div>
            </template>
            <template v-else>
              <button
                v-if="!showLoginForm"
                @click="toggleLoginForm"
                class="group relative inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
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
        <div class="pt-2 pb-3 space-y-1 bg-white shadow-xl rounded-b-2xl">
          <template v-if="auth.loading">
            <div class="px-4 py-3 flex items-center justify-center">
              <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            </div>
          </template>
          <template v-else-if="auth.user">
            <!-- User Info Section -->
            <div class="px-4 py-4 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
              <div class="flex items-center space-x-4">
                <div class="flex-shrink-0">
                  <div class="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md">
                    <span class="text-xl font-medium text-white">
                      {{ (auth.user.displayName || auth.user.email || '?')[0].toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-base font-medium text-gray-900 truncate">
                    {{ auth.user.displayName || 'User' }}
                  </p>
                  <p class="text-sm text-gray-600 truncate">
                    {{ auth.user.email }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Menu Items -->
            <div class="mt-1 px-2 py-3 space-y-1">
              <router-link
                to="/"
                class="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
                @click="isMobileMenuOpen = false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Home
              </router-link>
              
              <router-link
                to="/history"
                class="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
                @click="isMobileMenuOpen = false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
                </svg>
                History
              </router-link>

              <router-link
                to="/profile"
                class="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
                @click="isMobileMenuOpen = false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                </svg>
                Profile
              </router-link>

              <router-link
                v-if="auth.isAdmin"
                to="/admin"
                class="flex items-center px-4 py-3 rounded-xl text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition-all duration-300"
                @click="isMobileMenuOpen = false"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
                </svg>
                Admin Panel
              </router-link>

              <button
                @click="handleLogout"
                class="flex items-center w-full px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V4a1 1 0 00-1-1H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clip-rule="evenodd" />
                </svg>
                Logout
              </button>
            </div>
          </template>
          <template v-else>
            <button
              v-if="!showLoginForm"
              @click="toggleLoginForm"
              class="w-full flex items-center px-4 py-4 text-base font-medium text-primary-600 hover:text-primary-900 hover:bg-primary-50 transition-all duration-300"
            >
              <svg class="mr-3 h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
