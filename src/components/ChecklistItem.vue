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
  <div class="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
    <div class="flex items-start space-x-4">
      <!-- Checkbox -->
      <div class="flex-shrink-0 pt-1">
        <button
          @click="handleToggle"
          class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors"
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
        <div v-if="isEditing" class="space-y-2">
          <input
            v-model="editedTitle"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Item title"
          />
          <textarea
            v-model="editedDescription"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Item description (optional)"
            rows="2"
          />
          <div class="flex space-x-2">
            <button
              @click="saveEdit"
              class="px-3 py-1 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              Save
            </button>
            <button
              @click="cancelEdit"
              class="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
        <div v-else>
          <h3 
            class="text-lg font-medium"
            :class="{ 'line-through text-gray-500': item.completed }"
          >
            {{ item.title }}
          </h3>
          <p v-if="item.description" class="mt-1 text-gray-600">
            {{ item.description }}
          </p>
          <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500">
            <span>Created: {{ formatDate(item.createdAt) }}</span>
            <span v-if="item.updatedAt">Updated: {{ formatDate(item.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div v-if="!isEditing" class="flex-shrink-0 flex space-x-2">
        <button
          @click="startEdit"
          class="p-1 text-gray-400 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          @click="store.deleteItem(item.id)"
          class="p-1 text-gray-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-md"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template> 