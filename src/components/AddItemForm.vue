<script setup lang="ts">
import { ref } from 'vue';
import { useChecklistStore } from '../stores/checklist';

const store = useChecklistStore();
const title = ref('');
const description = ref('');
const isOpen = ref(false);

const handleSubmit = async () => {
  if (!title.value.trim()) return;
  
  await store.addItem(title.value.trim(), description.value.trim());
  title.value = '';
  description.value = '';
  isOpen.value = false;
};
</script>

<template>
  <div class="bg-white shadow-md rounded-lg p-6 mb-6">
    <button
      v-if="!isOpen"
      @click="isOpen = true"
      class="w-full flex items-center justify-center space-x-2 text-primary-600 hover:text-primary-700"
    >
      <svg
        class="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
      <span>Add New Item</span>
    </button>

    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-800">Title</label>
        <input
          id="title"
          v-model="title"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-800">Description (optional)</label>
        <textarea
          id="description"
          v-model="description"
          rows="3"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-gray-900 placeholder-gray-400 sm:text-sm p-2"
          placeholder="Add some details..."
        />
      </div>

      <div class="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
        <button
          type="button"
          @click="isOpen = false"
          class="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:text-sm transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm transition-colors duration-200"
        >
          Add Item
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Add form specific styles here if needed */
</style> 