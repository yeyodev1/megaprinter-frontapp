<template>
  <header id="home" class="hero-section">
    <div class="ambient-glow"></div>
    <div class="container">
      <div class="hero-content">
        <div class="pill-badge animate-fade">
          <span class="pulse-dot"></span>
          <span>Tecnología & Soporte Gráfico en Guayaquil</span>
        </div>

        <h1 class="animate-title">
          Excelencia e <br><span class="gradient-text">Innovación en Impresión</span>
        </h1>
        
        <p class="hero-desc">
          Especialistas en mantenimiento preventivo, reparación avanzada de impresoras y laptops, repuestos originales y venta de equipos corporativos de alta gama.
        </p>

        <div class="hero-actions">
          <a href="#catalogo" class="btn-primary">
            <span>Explorar Catálogo</span>
            <i class="fa-solid fa-arrow-right"></i>
          </a>
          <a href="https://wa.me/593998028318?text=Hola%20Megaprinter,%20necesito%20asistencia%20técnica." target="_blank" class="btn-secondary">
            <i class="fa-brands fa-whatsapp"></i>
            <span>Asistencia Inmediata</span>
          </a>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-num">12+</span>
            <span class="stat-label">Años de Trayectoria</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-card">
            <span class="stat-num">8,500+</span>
            <span class="stat-label">Equipos Reparados</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-card">
            <span class="stat-num">100%</span>
            <span class="stat-label">Garantía Corporativa</span>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="showcase-card">
          <div class="img-wrapper">
            <img src="https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=1000&auto=format&fit=crop" alt="Megaprinter Lab" />
            <div class="img-overlay"></div>
          </div>
          <div class="floating-badge">
            <i class="fa-solid fa-location-dot"></i>
            <div>
              <strong>Tungurahua 200 y Padre Solano</strong>
              <span>Guayaquil, Ecuador</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
// Hero script
</script>

<style scoped lang="scss">
.hero-section {
  min-height: 100vh;
  padding: 140px 24px 80px 24px;
  background: #050505;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.ambient-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 500px;
  background: radial-gradient(ellipse at center, rgba(0, 112, 243, 0.15) 0%, rgba(0, 0, 0, 0) 70%);
  z-index: 1;
  pointer-events: none;
}

.container {
  width: 100%;
  max-width: 1300px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 60px;
  position: relative;
  z-index: 2;
}

.hero-content {
  flex: 1;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.pill-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 18px;
  border-radius: 40px;
  width: fit-content;
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  backdrop-filter: blur(10px);

  .pulse-dot {
    width: 8px;
    height: 8px;
    background: #0070f3;
    border-radius: 50%;
    box-shadow: 0 0 12px #0070f3;
    animation: pulse 2s infinite;
  }
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 112, 243, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(0, 112, 243, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(0, 112, 243, 0); }
}

h1 {
  font-size: 60px;
  font-weight: 800;
  color: #fff;
  line-height: 1.05;
  letter-spacing: -2px;

  .gradient-text {
    background: linear-gradient(135deg, #0070f3 0%, #00d2ff 50%, #ffffff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
}

.hero-desc {
  font-size: 17px;
  color: #a1a1a6;
  line-height: 1.7;
  font-weight: 400;
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #0070f3;
  color: #fff;
  padding: 16px 30px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 30px rgba(0, 112, 243, 0.35);

  &:hover {
    background: #005bb5;
    transform: translateY(-3px);
    box-shadow: 0 15px 35px rgba(0, 112, 243, 0.5);
  }
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 16px 26px;
  border-radius: 14px;
  font-weight: 600;
  font-size: 15px;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-3px);
  }

  i {
    color: #25d366;
    font-size: 18px;
  }
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-top: 16px;
  padding-top: 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .stat-num {
    font-size: 28px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .stat-label {
    font-size: 13px;
    color: #888;
    font-weight: 500;
  }
}

.stat-divider {
  width: 1px;
  height: 35px;
  background: rgba(255, 255, 255, 0.1);
}

.hero-visual {
  flex: 1;
  max-width: 540px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.showcase-card {
  position: relative;
  width: 100%;
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  background: #111;

  .img-wrapper {
    position: relative;
    width: 100%;
    height: 420px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scale(1.02);
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .img-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(5,5,5,0.85) 100%);
    }
  }

  &:hover .img-wrapper img {
    transform: scale(1.06);
  }

  .floating-badge {
    position: absolute;
    bottom: 24px;
    left: 24px;
    right: 24px;
    background: rgba(15, 15, 15, 0.85);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 16px 20px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    gap: 16px;

    i {
      font-size: 24px;
      color: #0070f3;
      background: rgba(0, 112, 243, 0.15);
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;

      strong {
        color: #fff;
        font-size: 14px;
        font-weight: 700;
      }

      span {
        color: #a1a1a6;
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 1024px) {
  .container {
    flex-direction: column;
    text-align: center;
    padding-top: 40px;
  }

  .hero-content {
    align-items: center;
    max-width: 100%;
  }

  .hero-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .stats-row {
    justify-content: center;
  }

  .hero-visual {
    width: 100%;
    max-width: 100%;
  }
}

@media (max-width: 600px) {
  h1 {
    font-size: 40px;
  }
  .stats-row {
    flex-direction: column;
    gap: 16px;
  }
  .stat-divider {
    display: none;
  }
}
</style>
