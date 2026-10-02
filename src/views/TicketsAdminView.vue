<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppModal from '@/components/ui/AppModal.vue'
import {
  DEVICE_LABEL,
  TICKET_STATUSES,
  listTickets,
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
 * Tickets de servicio técnico y suministros que crea Mila por WhatsApp. Los
 * atiende una persona: estado, precio final, técnico asignado y notas.
 */

useAdminEntrance()
const route = useRoute()
const dialog = useDialogStore()

const tickets = ref<ServiceTicket[]>([])
const loading = ref(true)
const saving = ref(false)
const notice = ref('')
const search = ref('')
const statusFilter = ref<TicketStatus | 'abiertos' | 'todos'>('abiertos')
const typeFilter = ref<'todos' | 'servicio_tecnico' | 'suministros'>('todos')
const selected = ref<ServiceTicket | null>(null)
const note = ref('')
const finalPrice = ref('')
const assignedTo = ref('')

const OPEN: TicketStatus[] = ['nuevo', 'en_revision', 'cotizado', 'en_reparacion', 'listo']

const counts = computed(() => {
  const result: Record<string, number> = {}
  for (const ticket of tickets.value) result[ticket.status] = (result[ticket.status] ?? 0) + 1
  return result
})

const visible = computed(() => {
  const query = search.value.trim().toLowerCase()
  return tickets.value.filter((ticket) => {
    if (statusFilter.value === 'abiertos' && !OPEN.includes(ticket.status)) return false
    if (statusFilter.value !== 'abiertos' && statusFilter.value !== 'todos' && ticket.status !== statusFilter.value) return false
    if (typeFilter.value !== 'todos' && ticket.type !== typeFilter.value) return false
    if (!query) return true
    return [ticket.ticketNumber, ticket.customerName, ticket.customerPhone, ticket.issue, ticket.device].join(' ').toLowerCase().includes(query)
  })
})

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

const openTicket = (ticket: ServiceTicket) => {
  selected.value = ticket
  note.value = ''
  finalPrice.value = ticket.finalPrice != null ? String(ticket.finalPrice) : ''
  assignedTo.value = ticket.assignedTo
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
      <div class="chips">
        <button type="button" :class="{ active: statusFilter === 'abiertos' }" @click="statusFilter = 'abiertos'">
          Abiertos <strong>{{ tickets.filter((ticket) => OPEN.includes(ticket.status)).length }}</strong>
        </button>
        <button v-for="meta in TICKET_STATUSES" :key="meta.value" type="button" :class="{ active: statusFilter === meta.value }" @click="statusFilter = meta.value">
          <i :class="meta.icon" aria-hidden="true"></i> {{ meta.label }} <strong>{{ counts[meta.value] ?? 0 }}</strong>
        </button>
        <button type="button" :class="{ active: statusFilter === 'todos' }" @click="statusFilter = 'todos'">Todos</button>
      </div>
      <div class="row">
        <label class="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
          <span class="visually-hidden">Buscar ticket</span>
          <input v-model="search" type="search" placeholder="ST-, cliente, teléfono o problema" />
        </label>
        <div class="types" role="group" aria-label="Tipo">
          <button type="button" :class="{ active: typeFilter === 'todos' }" @click="typeFilter = 'todos'">Todo</button>
          <button type="button" :class="{ active: typeFilter === 'servicio_tecnico' }" @click="typeFilter = 'servicio_tecnico'">🛠️ Servicio</button>
          <button type="button" :class="{ active: typeFilter === 'suministros' }" @click="typeFilter = 'suministros'">🧴 Suministros</button>
        </div>
      </div>
    </section>

    <section class="list" data-admin-reveal>
      <p v-if="loading" class="state">Cargando tickets…</p>
      <p v-else-if="!visible.length" class="state">No hay tickets con este filtro.</p>
      <button v-for="ticket in visible" :key="ticket._id" type="button" class="ticket" @click="openTicket(ticket)">
        <span class="type">{{ ticket.type === 'suministros' ? '🧴' : '🛠️' }}</span>
        <span class="copy">
          <span class="top">
            <strong>{{ ticket.ticketNumber }} · {{ ticket.customerName || ticket.customerPhone }}</strong>
            <span class="badge" :class="ticket.status"><i :class="ticketStatusMeta(ticket.status).icon" aria-hidden="true"></i>{{ ticketStatusMeta(ticket.status).label }}</span>
          </span>
          <span class="issue">{{ ticket.type === 'servicio_tecnico' ? `${DEVICE_LABEL[ticket.device] ?? ticket.device} · ` : '' }}{{ ticket.issue }}</span>
          <span class="meta">{{ price(ticket) }} · {{ formatDate(ticket.createdAt) }}<template v-if="ticket.assignedTo"> · 👤 {{ ticket.assignedTo }}</template></span>
        </span>
      </button>
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

.chips,
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

.row {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.search {
  @include admin-search;
  flex: 1 1 260px;
}

.list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;
  box-shadow: $shadow-sm;
}

.state {
  padding: $space-10;
  color: $text-muted;
  text-align: center;
}

.ticket {
  @include row($space-3, flex-start);
  width: 100%;
  padding: $space-4 $space-5;
  border: 0;
  border-bottom: 1px solid $border-subtle;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  @include focus-ring;

  &:hover {
    background: $surface-sunken;
  }

  .type {
    font-size: 1.4rem;
  }
}

.copy {
  @include stack(4px);
  min-width: 0;
  flex: 1;
}

.top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;

  strong {
    font-size: $text-body-sm;
  }
}

.issue {
  color: $text-body;
  font-size: $text-caption;
  overflow-wrap: anywhere;
}

.meta {
  @include mono-data($text-muted, $text-eyebrow);
}

.badge {
  @include badge;

  &.nuevo {
    background: $warning-100;
    color: $warning-500;
  }

  &.en_reparacion,
  &.cotizado,
  &.en_revision {
    background: $brand-100;
    color: $cyan-dark;
  }

  &.listo,
  &.entregado {
    background: $success-100;
    color: $success-500;
  }

  &.cancelado {
    background: $danger-100;
    color: $danger-500;
  }
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

.form {
  display: flex;
  flex-wrap: wrap;
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
