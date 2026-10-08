<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { BotConversation } from '@/services/bot'
import { ORDER_STATUS_LABEL } from '@/services/orders'
import {
  FUNNEL,
  endpointLabel,
  paymentLabel,
  routeMeta,
  stageMeta,
  timeAgo,
  timeOf,
  waLink,
  whatsappHtml,
} from '@/components/admin/bot/botLabels'

const props = defineProps<{ conversation: BotConversation | null; loading: boolean; error: string }>()
const emit = defineEmits<{ back: []; reset: [phone: string] }>()

const tab = ref<'chat' | 'activity'>('chat')
const chatBox = ref<HTMLElement | null>(null)

const state = computed(() => props.conversation?.state)
const funnelIndex = computed(() => (state.value ? FUNNEL.indexOf(state.value.stage) : -1))
const isPdf = (url: string) => /\.pdf($|\?)|\/raw\/upload\//i.test(url)

// Cada mensaje del cliente con la decision de /brain y la respuesta del flujo, agrupados.
const turns = computed(() => {
  const events = [...(props.conversation?.events ?? [])].reverse()
  const groups: Array<{ id: string; at: string; message: string; mediaUrl: string; decision?: (typeof events)[number]; result?: (typeof events)[number] }> = []
  for (const event of events) {
    if (event.kind === 'decision') {
      groups.push({ id: event._id, at: event.createdAt, message: event.message, mediaUrl: event.mediaUrl, decision: event })
      continue
    }
    const open = groups.at(-1)
    if (open && !open.result && open.message === event.message) open.result = event
    else groups.push({ id: event._id, at: event.createdAt, message: event.message, mediaUrl: event.mediaUrl, result: event })
  }
  return groups.reverse()
})

const scrollChatToEnd = async () => {
  await nextTick()
  if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight
}

watch(
  () => [props.conversation?.phone, props.conversation?.history.length],
  (next, previous) => {
    if (next[0] !== previous?.[0]) tab.value = 'chat'
    void scrollChatToEnd()
  },
)
watch(tab, (value) => value === 'chat' && scrollChatToEnd())
</script>

<template>
  <section class="detail" aria-live="polite">
    <div v-if="!conversation" class="placeholder">
      <p v-if="loading">Cargando conversación…</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <template v-else>
        <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
        <p>Elige una conversación para ver qué está pasando.</p>
      </template>
    </div>

    <template v-else-if="state">
      <header class="head">
        <button type="button" class="back" aria-label="Volver a la lista" @click="emit('back')">
          <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
        </button>
        <div class="who">
          <strong>{{ state.customerName || conversation.phone }}</strong>
          <span><span class="mono">{{ conversation.phone }}</span> · activo {{ timeAgo(conversation.updatedAt) }}</span>
        </div>
        <div class="head-actions">
          <a v-if="waLink(conversation.phone)" :href="waLink(conversation.phone)" target="_blank" rel="noopener" class="wa">
            <i class="fa-brands fa-whatsapp" aria-hidden="true"></i><span>Abrir chat</span>
          </a>
          <button type="button" class="reset" title="Reiniciar conversación" @click="emit('reset', conversation.phone)">
            <i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>Reiniciar</span>
          </button>
        </div>
      </header>

      <ol class="funnel" aria-label="Avance del cliente">
        <li
          v-for="(stage, index) in FUNNEL"
          :key="stage"
          :class="{ done: index < funnelIndex, current: index === funnelIndex }"
          :title="stageMeta(stage).label"
        >
          <i :class="stageMeta(stage).icon" aria-hidden="true"></i>
          <span>{{ stageMeta(stage).label }}</span>
        </li>
      </ol>

      <div class="facts">
        <div class="fact">
          <span>Paso actual</span>
          <strong><i :class="stageMeta(state.stage).icon" aria-hidden="true"></i> {{ stageMeta(state.stage).label }}</strong>
        </div>
        <div class="fact">
          <span>Carrito</span>
          <strong v-if="state.cart.length">{{ state.cart.length }} {{ state.cart.length === 1 ? 'producto' : 'productos' }} · ${{ state.cartTotal.toFixed(2) }}</strong>
          <strong v-else class="muted">Vacío</strong>
          <ul v-if="state.cart.length">
            <li v-for="line in state.cart" :key="line.productId">{{ line.quantity }} × {{ line.name }}</li>
          </ul>
        </div>
        <div class="fact">
          <span>Datos del cliente</span>
          <ul>
            <li :class="{ missing: !state.customerName }">👤 {{ state.customerName || 'Falta nombre' }}</li>
            <li :class="{ missing: !state.customerEmail }">📧 {{ state.customerEmail || 'Falta correo' }}</li>
            <li :class="{ missing: !state.address }">📍 {{ state.address || 'Falta dirección' }}</li>
            <li :class="{ missing: !state.paymentMethod }">💳 {{ paymentLabel(state.paymentMethod) }}</li>
          </ul>
        </div>
        <div class="fact">
          <span>Pedidos de este número</span>
          <ul v-if="conversation.orders.length">
            <li v-for="order in conversation.orders.slice(0, 4)" :key="order._id">
              <router-link :to="{ name: 'AdminOrders', query: { search: order.orderNumber || order._id } }" class="order-link">
                {{ order.orderNumber || order._id.slice(-6).toUpperCase() }}
              </router-link>
              · ${{ order.totalAmount.toFixed(2) }} · {{ ORDER_STATUS_LABEL[order.status] ?? order.status }}
              <template v-if="order.transfer?.status === 'in_review'"> · 🔎 comprobante</template>
            </li>
          </ul>
          <strong v-else class="muted">Ninguno</strong>
        </div>
      </div>

      <div class="tabs" role="tablist">
        <button type="button" role="tab" :aria-selected="tab === 'chat'" :class="{ active: tab === 'chat' }" @click="tab = 'chat'">
          <i class="fa-solid fa-comments" aria-hidden="true"></i> Chat ({{ conversation.history.length }})
        </button>
        <button type="button" role="tab" :aria-selected="tab === 'activity'" :class="{ active: tab === 'activity' }" @click="tab = 'activity'">
          <i class="fa-solid fa-route" aria-hidden="true"></i> Qué decidió el bot ({{ turns.length }})
        </button>
      </div>

      <div v-if="tab === 'chat'" ref="chatBox" class="chat" role="tabpanel">
        <p v-if="!conversation.history.length" class="empty">Sin mensajes guardados (la conversación se borra tras 3 días sin actividad).</p>
        <div v-for="(entry, index) in conversation.history" :key="index" class="bubble" :class="entry.role">
          <a v-if="entry.mediaUrl" :href="entry.mediaUrl" target="_blank" rel="noopener" class="media">
            <span v-if="isPdf(entry.mediaUrl)"><i class="fa-solid fa-file-pdf" aria-hidden="true"></i> Ver archivo</span>
            <img v-else :src="entry.mediaUrl" alt="Archivo enviado por el cliente" loading="lazy" />
          </a>
          <!-- eslint-disable-next-line vue/no-v-html -- texto escapado en whatsappHtml -->
          <p v-if="!entry.mediaUrl || !entry.content.startsWith('[')" v-html="whatsappHtml(entry.content)"></p>
          <time>{{ timeOf(entry.createdAt) }}</time>
        </div>
      </div>

      <ol v-else class="activity" role="tabpanel">
        <li v-if="!turns.length" class="empty">Sin actividad registrada.</li>
        <li v-for="turn in turns" :key="turn.id" class="turn" :class="{ failed: turn.result?.kind === 'error' }">
          <div class="turn-head">
            <time>{{ timeOf(turn.at) }}</time>
            <span class="said">👤 {{ turn.message || '(sin texto)' }}</span>
          </div>
          <div class="steps">
            <span v-if="turn.decision" class="step">
              <small>{{ endpointLabel('brain') }} decidió</small>
              <strong :class="routeMeta(turn.decision.route).tone">{{ routeMeta(turn.decision.route).label }}</strong>
              <em>{{ turn.decision.decision }} · {{ turn.decision.durationMs }} ms</em>
            </span>
            <span v-if="turn.decision && turn.result" class="arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>
            <span v-if="turn.result && turn.result.kind !== 'error'" class="step">
              <small>{{ endpointLabel(turn.result.endpoint) }} respondió</small>
              <strong :class="routeMeta(turn.result.route).tone">{{ routeMeta(turn.result.route).label }}</strong>
              <em>
                {{ turn.result.decision }} · {{ stageMeta(turn.result.step).label }} · {{ turn.result.durationMs }} ms
                <template v-if="turn.result.duplicated"> · reintento</template>
                <template v-if="turn.result.orderNumber"> · {{ turn.result.orderNumber }}</template>
              </em>
            </span>
            <span v-else-if="turn.result?.kind === 'error'" class="step error">
              <small>{{ endpointLabel(turn.result.endpoint) }} falló</small>
              <strong>⚠️ {{ turn.result.error }}</strong>
            </span>
            <span v-else-if="turn.decision" class="step pending">
              <small>Sin respuesta registrada</small>
              <em>¿La Rule de «{{ routeMeta(turn.decision.route).label }}» existe en BuilderBot?</em>
            </span>
          </div>
          <!-- eslint-disable-next-line vue/no-v-html -- texto escapado en whatsappHtml -->
          <p v-if="turn.result?.reply" class="reply" v-html="whatsappHtml(turn.result.reply)"></p>
        </li>
      </ol>
    </template>
  </section>
</template>

<style scoped lang="scss">
// Fondo del chat como WhatsApp: el asesor reconoce de inmediato quien dijo que.
$chat-bg: #efeae2;
$bubble-out: #d9fdd3;

.detail {
  @include stack($space-4);
  min-width: 0;
  padding: $space-4;
}

.placeholder {
  @include stack($space-3);
  align-items: center;
  justify-content: center;
  min-height: 320px;
  flex: 1;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;

  i {
    display: flex;
    width: 64px;
    height: 64px;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: rgba($whatsapp, 0.14);
    color: $whatsapp;
    font-size: 1.75rem;
  }

  .error {
    color: $danger-500;
  }
}

.head {
  @include row($space-3);
  flex-wrap: wrap;
  padding-bottom: $space-4;
  border-bottom: 1px solid $border-subtle;
}

.back {
  @include button-ghost;
  padding: $space-2 $space-3;
}

.who {
  @include stack(2px);
  min-width: 0;
  flex: 1;

  strong {
    @include truncate;
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
  }

  > span {
    color: $text-muted;
    font-size: $admin-text-sm;
  }

  .mono {
    font-family: $font-mono;
    font-variant-numeric: tabular-nums;
  }
}

.head-actions {
  display: flex;
  width: 100%;
  gap: $space-2;

  > * {
    flex: 1;
  }
}

.wa {
  @include button-whatsapp;
  padding: $space-2 $space-4;
  font-size: $admin-text-sm;
}

.reset {
  @include button-secondary;
  padding: $space-2 $space-4;
  font-size: $admin-text-sm;
}

.funnel {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;

  li {
    @include row(6px);
    flex: none;
    min-height: 30px;
    padding: 4px 10px;
    border-radius: $radius-pill;
    background: $surface-sunken;
    color: $text-muted;
    font-size: $admin-text-xs;
    white-space: nowrap;

    span {
      display: none;
    }
  }

  .done {
    background: $success-100;
    color: $success-500;
  }

  .current {
    background: $key-900;
    color: $text-on-dark;
    font-weight: $weight-semibold;

    i {
      color: $cyan-soft;
    }

    span {
      display: inline;
    }
  }
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.fact {
  @include stack(6px);
  flex: 1 1 150px;
  min-width: 0;
  padding: $space-3 $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-page;
  font-size: $admin-text-sm;

  > span {
    @include admin-label($text-muted);
  }

  strong {
    @include row(6px);
    color: $text-strong;
    font-size: $admin-text-md;

    i {
      color: $cyan-deep;
    }
  }

  ul {
    @include stack(4px);
    color: $text-body;
    overflow-wrap: anywhere;
  }

  .missing {
    color: $text-muted;
  }

  .muted {
    color: $text-muted;
    font-weight: $weight-medium;
  }
}

.order-link {
  color: $cyan-dark;
  font-family: $font-mono;
  font-weight: $weight-semibold;
  @include focus-ring;
}

.tabs {
  display: flex;
  gap: $space-1;
  border-bottom: 1px solid $border-subtle;

  button {
    @include row($space-2);
    min-height: 42px;
    padding: $space-2 $space-3;
    margin-bottom: -1px;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: $text-muted;
    font-size: $admin-text-md;
    font-weight: $weight-semibold;
    cursor: pointer;
    transition: color $duration-base $ease-out, border-color $duration-base $ease-out;
    @include focus-ring;

    &:hover {
      color: $text-strong;
    }

    &.active {
      border-color: $cyan;
      color: $text-strong;
    }
  }
}

.chat {
  @include stack($space-2);
  max-height: 70vh;
  overflow-y: auto;
  padding: $space-4;
  border-radius: $radius-md;
  background: $chat-bg;
  overscroll-behavior: contain;
}

.bubble {
  @include stack(4px);
  max-width: 82%;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  box-shadow: 0 1px 1px rgba($key-900, 0.08);
  color: $text-strong;
  font-size: $admin-text-md;
  line-height: 1.5;

  p {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }

  p :deep(a) {
    color: $cyan-dark;
  }

  time {
    align-self: flex-end;
    color: $text-muted;
    font-size: $admin-text-xs;
    font-variant-numeric: tabular-nums;
  }

  &.user {
    align-self: flex-start;
    border-top-left-radius: $radius-xs;
    background: $surface-card;
  }

  &.assistant {
    align-self: flex-end;
    border-top-right-radius: $radius-xs;
    background: $bubble-out;
  }
}

.media {
  display: flex;
  overflow: hidden;
  border-radius: $radius-sm;
  background: $surface-card;
  @include focus-ring;

  img {
    width: 100%;
    max-width: 220px;
    max-height: 220px;
    object-fit: contain;
  }

  span {
    @include row($space-2);
    padding: $space-3;
    color: $danger-500;
    font-weight: $weight-semibold;
  }
}

.activity {
  @include stack($space-3);
}

.empty {
  padding: $space-8 $space-6;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;
}

.turn {
  @include stack($space-3);
  padding: $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;

  &.failed {
    border-color: rgba($danger-500, 0.4);
    background: $danger-100;
  }
}

.turn-head {
  @include row($space-3, baseline);

  time {
    @include mono-data($text-muted, $admin-text-xs);
    flex: none;
  }

  .said {
    min-width: 0;
    color: $text-strong;
    font-size: $admin-text-md;
    font-weight: $weight-semibold;
    overflow-wrap: anywhere;
  }
}

.steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.step {
  @include stack(4px);
  padding: $space-2 $space-3;
  border-radius: $radius-sm;
  background: $surface-sunken;

  small {
    @include admin-label($text-muted);
  }

  strong {
    font-size: $admin-text-sm;

    &.ok {
      color: $success-500;
    }

    &.warn {
      color: $warning-500;
    }

    &.info {
      color: $cyan-dark;
    }
  }

  em {
    @include mono-data($text-muted, $admin-text-xs);
    font-style: normal;
  }

  &.error strong {
    color: $danger-500;
  }

  &.pending {
    border: 1px dashed $warning-500;
  }
}

.arrow {
  color: $text-muted;
  font-size: $admin-text-sm;
}

.reply {
  padding: $space-3;
  border-left: 3px solid $whatsapp;
  border-radius: 0 $radius-sm $radius-sm 0;
  background: $surface-page;
  color: $text-body;
  font-size: $admin-text-md;
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

@include from($bp-md) {
  .back {
    display: none;
  }

  .head-actions {
    width: auto;

    > * {
      flex: none;
    }
  }

  .detail {
    height: 100%;
    padding: $space-5 $space-6;
    overflow: hidden;
  }

  .fact ul {
    max-height: 92px;
    overflow-y: auto;
  }

  .chat,
  .activity {
    flex: 1;
    min-height: 0;
    max-height: none;
    overflow-y: auto;
  }
}
</style>
