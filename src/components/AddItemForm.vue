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
  <div class="card">
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

    <form v-else @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
        <input
          id="title"
          v-model="title"
          type="text"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="What needs to be done?"
        />
      </div>

      <div>
        <label for="description" class="block text-sm font-medium text-gray-700">Description (optional)</label>
        <textarea
          id="description"
          v-model="description"
          rows="2"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="Add some details..."
        />
      </div>

      <div class="flex justify-end space-x-3">
        <button
          type="button"
          @click="isOpen = false"
          class="btn btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          class="btn btn-primary"
        >
          Add Item
        </button>
      </div>
    </form>
  </div>
</template> 