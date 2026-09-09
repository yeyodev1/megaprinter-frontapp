<script setup lang="ts">
import PaymentModal from '@/components/PaymentModal.vue'
import DialogHost from '@/components/ui/DialogHost.vue'
</script>

<template>
  <div class="app-container">
    <a class="skip-link" href="#contenido">Saltar al contenido</a>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <PaymentModal />
    <DialogHost />
  </div>
</template>

<style scoped lang="scss">
.app-container {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}
</style>
