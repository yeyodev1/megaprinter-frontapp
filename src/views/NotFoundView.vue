<template>
  <main class="not-found">
    <div class="signal">ERROR / 404</div>
    <div class="content">
      <span class="eyebrow">Megaprinter / Guayaquil</span>
      <h1>Esta página<br>no imprime.</h1>
      <p>La dirección que buscas no existe o fue movida. Regresa al inicio para continuar.</p>
      <router-link to="/">Volver al inicio <i class="fa-solid fa-arrow-right"></i></router-link>
    </div>
    <div class="orbital"><span>404</span></div>
  </main>
</template>

<script setup lang="ts">
</script>

<style scoped lang="scss">
.not-found { min-height:100vh; padding:32px 24px; overflow:hidden; position:relative; background:#10191c; color:#f1f0ea; display:flex; flex-direction:column; justify-content:space-between; }.signal,.eyebrow { color:#57b7f4; font-size:11px; font-weight:900; letter-spacing:1.5px; text-transform:uppercase; }.content { position:relative; z-index:1; max-width:680px; display:flex; flex-direction:column; align-items:flex-start; gap:20px; margin:auto 0; }.content h1 { font-size:clamp(4rem,15vw,10rem); line-height:.75; letter-spacing:-.11em; }.content p { max-width:350px; color:#aebbb9; line-height:1.6; }.content a { display:flex; align-items:center; gap:10px; padding-bottom:6px; color:#fff; font-weight:800; text-decoration:none; border-bottom:2px solid #4daaf0; }.orbital { position:absolute; right:-125px; bottom:-105px; width:350px; height:350px; border:1px solid rgba(87,183,244,.45); border-radius:50%; display:flex; align-items:center; justify-content:center; transform:rotate(-18deg); }.orbital::before,.orbital::after { content:''; position:absolute; border:1px solid rgba(87,183,244,.22); border-radius:50%; }.orbital::before { width:270px; height:270px; }.orbital::after { width:460px; height:460px; }.orbital span { color:#57b7f4; font-size:96px; font-weight:900; letter-spacing:-.1em; }
@media (min-width:800px) { .not-found { padding:50px max(6vw,60px); }.orbital { right:8vw; bottom:-150px; width:540px; height:540px; }.orbital::before { width:410px; height:410px; }.orbital span { font-size:150px; } }
</style>
