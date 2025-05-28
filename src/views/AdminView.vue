<script setup lang="ts">
import { onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';
import { format } from 'date-fns';

const store = useAdminStore();

onMounted(async () => {
  await store.fetchUsers();
});
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

    <div v-else-if="!store.users.length" class="text-center py-8 text-gray-600">
      No users found
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
            <p class="text-sm text-gray-500 mt-2">
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
        </div>

        <div class="mt-4 pt-4 border-t">
          <button
            @click="store.deleteUser(user.id)"
            class="text-red-600 hover:text-red-700 text-sm"
          >
            Delete User
          </button>
        </div>
      </div>
    </div>
  </div>
</template> 