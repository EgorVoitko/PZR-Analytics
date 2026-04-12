<template>
  <AppSidebar />
  <div class="main">
    <AppHeader :title="route.meta.title || ''" />
    <div class="content">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const route = useRoute()
</script>

<style scoped>
.main {
  margin-left: var(--sidebar-w);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
}
</style>
