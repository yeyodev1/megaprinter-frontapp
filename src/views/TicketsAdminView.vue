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

// El más antiguo arriba: se atiende en el orden en que llegaron.
const byStatus = computed(() => {
  const result: Record<string, ServiceTicket[]> = {}
  for (const ticket of visible.value) (result[ticket.status] ??= []).push(ticket)
  for (const list of Object.values(result)) list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  return result
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
        <h1>Tickets y<br /><em>suministros.</em></h1>
        <p>Las solicitudes que registra Mila por WhatsApp. Un asesor toma el chat y las sigue desde aquí.</p>
      </div>
      <button class="refresh" type="button" :disabled="loading" @click="load()">
        <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i> Actualizar
      </button>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}</p>
    </Transition>

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
        <div class="facts">
          <div><span>Cliente</span><strong>{{ selected.customerName || '—' }}</strong></div>
          <div><span>WhatsApp</span><strong>{{ selected.customerPhone }}</strong></div>
          <div v-if="selected.type === 'servicio_tecnico'"><span>Equipo</span><strong>{{ DEVICE_LABEL[selected.device] ?? selected.device }}</strong></div>
          <div><span>Precio sugerido</span><strong>{{ selected.priceMin != null ? `$${selected.priceMin} – $${selected.priceMax}` : 'Por cotizar' }}</strong><small v-if="selected.category">{{ selected.category }} · {{ selected.priceSource }}</small></div>
        </div>
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
            <li v-for="(entry, index) in [...selected.notes.map((item) => ({ at: item.at, text: `📝 ${item.text}`, by: item.by })), ...selected.statusHistory.map((item) => ({ at: item.at, text: `➡️ ${ticketStatusMeta(item.status).label}`, by: item.by }))].sort((a, b) => a.at.localeCompare(b.at))" :key="index">
              <time>{{ formatDate(entry.at) }}</time> {{ entry.text }}<template v-if="entry.by"> · {{ entry.by }}</template>
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

.filters {
  @include stack($space-3);
}

.types {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;

  button {
    @include row($space-1);
    padding: $space-1 $space-3;
    border: 1px solid $border-subtle;
    border-radius: $radius-pill;
    background: $surface-card;
    color: $text-body;
    font-size: $text-eyebrow;
    cursor: pointer;
    @include focus-ring;

    strong {
      font-family: $font-mono;
    }

    &.active {
      border-color: $cyan;
      background: $brand-100;
      color: $text-strong;
      font-weight: $weight-semibold;
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
  flex: 1 1 260px;
}

.state {
  padding: $space-10;
  color: $text-muted;
  text-align: center;
}

// Tablero: columnas de izquierda a derecha; en el celular se desliza de lado.
.board {
  display: flex;
  gap: $space-3;
  overflow-x: auto;
  padding-bottom: $space-3;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
}

.column {
  @include stack($space-2);
  flex: 0 0 min(84vw, 290px);
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-sunken;
  scroll-snap-align: start;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &.over {
    border-color: $cyan;
    background: $brand-100;
  }

  &.atencion {
    border-color: $warning-500;
    background: $warning-100;
  }
}

.column-head {
  @include row($space-2);
  justify-content: space-between;
  font-size: $text-caption;
  font-weight: $weight-semibold;
  color: $text-strong;

  strong {
    @include mono-data($text-muted, $text-eyebrow);
  }
}

.column-hint {
  color: $warning-500;
  font-size: $text-eyebrow;
}

.cards {
  @include stack($space-2);
  min-height: 80px;
}

.empty-col {
  padding: $space-4 0;
  color: $text-muted;
  font-size: $text-eyebrow;
  text-align: center;
}

.card {
  @include stack(6px);
  width: 100%;
  padding: $space-3;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
  background: $surface-card;
  box-shadow: $shadow-sm;
  color: inherit;
  text-align: left;
  cursor: grab;
  @include focus-ring;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: $cyan;
  }

  &:active {
    cursor: grabbing;
  }

  &.dragging {
    opacity: 0.5;
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

.number,
.card-top time,
.price {
  @include mono-data($text-muted, $text-eyebrow);
}

.customer {
  font-size: $text-body-sm;
  color: $text-strong;
}

.want {
  color: $text-body;
  font-size: $text-caption;
  overflow-wrap: anywhere;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.reason {
  color: $warning-500;
  font-size: $text-eyebrow;
}

.assignee {
  @include row(4px);
  font-size: $text-eyebrow;
  font-weight: $weight-semibold;
  color: $cyan-dark;

  &.empty {
    color: $text-muted;
    font-weight: normal;
  }
}

.summary {
  @include stack($space-2);
  padding: $space-3 $space-4;
  border: 1px solid $border-subtle;
  border-radius: $radius-sm;
  background: $surface-card;
  font-size: $text-body-sm;
  overflow-wrap: anywhere;

  &.attention {
    border-color: $warning-500;
    background: $warning-100;
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
    @include badge;
  }

  .muted {
    color: $text-muted;
  }
}

.regen {
  @include button-secondary;
  padding: $space-1 $space-3;
  font-size: $text-eyebrow;
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
      @include field-label;
    }

    small {
      color: $text-muted;
      font-size: $text-eyebrow;
    }
  }
}

.issue-box {
  padding: $space-3 $space-4;
  border-left: 3px solid $cyan;
  background: $brand-100;
  font-size: $text-body-sm;
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
    font-size: $text-caption;

    &.active {
      border-color: $cyan;
      background: $brand-100;
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
}

.history {
  @include stack(4px);
  font-size: $text-caption;

  time {
    @include mono-data($text-muted, $text-eyebrow);
  }
}

.ghost-btn {
  @include button-secondary;
}
</style>
