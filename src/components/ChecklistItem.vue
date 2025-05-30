<script setup lang="ts">
import { ref } from 'vue';
import { useChecklistStore } from '../stores/checklist';
import type { ChecklistItem } from '../types/checklist';

const props = defineProps<{
  item: ChecklistItem;
}>();

// No need to emit events to parent for actions that can be handled by the store directly
// const emit = defineEmits<{
//   (e: 'start-edit', item: ChecklistItem): void;
//   (e: 'save-edit', item: ChecklistItem): void;
//   (e: 'cancel-edit'): void;
//   (e: 'toggle-repeatable', item: ChecklistItem): void;
// }>();

const store = useChecklistStore();

// Local state for editing, tied to this specific item
const isEditingLocal = ref(false);
const editedTitleLocal = ref(props.item.title);
const editedDescriptionLocal = ref(props.item.description || '');

const startEditLocal = () => {
  isEditingLocal.value = true;
  editedTitleLocal.value = props.item.title;
  editedDescriptionLocal.value = props.item.description || '';
};

const saveEditLocal = async () => {
  if (editedTitleLocal.value.trim()) {
    // Update the item in the store
    await store.updateItem(props.item.id, {
      title: editedTitleLocal.value.trim(),
      description: editedDescriptionLocal.value.trim() || undefined,
      repeatable: props.item.repeatable // Keep existing repeatable status
    });
    isEditingLocal.value = false; // Exit local editing mode
  }
};

const cancelEditLocal = () => {
  isEditingLocal.value = false;
  editedTitleLocal.value = props.item.title; // Revert changes
  editedDescriptionLocal.value = props.item.description || ''; // Revert changes
};

const handleToggleCompleted = async () => {
  await store.toggleItem(props.item.id);
};

const handleToggleRepeatable = async () => {
   await store.updateItem(props.item.id, {
    title: props.item.title,
    description: props.item.description,
    repeatable: !props.item.repeatable
  });
};

const handleDeleteItem = async () => {
  await store.deleteItem(props.item.id);
};

</script>

<template>
  <div 
       class="group flex items-center space-x-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200">
    <!-- Checkbox -->
    <div class="flex-shrink-0">
      <button
        @click="handleToggleCompleted"
        class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        :class="[
          item.completed 
            ? 'bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700' 
            : 'border-gray-300 hover:border-blue-500'
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
    <div class="flex-1 min-w-0">
      <div v-if="isEditingLocal" class="space-y-3">
        <input
          v-model="editedTitleLocal"
          type="text"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Task title"
        />
        <textarea
          v-model="editedDescriptionLocal"
          class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Description (optional)"
          rows="2"
        ></textarea>
        <div class="flex justify-end space-x-2">
          <button
            @click="saveEditLocal"
            class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save
          </button>
          <button
            @click="cancelEditLocal"
            class="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        </div>
      </div>
      <div v-else>
        <h3 :class="{'line-through text-gray-500': item.completed}" 
            class="text-lg font-medium text-gray-900">
          {{ item.title }}
        </h3>
        <p v-if="item.description" class="mt-1 text-gray-600">{{ item.description }}</p>
        <div class="mt-2 flex items-center space-x-2 text-sm text-gray-500">
          <span v-if="item.repeatable" class="inline-flex items-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            Repeats daily
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex-shrink-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <button
        @click="startEditLocal"
        class="p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        title="Edit task"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
        </svg>
      </button>
      <button
        @click="handleToggleRepeatable"
        class="p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        :title="item.repeatable ? 'Task repeats daily' : 'Make task repeat daily'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
        </svg>
      </button>
      <button
        @click="handleDeleteItem"
        class="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
        title="Delete task"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Add smooth transitions */
.transition-shadow {
  transition: box-shadow 0.2s ease-in-out;
}

.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}
</style> 