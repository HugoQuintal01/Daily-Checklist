<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { collection, query, where, getDocs, orderBy, doc as firestoreDoc, getDoc, or } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from '../stores/auth';
import type { ChecklistHistory, ChecklistItem } from '../types/checklist';

interface CombinedHistoryItem {
  id: string;
  type: 'completed-task' | 'history';
  title: string;
  date: any; // Use any for now, will format later
  originalItem?: ChecklistItem; // For completed tasks
  historyEntry?: ChecklistHistory; // For history entries
}

const combinedItems = ref<CombinedHistoryItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const authStore = useAuthStore();

const searchQuery = ref('');
const sortBy = ref('dateDesc'); // 'dateAsc', 'dateDesc', 'titleAsc', 'titleDesc'

const fetchCompletedTasksAndHistory = async () => {
  if (authStore.loading) return;
  if (!authStore.user) {
    error.value = 'User not authenticated';
    loading.value = false;
    combinedItems.value = [];
    return;
  }

  loading.value = true;
  error.value = null;
  combinedItems.value = [];

  try {
    const userId = authStore.user.uid;

    // Fetch completed tasks
    const checklistRef = collection(db, 'checklist');
    const completedTasksQuery = query(
      checklistRef,
      where('userId', '==', userId),
      where('completed', '==', true)
    );
    const completedTasksSnapshot = await getDocs(completedTasksQuery);
    const completedTasks = completedTasksSnapshot.docs.map(doc => {
      const data = doc.data() as ChecklistItem;
      return {
        id: doc.id,
        type: 'completed-task',
        title: data.title,
        date: data.updatedAt, // Use updatedAt as completion date for tasks
        originalItem: data,
      } as CombinedHistoryItem;
    });

    // Fetch history entries
    const historyRef = collection(db, 'history');
    const historyQuery = query(
      historyRef,
      where('userId', '==', userId),
      orderBy('completedAt', 'desc')
    );
    const historySnapshot = await getDocs(historyQuery);
    const historyEntries = await Promise.all(
      historySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data() as ChecklistHistory;
        // Although we have itemTitle in history, fetching the item ensures consistency
        const itemDoc = await getDoc(firestoreDoc(db, 'checklist', data.itemId));
        const itemData = itemDoc.data();
        
        return {
          id: docSnapshot.id,
          type: 'history',
          title: itemData?.title || data.itemTitle || 'Unknown Item',
          date: data.completedAt,
          historyEntry: data,
        } as CombinedHistoryItem;
      })
    );

    // Combine and sort initially by date descending
    combinedItems.value = [...completedTasks, ...historyEntries].sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime());

  } catch (err) {
    console.error('Error fetching completed tasks and history:', err);
    error.value = 'Failed to fetch data';
  } finally {
    loading.value = false;
  }
};

const filteredAndSortedItems = computed(() => {
  let items = [...combinedItems.value];

  // Filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }

  // Sort
  items.sort((a, b) => {
    const dateA = a.date.toDate().getTime();
    const dateB = b.date.toDate().getTime();
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();

    if (sortBy.value === 'dateAsc') {
      return dateA - dateB;
    } else if (sortBy.value === 'dateDesc') {
      return dateB - dateA;
    } else if (sortBy.value === 'titleAsc') {
      return titleA.localeCompare(titleB);
    } else if (sortBy.value === 'titleDesc') {
      return titleB.localeCompare(titleA);
    }
    return 0; // Default
  });

  return items;
});

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

// Fetch data on component mount and when auth state changes
onMounted(() => {
  fetchCompletedTasksAndHistory();
});

// Watch for auth state changes to refetch data
watch(() => authStore.user, () => {
  fetchCompletedTasksAndHistory();
});

// Watch for searchQuery or sortBy changes to update the computed list (though computed handles this automatically)
watch([searchQuery, sortBy], () => {
  // This watch is not strictly necessary because computed properties are reactive
  // but can be useful for debugging or triggering side effects if needed.
  console.log('Search query or sort order changed');
});
</script>

<template>
  <div class="bg-white rounded-lg shadow-md p-6 mb-6">
    <h2 class="text-2xl font-bold text-gray-800 mb-6">Completed Tasks & History</h2>
    
    <!-- Controls -->
    <div class="flex flex-col sm:flex-row items-center justify-between mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
      <!-- Search Input -->
      <div class="relative flex-1 w-full sm:w-auto">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search..."
          class="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
          </svg>
        </div>
      </div>

      <!-- Sort By Dropdown -->
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
    
    <div v-else-if="error" class="text-center py-8 text-red-600">
      {{ error }}
    </div>
    
    <div v-else-if="filteredAndSortedItems.length === 0" class="text-center py-8 text-gray-600">
      No completed tasks or history yet, or none match your search.
    </div>
    
    <div v-else class="space-y-4">
      <div
        v-for="item in filteredAndSortedItems"
        :key="item.id + item.type"
        class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0"
      >
        <div>
          <p class="font-medium text-gray-900">{{ item.title }}</p>
          <p class="text-sm text-gray-600 mt-1">
            <span v-if="item.type === 'completed-task'">Completed Task:</span>
            <span v-else>History Entry:</span>
             {{ formatDate(item.date) }}
          </p>
           <p v-if="item.type === 'history' && item.historyEntry?.uncheckedAt" class="text-sm text-gray-600 mt-1">
            Unchecked: {{ formatDate(item.historyEntry.uncheckedAt) }}
           </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add component specific styles here if needed */
</style> 