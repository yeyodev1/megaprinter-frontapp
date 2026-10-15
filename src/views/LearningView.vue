<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  createLesson,
  deleteLesson,
  getLearning,
  runLearning,
  updateLesson,
  type LearningRun,
  type Lesson,
  type LessonKind,
  type LessonStatus,
} from '@/services/learning'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'
import { useAdminEntrance } from '@/composables/useAdminEntrance'

/**
 * Aprendizaje de Mila: cada mañana el sistema revisa los chats de ayer y saca
 * lecciones. Las que solo enseñan a entender se activan solas; las que afirman
 * algo del negocio esperan aprobación aquí. El equipo también puede escribirlas.
 */

useAdminEntrance()
const dialog = useDialogStore()

const loading = ref(true)
const running = ref(false)
const notice = ref('')
const runs = ref<LearningRun[]>([])
const lessons = ref<Lesson[]>([])
const maxActive = ref(40)
const tab = ref<LessonStatus>('pendiente')
const editing = ref('')
const draft = ref('')
const newKind = ref<LessonKind>('frase')
const newText = ref('')
const adding = ref(false)

const KIND_LABEL: Record<LessonKind, string> = { frase: 'Cómo lo dicen', respuesta: 'Cómo responder', evitar: 'No repetir' }
const TABS: Array<{ value: LessonStatus; label: string }> = [
  { value: 'pendiente', label: 'Por aprobar' },
  { value: 'activa', label: 'Activas' },
  { value: 'descartada', label: 'Descartadas' },
]

const countOf = (status: LessonStatus) => lessons.value.filter((lesson) => lesson.status === status).length
const visible = computed(() => lessons.value.filter((lesson) => lesson.status === tab.value))
const latest = computed(() => runs.value[0])

let noticeTimer: ReturnType<typeof setTimeout> | undefined
const flash = (text: string) => {
  notice.value = text
  clearTimeout(noticeTimer)
  noticeTimer = setTimeout(() => (notice.value = ''), 5000)
}

const pct = (part: number, total: number) => (total ? Math.round((part / total) * 100) : 0)
const dayLabel = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

const load = async () => {
  try {
    const data = await getLearning()
    runs.value = data.runs
    lessons.value = data.lessons
    maxActive.value = data.maxActive
    if (!countOf('pendiente') && tab.value === 'pendiente') tab.value = 'activa'
  } catch (caught) {
    await dialog.notify({ title: 'No pudimos cargar el aprendizaje', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    loading.value = false
  }
}

const runNow = async () => {
  running.value = true
  try {
    const result = await runLearning()
    await load()
    flash(`Listo: ${result.added?.length ?? 0} lecciones nuevas de los chats del ${result.date}.`)
    if (countOf('pendiente')) tab.value = 'pendiente'
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo revisar', message: errorMessage(caught, 'Intenta de nuevo en un rato.'), tone: 'danger' })
  } finally {
    running.value = false
  }
}

const replace = (updated: Lesson) => {
  lessons.value = lessons.value.map((lesson) => (lesson._id === updated._id ? updated : lesson))
}

const setStatus = async (lesson: Lesson, status: LessonStatus) => {
  try {
    replace(await updateLesson(lesson._id, { status }))
    flash(status === 'activa' ? 'Lección activa: Mila la usa desde ahora.' : status === 'descartada' ? 'Lección descartada: no se volverá a proponer.' : 'Lección en revisión.')
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo cambiar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  }
}

const startEdit = (lesson: Lesson) => {
  editing.value = lesson._id
  draft.value = lesson.text
}

const saveEdit = async (lesson: Lesson) => {
  try {
    replace(await updateLesson(lesson._id, { text: draft.value }))
    editing.value = ''
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar', message: errorMessage(caught, 'Revisa el texto.'), tone: 'danger' })
  }
}

const remove = async (lesson: Lesson) => {
  const confirmed = await dialog.confirm({
    title: '¿Eliminar esta lección?',
    message: 'Si la eliminas, la revisión diaria podría volver a proponerla. Para que no vuelva, mejor descártala.',
    detail: lesson.text,
    confirmLabel: 'Eliminar',
    tone: 'danger',
    icon: 'fa-solid fa-trash-can',
  })
  if (!confirmed) return
  try {
    await deleteLesson(lesson._id)
    lessons.value = lessons.value.filter((item) => item._id !== lesson._id)
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo eliminar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  }
}

const add = async () => {
  if (newText.value.trim().length < 10) {
    await dialog.notify({ title: 'Falta la lección', message: 'Escribe qué debe aprender Mila (mínimo 10 caracteres).', tone: 'warning' })
    return
  }
  adding.value = true
  try {
    lessons.value = [await createLesson({ kind: newKind.value, text: newText.value }), ...lessons.value]
    newText.value = ''
    tab.value = 'activa'
    flash('Lección agregada: Mila la usa desde ahora.')
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo agregar', message: errorMessage(caught, 'Revisa el texto.'), tone: 'danger' })
  } finally {
    adding.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="learning-page">
    <header class="page-header" data-admin-reveal>
      <div>
        <p class="eyebrow"><i class="fa-solid fa-brain" aria-hidden="true"></i> Sistema</p>
        <h1>Aprendizaje de Mila</h1>
        <p>
          Cada mañana Mila revisa los chats de ayer y aprende de lo que no entendió. Lo que afirma algo del negocio espera tu
          aprobación aquí.
        </p>
      </div>
      <button type="button" class="primary" :disabled="running || loading" @click="runNow">
        <i :class="running ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" aria-hidden="true"></i>
        {{ running ? 'Revisando chats…' : 'Revisar ayer ahora' }}
      </button>
    </header>

    <Transition name="fade">
      <p v-if="notice" class="notice ok" role="status">
        <i class="fa-solid fa-circle-check" aria-hidden="true"></i>{{ notice }}
      </p>
    </Transition>

    <p v-if="loading" class="state">Cargando…</p>

    <template v-else>
      <section class="trend" data-admin-reveal>
        <header class="section-head">
          <h2>¿Está mejorando?</h2>
          <span class="count">Menos es mejor</span>
        </header>
        <p v-if="!runs.length" class="muted">Todavía no hay días revisados. El primero sale mañana a las 7:00 o con “Revisar ayer ahora”.</p>
        <p v-else-if="latest?.summary" class="summary">{{ latest.summary }}</p>
        <ul v-if="runs.length" class="days">
          <li v-for="run in runs.slice(0, 14)" :key="run._id" class="day">
            <span class="day-date">{{ dayLabel(run._id) }}</span>
            <span class="day-people">{{ run.metrics.conversations }} personas</span>
            <div class="bar-wrap" :title="`No entendió ${run.metrics.notUnderstood} de ${run.metrics.messages} mensajes`">
              <span class="bar" :style="{ width: `${Math.min(pct(run.metrics.notUnderstood, run.metrics.messages) * 3, 100)}%` }"></span>
            </div>
            <span class="day-stat">No entendió {{ pct(run.metrics.notUnderstood, run.metrics.messages) }}%</span>
            <span class="day-stat">A asesor {{ pct(run.metrics.handoffs, run.metrics.conversations) }}%</span>
          </li>
        </ul>
        <details v-if="latest?.devSuggestions?.length" class="dev">
          <summary>Ideas para el desarrollador ({{ latest.devSuggestions.length }})</summary>
          <ul>
            <li v-for="(item, index) in latest.devSuggestions" :key="index">{{ item }}</li>
          </ul>
        </details>
      </section>

      <section class="lessons" data-admin-reveal>
        <header class="section-head">
          <h2>Lecciones</h2>
          <span class="count">{{ countOf('activa') }} activas · Mila usa las {{ maxActive }} más recientes</span>
        </header>

        <div class="tabs" role="tablist">
          <button
            v-for="item in TABS"
            :key="item.value"
            type="button"
            role="tab"
            class="tab"
            :class="{ on: tab === item.value }"
            :aria-selected="tab === item.value"
            @click="tab = item.value"
          >
            {{ item.label }} <span class="tab-count">{{ countOf(item.value) }}</span>
          </button>
        </div>

        <p v-if="!visible.length" class="muted">Nada por aquí.</p>

        <article v-for="lesson in visible" :key="lesson._id" class="lesson">
          <div class="lesson-top">
            <span class="kind" :class="lesson.kind">{{ KIND_LABEL[lesson.kind] }}</span>
            <span class="meta">{{ lesson.source === 'manual' ? `Escrita por ${lesson.updatedBy || 'el equipo'}` : `De los chats del ${lesson.learnedFrom}` }}</span>
          </div>
          <textarea v-if="editing === lesson._id" v-model="draft" rows="3" maxlength="320" aria-label="Texto de la lección"></textarea>
          <p v-else class="text">{{ lesson.text }}</p>
          <p v-if="lesson.example" class="example">Cliente: “{{ lesson.example }}”</p>
          <p v-if="lesson.status === 'pendiente' && lesson.reason" class="reason"><i class="fa-solid fa-circle-info" aria-hidden="true"></i> {{ lesson.reason }}</p>
          <footer class="actions">
            <template v-if="editing === lesson._id">
              <button type="button" class="small primary-small" @click="saveEdit(lesson)">Guardar</button>
              <button type="button" class="small" @click="editing = ''">Cancelar</button>
            </template>
            <template v-else>
              <button v-if="lesson.status !== 'activa'" type="button" class="small primary-small" @click="setStatus(lesson, 'activa')">
                <i class="fa-solid fa-check" aria-hidden="true"></i> {{ lesson.status === 'pendiente' ? 'Aprobar' : 'Activar' }}
              </button>
              <button v-if="lesson.status !== 'descartada'" type="button" class="small" @click="setStatus(lesson, 'descartada')">
                <i class="fa-solid fa-ban" aria-hidden="true"></i> Descartar
              </button>
              <button type="button" class="small" @click="startEdit(lesson)"><i class="fa-solid fa-pen" aria-hidden="true"></i> Editar</button>
              <button type="button" class="icon danger" :aria-label="`Eliminar lección`" title="Eliminar" @click="remove(lesson)">
                <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
              </button>
            </template>
          </footer>
        </article>

        <form class="new-lesson" @submit.prevent="add">
          <h3>Enseñarle algo a Mila</h3>
          <label class="field">
            <span>Tipo</span>
            <select v-model="newKind">
              <option value="frase">Cómo lo dicen los clientes</option>
              <option value="respuesta">Cómo responder algo</option>
              <option value="evitar">Algo que no debe hacer</option>
            </select>
          </label>
          <label class="field">
            <span>Lección</span>
            <textarea v-model="newText" rows="3" maxlength="320" placeholder="Cuando dicen “la de tanque” se refieren a impresoras de tinta continua."></textarea>
          </label>
          <button type="submit" class="primary" :disabled="adding">
            <i :class="adding ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plus'" aria-hidden="true"></i> Agregar
          </button>
        </form>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.learning-page {
  @include admin-page;
}

.page-header {
  @include admin-header;
  margin-bottom: 0;
}

.eyebrow {
  @include admin-eyebrow;
}

.notice {
  @include admin-notice;
}

.state,
.muted {
  color: $text-muted;
  font-size: $admin-text-md;
}

.state {
  padding-block: $space-10;
  text-align: center;
}

.primary {
  @include button-primary;
  align-self: flex-start;
  flex: none;
  box-shadow: none;
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

.trend,
.lessons {
  @include stack($space-4);
}

.trend {
  @include admin-card($space-5);
}

.summary {
  color: $text-body;
  font-size: $admin-text-md;
  line-height: $leading-body;
}

.days {
  @include stack($space-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.day {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-1 $space-3;
  padding-block: $space-2;
  border-top: 1px solid $border-subtle;
  font-size: $admin-text-sm;
}

.day-date {
  min-width: 96px;
  color: $text-strong;
  font-weight: $weight-bold;
  text-transform: capitalize;
}

.day-people {
  @include mono-data($text-muted, $admin-text-xs);
  min-width: 90px;
}

.bar-wrap {
  display: flex;
  height: 8px;
  flex: 1 1 120px;
  overflow: hidden;
  border-radius: $radius-pill;
  background: $surface-sunken;
}

.bar {
  border-radius: $radius-pill;
  background: $danger-500;
}

.day-stat {
  @include mono-data($text-body, $admin-text-xs);
}

.dev {
  color: $text-body;
  font-size: $admin-text-sm;

  summary {
    cursor: pointer;
    font-weight: $weight-bold;
  }

  ul {
    @include stack($space-2);
    margin-top: $space-2;
    padding-left: $space-5;
  }
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: $space-2;
}

.tab {
  @include button-secondary;

  &.on {
    border-color: $cyan-deep;
    color: $cyan-deep;
  }
}

.tab-count {
  @include mono-data(inherit, $admin-text-xs);
  margin-left: $space-1;
}

.lesson {
  @include admin-card($space-4);
  @include stack($space-2);
  min-width: 0;

  textarea {
    width: 100%;
  }
}

.lesson-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
}

.kind {
  @include admin-badge($cyan-deep, $surface-sunken);

  &.evitar {
    background: $danger-100;
    color: $danger-500;
  }

  &.respuesta {
    background: $ok-wash;
    color: $ok;
  }
}

.meta {
  @include mono-data($text-muted, $admin-text-xs);
}

.text {
  color: $text-strong;
  font-size: $admin-text-md;
  line-height: $leading-body;
}

.example,
.reason {
  color: $text-muted;
  font-size: $admin-text-sm;
}

.example {
  font-style: italic;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: $space-2;
  padding-top: $space-2;
}

.small {
  @include button-secondary;
}

.primary-small {
  border-color: $ok;
  color: $ok;
}

.icon {
  @include button-ghost($text-muted);
  width: 40px;
  height: 40px;
  flex: none;
  padding: 0;
  margin-left: auto;

  &.danger:hover:not(:disabled) {
    background: $danger-100;
    color: $danger-500;
  }
}

.new-lesson {
  @include admin-card($space-5);
  @include stack($space-3);

  h3 {
    color: $text-strong;
    font-size: $admin-text-md;
    font-weight: $weight-bold;
  }
}

.field {
  @include admin-field;
  min-width: 0;
  margin: 0;
}
</style>
