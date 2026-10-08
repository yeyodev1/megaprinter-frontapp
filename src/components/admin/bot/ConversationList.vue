<script setup lang="ts">
import type { BotConversationSummary } from '@/services/bot'
import { routeMeta, stageMeta, timeAgo } from '@/components/admin/bot/botLabels'

defineProps<{ conversations: BotConversationSummary[]; selected: string; loading: boolean }>()
const emit = defineEmits<{ select: [phone: string] }>()

const preview = (item: BotConversationSummary) => {
  if (!item.lastMessage) return 'Sin mensajes'
  const who = item.lastMessage.role === 'user' ? '' : 'Bot: '
  return `${who}${item.lastMessage.hasMedia && item.lastMessage.content.startsWith('[') ? '📎 Archivo' : item.lastMessage.content}`
}

const initials = (item: BotConversationSummary) =>
  item.customerName
    ? item.customerName
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''
</script>

<template>
  <div class="conversation-list">
    <p v-if="loading && !conversations.length" class="state">Cargando conversaciones…</p>
    <p v-else-if="!conversations.length" class="state">
      <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
      Todavía no hay conversaciones con el bot.
    </p>

    <button
      v-for="item in conversations"
      :key="item.phone"
      type="button"
      class="item"
      :class="{ active: item.phone === selected }"
      :aria-current="item.phone === selected"
      @click="emit('select', item.phone)"
    >
      <span class="avatar" :class="{ human: item.withHuman }" aria-hidden="true">
        <template v-if="initials(item)">{{ initials(item) }}</template>
        <i v-else class="fa-brands fa-whatsapp"></i>
      </span>
      <span class="copy">
        <span class="top">
          <strong>{{ item.customerName || item.phone }}</strong>
          <time>{{ timeAgo(item.updatedAt) }}</time>
        </span>
        <span class="preview">{{ preview(item) }}</span>
        <span class="tags">
          <span class="tag stage"><i :class="stageMeta(item.stage).icon" aria-hidden="true"></i>{{ stageMeta(item.stage).label }}</span>
          <span v-if="item.withHuman" class="tag warn">🙋 Con asesor</span>
          <span v-if="item.lastError" class="tag danger"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>Error</span>
          <span v-if="item.orderNumber" class="tag ok">{{ item.orderNumber }}</span>
          <span v-else-if="item.cartCount" class="tag">🛒 {{ item.cartCount }} · ${{ item.cartTotal.toFixed(2) }}</span>
          <span v-if="item.lastRoute && !item.withHuman" class="tag route">{{ routeMeta(item.lastRoute).label }}</span>
        </span>
      </span>
    </button>
  </div>
</template>

<style scoped lang="scss">
.conversation-list {
  display: flex;
  flex-direction: column;
}

.state {
  @include stack($space-2);
  align-items: center;
  padding: $space-10 $space-4;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;

  i {
    color: $whatsapp;
    font-size: 1.75rem;
  }
}

.item {
  @include row($space-3, flex-start);
  width: 100%;
  padding: $space-4;
  border: 0;
  border-bottom: 1px solid $border-subtle;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background $duration-fast $ease-out;
  @include focus-ring;

  @media (hover: hover) {
    &:hover {
      background: $surface-page;
    }
  }

  &.active {
    background: $cyan-wash;
    box-shadow: inset 3px 0 0 $cyan;
  }
}

.avatar {
  display: flex;
  width: 44px;
  height: 44px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: rgba($whatsapp, 0.16);
  color: #0d7a3c;
  font-size: $admin-text-sm;
  font-weight: $weight-bold;

  i {
    font-size: 1.125rem;
  }

  &.human {
    background: $yellow-wash;
    color: $yellow-deep;
  }
}

.copy {
  @include stack(6px);
  min-width: 0;
  flex: 1;
}

.top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-2;

  strong {
    @include truncate;
    color: $text-strong;
    font-size: $admin-text-base;
    font-weight: $weight-bold;
  }

  time {
    flex: none;
    color: $text-muted;
    font-size: $admin-text-xs;
    font-variant-numeric: tabular-nums;
  }
}

.preview {
  @include truncate;
  color: $text-body;
  font-size: $admin-text-md;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  @include admin-badge;
  padding: 2px 8px;
  font-weight: $weight-medium;

  &.stage {
    background: $cyan-wash;
    color: $cyan-dark;
  }

  &.ok {
    background: $success-100;
    color: $success-500;
    font-family: $font-mono;
  }

  &.warn {
    background: $yellow-wash;
    color: $yellow-deep;
  }

  &.danger {
    background: $danger-100;
    color: $danger-500;
  }
}
</style>
