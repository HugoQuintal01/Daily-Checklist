import { defineStore } from 'pinia';
import { 
  collection, 
  query, 
  getDocs, 
  doc,
  getDoc,
  where,
  writeBatch,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuthStore } from './auth';
import type { ChecklistItem, ChecklistHistory } from '../types/checklist';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  phoneNumber?: string | null;
  bio?: string | null;
  lastLogin?: Date | null;
}

interface ChecklistStats {
  totalItems: number;
  completedItems: number;
  lastCompleted: Date | null;
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [] as UserData[],
    selectedUser: null as UserData | null,
    userStats: null as ChecklistStats | null,
    userItems: {} as { [key: string]: ChecklistItem[] },
    userHistory: {} as { [key: string]: ChecklistHistory[] },
    loading: false,
    error: null as string | null,
  }),

  getters: {
    // isAdmin: () => {
    //   const authStore = useAuthStore();
    //   return authStore.isAdmin;
    // },
  },

  actions: {
    async fetchUsers() {
      const authStore = useAuthStore();

      if (authStore.loading) {
        await new Promise<void>(resolve => {
          const unsubscribe = authStore.$subscribe((_mutation, state) => {
            if (!state.loading) {
              unsubscribe();
              resolve();
            }
          });
        });
      }

      if (!authStore.user || !authStore.isAdmin) {
        this.error = 'Unauthorized';
        this.loading = false;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        
        this.users = querySnapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            id: docSnapshot.id,
            email: data.email || '',
            displayName: data.displayName || '',
            createdAt: data.createdAt?.toDate() || new Date(),
            phoneNumber: data.phoneNumber || null,
            bio: data.bio || null,
            lastLogin: data.lastLogin?.toDate() || null,
          };
        });
      } catch (error) {
        console.error('Error fetching users:', error);
        this.error = 'Failed to fetch users';
      } finally {
        this.loading = false;
      }
    },

    async fetchUserStats(userId: string) {
       const authStore = useAuthStore();

       if (authStore.loading) {
         await new Promise<void>(resolve => {
           const unsubscribe = authStore.$subscribe((_mutation, state) => {
             if (!state.loading) {
               unsubscribe();
               resolve();
             }
           });
         });
       }

      if (!authStore.user || !authStore.isAdmin) {
        this.error = 'Unauthorized';
        this.loading = false;
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        const itemsRef = collection(db, 'checklist');
        const itemsQuery = query(
          itemsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const itemsSnapshot = await getDocs(itemsQuery);
        
        const items = itemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ChecklistItem[];

        const historyRef = collection(db, 'history');
        const historyQuery = query(
          historyRef,
          where('userId', '==', userId),
          orderBy('completedAt', 'desc')
        );
        const historySnapshot = await getDocs(historyQuery);
        
        const lastCompleted = historySnapshot.docs[0]?.data()?.completedAt?.toDate() || null;

        this.userStats = {
          totalItems: items.length,
          completedItems: items.filter(item => item.completed).length,
          lastCompleted
        };
        this.error = null;
      } catch (error) {
        console.error('Error fetching user stats:', error);
        this.error = 'Failed to fetch user stats';
      } finally {
        this.loading = false;
      }
    },

    async selectUser(userId: string) {
       const authStore = useAuthStore();
       if (!authStore.user || !authStore.isAdmin) {
         this.error = 'Unauthorized';
         return;
       }

      const user = this.users.find(u => u.id === userId);
      if (user) {
        this.selectedUser = user;
        await this.fetchUserItems(userId);
        await this.fetchUserHistory(userId);
        await this.fetchUserStats(userId);
      }
    },

    async fetchUserItems(userId: string) {
       const authStore = useAuthStore();
       if (!authStore.user || !authStore.isAdmin) {
         return;
       }
       try {
         const itemsRef = collection(db, 'checklist');
         const itemsQuery = query(
           itemsRef,
           where('userId', '==', userId),
           orderBy('createdAt', 'desc')
         );
         const itemsSnapshot = await getDocs(itemsQuery);
         this.userItems[userId] = itemsSnapshot.docs.map(doc => ({
           id: doc.id,
           ...doc.data()
         })) as ChecklistItem[];
       } catch (error) {
         console.error(`Error fetching items for user ${userId}:`, error);
       }
     },

    async fetchUserHistory(userId: string) {
        const authStore = useAuthStore();
        if (!authStore.user || !authStore.isAdmin) {
          return;
        }
        try {
          const historyRef = collection(db, 'history');
          const historyQuery = query(
            historyRef,
            where('userId', '==', userId),
            orderBy('completedAt', 'desc')
          );
          const historySnapshot = await getDocs(historyQuery);
          this.userHistory[userId] = await Promise.all(
             historySnapshot.docs.map(async (docSnapshot) => {
                const data = docSnapshot.data();
                const itemDoc = await getDoc(doc(db, 'checklist', data.itemId));
                const itemData = itemDoc.data();

                return {
                   id: docSnapshot.id,
                   itemId: data.itemId,
                   userId: data.userId,
                   completedAt: data.completedAt,
                   uncheckedAt: data.uncheckedAt || null,
                   itemTitle: itemData?.title || 'Unknown Item'
                };
             })
          );
        } catch (error) {
          console.error(`Error fetching history for user ${userId}:`, error);
        }
      },

    async deleteUser(userId: string) {
       const authStore = useAuthStore();
       if (!authStore.user || !authStore.isAdmin) {
         this.error = 'Unauthorized';
         return;
       }

      try {
        const batch = writeBatch(db);

        const itemsRef = collection(db, 'checklist');
        const itemsQuery = query(itemsRef, where('userId', '==', userId));
        const itemsSnapshot = await getDocs(itemsQuery);
        itemsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        const historyRef = collection(db, 'history');
        const historyQuery = query(historyRef, where('userId', '==', userId));
        const historySnapshot = await getDocs(historyQuery);
        historySnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });

        const userRef = doc(db, 'users', userId);
        batch.delete(userRef);

        await batch.commit();
        this.users = this.users.filter(u => u.id !== userId);
        if (this.selectedUser?.id === userId) {
          this.selectedUser = null;
          this.userStats = null;
          delete this.userItems[userId];
          delete this.userHistory[userId];
        }
        this.error = null;
      } catch (error) {
        console.error('Error deleting user:', error);
        this.error = 'Failed to delete user';
      }
    },
  },
}); 