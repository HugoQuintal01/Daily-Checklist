<script setup lang="ts">
import { onMounted } from 'vue';
import { useAdminStore } from '../stores/admin';
import AdminDashboard from '../components/AdminDashboard.vue';

const adminStore = useAdminStore();

onMounted(() => {
  adminStore.fetchUsers();
});

// Placeholder for any AdminView specific logic or data
// For now, most logic resides in the AdminDashboard component and the admin store.

</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-6">Admin Section</h1>
    <!-- Render the AdminDashboard component -->
    <AdminDashboard />
  </div>
</template>

<style scoped>
/* Add any specific styles for AdminView here */
</style> 