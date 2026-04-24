<template>
  <AppSidebar />
  <div class="main">
    <AppHeader :title="(route.meta.title as string) || ''" />
    <div class="content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
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
