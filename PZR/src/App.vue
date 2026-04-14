<template>
  <template v-if="routeReady">
    <template v-if="route.meta.public">
      <RouterView />
    </template>
    <template v-else>
      <AppLayout />
    </template>
  </template>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppLayout from './components/layout/AppLayout.vue'

const route = useRoute()
const router = useRouter()

const routeReady = ref(false)
router.isReady().then(() => { routeReady.value = true })
</script>
