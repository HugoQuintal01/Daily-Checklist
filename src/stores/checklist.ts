import { defineStore } from 'pinia';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where, orderBy, Timestamp, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import type { ChecklistItem } from '../types/checklist';

export const useChecklistStore = defineStore('checklist', {
  state: () => ({
    items: [] as ChecklistItem[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchItems() {
      if (!auth.currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const itemsRef = collection(db, 'checklist');
        const q = query(
          itemsRef,
          where('userId', '==', auth.currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        this.items = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChecklistItem[];

        await this.checkAndResetItems();
      } catch (error) {
        console.error('Error fetching items:', error);
        this.error = 'Failed to fetch items';
      } finally {
        this.loading = false;
      }
    },

    async addItem(title: string, description?: string) {
      if (!auth.currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      try {
        const newItem = {
          title,
          description,
          completed: false,
          userId: auth.currentUser.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, 'checklist'), newItem);
        this.items.unshift({
          id: docRef.id,
          ...newItem
        });
      } catch (error) {
        console.error('Error adding item:', error);
        this.error = 'Failed to add item';
      }
    },

    async toggleItem(itemId: string) {
      if (!auth.currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      try {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        const newStatus = !item.completed;
        await updateDoc(doc(db, 'checklist', itemId), {
          completed: newStatus,
          updatedAt: Timestamp.now()
        });

        item.completed = newStatus;
        item.updatedAt = Timestamp.now();

        // Add to history if completed
        if (newStatus) {
          await addDoc(collection(db, 'history'), {
            itemId,
            userId: auth.currentUser.uid,
            completedAt: Timestamp.now()
          });
        }
      } catch (error) {
        console.error('Error toggling item:', error);
        this.error = 'Failed to update item';
      }
    },

    async deleteItem(itemId: string) {
      if (!auth.currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      try {
        await deleteDoc(doc(db, 'checklist', itemId));
        this.items = this.items.filter(item => item.id !== itemId);
      } catch (error) {
        console.error('Error deleting item:', error);
        this.error = 'Failed to delete item';
      }
    },

    async updateItem(itemId: string, updates: { title: string; description?: string }) {
      if (!auth.currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      try {
        const item = this.items.find(i => i.id === itemId);
        if (!item) return;

        await updateDoc(doc(db, 'checklist', itemId), {
          ...updates,
          updatedAt: Timestamp.now()
        });

        Object.assign(item, {
          ...updates,
          updatedAt: Timestamp.now()
        });
      } catch (error) {
        console.error('Error updating item:', error);
        this.error = 'Failed to update item';
      }
    },

    async checkAndResetItems() {
      const lastReset = localStorage.getItem('lastReset');
      const now = new Date();
      const portugalTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Lisbon' }));
      
      // Check if it's 4 AM in Portugal
      if (portugalTime.getHours() === 4) {
        const today = portugalTime.toDateString();
        
        if (lastReset !== today) {
          // Reset all checked items
          const batch = writeBatch(db);
          const itemsToReset = this.items.filter(item => item.completed);
          
          itemsToReset.forEach(item => {
            const itemRef = doc(db, 'checklist', item.id);
            batch.update(itemRef, {
              completed: false,
              updatedAt: Timestamp.now()
            });
            item.completed = false;
            item.updatedAt = Timestamp.now();
          });
          
          await batch.commit();
          localStorage.setItem('lastReset', today);
        }
      }
    }
  }
}); 