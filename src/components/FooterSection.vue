<template>
  <footer id="contacto" class="footer-section">
    <div class="container">
      <div class="footer-top">
        <div class="footer-col brand-col">
          <img :src="brand.logo" :alt="brand.name" class="footer-logo" />
          <p>{{ brand.addressShort }}<br>{{ brand.city }}</p>
          <div class="social-row">
            <a :href="brand.instagram" target="_blank" rel="noopener" aria-label="Instagram">
              <i class="fa-brands fa-instagram"></i>
            </a>
            <a :href="`https://wa.me/${brand.whatsappRaw}`" target="_blank" rel="noopener" aria-label="WhatsApp">
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
          <p><i class="fa-brands fa-instagram"></i> <a :href="brand.instagram" target="_blank" rel="noopener" class="contact-link">{{ brand.instagramHandle }}</a></p>
          <p><i class="fa-brands fa-whatsapp"></i> <a :href="`https://wa.me/${brand.whatsappRaw}`" target="_blank" rel="noopener" class="contact-link">{{ brand.whatsappDisplay }}</a></p>
          <p><i class="fa-solid fa-phone"></i> {{ brand.phone }}</p>
          <p><i class="fa-solid fa-envelope"></i> {{ brand.email }}</p>
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
import { brand } from '@/config/brand'
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

  .contact-link {
    color: #a1a1a6;
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: #0070f3;
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
