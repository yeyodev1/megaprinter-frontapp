<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getStoreSettings, saveStoreSettings, type Branch, type StoreSettings } from '@/services/store'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'
import { formatDate } from '@/components/admin/orderHelpers'

/**
 * Sucursales: dirección, link de Maps y horarios. El bot de WhatsApp y el
 * footer de la web leen estos datos, así que un cambio aquí se ve en ambos.
 */

useAdminEntrance()
const dialog = useDialogStore()

const loading = ref(true)
const saving = ref(false)
const notice = ref('')
const city = ref('')
const branches = ref<Branch[]>([])
const updatedBy = ref('')
const updatedAt = ref<string | null>(null)

const activeBranches = computed(() => branches.value.filter((branch) => branch.active))

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 4000)
}

const clone = (list: Branch[]): Branch[] =>
  list.map((branch) => ({ ...branch, hours: (branch.hours ?? []).map((slot) => ({ ...slot })) }))

const apply = (data: StoreSettings) => {
  city.value = data.city ?? ''
  branches.value = clone(data.branches ?? [])
  updatedBy.value = data.updatedBy ?? ''
  updatedAt.value = data.updatedAt ?? null
}

const load = async () => {
  loading.value = true
  try {
    apply(await getStoreSettings())
  } catch (caught) {
    await dialog.notify({ title: 'No pudimos cargar las sucursales', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    loading.value = false
  }
}

const addBranch = () => {
  branches.value.push({
    name: `Sucursal ${branches.value.length + 1}`,
    address: '',
    mapsUrl: '',
    hours: [{ days: 'Lunes a Viernes', time: '' }],
    active: true,
  })
}

const removeBranch = async (index: number) => {
  const branch = branches.value[index]
  if (!branch) return
  const confirmed = await dialog.confirm({
    title: '¿Quitar esta sucursal?',
    message: 'Dejará de aparecer en la web y en el bot cuando guardes los cambios.',
    detail: [branch.name, branch.address].filter(Boolean).join(' · ') || undefined,
    confirmLabel: 'Quitar',
    tone: 'danger',
    icon: 'fa-solid fa-location-dot',
  })
  if (!confirmed) return
  branches.value.splice(index, 1)
}

const addHour = (branch: Branch) => branch.hours.push({ days: '', time: '' })
const removeHour = (branch: Branch, index: number) => branch.hours.splice(index, 1)

const isUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim())
const openMaps = (url: string) => {
  if (isUrl(url)) window.open(url.trim(), '_blank', 'noopener')
}

/** Limpia espacios y filas vacías antes de enviar. */
const payload = () => ({
  city: city.value.trim(),
  branches: branches.value.map((branch) => ({
    name: branch.name.trim(),
    address: branch.address.trim(),
    mapsUrl: branch.mapsUrl.trim(),
    hours: branch.hours
      .map((slot) => ({ days: slot.days.trim(), time: slot.time.trim() }))
      .filter((slot) => slot.days || slot.time),
    active: branch.active,
  })),
})

const validate = (data: ReturnType<typeof payload>) => {
  if (!data.city) return 'Escribe la ciudad.'
  if (!data.branches.length) return 'Agrega al menos una sucursal.'
  for (const branch of data.branches) {
    const label = branch.name || 'Una sucursal'
    if (!branch.name) return 'Cada sucursal necesita un nombre.'
    if (!branch.address) return `${label} no tiene dirección.`
    if (branch.mapsUrl && !isUrl(branch.mapsUrl)) return `El link de Maps de ${label} debe empezar con https://`
    if (branch.hours.some((slot) => !slot.days || !slot.time)) return `${label} tiene un horario incompleto (días y horario).`
  }
  return ''
}

const save = async () => {
  const data = payload()
  const problem = validate(data)
  if (problem) {
    await dialog.notify({ title: 'Revisa los datos', message: problem, tone: 'warning' })
    return
  }
  saving.value = true
  try {
    apply(await saveStoreSettings(data))
    flash('Sucursales guardadas. La web y el bot ya usan los datos nuevos.')
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar', message: errorMessage(caught, 'Revisa los datos.'), tone: 'danger' })
  } finally {
    saving.value = false
  }
}

// Vista previa del mensaje del bot.
const preview = computed(() =>
  activeBranches.value
    .map((branch) =>
      [
        `📍 *${branch.name || 'Sucursal'}*`,
        branch.address && `📌 ${branch.address}${city.value.trim() ? `, ${city.value.trim()}` : ''}`,
        branch.mapsUrl,
        ...branch.hours.filter((slot) => slot.days || slot.time).map((slot) => `🕒 ${slot.days}: ${slot.time}`),
      ]
        .filter(Boolean)
        .join('\n'),
    )
    .join('\n\n'),
)
const bold = (text: string) =>
  text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`).replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')

onMounted(load)
</script>

<template>
  <div class="store-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Sistema</p>
        <h1>Sucursales</h1>
        <p>Direcciones, link de Google Maps y horarios. El bot de WhatsApp y la web muestran lo que guardes aquí.</p>
        <small v-if="updatedAt" class="updated">Última actualización por {{ updatedBy || 'equipo' }} el {{ formatDate(updatedAt) }}</small>
      </div>
      <button type="button" class="primary" :disabled="saving || loading" @click="save">
        <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i>
        {{ saving ? 'Guardando…' : 'Guardar' }}
      </button>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}
      </p>
    </Transition>

    <p v-if="loading" class="state">Cargando sucursales…</p>

    <template v-else>
      <section class="city-card" data-admin-reveal>
        <label class="field">
          <span>Ciudad</span>
          <input v-model="city" maxlength="80" placeholder="Guayaquil, Ecuador" />
        </label>
      </section>

      <section class="workspace" data-admin-reveal>
        <div class="branches">
          <header class="section-head">
            <h2>Sucursales</h2>
            <span class="count">{{ activeBranches.length }} de {{ branches.length }} activas</span>
          </header>

          <div v-if="!branches.length" class="empty">
            <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
            <p>Todavía no hay sucursales. Agrega la primera.</p>
          </div>

          <article v-for="(branch, index) in branches" :key="index" class="branch" :class="{ paused: !branch.active }">
            <div class="branch-top">
              <label class="field grow">
                <span>Nombre</span>
                <input v-model="branch.name" maxlength="60" placeholder="Sucursal 1" />
              </label>
              <span class="state-badge" :class="{ on: branch.active }">{{ branch.active ? 'Activa' : 'Oculta' }}</span>
            </div>

            <label class="field">
              <span>Dirección</span>
              <input v-model="branch.address" maxlength="200" placeholder="Av. Tungurahua 103, entre Luis Vernaza y Padre Solano" />
            </label>

            <div class="field">
              <span>Link de Google Maps</span>
              <div class="maps-row">
                <input v-model="branch.mapsUrl" type="url" maxlength="500" placeholder="https://maps.app.goo.gl/…" :aria-label="`Link de Maps de ${branch.name}`" />
                <button type="button" class="ghost" :disabled="!isUrl(branch.mapsUrl)" @click="openMaps(branch.mapsUrl)">
                  <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i> Probar
                </button>
              </div>
            </div>

            <div class="field">
              <span>Horarios</span>
              <div class="hours">
                <div v-for="(slot, slotIndex) in branch.hours" :key="slotIndex" class="hour-row">
                  <input v-model="slot.days" maxlength="60" placeholder="Lunes a Viernes" :aria-label="`Días, fila ${slotIndex + 1}`" />
                  <input v-model="slot.time" maxlength="60" placeholder="8:30 AM – 7:00 PM" :aria-label="`Horario, fila ${slotIndex + 1}`" />
                  <button
                    type="button"
                    class="icon danger"
                    :aria-label="`Quitar fila ${slotIndex + 1}`"
                    title="Quitar fila"
                    @click="removeHour(branch, slotIndex)"
                  >
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                  </button>
                </div>
                <button type="button" class="link-btn" @click="addHour(branch)">
                  <i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar horario
                </button>
              </div>
            </div>

            <footer class="branch-actions">
              <label class="toggle-label">
                <button
                  type="button"
                  class="mini-switch"
                  role="switch"
                  :aria-checked="branch.active"
                  :aria-label="`${branch.active ? 'Ocultar' : 'Activar'} ${branch.name}`"
                  @click="branch.active = !branch.active"
                >
                  <span class="knob"></span>
                </button>
                <span aria-hidden="true">{{ branch.active ? 'Se muestra' : 'No se muestra' }}</span>
              </label>
              <button type="button" class="icon danger" :aria-label="`Quitar ${branch.name}`" title="Quitar sucursal" @click="removeBranch(index)">
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </footer>
          </article>

          <button type="button" class="add" @click="addBranch">
            <i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar sucursal
          </button>
        </div>

        <aside class="preview-card">
          <header class="preview-head">
            <span class="wa-avatar"><i class="fa-brands fa-whatsapp" aria-hidden="true"></i></span>
            <div>
              <strong>Vista previa</strong>
              <span>Lo que recibe el cliente por WhatsApp</span>
            </div>
          </header>
          <div class="chat">
            <!-- eslint-disable-next-line vue/no-v-html -- texto escapado en bold() -->
            <p v-if="preview" class="bubble" v-html="bold(preview)"></p>
            <p v-else class="hint-line">Activa al menos una sucursal para ver el mensaje.</p>
          </div>
          <p class="hint">
            <i class="fa-solid fa-circle-info" aria-hidden="true"></i>
            Los cambios se aplican al guardar. Las sucursales ocultas no aparecen en la web ni en el bot.
          </p>
        </aside>
      </section>

      <div class="save-bar">
        <button type="button" class="primary" :disabled="saving" @click="save">
          <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i>
          {{ saving ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.store-page {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;
}

.updated {
  display: block;
  margin-top: $space-2;
  @include mono-data($text-muted, $admin-text-xs);
}

.notice {
  @include admin-notice;
}

.state {
  padding-block: $space-10;
  color: $text-muted;
  font-size: $admin-text-md;
  text-align: center;
}

.primary {
  @include button-primary;
  align-self: flex-start;
  flex: none;
  box-shadow: none;
}

.ghost {
  @include button-secondary;
  flex: none;
}

.add {
  @include button-secondary;
  align-self: flex-start;
}

.city-card {
  @include admin-card($space-5);
}

.field {
  @include admin-field;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;

  &.grow {
    flex: 1;
  }
}

.workspace {
  @include stack($space-6);
}

.branches {
  @include stack($space-3);
  min-width: 0;
}

.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: $space-2;

  h2 {
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
  }

  .count {
    @include mono-data($text-muted, $admin-text-xs);
  }
}

.empty {
  @include admin-card($space-10 $space-5);
  @include stack($space-3);
  align-items: center;
  color: $text-body;
  font-size: $admin-text-md;
  text-align: center;

  > i {
    color: $cyan;
    font-size: 1.75rem;
  }
}

.branch {
  @include admin-card($space-5);
  @include stack($space-4);
  min-width: 0;

  &.paused {
    background: $surface-page;
  }
}

.branch-top {
  display: flex;
  align-items: flex-end;
  gap: $space-3;
}

.state-badge {
  @include admin-badge($text-muted, $surface-sunken);
  flex: none;
  margin-bottom: $space-3;

  &.on {
    background: $ok-wash;
    color: $ok;
  }
}

.maps-row {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  input {
    flex: 1;
    min-width: 0;
  }
}

.hours {
  @include stack($space-2);
}

.hour-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;

  input {
    flex: 1 1 140px;
    min-width: 0;
  }
}

.link-btn {
  @include button-ghost($cyan-deep);
  align-self: flex-start;
}

.branch-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $space-2;
  padding-top: $space-3;
  border-top: 1px solid $border-subtle;
}

.toggle-label {
  @include row($space-2);
  color: $text-body;
  font-size: $admin-text-sm;
}

.icon {
  @include button-ghost($text-muted);
  width: 40px;
  height: 40px;
  flex: none;
  padding: 0;

  &.danger:hover:not(:disabled) {
    background: $danger-100;
    color: $danger-500;
  }
}

.mini-switch {
  position: relative;
  display: flex;
  width: 42px;
  height: 24px;
  flex: none;
  align-items: center;
  padding: 3px;
  border: 0;
  border-radius: $radius-pill;
  background: $key-200;
  cursor: pointer;
  transition: background $duration-base $ease-out;
  @include focus-ring;

  .knob {
    width: 18px;
    height: 18px;
    border-radius: $radius-pill;
    background: $paper-white;
    box-shadow: $shadow-xs;
    transition: transform $duration-base $ease-out;
  }

  &[aria-checked='true'] {
    background: $ok;

    .knob {
      transform: translateX(18px);
    }
  }

  @include reduced-motion {
    transition: none;

    .knob {
      transition: none;
    }
  }
}

// ─── Vista previa ───────────────────────────────────────────────────────────
.preview-card {
  @include admin-card(0);
  overflow: hidden;
}

.preview-head {
  @include row($space-3);
  padding: $space-4 $space-5;
  background: #075e54;
  color: $paper-white;

  div {
    @include stack(2px);
  }

  strong {
    font-size: $admin-text-md;
  }

  span {
    color: rgba(255, 255, 255, 0.78);
    font-size: $admin-text-xs;
  }
}

.wa-avatar {
  display: flex;
  width: 36px;
  height: 36px;
  flex: none;
  align-items: center;
  justify-content: center;
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.16);
  font-size: 1.15rem;
}

.chat {
  @include stack($space-3);
  padding: $space-5;
  background: #efeae2;
}

.bubble {
  align-self: flex-start;
  max-width: 92%;
  padding: $space-3 $space-4;
  border-radius: $radius-xs $radius-md $radius-md $radius-md;
  background: $paper-white;
  box-shadow: 0 1px 1px rgba(12, 12, 14, 0.12);
  color: $key-900;
  font-size: $admin-text-md;
  line-height: $leading-body;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.hint-line {
  align-self: center;
  padding: 4px 10px;
  border-radius: $radius-sm;
  background: rgba(255, 255, 255, 0.7);
  color: $text-body;
  font-size: $admin-text-xs;
  text-align: center;
}

.hint {
  @include row($space-2, flex-start);
  padding: $space-4 $space-5;
  color: $text-body;
  font-size: $admin-text-sm;
  line-height: $leading-body;

  i {
    margin-top: 3px;
    color: $cyan-deep;
  }
}

.save-bar {
  display: flex;
  justify-content: flex-end;
}

@include from($bp-sm) {
  .maps-row {
    flex-direction: row;
    align-items: center;
  }
}

@include from($bp-lg) {
  .workspace {
    flex-direction: row;
    align-items: flex-start;
  }

  .branches {
    flex: 1;
  }

  .preview-card {
    position: sticky;
    top: $space-6;
    width: 360px;
    flex: none;
  }
}
</style>
