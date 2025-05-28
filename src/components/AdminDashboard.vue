<script setup lang="ts">
import { onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';

const store = useAdminStore();

onMounted(async () => {
  // Ensure admin data is fetched only if user is potentially admin and data not loaded
  // The store action now handles waiting for auth loading
  await store.fetchUsers();
});

// Helper function to format date (if needed in template, currently using new Date().toLocaleDateString())
// const formatDate = (timestamp: any) => {
//   if (!timestamp) return '';
//   const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
//   return format(date, 'MMM d, yyyy HH:mm');
// };

</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Admin Dashboard</h1>

    <div v-if="store.loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
      <p class="mt-4 text-gray-600">Loading users...</p>
    </div>

    <div v-else-if="store.error" class="text-center py-8 text-red-600">
      {{ store.error }}
    </div>

    <div v-else-if="store.users.length === 0" class="text-center py-8 text-gray-600">
      No users found.
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="user in store.users"
        :key="user.id"
        class="bg-white rounded-lg shadow p-6"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-medium">{{ user.displayName || 'No name' }}</h3>
            <p class="text-gray-600">{{ user.email }}</p>
            <p v-if="user.createdAt" class="text-sm text-gray-500 mt-2">
              Joined: {{ new Date(user.createdAt).toLocaleDateString() }}
            </p>
          </div>
          <button
            @click="store.selectUser(user.id)"
            class="text-primary-600 hover:text-primary-700"
          >
            View Details
          </button>
        </div>

        <!-- User Stats - Display only if selected user matches current card user -->
        <div v-if="store.selectedUser?.id === user.id && store.userStats" class="mt-4 pt-4 border-t">
          <h4 class="font-medium mb-2">Statistics</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Total Items</p>
              <p class="text-lg font-medium">{{ store.userStats.totalItems }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Completed Items</p>
              <p class="text-lg font-medium">{{ store.userStats.completedItems }}</p>
            </div>
          </div>
          <div v-if="store.userStats.lastCompleted" class="mt-2">
            <p class="text-sm text-gray-600">Last Completed</p>
            <p class="text-sm">
              {{ new Date(store.userStats.lastCompleted).toLocaleString() }}
            </p>
          </div>
           <!-- Add more stats here if needed -->
        </div>

        <div class="mt-4 pt-4 border-t">
          <button
            @click="store.deleteUser(user.id)"
            class="text-red-600 hover:text-red-700 text-sm"
          >
            Delete User
          </button>
        </div>

         <!-- Modal/Detailed View - Display only if selected user matches current card user -->
         <div v-if="store.selectedUser?.id === user.id" class="mt-4 pt-4 border-t">
            <h4 class="font-medium mb-4">Detailed Info</h4>
             <div class="space-y-3">
                <div v-if="store.selectedUser.phoneNumber">
                   <p class="text-sm text-gray-500">Phone Number</p>
                   <p class="font-medium">{{ store.selectedUser.phoneNumber }}</p>
                </div>
                 <div v-if="store.selectedUser.bio">
                   <p class="text-sm text-gray-500">Bio</p>
                   <p class="font-medium whitespace-pre-line">{{ store.selectedUser.bio }}</p>
                </div>
                 <div v-if="store.selectedUser.lastLogin">
                   <p class="text-sm text-gray-500">Last Login</p>
                   <p class="font-medium">{{ new Date(store.selectedUser.lastLogin).toLocaleString() }}</p>
                </div>
                <!-- You might want to add user items and history here as well -->
                 <div v-if="store.userItems[user.id]?.length">
                     <h5 class="font-medium mt-4 mb-2">Checklist Items</h5>
                     <ul class="list-disc list-inside text-sm text-gray-700">
                        <li v-for="item in store.userItems[user.id]" :key="item.id">
                            {{ item.title }} ({{ item.completed ? 'Completed' : 'Incomplete' }})
                        </li>
                     </ul>
                 </div>
                  <div v-if="store.userHistory[user.id]?.length">
                     <h5 class="font-medium mt-4 mb-2">History Entries</h5>
                     <ul class="list-disc list-inside text-sm text-gray-700">
                        <li v-for="entry in store.userHistory[user.id]" :key="entry.id">
                            {{ entry.itemTitle }} ({{ entry.uncheckedAt ? 'Unchecked' : 'Checked' }})
                        </li>
                     </ul>
                 </div>
             </div>
             <button
                @click="store.selectedUser = null"
                class="mt-4 px-3 py-1 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
             >
               Hide Details
             </button>
         </div>
      </div>
    </div>
  </div>
</template> 