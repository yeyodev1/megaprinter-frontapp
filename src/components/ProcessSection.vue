<template>
  <section id="proceso" class="process-section">
    <div class="container">
      <div class="section-header center">
        <span class="section-tag">Metodología de Trabajo</span>
        <h2>Proceso rápido, transparente y efectivo</h2>
        <p>Un flujo diseñado para garantizar la máxima eficiencia y restauración total de tus equipos tecnológicos.</p>
      </div>

      <div class="steps-row">
        <div class="step-card" v-for="(step, index) in steps" :key="step.title">
          <div class="card-header">
            <span class="step-num">0{{ index + 1 }}</span>
            <div class="icon-box">
              <i :class="step.icon"></i>
            </div>
          </div>
          <h3>{{ step.title }}</h3>
          <p>{{ step.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const steps = [
  {
    title: 'Diagnóstico Profesional',
    description: 'Evaluación técnica detallada para identificar el origen exacto de la falla sin compromiso.',
    icon: 'fa-solid fa-magnifying-glass-chart',
  },
  {
    title: 'Aprobación de Presupuesto',
    description: 'Te notificamos el dictamen técnico y los costos exactos antes de ejecutar cualquier acción.',
    icon: 'fa-solid fa-file-signature',
  },
  {
    title: 'Reparación & Calibración',
    description: 'Intervención especializada con herramientas de precisión y repuestos originales certificados.',
    icon: 'fa-solid fa-wrench',
  },
  {
    title: 'Pruebas & Entrega',
    description: 'Rigurosos test de calidad y entrega puntual coordinada para tu máxima tranquilidad.',
    icon: 'fa-solid fa-circle-check',
  },
]
</script>

<style scoped lang="scss">
.process-section {
  padding: 120px 24px;
  background: #050505;
  display: flex;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 1300px;
  display: flex;
  flex-direction: column;
  gap: 64px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &.center {
    align-items: center;
    text-align: center;
    max-width: 750px;
    margin: 0 auto;
  }

  .section-tag {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    color: #0070f3;
    letter-spacing: 1.5px;
  }

  h2 {
    font-size: 42px;
    font-weight: 800;
    color: #fff;
    line-height: 1.15;
    letter-spacing: -1.2px;
  }

  p {
    font-size: 16px;
    color: #a1a1a6;
    line-height: 1.6;
  }
}

.steps-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.step-card {
  flex: 1;
  min-width: 260px;
  background: rgba(20, 20, 20, 0.6);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 36px 30px;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease;

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(0, 112, 243, 0.4);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);

    .icon-box {
      background: #0070f3;
      color: #fff;
    }
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .step-num {
      font-size: 28px;
      font-weight: 900;
      color: rgba(255, 255, 255, 0.15);
      letter-spacing: -1px;
    }

    .icon-box {
      width: 48px;
      height: 48px;
      background: rgba(0, 112, 243, 0.12);
      color: #3291ff;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: all 0.3s ease;
    }
  }

  h3 {
    font-size: 20px;
    color: #fff;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  p {
    font-size: 14px;
    color: #a1a1a6;
    line-height: 1.6;
  }
}

@media (max-width: 900px) {
  .steps-row {
    flex-direction: column;
  }
}
</style>
