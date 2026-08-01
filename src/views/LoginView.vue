<template>
  <main class="login-page"><router-link to="/" class="back">← Megaprinter</router-link><form @submit.prevent="login"><span>Acceso restringido</span><h1>Panel interno</h1><p>Acceso exclusivo para el equipo operativo Megaprinter.</p><input v-model="email" type="email" placeholder="correo@bakano.ec" required autofocus><input v-model="password" type="password" placeholder="Contraseña" required><button>Entrar al panel <i class="fa-solid fa-arrow-right"></i></button><small v-if="error">{{ error }}</small></form></main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { apiBase } from '@/services/api'
const router = useRouter(); const email = ref('dreyes@bakano.ec'); const password = ref(''); const error = ref('')
const login = async () => { try { const { data } = await axios.post(`${apiBase}/auth/login`,{ email:email.value,password:password.value }); sessionStorage.setItem('admin-token',data.token); router.push('/admin') } catch { error.value='Correo o contraseña incorrectos.' } }
</script>

<style scoped lang="scss">
.login-page { min-height:100vh; padding:28px; display:flex; flex-direction:column; background:#10191c; color:#f1f2ed; }.back { color:#7dc7f4; text-decoration:none; font-size:12px; font-weight:800; }.login-page form { width:100%; max-width:430px; margin:auto; display:flex; flex-direction:column; align-items:flex-start; gap:16px; }.login-page span { color:#68b9ec; font-size:11px; font-weight:900; letter-spacing:1.4px; text-transform:uppercase; }.login-page h1 { font-size:clamp(3rem,12vw,6rem); letter-spacing:-.09em; line-height:.8; }.login-page p { color:#aab7b9; line-height:1.55; }.login-page input { width:100%; box-sizing:border-box; padding:15px; border:1px solid rgba(255,255,255,.18); border-radius:5px; outline:0; background:rgba(255,255,255,.06); color:#fff; font:inherit; &:focus { border-color:#5ab8ef; } }.login-page button { display:flex; align-items:center; gap:10px; border:0; padding:15px 18px; background:#5ab8ef; color:#07141a; font-weight:900; cursor:pointer; }.login-page small { color:#ff8994; }
</style>
