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
      <span class="avatar" aria-hidden="true"><i class="fa-brands fa-whatsapp"></i></span>
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
  font-size: $text-body-sm;
  text-align: center;

  i {
    color: $whatsapp;
    font-size: 1.5rem;
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

  &:hover {
    background: $surface-sunken;
  }

  &.active {
    background: $brand-100;
    box-shadow: inset 3px 0 0 $cyan;
  }
}

.avatar {
  display: flex;
  width: 38px;
  height: 38px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: rgba($whatsapp, 0.16);
  color: $whatsapp;
}

.copy {
  @include stack($space-1);
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
    font-size: $text-body-sm;
  }

  time {
    @include mono-data($text-muted, $text-eyebrow);
    flex: none;
  }
}

.preview {
  @include truncate;
  color: $text-body;
  font-size: $text-caption;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: $space-1;
}

.tag {
  @include row(4px);
  padding: 2px $space-2;
  border-radius: $radius-xs;
  background: $surface-sunken;
  color: $text-body;
  font-size: 0.6875rem;

  &.stage {
    background: $brand-100;
    color: $brand-700;
  }

  &.ok {
    background: $success-100;
    color: $success-500;
    font-family: $font-mono;
  }

  &.warn {
    background: $warning-100;
    color: $text-strong;
  }

  &.danger {
    background: $danger-100;
    color: $danger-500;
  }
}
</style>
