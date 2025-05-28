<script setup lang="ts">
import { onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';
import { format } from 'date-fns';

const admin = useAdminStore();

onMounted(() => {
  admin.fetchUsers();
});
</script>

<template>
  <div class="space-y-8">
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-2xl font-semibold mb-6">Admin Dashboard</h2>
      
      <div v-if="admin.loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading users...</p>
      </div>
      
      <div v-else-if="admin.error" class="text-center py-8">
        <p class="text-red-600">{{ admin.error }}</p>
      </div>
      
      <div v-else class="space-y-6">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in admin.users" :key="user.uid" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div>
                      <div class="text-sm font-medium text-gray-900">
                        {{ user.displayName || 'No name' }}
                      </div>
                      <div class="text-sm text-gray-500">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div v-if="admin.userStats[user.uid]" class="text-sm text-gray-900">
                    <div>Total Items: {{ admin.userStats[user.uid].totalItems }}</div>
                    <div>Checked Items: {{ admin.userStats[user.uid].checkedItems }}</div>
                  </div>
                  <div v-else class="text-sm text-gray-500">
                    No activity
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div v-if="admin.userStats[user.uid]?.lastActivity">
                    {{ format(admin.userStats[user.uid].lastActivity, 'MMM d, yyyy HH:mm') }}
                  </div>
                  <div v-else>
                    Never
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    @click="admin.selectUser(user.uid)"
                    class="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    View Details
                  </button>
                  <button
                    @click="admin.deleteUser(user.uid)"
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- User Details Modal -->
    <div v-if="admin.selectedUser" class="bg-white shadow rounded-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-medium">User Details</h3>
        <button
          @click="admin.selectedUser = null"
          class="text-gray-400 hover:text-gray-500"
        >
          <span class="sr-only">Close</span>
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <div>
          <p class="text-sm text-gray-500">Email</p>
          <p class="font-medium">{{ admin.selectedUser.email }}</p>
        </div>

        <div>
          <p class="text-sm text-gray-500">Display Name</p>
          <p class="font-medium">{{ admin.selectedUser.displayName || 'Not set' }}</p>
        </div>

        <div v-if="admin.selectedUser.phoneNumber">
          <p class="text-sm text-gray-500">Phone Number</p>
          <p class="font-medium">{{ admin.selectedUser.phoneNumber }}</p>
        </div>

        <div v-if="admin.selectedUser.bio">
          <p class="text-sm text-gray-500">Bio</p>
          <p class="font-medium whitespace-pre-line">{{ admin.selectedUser.bio }}</p>
        </div>

        <div>
          <p class="text-sm text-gray-500">Account Created</p>
          <p class="font-medium">{{ format(admin.selectedUser.createdAt, 'MMM d, yyyy') }}</p>
        </div>

        <div v-if="admin.selectedUser.lastLogin">
          <p class="text-sm text-gray-500">Last Login</p>
          <p class="font-medium">{{ format(admin.selectedUser.lastLogin, 'MMM d, yyyy HH:mm') }}</p>
        </div>

        <div v-if="admin.userStats[admin.selectedUser.uid]" class="border-t pt-6">
          <h4 class="font-medium mb-4">Activity Stats</h4>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-sm text-gray-500">Total Items</p>
              <p class="font-medium">{{ admin.userStats[admin.selectedUser.uid].totalItems }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Checked Items</p>
              <p class="font-medium">{{ admin.userStats[admin.selectedUser.uid].checkedItems }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 