<script setup lang="ts">
import { ref } from 'vue'
import { uploadCatalogImage } from '@/services/catalog'
import { errorMessage } from '@/services/http'

const modelValue = defineModel<string>({ required: true })

const uploading = ref(false)
const uploadError = ref('')

const uploadImage = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  uploadError.value = ''
  try {
    modelValue.value = (await uploadCatalogImage(file)).url
  } catch (caught) {
    uploadError.value = errorMessage(caught, 'No se pudo subir la imagen.')
  } finally {
    uploading.value = false
    // Sin esto, volver a elegir el mismo archivo no dispara el evento `change`.
    input.value = ''
  }
}

defineExpose({ uploading })
</script>

<template>
  <div class="image-upload">
    <div class="image-label">
      <span>Imagen principal</span>
      <small>JPG, PNG, WebP o AVIF · Máx. 5 MB</small>
    </div>

    <label class="dropzone" :class="{ uploading, ready: !!modelValue }">
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" @change="uploadImage" />
      <i
        :class="
          uploading
            ? 'fa-solid fa-spinner fa-spin'
            : modelValue
              ? 'fa-solid fa-circle-check'
              : 'fa-solid fa-cloud-arrow-up'
        "
        aria-hidden="true"
      ></i>
      <strong>
        {{ uploading ? 'Subiendo imagen…' : modelValue ? 'Imagen lista para guardar' : 'Seleccionar una imagen' }}
      </strong>
      <small>
        {{ modelValue ? 'Elige otro archivo para reemplazarla' : 'Se optimiza y guarda de forma segura' }}
      </small>
    </label>

    <p v-if="uploadError" class="upload-error" role="alert">{{ uploadError }}</p>

    <div v-if="modelValue" class="image-preview">
      <img :src="modelValue" alt="Vista previa de la imagen cargada" />
      <button type="button" aria-label="Quitar imagen" @click="modelValue = ''">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.image-upload {
  @include stack($space-2);
}

.image-label {
  display: flex;
  align-items: baseline;
  justify-content: space-between;

  span {
    @include field-label;
  }

  small {
    color: $text-muted;
    font-size: 0.6875rem;
  }
}

// Los estados de esta zona estaban anidados como `.dropzone .dropzone:hover`,
// un selector que nunca coincide: el hover, el estado listo y el de subida
// jamas llegaban a aplicarse.
.dropzone {
  @include stack($space-2);
  min-height: 124px;
  align-items: center;
  justify-content: center;
  padding: $space-5;
  border: 1px dashed $border-strong;
  border-radius: $radius-md;
  background: $surface-sunken;
  color: $brand-600;
  text-align: center;
  cursor: pointer;
  transition: border-color $duration-base $ease-out, background $duration-base $ease-out;

  input {
    display: none;
  }

  i {
    font-size: 1.4rem;
  }

  strong {
    font-size: $text-body-sm;
  }

  small {
    color: $text-muted;
    font-size: $text-eyebrow;
  }

  &:hover,
  &.ready {
    border-color: $brand-500;
    background: $brand-100;
  }

  &.uploading {
    opacity: 0.7;
    pointer-events: none;
  }
}

.upload-error {
  color: $danger-500;
  font-size: $text-caption;
}

.image-preview {
  position: relative;
  height: 180px;
  overflow: hidden;
  border-radius: $radius-md;
  background: $surface-sunken;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  button {
    position: absolute;
    top: $space-2;
    right: $space-2;
    display: flex;
    width: 30px;
    height: 30px;
    align-items: center;
    justify-content: center;
    border: 0;
    border-radius: $radius-pill;
    background: rgba($ink-900, 0.78);
    color: $white;
    cursor: pointer;
    @include focus-ring;
  }
}
</style>
