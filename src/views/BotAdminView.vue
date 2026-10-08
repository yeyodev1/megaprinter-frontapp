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

// Lo más reciente arriba.
const visible = computed(() =>
  conversations.value
    .filter((item) => {
      if (filter.value === 'human') return item.withHuman
      if (filter.value === 'cart') return item.cartCount > 0 && !item.orderNumber
      if (filter.value === 'ordered') return Boolean(item.orderNumber)
      if (filter.value === 'error') return item.lastError
      return true
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
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
        <h1>Conversaciones <em>en vivo</em></h1>
        <p>Cada chat con Mila, lo que decidió el bot y lo que respondió cada flujo de BuilderBot.</p>
      </div>
      <button type="button" class="live" :class="{ on: live }" :aria-pressed="live" @click="live = !live">
        <span class="dot" aria-hidden="true"></span>
        {{ live ? 'En vivo' : 'Pausado' }}
        <small>{{ syncLabel }}</small>
      </button>
    </header>

    <section class="stats" data-admin-reveal aria-label="Últimas 24 horas">
      <article>
        <span class="stat-icon"><i class="fa-solid fa-comments" aria-hidden="true"></i></span>
        <strong>{{ stats?.conversations ?? '—' }}</strong>
        <span>Conversaciones</span>
        <small>últimas 24 h</small>
      </article>
      <article>
        <span class="stat-icon"><i class="fa-solid fa-bolt" aria-hidden="true"></i></span>
        <strong>{{ stats?.messages ?? '—' }}</strong>
        <span>Mensajes atendidos</span>
        <small>responde en {{ stats ? (stats.avgResponseMs / 1000).toFixed(1) : '—' }} s</small>
      </article>
      <article class="ok">
        <span class="stat-icon"><i class="fa-solid fa-bag-shopping" aria-hidden="true"></i></span>
        <strong>{{ stats?.orders ?? '—' }}</strong>
        <span>Pedidos del bot</span>
        <small>${{ stats?.ordersTotal.toFixed(2) ?? '0.00' }}</small>
      </article>
      <article :class="{ warn: (stats?.toHuman ?? 0) > 0 }">
        <span class="stat-icon"><i class="fa-solid fa-headset" aria-hidden="true"></i></span>
        <strong>{{ stats?.toHuman ?? '—' }}</strong>
        <span>Pasaron a un asesor</span>
        <small>en 24 h</small>
      </article>
      <article :class="{ danger: (stats?.errors ?? 0) > 0 }">
        <span class="stat-icon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></span>
        <strong>{{ stats?.errors ?? '—' }}</strong>
        <span>Errores</span>
        <small>{{ stats?.errors ? 'revisa la actividad' : 'todo en orden' }}</small>
      </article>
    </section>

    <section v-if="topRoutes.length" class="routes" data-admin-reveal aria-label="Decisiones de /brain en 24 h">
      <span class="routes-title"><i class="fa-solid fa-brain" aria-hidden="true"></i> Lo que decidió el bot en 24 h</span>
      <span class="route-list">
        <span v-for="item in topRoutes" :key="item.key" class="route-chip">{{ item.label }} <strong>{{ item.count }}</strong></span>
      </span>
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
  min-height: 40px;
  padding: $space-2 $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-pill;
  background: $surface-card;
  color: $text-muted;
  font-size: $admin-text-sm;
  font-weight: $weight-semibold;
  cursor: pointer;
  transition: border-color $duration-base $ease-out;
  @include focus-ring;

  small {
    @include mono-data($text-muted, $admin-text-xs);
  }

  .dot {
    width: 9px;
    height: 9px;
    border-radius: $radius-pill;
    background: $key-300;
  }

  &.on {
    border-color: rgba($success-500, 0.45);
    background: $success-100;
    color: $success-500;

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

// Movil: franja deslizable (cinco tarjetas apiladas ocupaban dos pantallas).
.stats {
  display: flex;
  gap: $space-3;
  overflow-x: auto;
  margin-inline: calc(-1 * #{$space-4});
  padding: 2px $space-4 $space-1;
  scroll-padding-inline: $space-4;
  scroll-snap-type: x proximity;
  scrollbar-width: none;

  article {
    @include stack(2px);
    flex: 0 0 156px;
    scroll-snap-align: start;
    padding: $space-4 $space-5;
    border: 1px solid $border-subtle;
    border-radius: $radius-lg;
    background: $surface-card;
    box-shadow: $shadow-xs;

    > span:not(.stat-icon) {
      color: $text-strong;
      font-size: $admin-text-sm;
      font-weight: $weight-semibold;
    }

    strong {
      margin-top: $space-2;
      color: $text-strong;
      font-family: $font-display;
      font-size: 1.75rem;
      font-weight: $weight-black;
      line-height: 1.1;
      font-variant-numeric: tabular-nums;
    }

    small {
      color: $text-muted;
      font-size: $admin-text-xs;
    }

    &.ok .stat-icon {
      background: $success-100;
      color: $success-500;
    }

    &.warn {
      border-color: rgba($yellow-deep, 0.35);
      background: $yellow-wash;

      .stat-icon {
        background: $surface-card;
        color: $yellow-deep;
      }
    }

    &.danger {
      border-color: rgba($danger-500, 0.35);
      background: $danger-100;

      strong {
        color: $danger-500;
      }

      .stat-icon {
        background: $surface-card;
        color: $danger-500;
      }
    }
  }
}

.stat-icon {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $cyan-wash;
  color: $cyan-deep;
  font-size: $admin-text-sm;
}

.routes {
  @include stack($space-3);
  padding: $space-4 $space-5;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-xs;
}

.routes-title {
  @include row($space-2);
  color: $text-strong;
  font-size: $admin-text-sm;
  font-weight: $weight-semibold;

  i {
    color: $magenta;
  }
}

.route-list {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.route-chip {
  @include admin-badge($text-strong, $surface-sunken);
  font-weight: $weight-medium;

  strong {
    padding-left: 2px;
    color: $cyan-deep;
    font-family: $font-mono;
    font-weight: $weight-semibold;
  }
}

.workspace {
  display: flex;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-xs;
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
  background: $surface-card;
}

.search {
  @include admin-search;
}

.filters {
  display: flex;
  gap: $space-2;
  overflow-x: auto;
  padding-bottom: 2px;
  scrollbar-width: none;

  button {
    @include admin-pill;
    flex: none;
    min-height: 34px;
    padding: 4px 12px;
  }
}

@include from($bp-md) {
  .stats {
    flex-wrap: wrap;
    overflow: visible;
    margin-inline: 0;
    padding: 0;

    article {
      flex: 1 1 150px;
    }
  }

  .workspace,
  .workspace.has-selection {
    height: min(820px, calc(100vh - 120px));
    min-height: 620px;

    .list-pane {
      display: flex;
      width: 380px;
      flex: none;
      border-right: 1px solid $border-subtle;
    }

    .detail-pane {
      display: flex;
      flex: 1;
      flex-direction: column;
    }
  }

  .list-pane :deep(.conversation-list) {
    flex: 1;
    overflow-y: auto;
  }
}
</style>
