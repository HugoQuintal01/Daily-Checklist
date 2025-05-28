<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { collection, query, where, getDocs, orderBy, doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useChecklistStore } from '../stores/checklist';
import { useAuthStore } from '../stores/auth';
import type { ChecklistHistory } from '../types/checklist';

interface HistoryItem extends ChecklistHistory {
  itemTitle: string;
}

const history = ref<HistoryItem[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);
const store = useChecklistStore();
const authStore = useAuthStore();

const fetchHistory = async () => {
  if (authStore.loading) return;
  if (!authStore.user) {
    error.value = 'User not authenticated';
    loading.value = false;
    return;
  }

  try {
    loading.value = true;
    const historyRef = collection(db, 'history');
    const q = query(
      historyRef,
      where('userId', '==', authStore.user.uid),
      orderBy('completedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const historyItems = await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const itemDoc = await getDoc(firestoreDoc(db, 'checklist', data.itemId));
        const itemData = itemDoc.data();
        
        return {
          id: docSnapshot.id,
          itemId: data.itemId,
          userId: data.userId,
          completedAt: data.completedAt,
          itemTitle: itemData?.title || 'Unknown Item'
        };
      })
    );
    
    history.value = historyItems;
    error.value = null;
  } catch (err) {
    console.error('History fetch error:', err);
    error.value = 'Failed to fetch history';
  } finally {
    loading.value = false;
  }
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  return new Intl.DateTimeFormat('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

// Watch for changes in the checklist items
watch(() => store.items, () => {
  fetchHistory();
}, { deep: true });

// Watch for auth loading/user changes
watch([
  () => authStore.loading,
  () => authStore.user
], ([loading, user]) => {
  if (!loading && user) fetchHistory();
}, { immediate: true });

onMounted(() => {
  if (!authStore.loading && authStore.user) fetchHistory();
});
</script>

<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-medium mb-4">History</h2>
    
    <div v-if="loading" class="text-center py-4">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
      <p class="mt-2 text-gray-600">Loading history...</p>
    </div>
    
    <div v-else-if="error" class="text-center py-4 text-red-600">
      {{ error }}
    </div>
    
    <div v-else-if="history.length === 0" class="text-center py-4 text-gray-600">
      No history yet
    </div>
    
    <div v-else class="space-y-2">
      <div
        v-for="item in history"
        :key="item.id"
        class="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors"
      >
        <div>
          <p class="font-medium">{{ item.itemTitle }}</p>
          <p class="text-sm text-gray-500">
            Completed: {{ formatDate(item.completedAt) }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template> 