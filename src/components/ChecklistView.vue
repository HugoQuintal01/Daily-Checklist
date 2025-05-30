<template>
  <div class="space-y-4">
    <!-- Header with Search and History Button -->
    <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
      <!-- Search Bar -->
      <div class="relative flex-1 w-full">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search tasks..."
          class="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:border-gray-300"
          @input="handleSearch"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>
      
      <!-- View History Button -->
      <button
        @click="goToHistory"
        class="w-full sm:w-auto bg-white text-gray-700 px-4 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm flex items-center justify-center space-x-2"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" />
        </svg>
        <span>View History</span>
      </button>
    </div>

    <!-- Add Item Form -->
    <AddItemForm @add-item="store.addItem" />

    <!-- Task List -->
    <div class="space-y-3">
      <ChecklistItem 
        v-for="item in store.filteredItems" 
        :key="item.id" 
        :item="item"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useChecklistStore } from '../stores/checklist';
import AddItemForm from './AddItemForm.vue';
import ChecklistItem from './ChecklistItem.vue';

const store = useChecklistStore();
const router = useRouter();
const searchQuery = ref('');
let searchTimeout: number | null = null;

const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  searchTimeout = window.setTimeout(() => {
    store.setSearchQuery(searchQuery.value);
  }, 300); // 300ms delay
};

onMounted(() => {
  searchQuery.value = store.searchQuery;
});

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

const goToHistory = () => {
  router.push({ name: 'history' });
};
</script>

<style scoped>
/* Add smooth transitions */
.transition-shadow {
  transition: box-shadow 0.2s ease-in-out;
}

.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}
</style> 