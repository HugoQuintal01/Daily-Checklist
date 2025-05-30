<script setup lang="ts">
import { onMounted } from 'vue';
import { useChecklistStore } from '../stores/checklist';
import ChecklistItem from '../components/ChecklistItem.vue';
import AddItemForm from '../components/AddItemForm.vue';
import UserProfile from '../components/UserProfile.vue';

const store = useChecklistStore();

onMounted(async () => {
  await store.fetchItems();
});
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="md:col-span-2">
      <AddItemForm />
      <div v-if="store.loading" class="mt-6 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        <p class="mt-2 text-gray-600">Loading items...</p>
      </div>
      <div v-else-if="store.error" class="mt-6 text-center text-red-600">
        {{ store.error }}
      </div>
      <div v-else-if="store.activeItems.length === 0" class="mt-6 text-center text-gray-600">
        No active items. Add your first item above!
      </div>
      <div v-else class="mt-6 space-y-4">
        <ChecklistItem
          v-for="item in store.activeItems"
          :key="item.id"
          :item="item"
        />
      </div>
    </div>
    <div>
      <UserProfile />
    </div>
  </div>
</template> 