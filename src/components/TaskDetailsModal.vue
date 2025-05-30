<template>
  <div v-if="isOpen && task" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Background overlay -->
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" @click="close"></div>

    <!-- Modal panel -->
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
        <!-- Close button -->
        <div class="absolute right-0 top-0 pr-4 pt-4">
          <button
            type="button"
            class="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            @click="close"
          >
            <span class="sr-only">Close</span>
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="sm:flex sm:items-start">
          <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
            <h3 class="text-2xl font-semibold leading-6 text-gray-900 mb-4" id="modal-title">
              {{ task.title }}
            </h3>
            
            <div class="mt-4 space-y-4">
              <!-- Description -->
              <div v-if="task.description" class="text-gray-600">
                <h4 class="text-sm font-medium text-gray-900 mb-1">Description</h4>
                <p class="text-sm">{{ task.description }}</p>
              </div>

              <!-- Completion Status -->
              <div class="flex items-center space-x-2">
                <span class="text-sm font-medium text-gray-900">Status:</span>
                <span :class="[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                ]">
                  {{ task.completed ? 'Completed' : 'Incomplete' }}
                </span>
              </div>

              <!-- Dates -->
              <div class="space-y-2">
                <div class="text-sm">
                  <span class="font-medium text-gray-900">Created:</span>
                  <span class="text-gray-600 ml-2">{{ formatDate(task.createdAt) }}</span>
                </div>
                <div class="text-sm">
                  <span class="font-medium text-gray-900">Last Updated:</span>
                  <span class="text-gray-600 ml-2">{{ formatDate(task.updatedAt) }}</span>
                </div>
                <div v-if="task.completedAt" class="text-sm">
                  <span class="font-medium text-gray-900">Completed:</span>
                  <span class="text-gray-600 ml-2">{{ formatDate(task.completedAt) }}</span>
                </div>
              </div>

              <!-- Repeatable Status -->
              <div v-if="task.repeatable" class="text-sm">
                <span class="font-medium text-gray-900">Repeatable Task</span>
                <p class="text-gray-600 mt-1">This task will reset daily at 4 AM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import type { ChecklistItem } from '../types/checklist';

const props = defineProps<{
  isOpen: boolean;
  task: ChecklistItem | undefined;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const close = () => {
  emit('close');
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return 'N/A';
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
};
</script> 