<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConversationList from '@/components/admin/bot/ConversationList.vue'
import ConversationDetail from '@/components/admin/bot/ConversationDetail.vue'
import {
  getBotConversation,
  getBotStats,
  listBotConversations,
  resetBotConversation,
  type BotConversation,
  type BotConversationSummary,
  type BotStats,
} from '@/services/bot'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { ROUTE_META } from '@/components/admin/bot/botLabels'

/**
 * Lo que pasa en el bot de WhatsApp, en vivo: conversaciones, el chat de cada
 * cliente, que decidio /brain y que respondio cada flujo de BuilderBot.
 */

useAdminEntrance()
const route = useRoute()
const router = useRouter()
const dialog = useDialogStore()

const LIVE_MS = 8000

const stats = ref<BotStats | null>(null)
const conversations = ref<BotConversationSummary[]>([])
const selectedPhone = ref('')
const detail = ref<BotConversation | null>(null)
const loadingList = ref(true)
const loadingDetail = ref(false)
const detailError = ref('')
const listError = ref('')
const search = ref('')
const live = ref(true)
const lastSync = ref<Date | null>(null)
const filter = ref<'all' | 'human' | 'cart' | 'ordered' | 'error'>('all')

const FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'human', label: '🙋 Con asesor' },
  { value: 'cart', label: '🛒 Con carrito' },
  { value: 'ordered', label: '✅ Con pedido' },
  { value: 'error', label: '⚠️ Con error' },
] as const

const visible = computed(() =>
  conversations.value.filter((item) => {
    if (filter.value === 'human') return item.withHuman
    if (filter.value === 'cart') return item.cartCount > 0 && !item.orderNumber
    if (filter.value === 'ordered') return Boolean(item.orderNumber)
    if (filter.value === 'error') return item.lastError
    return true
  }),
)

const topRoutes = computed(() =>
  Object.entries(stats.value?.routes ?? {})
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count, label: ROUTE_META[key]?.label ?? key })),
)

const syncLabel = computed(() =>
  lastSync.value ? lastSync.value.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—',
)

async function loadList(quiet = false) {
  if (!quiet) loadingList.value = true
  try {
    const [list, metrics] = await Promise.all([listBotConversations(search.value.trim()), getBotStats()])
    conversations.value = list
    stats.value = metrics
    listError.value = ''
    lastSync.value = new Date()
  } catch (caught) {
    listError.value = errorMessage(caught, 'No pudimos cargar las conversaciones.')
  } finally {
    loadingList.value = false
  }
}

async function loadDetail(quiet = false) {
  if (!selectedPhone.value) return
  if (!quiet) {
    loadingDetail.value = true
    detail.value = null
  }
  try {
    detail.value = await getBotConversation(selectedPhone.value)
    detailError.value = ''
  } catch (caught) {
    if (!quiet) detailError.value = errorMessage(caught, 'No pudimos cargar la conversación.')
  } finally {
    loadingDetail.value = false
  }
}

const select = (phone: string) => {
  selectedPhone.value = phone
  router.replace({ query: { ...route.query, phone } })
  void loadDetail()
}

const back = () => {
  selectedPhone.value = ''
  detail.value = null
  const { phone: _phone, ...query } = route.query
  router.replace({ query })
}

const reset = async (phone: string) => {
  const confirmed = await dialog.confirm({
    title: '¿Reiniciar esta conversación?',
    message: 'Se borran el carrito, los datos y el paso en el que va el cliente. Los pedidos ya creados no se tocan.',
    detail: phone,
    confirmLabel: 'Reiniciar',
    tone: 'danger',
    icon: 'fa-solid fa-rotate-left',
  })
  if (!confirmed) return
  try {
    await resetBotConversation(phone)
    back()
    await loadList(true)
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo reiniciar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  }
}

// En vivo: refresca la lista y la conversacion abierta. Se pausa con la pestaña oculta.
let timer: ReturnType<typeof setInterval> | undefined
const tick = () => {
  if (!live.value || document.hidden) return
  void loadList(true)
  void loadDetail(true)
}
watch(live, (value) => value && tick())

let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadList(), 350)
})

onMounted(() => {
  if (typeof route.query.phone === 'string' && route.query.phone) select(route.query.phone)
  void loadList()
  timer = setInterval(tick, LIVE_MS)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="bot-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Bot de WhatsApp</p>
        <h1>Qué está pasando<br /><em>en vivo.</em></h1>
        <p>Cada conversación, lo que decidió el bot y lo que respondió cada flujo de BuilderBot.</p>
      </div>
      <button type="button" class="live" :class="{ on: live }" :aria-pressed="live" @click="live = !live">
        <span class="dot" aria-hidden="true"></span>
        {{ live ? 'En vivo' : 'Pausado' }}
        <small>{{ syncLabel }}</small>
      </button>
    </header>

    <section class="stats" data-admin-reveal aria-label="Últimas 24 horas">
      <article>
        <span>Conversaciones</span>
        <strong>{{ stats?.conversations ?? '—' }}</strong>
        <small>últimas 24 h</small>
      </article>
      <article>
        <span>Mensajes atendidos</span>
        <strong>{{ stats?.messages ?? '—' }}</strong>
        <small>respuesta media {{ stats ? (stats.avgResponseMs / 1000).toFixed(1) : '—' }} s</small>
      </article>
      <article>
        <span>Pedidos del bot</span>
        <strong>{{ stats?.orders ?? '—' }}</strong>
        <small>${{ stats?.ordersTotal.toFixed(2) ?? '0.00' }}</small>
      </article>
      <article :class="{ warn: (stats?.toHuman ?? 0) > 0 }">
        <span>A un asesor</span>
        <strong>{{ stats?.toHuman ?? '—' }}</strong>
        <small>🙋 derivados</small>
      </article>
      <article :class="{ danger: (stats?.errors ?? 0) > 0 }">
        <span>Errores</span>
        <strong>{{ stats?.errors ?? '—' }}</strong>
        <small>{{ stats?.errors ? 'revisa la actividad' : 'todo en orden' }}</small>
      </article>
    </section>

    <section v-if="topRoutes.length" class="routes" data-admin-reveal aria-label="Decisiones de /brain en 24 h">
      <span class="routes-title">🧠 Principal decidió (24 h):</span>
      <span v-for="item in topRoutes" :key="item.key" class="route-chip">{{ item.label }} <strong>{{ item.count }}</strong></span>
    </section>

    <p v-if="listError" class="notice error" role="alert">
      <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>{{ listError }}
    </p>

    <section class="workspace" :class="{ 'has-selection': selectedPhone }" data-admin-reveal>
      <aside class="list-pane">
        <div class="list-tools">
          <label class="search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <span class="visually-hidden">Buscar conversación</span>
            <input v-model="search" type="search" placeholder="Teléfono, nombre o MP-…" />
          </label>
          <div class="filters" role="group" aria-label="Filtrar conversaciones">
            <button
              v-for="item in FILTERS"
              :key="item.value"
              type="button"
              :class="{ active: filter === item.value }"
              :aria-pressed="filter === item.value"
              @click="filter = item.value"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
        <ConversationList :conversations="visible" :selected="selectedPhone" :loading="loadingList" @select="select" />
      </aside>

      <div class="detail-pane">
        <ConversationDetail :conversation="detail" :loading="loadingDetail" :error="detailError" @back="back" @reset="reset" />
      </div>
    </section>
  </div>
</template>

<style scoped lang="scss">
.bot-page {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;

  i {
    color: $whatsapp;
  }
}

.notice {
  @include admin-notice;
}

.live {
  @include row($space-2);
  align-self: flex-start;
  padding: $space-2 $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-pill;
  background: $surface-card;
  color: $text-muted;
  font-size: $text-caption;
  font-weight: $weight-semibold;
  cursor: pointer;
  @include focus-ring;

  small {
    @include mono-data($text-muted, 0.625rem);
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: $radius-pill;
    background: $key-300;
  }

  &.on {
    border-color: $success-500;
    color: $text-strong;

    .dot {
      background: $success-500;
      box-shadow: 0 0 0 0 rgba($success-500, 0.5);
      animation: pulse 1.8s ease-out infinite;
    }
  }

  @include reduced-motion {
    &.on .dot {
      animation: none;
    }
  }
}

@keyframes pulse {
  to {
    box-shadow: 0 0 0 8px rgba($success-500, 0);
  }
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  article {
    @include stack(2px);
    flex: 1 1 140px;
    padding: $space-3 $space-4;
    border: 1px solid $border-subtle;
    border-radius: $radius-md;
    background: $surface-card;

    span {
      @include field-label;
    }

    strong {
      font-size: 1.5rem;
      font-weight: $weight-black;
      line-height: 1.1;
    }

    small {
      color: $text-muted;
      font-size: $text-eyebrow;
    }

    &.warn {
      border-color: $warning-500;
    }

    &.danger {
      border-color: $danger-500;

      strong {
        color: $danger-500;
      }
    }
  }
}

.routes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  font-size: $text-caption;
}

.routes-title {
  color: $text-muted;
  font-weight: $weight-semibold;
}

.route-chip {
  @include row($space-1);
  padding: 2px $space-2;
  border-radius: $radius-pill;
  background: $surface-sunken;

  strong {
    font-family: $font-mono;
  }
}

.workspace {
  display: flex;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.list-pane {
  display: flex;
  width: 100%;
  flex-direction: column;
  min-width: 0;
}

.detail-pane {
  display: none;
  width: 100%;
  min-width: 0;
}

// Movil: lista o detalle, uno a la vez.
.has-selection {
  .list-pane {
    display: none;
  }

  .detail-pane {
    display: block;
  }
}

.list-tools {
  @include stack($space-3);
  padding: $space-4;
  border-bottom: 1px solid $border-subtle;
}

.search {
  @include admin-search;
}

.filters {
  display: flex;
  gap: $space-1;
  overflow-x: auto;

  button {
    flex: none;
    padding: $space-1 $space-3;
    border: 1px solid $border-subtle;
    border-radius: $radius-pill;
    background: $surface-card;
    color: $text-body;
    font-size: $text-eyebrow;
    cursor: pointer;
    @include focus-ring;

    &.active {
      border-color: $cyan;
      background: $brand-100;
      color: $text-strong;
      font-weight: $weight-semibold;
    }
  }
}

@include from($bp-md) {
  .workspace,
  .workspace.has-selection {
    min-height: 640px;

    .list-pane {
      display: flex;
      width: 360px;
      flex: none;
      border-right: 1px solid $border-subtle;
    }

    .detail-pane {
      display: block;
      flex: 1;
    }
  }

  .list-pane :deep(.conversation-list) {
    max-height: 720px;
    overflow-y: auto;
  }
}
</style>
