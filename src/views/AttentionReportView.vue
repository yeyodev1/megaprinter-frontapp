<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import {
  HANDOFF_STATUS,
  getAttentionReport,
  getCrmHealth,
  sendAttentionReport,
  type AttentionReport,
  type CrmHealth,
} from '@/services/reports'

/**
 * Atención por WhatsApp día por día: cuánta gente escribió, cuánta resolvió
 * Mila, quién pidió una persona y si alguien le respondió. El mismo resumen
 * llega por correo cada mañana.
 */

useAdminEntrance()
const route = useRoute()
const router = useRouter()
const dialog = useDialogStore()

// Hoy en Ecuador (UTC-5 fijo).
const ecuadorDate = (daysAgo = 0) => new Date(Date.now() - 5 * 3600000 - daysAgo * 86400000).toISOString().slice(0, 10)

const date = ref(typeof route.query.date === 'string' ? route.query.date : ecuadorDate())
const report = ref<AttentionReport | null>(null)
const crm = ref<CrmHealth | null>(null)
const loading = ref(true)
const sending = ref(false)

const load = async () => {
  loading.value = true
  try {
    report.value = await getAttentionReport(date.value)
  } catch (caught) {
    await dialog.notify({ title: 'No pudimos cargar el reporte', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    loading.value = false
  }
}

const shift = (days: number) => {
  const value = new Date(`${date.value}T12:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  date.value = value.toISOString().slice(0, 10)
}

const isToday = computed(() => date.value === ecuadorDate())
const dayLabel = computed(() => {
  const text = new Date(`${date.value}T12:00:00Z`).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
  return text.charAt(0).toUpperCase() + text.slice(1)
})

const t = computed(() => report.value?.totals)
const botRate = computed(() => (t.value?.conversations ? Math.round((t.value.botOnly / t.value.conversations) * 100) : 0))
const maxHour = computed(() => Math.max(1, ...(report.value?.hourly ?? [0])))
// Solo las horas con movimiento del día (de 7:00 a 22:00 siempre se muestran).
const hours = computed(() =>
  (report.value?.hourly ?? []).map((count, hour) => ({ hour, count })).filter((item) => item.count > 0 || (item.hour >= 7 && item.hour <= 22)),
)

const time = (iso: string) => new Date(iso).toLocaleTimeString('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' })
const waLink = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`

const send = async () => {
  sending.value = true
  try {
    await sendAttentionReport(date.value)
    await dialog.notify({ title: 'Resumen enviado', message: 'Llegó a Marilexi, Selena, Johnny y al equipo.', tone: 'success' })
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo enviar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    sending.value = false
  }
}

watch(date, (value) => {
  router.replace({ query: { ...route.query, date: value } })
  load()
})

onMounted(async () => {
  await load()
  getCrmHealth()
    .then((health) => (crm.value = health))
    .catch(() => (crm.value = null))
})
</script>

<template>
  <div class="attention-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-headset" aria-hidden="true"></i> Atención</p>
        <h1>Cómo se atendió <em>WhatsApp</em></h1>
        <p>Quién escribió, qué resolvió Mila y quién quedó esperando a una persona. Cada mañana llega este resumen por correo.</p>
      </div>
      <button class="send" type="button" :disabled="sending || loading" @click="send">
        <i :class="sending ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'" aria-hidden="true"></i> Enviar por correo
      </button>
    </header>

    <section class="toolbar" data-admin-reveal aria-label="Día del reporte">
      <div class="day-picker">
        <button type="button" aria-label="Día anterior" @click="shift(-1)"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>
        <label>
          <span class="visually-hidden">Fecha</span>
          <input v-model="date" type="date" :max="ecuadorDate()" />
        </label>
        <button type="button" aria-label="Día siguiente" :disabled="isToday" @click="shift(1)"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
      </div>
      <p class="day-label">{{ dayLabel }}<template v-if="isToday"> · hasta ahora</template></p>
      <span v-if="crm" class="crm" :class="{ ok: crm.ok }">
        <i :class="crm.ok ? 'fa-solid fa-plug-circle-check' : 'fa-solid fa-plug-circle-xmark'" aria-hidden="true"></i>
        {{ crm.ok ? 'CRM conectado' : 'CRM sin conectar' }}
      </span>
    </section>

    <p v-if="loading && !report" class="state">Armando el reporte…</p>

    <template v-else-if="report && t">
      <section class="kpis" data-admin-reveal aria-label="Totales del día">
        <div class="kpi"><strong>{{ t.conversations }}</strong><span>Personas escribieron</span><small>{{ t.messages }} mensajes</small></div>
        <div class="kpi"><strong>{{ t.botOnly }}</strong><span>Resolvió Mila sola</span><small>{{ botRate }}% de los chats</small></div>
        <div class="kpi"><strong>{{ t.handoffs }}</strong><span>Pidieron una persona</span><small>{{ t.tickets }} tickets · {{ t.orders }} pedidos</small></div>
        <div class="kpi" :class="{ good: t.attended > 0 }"><strong>{{ t.attended }}</strong><span>Asesor respondió</span><small>{{ t.avgResponseMinutes != null ? `${t.avgResponseMinutes} min en promedio` : 'Sin datos del CRM' }}</small></div>
        <div class="kpi" :class="{ bad: t.unattended > 0 }"><strong>{{ t.unattended }}</strong><span>Sin atender</span><small>{{ t.unknown }} sin confirmar</small></div>
      </section>

      <p v-if="!report.crm" class="hint" data-admin-reveal>
        <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
        Falta conectar el CRM de BuilderBot: por ahora "sin atender" se estima cuando el cliente siguió escribiendo 15 minutos después de pedir asesor.
      </p>

      <section class="panel" data-admin-reveal>
        <header class="panel-head">
          <h2><i class="fa-solid fa-user-clock" aria-hidden="true"></i> Pidieron una persona</h2>
          <span>{{ report.handoffs.length }}</span>
        </header>
        <p v-if="!report.handoffs.length" class="empty">Nadie pidió asesor este día.</p>
        <ul v-else class="handoffs">
          <li v-for="item in report.handoffs" :key="item.phone + item.at" :class="HANDOFF_STATUS[item.status].tone">
            <div class="who">
              <strong>{{ item.name || item.phone }}</strong>
              <span>{{ time(item.at) }}<template v-if="item.name"> · {{ item.phone }}</template></span>
            </div>
            <p class="said">"{{ item.reason }}"<template v-if="item.followUps"> · luego escribió {{ item.followUps }} {{ item.followUps === 1 ? 'vez' : 'veces' }}<template v-if="item.lastMessage && item.lastMessage !== item.reason">, la última: "{{ item.lastMessage }}"</template></template></p>
            <div class="row-end">
              <span class="status" :class="HANDOFF_STATUS[item.status].tone">
                <i :class="HANDOFF_STATUS[item.status].icon" aria-hidden="true"></i>
                {{ HANDOFF_STATUS[item.status].label }}<template v-if="item.responseMinutes != null"> · {{ item.responseMinutes }} min</template>
              </span>
              <a :href="waLink(item.phone)" target="_blank" rel="noopener" class="wa"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i> Abrir chat</a>
              <router-link :to="{ name: 'AdminBot', query: { phone: item.phone } }" class="ghost">Ver conversación</router-link>
            </div>
          </li>
        </ul>
      </section>

      <div class="split">
        <section class="panel" data-admin-reveal>
          <header class="panel-head">
            <h2><i class="fa-solid fa-chart-column" aria-hidden="true"></i> Mensajes por hora</h2>
          </header>
          <div class="bars" role="img" :aria-label="`Mensajes por hora del ${date}`">
            <div v-for="item in hours" :key="item.hour" class="bar" :title="`${item.hour}:00 · ${item.count} mensajes`">
              <span class="count">{{ item.count || '' }}</span>
              <span class="fill" :style="{ height: `${(item.count / maxHour) * 100}%` }"></span>
              <span class="hour">{{ item.hour }}</span>
            </div>
          </div>
        </section>

        <section class="panel" data-admin-reveal>
          <header class="panel-head">
            <h2><i class="fa-solid fa-circle-question" aria-hidden="true"></i> Lo que Mila no entendió</h2>
            <span>{{ report.notUnderstood.length }}</span>
          </header>
          <p v-if="!report.notUnderstood.length" class="empty">Mila entendió todo este día 🙌</p>
          <ul v-else class="missed">
            <li v-for="item in report.notUnderstood" :key="item.phone + item.at">
              <span class="when">{{ time(item.at) }} · {{ item.name || item.phone }}</span>
              <p>"{{ item.message }}"</p>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.attention-page {
  @include admin-page;
}

.page-header {
  @include admin-header;
}

.eyebrow {
  @include admin-eyebrow;
}

.send {
  @include button-primary;
  align-self: flex-start;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-3;
}

.day-picker {
  display: flex;
  align-items: center;
  overflow: hidden;
  border: 1px solid $border-strong;
  border-radius: $radius-sm;
  background: $surface-card;

  button {
    display: flex;
    width: 44px;
    height: 44px;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
    color: $text-strong;
    cursor: pointer;
    @include focus-ring;

    &:disabled {
      color: $text-muted;
      cursor: not-allowed;
    }
  }

  input {
    height: 44px;
    padding: 0 $space-3;
    border: 0;
    border-inline: 1px solid $border-subtle;
    background: transparent;
    color: $text-strong;
    font: inherit;
    font-size: $admin-text-md;
  }
}

.day-label {
  color: $text-body;
  font-size: $admin-text-md;
}

.crm {
  @include admin-badge($danger-500, $danger-100);
  margin-left: auto;

  &.ok {
    background: $success-100;
    color: $success-500;
  }
}

.state,
.empty {
  padding: $space-8;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;
}

.kpis {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
}

.kpi {
  @include stack(2px);
  flex: 1 1 150px;
  padding: $space-4 $space-5;
  border: 1px solid $border-subtle;
  border-radius: $radius-lg;
  background: $surface-card;

  strong {
    color: $text-strong;
    font-family: $font-display;
    font-size: 2rem;
    font-weight: $weight-black;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  span {
    color: $text-strong;
    font-size: $admin-text-md;
    font-weight: $weight-semibold;
  }

  small {
    color: $text-muted;
    font-size: $admin-text-xs;
  }

  &.good {
    border-color: rgba($ok, 0.35);
    background: $ok-wash;

    strong {
      color: $ok;
    }
  }

  &.bad {
    border-color: rgba($danger, 0.35);
    background: $danger-wash;

    strong {
      color: $danger;
    }
  }
}

.hint {
  @include row($space-2, flex-start);
  padding: $space-3 $space-4;
  border-radius: $radius-md;
  background: $yellow-wash;
  color: $yellow-deep;
  font-size: $admin-text-sm;
}

.panel {
  @include admin-card(0);
  overflow: hidden;
}

.panel-head {
  @include row($space-2);
  justify-content: space-between;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $border-subtle;

  h2 {
    @include row($space-2);
    color: $text-strong;
    font-size: $admin-text-lg;

    i {
      color: $cyan-deep;
    }
  }

  span {
    @include admin-badge;
  }
}

.handoffs li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2 $space-4;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $border-subtle;
  border-left: 4px solid transparent;

  &:last-child {
    border-bottom: 0;
  }

  &.danger {
    border-left-color: $danger;
  }

  &.warn {
    border-left-color: $yellow;
  }

  &.ok {
    border-left-color: $ok;
  }
}

.who {
  @include stack(2px);
  flex: 0 1 220px;
  min-width: 0;

  strong {
    color: $text-strong;
    font-size: $admin-text-base;
  }

  span {
    @include mono-data($text-muted, $admin-text-xs);
  }
}

.said {
  flex: 1 1 260px;
  min-width: 0;
  color: $text-body;
  font-size: $admin-text-md;
  overflow-wrap: anywhere;
}

.row-end {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.status {
  @include admin-badge;

  &.ok {
    background: $success-100;
    color: $success-500;
  }

  &.danger {
    background: $danger-100;
    color: $danger-500;
  }

  &.warn {
    background: $yellow-wash;
    color: $yellow-deep;
  }
}

.wa {
  @include button-whatsapp;
  padding: 6px 12px;
  font-size: $admin-text-xs;
}

.ghost {
  @include button-secondary;
  padding: 6px 12px;
  font-size: $admin-text-xs;
}

.split {
  display: flex;
  flex-wrap: wrap;
  gap: $space-4;

  > .panel {
    flex: 1 1 360px;
    min-width: 0;
  }
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 220px;
  padding: $space-5 $space-5 $space-3;
  overflow-x: auto;
}

.bar {
  display: flex;
  flex: 1 0 18px;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  height: 100%;

  .fill {
    width: 100%;
    min-height: 2px;
    border-radius: 4px 4px 0 0;
    background: $cyan;
  }

  .count {
    @include mono-data($text-body, $admin-text-xs);
  }

  .hour {
    @include mono-data($text-muted, $admin-text-xs);
  }
}

.missed {
  max-height: 320px;
  overflow-y: auto;

  li {
    @include stack(2px);
    padding: $space-3 $space-5;
    border-bottom: 1px solid $border-subtle;

    &:last-child {
      border-bottom: 0;
    }
  }

  .when {
    @include mono-data($text-muted, $admin-text-xs);
  }

  p {
    color: $text-strong;
    font-size: $admin-text-md;
    overflow-wrap: anywhere;
  }
}
</style>
