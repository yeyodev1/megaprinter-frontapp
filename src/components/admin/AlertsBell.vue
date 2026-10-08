<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ALERT_META, listAlerts, markAlertsRead, type PanelAlert } from '@/services/alerts'

/**
 * Campana de alertas del panel: pedidos nuevos, pagos, comprobantes, tickets,
 * chats derivados a un asesor y correos que no salieron. Se actualiza sola.
 */

const router = useRouter()
const open = ref(false)
const alerts = ref<PanelAlert[]>([])
const unread = ref(0)
const baseTitle = document.title.replace(/^\(\d+\)\s*/, '')

const timeAgo = (value: string) => {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'ahora'
  if (seconds < 3600) return `hace ${Math.round(seconds / 60)} min`
  if (seconds < 86400) return `hace ${Math.round(seconds / 3600)} h`
  return new Date(value).toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })
}

const label = computed(() => (unread.value > 99 ? '99+' : String(unread.value)))

const refresh = async () => {
  try {
    const data = await listAlerts()
    alerts.value = data.alerts
    unread.value = data.unread
    document.title = `${data.unread ? `(${data.unread}) ` : ''}${document.title.replace(/^\(\d+\)\s*/, '') || baseTitle}`
  } catch {
    /* sin red o sesión vencida: se reintenta en el siguiente ciclo */
  }
}

const go = async (alert: PanelAlert) => {
  open.value = false
  if (!alert.read) {
    alert.read = true
    unread.value = (await markAlertsRead([alert._id]).catch(() => ({ unread: unread.value - 1 }))).unread
  }
  if (alert.link) await router.push(alert.link)
}

const readAll = async () => {
  unread.value = (await markAlertsRead().catch(() => ({ unread: 0 }))).unread
  alerts.value = alerts.value.map((alert) => ({ ...alert, read: true }))
  document.title = document.title.replace(/^\(\d+\)\s*/, '')
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  void refresh()
  timer = setInterval(() => !document.hidden && refresh(), 20000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div class="alerts">
    <button
      type="button"
      class="bell"
      :class="{ ringing: unread > 0 }"
      :aria-expanded="open"
      :aria-label="unread ? `${unread} alertas sin leer` : 'Alertas'"
      @click="open = !open"
    >
      <i class="fa-solid fa-bell" aria-hidden="true"></i>
      <span v-if="unread" class="count">{{ label }}</span>
    </button>

    <div v-if="open" class="scrim" @click="open = false"></div>
    <section v-if="open" class="panel" aria-label="Alertas">
      <header>
        <strong>Alertas</strong>
        <button v-if="unread" type="button" class="read-all" @click="readAll">Marcar todo como leído</button>
      </header>
      <p v-if="!alerts.length" class="empty">Sin alertas por ahora ✨</p>
      <ul v-else>
        <li v-for="alert in alerts" :key="alert._id">
          <button type="button" class="item" :class="[ALERT_META[alert.type]?.tone, { unread: !alert.read }]" @click="go(alert)">
            <span class="icon"><i :class="ALERT_META[alert.type]?.icon ?? 'fa-solid fa-bell'" aria-hidden="true"></i></span>
            <span class="copy">
              <strong>{{ alert.title }}</strong>
              <small v-if="alert.body">{{ alert.body }}</small>
              <time>{{ timeAgo(alert.createdAt) }}</time>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.alerts {
  position: fixed;
  top: 8px;
  right: 12px;
  z-index: $z-modal - 10;
}

.bell {
  position: relative;
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border: 1px solid $border-subtle;
  border-radius: $radius-pill;
  background: $surface-card;
  color: $text-strong;
  box-shadow: $shadow-sm;
  cursor: pointer;
  @include focus-ring;

  &.ringing i {
    color: $warning-500;
  }
}

.count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  padding: 1px 5px;
  border-radius: $radius-pill;
  background: $danger-500;
  color: $paper-white;
  font-size: $admin-text-xs;
  font-weight: $weight-black;
  text-align: center;
}

.scrim {
  position: fixed;
  inset: 0;
}

.panel {
  position: absolute;
  top: 48px;
  right: 0;
  display: flex;
  width: min(380px, calc(100vw - 24px));
  max-height: min(70vh, 560px);
  flex-direction: column;
  overflow: hidden;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: $surface-card;
  box-shadow: $shadow-lg;

  header {
    @include row($space-2);
    justify-content: space-between;
    padding: $space-3 $space-4;
    border-bottom: 1px solid $border-subtle;
  }

  ul {
    overflow-y: auto;
  }
}

.read-all {
  @include button-ghost;
  padding: $space-1 $space-2;
  font-size: $admin-text-xs;
}

.empty {
  padding: $space-6;
  color: $text-muted;
  font-size: $admin-text-sm;
  text-align: center;
}

.item {
  @include row($space-3, flex-start);
  width: 100%;
  padding: $space-3 $space-4;
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

  &.unread {
    background: $brand-100;
  }

  .icon {
    display: flex;
    width: 30px;
    height: 30px;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: $radius-pill;
    background: $surface-sunken;
    font-size: $admin-text-sm;
  }

  &.ok .icon {
    background: $success-100;
    color: $success-500;
  }

  &.warn .icon {
    background: $warning-100;
    color: $warning-500;
  }

  &.danger .icon {
    background: $danger-100;
    color: $danger-500;
  }

  &.info .icon {
    background: $brand-100;
    color: $cyan-dark;
  }
}

.copy {
  @include stack(2px);
  min-width: 0;

  strong {
    font-size: $admin-text-md;
  }

  small {
    color: $text-body;
    font-size: $admin-text-sm;
    overflow-wrap: anywhere;
  }

  time {
    color: $text-muted;
    font-size: $admin-text-xs;
  }
}
</style>
