<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-6">Task History</h1>
    
    <div class="bg-white rounded-lg shadow-md p-6">
      <div class="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
        <div class="relative flex-1 w-full sm:w-auto">
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Search completed tasks..."
            class="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <label for="sortBy" class="text-gray-700">Sort by:</label>
          <select
            id="sortBy"
            v-model="sortBy"
            class="block w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="dateDesc">Date (Newest First)</option>
            <option value="dateAsc">Date (Oldest First)</option>
            <option value="titleAsc">Title (A-Z)</option>
            <option value="titleDesc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
        <p class="mt-4 text-gray-600">Loading data...</p>
      </div>
      
      <div v-else-if="error" class="text-red-500 text-center py-4">
        {{ error }}
      </div>
      
      <div v-else-if="filteredAndSortedTasks.length === 0" class="text-gray-500 text-center py-4">
        No completed tasks found
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="task in filteredAndSortedTasks" 
          :key="task.id" 
          class="border-b border-gray-200 pb-4 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg p-4"
          @click="openTaskDetails(task)"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{{ task.title }}</h3>
              <p class="text-sm text-gray-500">Completed on: {{ formatDate(task.completedAt) }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-green-500">✓</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Task Details Modal -->
    <TaskDetailsModal
      :is-open="isModalOpen"
      :task="selectedTask"
      @close="closeModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../stores/auth';
import TaskDetailsModal from '../components/TaskDetailsModal.vue';
import type { ChecklistItem } from '../types/checklist';
import type { Timestamp } from 'firebase/firestore';

interface CompletedTask extends Omit<ChecklistItem, 'completedAt'> {
  completedAt: Date;
}

const authStore = useAuthStore();
const completedTasks = ref<CompletedTask[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const searchQuery = ref('');
const sortBy = ref('dateDesc');
const isModalOpen = ref(false);
const selectedTask = ref<ChecklistItem | undefined>(undefined);

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('pt-PT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const openTaskDetails = async (task: CompletedTask) => {
  try {
    // Fetch the full task details from Firestore
    const taskDoc = await getDoc(doc(db, 'checklist', task.id));
    if (taskDoc.exists()) {
      selectedTask.value = {
        id: taskDoc.id,
        ...taskDoc.data()
      } as ChecklistItem;
      isModalOpen.value = true;
    }
  } catch (err) {
    console.error('Error fetching task details:', err);
    error.value = 'Failed to load task details';
  }
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedTask.value = undefined;
};

const fetchCompletedTasks = async () => {
  if (!authStore.user) {
    error.value = 'Please log in to view your task history';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;
  
  try {
    console.log('Fetching completed tasks for user:', authStore.user.uid);
    const tasksRef = collection(db, 'checklist');
    const q = query(
      tasksRef,
      where('userId', '==', authStore.user.uid),
      where('completed', '==', true),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Query snapshot size:', querySnapshot.size);
    
    completedTasks.value = querySnapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Task data:', data);
      return {
        id: doc.id,
        ...data,
        completedAt: data.updatedAt?.toDate()
      };
    }) as CompletedTask[];
    
    console.log('Processed tasks:', completedTasks.value);
  } catch (err) {
    console.error('Error fetching completed tasks:', err);
    error.value = 'Failed to load task history. Please try again later.';
  } finally {
    loading.value = false;
  }
};

const filteredAndSortedTasks = computed(() => {
  let tasks = [...completedTasks.value];

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    tasks = tasks.filter(task => 
      task.title.toLowerCase().includes(query)
    );
  }

  tasks.sort((a, b) => {
    const dateA = a.completedAt.getTime();
    const dateB = b.completedAt.getTime();
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();

    switch (sortBy.value) {
      case 'dateAsc':
        return dateA - dateB;
      case 'dateDesc':
        return dateB - dateA;
      case 'titleAsc':
        return titleA.localeCompare(titleB);
      case 'titleDesc':
        return titleB.localeCompare(titleA);
      default:
        return 0;
    }
  });

  return tasks;
});

onMounted(() => {
  fetchCompletedTasks();
});
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style> 