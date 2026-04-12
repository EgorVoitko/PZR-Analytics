<template>
  <div class="feed">
    <div class="feed-header">
      <div class="feed-title">Recent Sales</div>
      <div class="feed-live">
        Live
      </div>
    </div>

    <div
      v-for="item in displaySales"
      :key="item.id"
      class="feed-item"
    >
      <span class="feed-time">{{ item.date }}</span>
      <span class="feed-product">{{ item.productName }}</span>
      <span class="feed-seller">{{ item.staffName }}</span>
      <span class="feed-amount">+{{ fmt(item.total) }}</span>
    </div>

    <div v-if="displaySales.length === 0" class="feed-empty">
      No sales yet
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  sales: { type: Array, default: () => [] },
  limit: { type: Number, default: 8 },
})

const displaySales = computed(() => props.sales.slice(0, props.limit))

function fmt(n) {
  return '$' + n.toLocaleString('en-US')
}
</script>

<style scoped>
.feed {
  background: var(--bg-raised);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 28px;
  transition: border-color 0.15s;
}

.feed:hover {
  border-color: var(--border-light);
}

.feed-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feed-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
}

.feed-live {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--green);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.feed-item {
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background 0.15s;
  border-bottom: 1px solid rgba(37, 37, 37, 0.5);
}

.feed-item:last-child {
  border-bottom: none;
}

.feed-item:hover {
  background: var(--bg-hover);
}

.feed-time {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  color: var(--text-3);
  min-width: 120px;
  flex-shrink: 0;
}

.feed-product {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  flex: 1;
}

.feed-seller {
  font-size: 12px;
  color: var(--text-3);
  min-width: 80px;
  flex-shrink: 0;
}

.feed-amount {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  font-weight: 500;
  color: var(--green);
  min-width: 100px;
  text-align: right;
  flex-shrink: 0;
}

.feed-empty {
  padding: 24px 20px;
  font-size: 13px;
  color: var(--text-3);
  text-align: center;
}
</style>
