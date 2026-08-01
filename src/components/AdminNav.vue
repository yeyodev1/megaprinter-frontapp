<template>
  <nav class="admin-nav"><router-link to="/admin" class="admin-brand"><i class="fa-solid fa-layer-group"></i><span>MEGAPRINTER</span><small>Operaciones</small></router-link><div class="nav-links"><router-link to="/admin"><i class="fa-solid fa-chart-line"></i> Resumen</router-link><router-link to="/admin/catalog"><i class="fa-solid fa-boxes-stacked"></i> Catálogo</router-link><router-link to="/admin/orders"><i class="fa-solid fa-receipt"></i> Pedidos</router-link><router-link to="/admin/users"><i class="fa-solid fa-users"></i> Usuarios</router-link></div><button class="logout" @click="logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Salir</button></nav>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
const logout = () => { sessionStorage.removeItem('admin-token'); router.push('/login') }
</script>

<style scoped lang="scss">
.admin-nav { min-height:64px; padding:0 18px; display:flex; align-items:center; justify-content:space-between; gap:12px; background:#102126; color:#fff; }.admin-brand { display:flex; align-items:center; gap:7px; color:#fff; text-decoration:none; font-size:11px; font-weight:900; letter-spacing:.7px; }.admin-brand i { color:#5ab8ef; }.admin-brand small { display:none; }.nav-links { display:flex; align-items:center; gap:12px; }.admin-nav a,.admin-nav button { border:0; background:transparent; color:#bdc9cd; text-decoration:none; font-size:11px; font-weight:800; cursor:pointer; }.nav-links i,.logout i { margin-right:5px; }.admin-nav a.router-link-active { color:#5ab8ef; }.logout { display:none; }
@media (min-width:800px) { .admin-nav { position:fixed; inset:0 auto 0 0; z-index:1200; width:210px; padding:30px 18px 20px; flex-direction:column; align-items:stretch; justify-content:flex-start; background:#0f1c22; }.admin-brand { flex-wrap:wrap; padding:8px 6px 27px; border-bottom:1px solid rgba(255,255,255,.1); font-size:12px; }.admin-brand small { display:block; width:100%; margin-left:22px; color:#5ab8ef; font-size:9px; text-transform:uppercase; letter-spacing:1.2px; }.nav-links { flex-direction:column; align-items:stretch; gap:4px; margin-top:25px; }.nav-links a { padding:11px 10px; border-radius:7px; font-size:12px; }.nav-links a.router-link-active { background:rgba(91,183,239,.12); }.logout { display:block; margin-top:auto; padding:10px; text-align:left; font-size:12px!important; } }
</style>
