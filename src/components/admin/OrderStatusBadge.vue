<script setup lang="ts">
import { computed } from 'vue'
import { orderStatusMeta } from '@/services/orders'

const props = defineProps<{ status: string }>()
const meta = computed(() => orderStatusMeta(props.status))
</script>

<template>
  <span class="status-badge" :class="status">
    <i :class="meta.icon" aria-hidden="true"></i>{{ meta.label }}
  </span>
</template>

<style scoped lang="scss">
.status-badge {
  @include admin-status-badge;
}
</style>
