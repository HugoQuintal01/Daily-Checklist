<script setup lang="ts">
import { ref } from 'vue';
import { useChecklistStore } from '../stores/checklist';
import type { ChecklistItem } from '../types/checklist';

const props = defineProps<{
  item: ChecklistItem;
}>();

const store = useChecklistStore();
const isEditing = ref(false);
const editedTitle = ref(props.item.title);
const editedDescription = ref(props.item.description || '');

const startEdit = () => {
  isEditing.value = true;
  editedTitle.value = props.item.title;
  editedDescription.value = props.item.description || '';
};

const saveEdit = async () => {
  if (editedTitle.value.trim()) {
    await store.updateItem(props.item.id, {
      title: editedTitle.value.trim(),
      description: editedDescription.value.trim() || undefined
    });
    isEditing.value = false;
  }
};

const cancelEdit = () => {
  isEditing.value = false;
  editedTitle.value = props.item.title;
  editedDescription.value = props.item.description || '';
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

const handleToggle = async () => {
  await store.toggleItem(props.item.id);
};
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow duration-200 mb-4">
    <div class="flex items-start space-x-4">
      <!-- Checkbox -->
      <div class="flex-shrink-0 pt-1">
        <button
          @click="handleToggle"
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          :class="[
            item.completed 
              ? 'bg-primary-500 border-primary-500 hover:bg-primary-600 hover:border-primary-600' 
              : 'border-gray-300 hover:border-primary-500'
          ]"
        >
          <svg
            v-if="item.completed"
            class="w-4 h-4 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-grow min-w-0">
        <div v-if="isEditing" class="space-y-3 w-full">
          <input
            v-model="editedTitle"
            type="text"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Item title"
          />
          <textarea
            v-model="editedDescription"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Item description (optional)"
            rows="3"
          />
          <div class="flex justify-end space-x-3 mt-2">
            <button
              @click="saveEdit"
              class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
            >
              Save
            </button>
            <button
              @click="cancelEdit"
              class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:text-sm transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
        <div v-else class="w-full">
          <h3 
            class="text-lg font-semibold text-gray-800"
            :class="{ 'line-through text-gray-500': item.completed }"
          >
            {{ item.title }}
          </h3>
          <p v-if="item.description" class="mt-1 text-gray-600 text-sm">
            {{ item.description }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2 text-sm text-gray-500">
            <span>Created: {{ formatDate(item.createdAt) }}</span>
            <span v-if="item.updatedAt">Updated: {{ formatDate(item.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="!isEditing" class="flex-shrink-0 flex flex-col space-y-2">
        <button
          @click="startEdit"
          class="p-2 rounded-md text-gray-400 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
        >
          <span class="sr-only">Edit item</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="store.deleteItem(item.id)"
          class="p-2 rounded-md text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200"
        >
          <span class="sr-only">Delete item</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add component specific styles here if needed */
</style> 