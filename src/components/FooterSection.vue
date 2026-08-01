<template>
  <footer id="contacto" class="footer-section">
    <div class="container">
      <div class="footer-top">
        <div class="footer-col brand-col">
          <img src="https://megaprinter.ec/wp-content/uploads/2024/05/Logo-color-web-1.png" alt="Megaprinter" class="footer-logo" />
          <p>Tungurahua 200 y Padre Solano, esquina.<br>Guayaquil, Ecuador</p>
          <div class="social-row">
            <a href="https://www.facebook.com/profile.php?id=61556411207673" target="_blank" aria-label="Facebook">
              <i class="fa-brands fa-facebook-f"></i>
            </a>
            <a href="https://www.instagram.com/megaprinter.ec/" target="_blank" aria-label="Instagram">
              <i class="fa-brands fa-instagram"></i>
            </a>
            <a href="https://wa.me/593998028318" target="_blank" aria-label="WhatsApp">
              <i class="fa-brands fa-whatsapp"></i>
            </a>
          </div>
        </div>

        <div class="footer-col">
          <h4>Horarios de Atención</h4>
          <p><strong>Lunes a Viernes:</strong> 08:00 - 18:30</p>
          <p><strong>Sábados:</strong> 09:00 - 17:00</p>
          <p><strong>Domingos:</strong> Cerrado</p>
        </div>

        <div class="footer-col">
          <h4>Contacto Directo</h4>
          <p><i class="fa-solid fa-phone"></i> 046017398 / 0984253059</p>
          <p><i class="fa-brands fa-whatsapp"></i> +593 99 802 8318</p>
          <p><i class="fa-solid fa-envelope"></i> info@megaprinter.ec</p>
          <p><i class="fa-solid fa-envelope-circle-check"></i> megaprinter@bakano.ec</p>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} Megaprinter S.A. Todos los derechos reservados.</p>
        <p>Desarrollado con estándares Awwwards & Flexbox</p>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Footer logic
</script>

<style scoped lang="scss">
.footer-section {
  background: #080808;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 80px 24px 30px 24px;
  display: flex;
  justify-content: center;
}

.container {
  width: 100%;
  max-width: 1300px;
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.footer-top {
  display: flex;
  justify-content: space-between;
  gap: 40px;
  flex-wrap: wrap;
}

.footer-col {
  flex: 1;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 16px;

  &.brand-col {
    max-width: 350px;
  }

  .footer-logo {
    height: 44px;
    width: auto;
    object-fit: contain;
    filter: brightness(1.2);
  }

  p {
    font-size: 14px;
    color: #a1a1a6;
    line-height: 1.6;

    strong {
      color: #fff;
    }

    i {
      color: #0070f3;
      margin-right: 8px;
    }
  }

  h4 {
    font-size: 18px;
    color: #fff;
    font-weight: 700;
  }
}

.social-row {
  display: flex;
  gap: 12px;
  margin-top: 8px;

  a {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    text-decoration: none;
    transition: all 0.2s ease;

    &:hover {
      background: #0070f3;
      border-color: #0070f3;
    }
  }
}

.footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 13px;
  color: #777;
  flex-wrap: wrap;
  gap: 16px;
}

@media (max-width: 768px) {
  .footer-top {
    flex-direction: column;
  }
  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
