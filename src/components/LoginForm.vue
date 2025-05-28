<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const email = ref('');
const password = ref('');
const isRegistering = ref(false);

const handleSubmit = async () => {
  try {
    if (isRegistering.value) {
      await auth.register(email.value, password.value);
    } else {
      await auth.login(email.value, password.value);
    }
    // Clear form after successful login/register
    email.value = '';
    password.value = '';
  } catch (error) {
    // Error is handled in the store
  }
};
</script>

<template>
  <div class="card max-w-md mx-auto">
    <h2 class="text-2xl font-bold text-center mb-6">
      {{ isRegistering ? 'Create Account' : 'Login' }}
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          placeholder="••••••••"
        />
      </div>

      <div v-if="auth.error" class="text-red-600 text-sm">
        {{ auth.error }}
      </div>

      <div class="flex flex-col space-y-3">
        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="auth.loading"
        >
          {{ auth.loading ? 'Loading...' : (isRegistering ? 'Register' : 'Login') }}
        </button>

        <button
          type="button"
          class="text-sm text-primary-600 hover:text-primary-700"
          @click="isRegistering = !isRegistering"
        >
          {{ isRegistering ? 'Already have an account? Login' : 'Need an account? Register' }}
        </button>
      </div>
    </form>
  </div>
</template> 