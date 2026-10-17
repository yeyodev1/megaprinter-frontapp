<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { getPersona, savePersona } from '@/services/learning'
import { errorMessage } from '@/services/http'
import { useDialogStore } from '@/stores/dialog'

/**
 * Personalidad de Mila: el tono, lo que siempre dice y lo que nunca dice.
 * Se aplica en menos de un minuto a todas las respuestas que escribe la IA.
 * Las reglas fijas (precios de reparación, pasos del pedido, reglas de Meta)
 * siguen mandando.
 */

const emit = defineEmits<{ notice: [text: string] }>()
const dialog = useDialogStore()

const loading = ref(true)
const saving = ref(false)
const updatedBy = ref('')
const form = reactive({ personality: '', alwaysSay: [] as string[], neverSay: [] as string[] })
const drafts = reactive({ alwaysSay: '', neverSay: '' })

type ListKey = 'alwaysSay' | 'neverSay'

const load = async () => {
  try {
    const persona = await getPersona()
    form.personality = persona.personality
    form.alwaysSay = [...persona.alwaysSay]
    form.neverSay = [...persona.neverSay]
    updatedBy.value = persona.updatedBy || ''
  } catch (caught) {
    await dialog.notify({ title: 'No pudimos cargar la personalidad', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    loading.value = false
  }
}

const addRule = (key: ListKey) => {
  const text = drafts[key].replace(/\s+/g, ' ').trim()
  if (text.length < 3) return
  form[key] = [...form[key], text]
  drafts[key] = ''
}

const removeRule = (key: ListKey, index: number) => {
  form[key] = form[key].filter((_, position) => position !== index)
}

const save = async () => {
  // Lo escrito sin presionar "Agregar" también cuenta.
  addRule('alwaysSay')
  addRule('neverSay')
  saving.value = true
  try {
    const saved = await savePersona({ ...form })
    updatedBy.value = saved.updatedBy || ''
    emit('notice', 'Personalidad guardada: Mila la aplica en menos de un minuto.')
  } catch (caught) {
    await dialog.notify({ title: 'No se pudo guardar', message: errorMessage(caught, 'Intenta de nuevo.'), tone: 'danger' })
  } finally {
    saving.value = false
  }
}

const LISTS: Array<{ key: ListKey; title: string; icon: string; placeholder: string; empty: string }> = [
  {
    key: 'alwaysSay',
    title: 'Qué decir siempre',
    icon: 'fa-solid fa-circle-check',
    placeholder: 'Ej.: Ofrece el retiro en tienda cuando pregunten por envíos',
    empty: 'Sin indicaciones todavía.',
  },
  {
    key: 'neverSay',
    title: 'Qué no decir nunca',
    icon: 'fa-solid fa-ban',
    placeholder: 'Ej.: Nunca digas "mi amor" ni "corazón"',
    empty: 'Sin prohibiciones todavía.',
  },
]

onMounted(load)
</script>

<template>
  <section class="persona">
    <header class="section-head">
      <h2>Personalidad de Mila</h2>
      <p class="muted">Cómo habla Mila, qué debe decir siempre y qué nunca. Se aplica a todas las respuestas que escribe la IA.</p>
    </header>

    <p v-if="loading" class="muted">Cargando…</p>

    <form v-else class="card" @submit.prevent="save">
      <label class="field">
        <span>Tono y forma de ser</span>
        <textarea
          v-model="form.personality"
          rows="4"
          maxlength="800"
          placeholder="Ej.: Cercana y alegre, tutea, frases cortas, máximo dos emojis por mensaje, nunca suena a vendedora insistente."
        ></textarea>
      </label>

      <div v-for="list in LISTS" :key="list.key" class="rules" :class="list.key">
        <h3><i :class="list.icon" aria-hidden="true"></i> {{ list.title }}</h3>
        <ul v-if="form[list.key].length">
          <li v-for="(rule, index) in form[list.key]" :key="`${list.key}-${index}`">
            <span>{{ rule }}</span>
            <button type="button" class="icon" :aria-label="`Quitar: ${rule}`" title="Quitar" @click="removeRule(list.key, index)">
              <i class="fa-solid fa-xmark" aria-hidden="true"></i>
            </button>
          </li>
        </ul>
        <p v-else class="muted small-text">{{ list.empty }}</p>
        <div class="add">
          <input v-model="drafts[list.key]" maxlength="240" :placeholder="list.placeholder" :aria-label="list.title" @keydown.enter.prevent="addRule(list.key)" />
          <button type="button" class="secondary" @click="addRule(list.key)"><i class="fa-solid fa-plus" aria-hidden="true"></i> Agregar</button>
        </div>
      </div>

      <p class="note">
        <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
        Lo fijo no cambia: Mila nunca da precios de reparaciones, siempre dice que es un bot y sigue los pasos del pedido. Si
        escribes una frase entre comillas en “Qué no decir”, se revisa palabra por palabra.
      </p>

      <footer class="footer">
        <span v-if="updatedBy" class="meta">Último cambio: {{ updatedBy }}</span>
        <button type="submit" class="primary" :disabled="saving">
          <i :class="saving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-floppy-disk'" aria-hidden="true"></i>
          {{ saving ? 'Guardando…' : 'Guardar personalidad' }}
        </button>
      </footer>
    </form>
  </section>
</template>

<style scoped lang="scss">
.persona {
  @include stack($space-4);
}

.section-head {
  @include stack($space-1);

  h2 {
    color: $text-strong;
    font-size: $admin-text-lg;
    font-weight: $weight-bold;
  }
}

.muted {
  color: $text-muted;
  font-size: $admin-text-md;
}

.small-text {
  font-size: $admin-text-sm;
}

.card {
  @include admin-card($space-5);
  @include stack($space-5);
}

.field {
  @include admin-field;
  margin: 0;
}

.rules {
  @include stack($space-2);

  h3 {
    display: flex;
    align-items: center;
    gap: $space-2;
    color: $ok;
    font-size: $admin-text-md;
    font-weight: $weight-bold;
  }

  &.neverSay h3 {
    color: $danger-500;
  }

  ul {
    @include stack($space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    align-items: center;
    gap: $space-2;
    padding: $space-2 $space-2 $space-2 $space-3;
    border: 1px solid $border-subtle;
    border-radius: $radius-md;
    background: $surface-page;
    color: $text-strong;
    font-size: $admin-text-md;

    span {
      min-width: 0;
      flex: 1;
    }
  }
}

.add {
  display: flex;
  flex-direction: column;
  gap: $space-2;

  input {
    @include input-base;
    min-width: 0;
    flex: 1;
  }
}

.icon {
  @include button-ghost($text-muted);
  width: 40px;
  height: 40px;
  flex: none;
  padding: 0;
}

.note {
  display: flex;
  align-items: flex-start;
  gap: $space-2;
  padding: $space-3;
  border-radius: $radius-md;
  background: $surface-sunken;
  color: $text-body;
  font-size: $admin-text-sm;
}

.footer {
  display: flex;
  flex-direction: column-reverse;
  gap: $space-3;
}

.meta {
  @include mono-data($text-muted, $admin-text-xs);
}

.primary {
  @include button-primary;
  box-shadow: none;
}

.secondary {
  @include button-secondary;
}

@include from($bp-sm) {
  .add {
    flex-direction: row;
  }

  .footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
</style>
