<template>
  <section id="servicios" class="services-section">
    <div class="container">
      <div class="section-header">
        <div class="header-tag">
          <i class="fa-solid fa-layer-group"></i>
          <span>Servicios Especializados</span>
        </div>
        <h2>Soluciones de alto rendimiento para tu negocio y hogar</h2>
        <p>Brindamos servicio corporativo a domicilio, retiro express y soporte técnico certificado en nuestras oficinas de Guayaquil.</p>
      </div>

      <div class="services-row">
        <div class="service-card" v-for="service in services" :key="service.title">
          <div class="card-bg">
            <img :src="service.image" :alt="service.title" />
            <div class="overlay"></div>
          </div>
          <div class="card-content">
            <div class="icon-box">
              <i :class="service.icon"></i>
            </div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
            <a href="#contacto" class="service-link">
              <span>Agendar Servicio</span>
              <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const services = [
  {
    title: 'Mantenimiento Preventivo',
    description: 'Limpieza ultrasónica de cabezales, calibración de rodillos, lubricación y optimización de rendimiento.',
    icon: 'fa-solid fa-screwdriver-wrench',
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Reparación Especializada',
    description: 'Solución experta a fallas electrónicas y mecánicas en impresoras láser, térmicas y laptops de todas las marcas.',
    icon: 'fa-solid fa-gears',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Instalación & Redes',
    description: 'Configuración de servidores de impresión en red, WiFi corporativo y despliegue de estaciones de trabajo.',
    icon: 'fa-solid fa-network-wired',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop',
  },
  {
    title: 'Venta de Equipos & Suministros',
    description: 'Impresoras nuevas, laptops corporativas, tintas originales, toners y repuestos certificados con garantía.',
    icon: 'fa-solid fa-store',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
  },
]
</script>

<style scoped lang="scss">
.services-section {
  padding: 120px 24px;
  background: #080808;
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
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 20px;

  .header-tag {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #0070f3;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
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

.services-row {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.service-card {
  flex: 1;
  min-width: 280px;
  height: 440px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease;

  .card-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, rgba(10,10,10,0.2) 20%, rgba(10,10,10,0.95) 85%);
    }
  }

  .card-content {
    position: relative;
    z-index: 2;
    padding: 36px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .icon-box {
    width: 52px;
    height: 52px;
    background: rgba(0, 112, 243, 0.85);
    backdrop-filter: blur(10px);
    color: #fff;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-bottom: 4px;
    box-shadow: 0 10px 25px rgba(0, 112, 243, 0.4);
  }

  h3 {
    font-size: 22px;
    color: #fff;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  p {
    font-size: 14px;
    color: #c0c0c5;
    line-height: 1.6;
  }

  .service-link {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #3291ff;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    margin-top: 8px;
    opacity: 0.9;
    transition: opacity 0.2s ease, transform 0.2s ease;

    &:hover {
      opacity: 1;
      transform: translateX(4px);
    }
  }

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(0, 112, 243, 0.5);

    .card-bg img {
      transform: scale(1.08);
    }
  }
}

@media (max-width: 900px) {
  .services-row {
    flex-direction: column;
  }
  .service-card {
    height: 380px;
  }
}
</style>
