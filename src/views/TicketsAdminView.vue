<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppModal from '@/components/ui/AppModal.vue'
import {
  CLASSIFICATION_LABEL,
  DEVICE_LABEL,
  TICKET_STATUSES,
  listTickets,
  summarizeTicket,
  ticketStatusMeta,
  updateTicket,
  type ServiceTicket,
  type TicketStatus,
} from '@/services/tickets'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatDate } from '@/components/admin/orderHelpers'

/**
 * Tickets de servicio técnico y suministros que crea Mila por WhatsApp, en un
 * tablero de izquierda a derecha por estado: se ve a quién se está atendiendo y
 * en qué va. La IA resume qué busca y qué quiere el cliente; lo que no sabe
 * clasificar cae en "Necesita atención".
 */

useAdminEntrance()
const route = useRoute()
const dialog = useDialogStore()

const tickets = ref<ServiceTicket[]>([])
const loading = ref(true)
const saving = ref(false)
const notice = ref('')
const search = ref('')
const showClosed = ref(false)
const summarizing = ref(false)
const dragging = ref<string | null>(null)
const dropTarget = ref<TicketStatus | null>(null)
const typeFilter = ref<'todos' | 'servicio_tecnico' | 'suministros'>('todos')
const selected = ref<ServiceTicket | null>(null)
const note = ref('')
const finalPrice = ref('')
const assignedTo = ref('')

const columns = computed(() =>
  TICKET_STATUSES.filter((meta) => showClosed.value || (meta.value !== 'cancelado' && meta.value !== 'entregado')),
)

const visible = computed(() => {
  const query = search.value.trim().toLowerCase()
  return tickets.value.filter((ticket) => {
    if (typeFilter.value !== 'todos' && ticket.type !== typeFilter.value) return false
    if (!query) return true
    return [ticket.ticketNumber, ticket.customerName, ticket.customerPhone, ticket.issue, ticket.device, ticket.assignedTo, ticket.summary?.text, ticket.summary?.wants]
      .join(' ')
      .toLowerCase()
      .includes(query)
  })
})

// Lo más reciente arriba (pedido del cliente).
const byStatus = computed(() => {
  const result: Record<string, ServiceTicket[]> = {}
  for (const ticket of visible.value) (result[ticket.status] ??= []).push(ticket)
  for (const list of Object.values(result)) list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return result
})

const CLOSED: TicketStatus[] = ['entregado', 'cancelado']
const openTickets = computed(() => tickets.value.filter((ticket) => !CLOSED.includes(ticket.status)))
const openCount = computed(() => openTickets.value.length)
const unassigned = computed(() => openTickets.value.filter((ticket) => !ticket.assignedTo).length)
const todayCount = computed(() => {
  const today = new Date().toDateString()
  return tickets.value.filter((ticket) => new Date(ticket.createdAt).toDateString() === today).length
})

const closedCount = computed(() => tickets.value.filter((ticket) => ticket.status === 'cancelado' || ticket.status === 'entregado').length)

const headline = (ticket: ServiceTicket) =>
  ticket.summary?.wants || `${ticket.type === 'servicio_tecnico' ? `${DEVICE_LABEL[ticket.device] ?? ticket.device} · ` : ''}${ticket.issue}`

const waitingFor = (iso: string) => {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `hace ${hours} h` : `hace ${Math.round(hours / 24)} d`
}

const price = (ticket: ServiceTicket) =>
  ticket.finalPrice != null
    ? `$${ticket.finalPrice.toFixed(2)} final`
    : ticket.priceMin != null
      ? ticket.priceMin === ticket.priceMax
        ? `Desde $${ticket.priceMin}`
        : `$${ticket.priceMin} – $${ticket.priceMax} ref.`
      : 'Por cotizar'

const waLink = (ticket: ServiceTicket) => {
  const digits = ticket.customerPhone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(`Hola ${ticket.customerName.split(' ')[0] || ''}, te escribimos de Megaprinter por tu solicitud ${ticket.ticketNumber}.`)}` : ''
}

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 4000)
}

const load = async (quiet = false) => {
  if (!quiet) loading.value = true
  try {
    tickets.value = await listTickets()
    if (selected.value) selected.value = tickets.value.find((ticket) => ticket._id === selected.value?._id) ?? selected.value
  } catch (caught) {
    if (!quiet) await dialog.notify({ title: 'No pudimos cargar los tickets', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    loading.value = false
  }
}

const summarize = async (quiet = false) => {
  if (!selected.value || summarizing.value) return
  summarizing.value = true
  try {
    const updated = await summarizeTicket(selected.value._id)
    tickets.value = tickets.value.map((ticket) => (ticket._id === updated._id ? updated : ticket))
    if (selected.value?._id === updated._id) selected.value = updated
  } catch (caught) {
    if (!quiet) await dialog.notify({ title: 'No se pudo resumir', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    summarizing.value = false
  }
}

const openTicket = (ticket: ServiceTicket) => {
  selected.value = ticket
  note.value = ''
  finalPrice.value = ticket.finalPrice != null ? String(ticket.finalPrice) : ''
  assignedTo.value = ticket.assignedTo
  // Tickets de antes del resumen, o si la IA no alcanzó al crearlo.
  if (!ticket.summary?.at) void summarize(true)
}

const save = async (data: Parameters<typeof updateTicket>[1], message: string) => {
  if (!selected.value) return
  saving.value = true
  try {
    const updated = await updateTicket(selected.value._id, data)
    tickets.value = tickets.value.map((ticket) => (ticket._id === updated._id ? updated : ticket))
    selected.value = updated
    flash(message)
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    saving.value = false
  }
}

const changeStatus = (status: TicketStatus) => save({ status }, `${selected.value?.ticketNumber} ahora está «${ticketStatusMeta(status).label}».`)

// Arrastrar una tarjeta a otra columna cambia su estado.
const onDrop = async (status: TicketStatus) => {
  const id = dragging.value
  dragging.value = null
  dropTarget.value = null
  const ticket = tickets.value.find((item) => item._id === id)
  if (!ticket || ticket.status === status) return
  const previous = ticket.status
  tickets.value = tickets.value.map((item) => (item._id === id ? { ...item, status } : item))
  try {
    const updated = await updateTicket(ticket._id, { status })
    tickets.value = tickets.value.map((item) => (item._id === updated._id ? updated : item))
    flash(`${ticket.ticketNumber} ahora está «${ticketStatusMeta(status).label}».`)
  } catch (caught) {
    tickets.value = tickets.value.map((item) => (item._id === id ? { ...item, status: previous } : item))
    await dialog.notify({ title: 'No se pudo mover', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  }
}

const saveDetails = async () => {
  const value = finalPrice.value.trim()
  await save(
    { finalPrice: value === '' ? null : Number(value), assignedTo: assignedTo.value, ...(note.value.trim() ? { note: note.value.trim() } : {}) },
    'Ticket actualizado.',
  )
  note.value = ''
}

let timer: ReturnType<typeof setInterval> | undefined
watch(
  () => route.query.ticket,
  (code) => {
    const found = typeof code === 'string' ? tickets.value.find((ticket) => ticket.ticketNumber === code) : null
    if (found) openTicket(found)
  },
)
onMounted(async () => {
  await load()
  const code = route.query.ticket
  const found = typeof code === 'string' ? tickets.value.find((ticket) => ticket.ticketNumber === code) : null
  if (found) openTicket(found)
  timer = setInterval(() => !document.hidden && load(true), 20000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="tickets-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-screwdriver-wrench" aria-hidden="true"></i> Servicio técnico</p>
        <h1>Tickets y <em>suministros</em></h1>
        <p>Lo que registra Mila por WhatsApp. Arrastra cada tarjeta a la columna de su estado.</p>
      </div>
      <button class="refresh" type="button" :disabled="loading" @click="load()">
        <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i> Actualizar
      </button>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}</p>
    </Transition>

    <section class="kpis" data-admin-reveal aria-label="Resumen de tickets">
      <div class="kpi warn"><strong>{{ byStatus.atencion?.length ?? 0 }}</strong><span>Necesitan atención</span></div>
      <div class="kpi"><strong>{{ openCount }}</strong><span>Abiertos</span></div>
      <div class="kpi"><strong>{{ unassigned }}</strong><span>Sin asignar</span></div>
      <div class="kpi"><strong>{{ todayCount }}</strong><span>Llegaron hoy</span></div>
    </section>

    <section class="filters" data-admin-reveal aria-label="Filtrar tickets">
      <label class="search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <span class="visually-hidden">Buscar ticket</span>
        <input v-model="search" type="search" placeholder="ST-, cliente, teléfono, problema o asesor" />
      </label>
      <div class="types" role="group" aria-label="Tipo">
        <button type="button" :class="{ active: typeFilter === 'todos' }" @click="typeFilter = 'todos'">Todo</button>
        <button type="button" :class="{ active: typeFilter === 'servicio_tecnico' }" @click="typeFilter = 'servicio_tecnico'">🛠️ Servicio</button>
        <button type="button" :class="{ active: typeFilter === 'suministros' }" @click="typeFilter = 'suministros'">🧴 Suministros</button>
        <button type="button" :class="{ active: showClosed }" @click="showClosed = !showClosed">
          <i class="fa-solid fa-box-archive" aria-hidden="true"></i> Entregados y cancelados <strong>{{ closedCount }}</strong>
        </button>
      </div>
    </section>

    <p v-if="loading && !tickets.length" class="state" data-admin-reveal>Cargando tickets…</p>
    <section v-else class="board" data-admin-reveal aria-label="Tablero de tickets">
      <div
        v-for="column in columns"
        :key="column.value"
        class="column"
        :class="[column.value, { over: dropTarget === column.value }]"
        @dragover.prevent="dropTarget = column.value"
        @dragleave="dropTarget === column.value && (dropTarget = null)"
        @drop.prevent="onDrop(column.value)"
      >
        <header class="column-head">
          <span><i :class="column.icon" aria-hidden="true"></i> {{ column.label }}</span>
          <strong>{{ byStatus[column.value]?.length ?? 0 }}</strong>
        </header>
        <p v-if="column.value === 'atencion'" class="column-hint">Lo que la IA no supo clasificar o pide revisión.</p>
        <div class="cards">
          <button
            v-for="ticket in byStatus[column.value] ?? []"
            :key="ticket._id"
            type="button"
            class="card"
            :class="{ dragging: dragging === ticket._id }"
            draggable="true"
            @dragstart="dragging = ticket._id"
            @dragend="dragging = null; dropTarget = null"
            @click="openTicket(ticket)"
          >
            <span class="card-top">
              <span class="number">{{ ticket.type === 'suministros' ? '🧴' : '🛠️' }} {{ ticket.ticketNumber }}</span>
              <time :datetime="ticket.createdAt">{{ waitingFor(ticket.createdAt) }}</time>
            </span>
            <strong class="customer">{{ ticket.customerName || ticket.customerPhone }}</strong>
            <span class="want">{{ headline(ticket) }}</span>
            <span v-if="ticket.summary?.needsAttention && ticket.summary.reason" class="reason">
              <i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> {{ ticket.summary.reason }}
            </span>
            <span class="card-foot">
              <span class="assignee" :class="{ empty: !ticket.assignedTo }">
                <i class="fa-solid fa-user" aria-hidden="true"></i> {{ ticket.assignedTo || 'Sin asignar' }}
              </span>
              <span class="price">{{ price(ticket) }}</span>
            </span>
          </button>
          <p v-if="!byStatus[column.value]?.length" class="empty-col">Sin tickets</p>
        </div>
      </div>
    </section>

    <AppModal
      :open="!!selected"
      size="lg"
      :eyebrow="selected?.type === 'suministros' ? 'Suministros' : 'Servicio técnico'"
      :title="selected ? `${selected.ticketNumber} · ${selected.customerName || selected.customerPhone}` : ''"
      @close="selected = null"
    >
      <div v-if="selected" class="detail">
        <section class="summary" :class="{ attention: selected.summary?.needsAttention }" aria-live="polite">
          <header>
            <p class="eyebrow"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Resumen</p>
            <span v-if="selected.summary?.classification" class="chip">{{ CLASSIFICATION_LABEL[selected.summary.classification] ?? selected.summary.classification }}</span>
            <button type="button" class="regen" :disabled="summarizing" @click="summarize()">
              <i :class="summarizing ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i>
              {{ selected.summary?.at ? 'Regenerar' : 'Resumir' }}
            </button>
          </header>
          <template v-if="selected.summary?.at">
            <p><strong>Qué busca:</strong> {{ selected.summary.text }}</p>
            <p v-if="selected.summary.wants"><strong>Qué quiere:</strong> {{ selected.summary.wants }}</p>
            <p v-if="selected.summary.needsAttention" class="reason"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> {{ selected.summary.reason }}</p>
          </template>
          <p v-else class="muted">{{ summarizing ? 'Leyendo la conversación…' : 'Aún no hay resumen.' }}</p>
        </section>
        <div class="facts">
          <div><span>Cliente</span><strong>{{ selected.customerName || '—' }}</strong></div>
          <div><span>WhatsApp</span><strong>{{ selected.customerPhone }}</strong></div>
          <div v-if="selected.type === 'servicio_tecnico'"><span>Equipo</span><strong>{{ DEVICE_LABEL[selected.device] ?? selected.device }}</strong></div>
          <div><span>Precio sugerido</span><strong>{{ selected.priceMin != null ? `$${selected.priceMin} – $${selected.priceMax}` : 'Por cotizar' }}</strong><small v-if="selected.category">{{ selected.category }} · {{ selected.priceSource }}</small></div>
        </div>
        <p class="issue-box"><strong>Lo que contó:</strong> {{ selected.issue }}</p>

        <div class="links">
          <a v-if="waLink(selected)" :href="waLink(selected)" target="_blank" rel="noopener" class="wa"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Abrir chat</a>
          <router-link :to="{ name: 'AdminBot', query: { phone: selected.customerPhone } }" class="ghost"><i class="fa-solid fa-robot" aria-hidden="true"></i> Ver conversación del bot</router-link>
        </div>

        <section class="block">
          <p class="eyebrow">Estado</p>
          <div class="status-buttons">
            <button
              v-for="meta in TICKET_STATUSES"
              :key="meta.value"
              type="button"
              :class="{ active: selected.status === meta.value }"
              :disabled="saving || selected.status === meta.value"
              @click="changeStatus(meta.value)"
            >
              <i :class="meta.icon" aria-hidden="true"></i> {{ meta.label }}
            </button>
          </div>
        </section>

        <form class="block form" @submit.prevent="saveDetails">
          <p class="eyebrow">Atención</p>
          <label class="field">
            <span>Precio final (USD)</span>
            <input v-model="finalPrice" inputmode="decimal" placeholder="Después del diagnóstico" />
          </label>
          <label class="field">
            <span>Técnico o asesor a cargo</span>
            <input v-model="assignedTo" maxlength="120" placeholder="Nombre" />
          </label>
          <label class="field wide">
            <span>Nueva nota</span>
            <textarea v-model="note" rows="2" maxlength="1000" placeholder="Ej.: cliente trae el equipo el lunes"></textarea>
          </label>
          <button type="submit" class="primary" :disabled="saving">
            <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i> Guardar
          </button>
        </form>

        <section v-if="selected.notes.length || selected.statusHistory.length" class="block">
          <p class="eyebrow">Historial</p>
          <ul class="history">
            <li v-for="(entry, index) in [...selected.notes.map((item) => ({ at: item.at, text: `📝 ${item.text}`, by: item.by })), ...selected.statusHistory.map((item) => ({ at: item.at, text: `➡️ ${ticketStatusMeta(item.status).label}`, by: item.by }))].sort((a, b) => b.at.localeCompare(a.at))" :key="index">
              <span>{{ entry.text }}<small v-if="entry.by"> · {{ entry.by }}</small></span>
              <time>{{ formatDate(entry.at) }}</time>
            </li>
          </ul>
        </section>
      </div>
      <template #footer>
        <button type="button" class="ghost-btn" @click="selected = null">Cerrar</button>
      </template>
    </AppModal>
  </div>
</template>

<style scoped lang="scss">
.tickets-page {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;
}

.refresh {
  @include admin-refresh-button;
}

.notice {
  @include admin-notice;
}

.kpis {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.kpi {
  @include stack(2px);
  flex: 1 1 140px;
  padding: $space-4 $space-5;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;

  strong {
    color: $text-strong;
    font-family: $font-display;
    font-size: 1.75rem;
    font-weight: $weight-black;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  span {
    color: $text-body;
    font-size: $admin-text-sm;
  }

  &.warn {
    border-color: rgba($yellow-deep, 0.35);
    background: $yellow-wash;

    strong {
      color: $yellow-deep;
    }
  }
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
}

.search {
  @include admin-search;
  flex: 1 1 280px;
  max-width: 460px;
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    @include admin-pill;
  }
}

.state {
  padding: $space-10;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;
}

// Tablero: columnas de izquierda a derecha; en el celular se desliza de lado.
.board {
  display: flex;
  align-items: flex-start;
  gap: $space-4;
  overflow-x: auto;
  padding: 2px 2px $space-4;
  scroll-snap-type: x proximity;
  overscroll-behavior-x: contain;
  scrollbar-width: thin;
}

.column {
  @include stack($space-3);
  flex: 0 0 min(86vw, 320px);
  max-height: calc(100vh - 140px);
  padding: $space-3;
  border: 1px solid transparent;
  border-radius: $radius-lg;
  background: $surface-sunken;
  scroll-snap-align: start;
  transition: border-color $duration-base $ease-out, background-color $duration-base $ease-out;

  &.over {
    border-color: $cyan;
    background: $cyan-wash;
  }

  &.atencion {
    border-color: rgba($yellow-deep, 0.3);
    background: $yellow-wash;
  }
}

.column-head {
  @include row($space-2);
  justify-content: space-between;
  padding: $space-1 $space-2 0;
  color: $text-strong;
  font-size: $admin-text-md;
  font-weight: $weight-bold;

  span {
    @include row($space-2);
  }

  i {
    color: $text-muted;
  }

  strong {
    min-width: 28px;
    padding: 2px 8px;
    border-radius: $radius-pill;
    background: $surface-card;
    color: $text-body;
    font-family: $font-mono;
    font-size: $admin-text-xs;
    text-align: center;
  }
}

.atencion .column-head i {
  color: $yellow-deep;
}

.column-hint {
  padding: 0 $space-2;
  color: $yellow-deep;
  font-size: $admin-text-xs;
}

.cards {
  @include stack($space-2);
  @include scroll-area;
  min-height: 96px;
  padding: 2px;
}

.empty-col {
  padding: $space-6 0;
  border: 1px dashed $border-strong;
  border-radius: $radius-md;
  color: $text-muted;
  font-size: $admin-text-sm;
  text-align: center;
}

.card {
  @include stack($space-2);
  flex: none;
  width: 100%;
  padding: $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  box-shadow: $shadow-xs;
  color: inherit;
  text-align: left;
  cursor: grab;
  @include focus-ring;
  transition: border-color $duration-base $ease-out, box-shadow $duration-base $ease-out, transform $duration-base $ease-out;

  @media (hover: hover) {
    &:hover {
      border-color: $cyan-soft;
      box-shadow: $shadow-md;
      transform: translateY(-1px);
    }
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.45;
  }
}

.card-top,
.card-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
}

.number {
  @include mono-data($text-body, $admin-text-xs);
  font-weight: $weight-medium;
}

.card-top time {
  color: $text-muted;
  font-size: $admin-text-xs;
}

.customer {
  color: $text-strong;
  font-size: $admin-text-base;
  font-weight: $weight-bold;
  line-height: 1.3;
}

.want {
  display: -webkit-box;
  overflow: hidden;
  color: $text-body;
  font-size: $admin-text-md;
  line-height: 1.45;
  overflow-wrap: anywhere;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.reason {
  @include row(6px, flex-start);
  padding: 6px $space-2;
  border-radius: $radius-sm;
  background: $yellow-wash;
  color: $yellow-deep;
  font-size: $admin-text-xs;
  font-weight: $weight-semibold;
}

.card-foot {
  padding-top: $space-2;
  border-top: 1px solid $border-subtle;
}

.assignee {
  @include admin-badge($cyan-dark, $cyan-wash);

  &.empty {
    background: $surface-sunken;
    color: $text-muted;
    font-weight: $weight-medium;
  }
}

.price {
  @include mono-data($text-strong, $admin-text-xs);
  font-weight: $weight-medium;
}

.summary {
  @include stack($space-2);
  padding: $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  font-size: $admin-text-md;
  line-height: 1.5;
  overflow-wrap: anywhere;

  &.attention {
    border-color: rgba($yellow-deep, 0.35);
    background: $yellow-wash;
  }

  header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $space-2;

    .eyebrow {
      flex: 1;
    }
  }

  .chip {
    @include admin-badge;
  }

  .muted {
    color: $text-muted;
  }
}

.regen {
  @include button-secondary;
  padding: 6px 12px;
  font-size: $admin-text-xs;
}

.detail {
  @include stack($space-5);
}

.facts {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  > div {
    @include stack(2px);
    flex: 1 1 160px;
    padding: $space-3;
    border-radius: $radius-sm;
    background: $surface-sunken;

    span {
      @include admin-label;
    }

    small {
      color: $text-muted;
      font-size: $admin-text-xs;
    }
  }
}

.issue-box {
  padding: $space-3 $space-4;
  border-left: 3px solid $cyan;
  background: $brand-100;
  font-size: $admin-text-md;
  overflow-wrap: anywhere;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.wa {
  @include button-whatsapp;
}

.ghost {
  @include button-secondary;
}

.block {
  @include stack($space-3);
}

.status-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    @include button-secondary;
    padding: $space-2 $space-3;
    font-size: $admin-text-sm;

    &.active {
      border-color: $key-900;
      background: $key-900;
      color: $text-on-dark;
      opacity: 1;
    }
  }
}

// .block es columna: sin flex-direction: row el flex-basis de cada campo se
// volvía altura y quedaban huecos enormes entre campos.
.form {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: $space-3;

  .eyebrow {
    flex: 1 1 100%;
  }
}

.field {
  @include admin-field;
  flex: 1 1 200px;

  &.wide {
    flex-basis: 100%;
  }
}

.primary {
  @include button-primary;
  margin-left: auto;
}

.history {
  @include stack(0);

  li {
    @include stack(2px);
    position: relative;
    padding: $space-2 0 $space-2 $space-5;
    border-left: 2px solid $border-subtle;
    font-size: $admin-text-md;

    &::before {
      content: '';
      position: absolute;
      top: 14px;
      left: -6px;
      width: 10px;
      height: 10px;
      border: 2px solid $surface-card;
      border-radius: $radius-pill;
      background: $cyan;
    }
  }

  small {
    color: $text-muted;
    font-size: $admin-text-sm;
  }

  time {
    @include mono-data($text-muted, $admin-text-xs);
  }
}
.ghost-btn {
  @include button-secondary;
}
</style>
