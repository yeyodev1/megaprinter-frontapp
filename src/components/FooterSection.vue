<script setup lang="ts">
import { brand, whatsappLink } from '@/config/brand'
import BrandMark from '@/components/BrandMark.vue'

const year = new Date().getFullYear()
const whatsapp = whatsappLink('Hola Megaprinter, quiero más información.')
</script>

<template>
  <footer id="contacto" class="footer">
    <div class="calibration-strip" aria-hidden="true"></div>
    <div class="footer-inner">
      <div class="footer-top">
        <div class="col brand-col">
          <BrandMark tone="light" size="lg" />
          <p>{{ brand.addressShort }}<br />{{ brand.city }}</p>
          <div class="social">
            <a :href="brand.instagram" target="_blank" rel="noopener" aria-label="Instagram">
              <i class="fa-brands fa-instagram" aria-hidden="true"></i>
            </a>
            <a :href="whatsapp" target="_blank" rel="noopener" aria-label="WhatsApp">
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
            </a>
          </div>
        </div>

        <div class="col">
          <h2>Horarios de atención</h2>
          <dl class="hours">
            <div v-for="slot in brand.hours" :key="slot.days">
              <dt>{{ slot.days }}</dt>
              <dd>{{ slot.time }}</dd>
            </div>
          </dl>
        </div>

        <div class="col">
          <h2>Contacto directo</h2>
          <ul class="contact">
            <li>
              <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
              <a :href="whatsapp" target="_blank" rel="noopener">{{ brand.whatsappDisplay }}</a>
            </li>
            <li>
              <i class="fa-solid fa-envelope" aria-hidden="true"></i>
              <a :href="`mailto:${brand.email}`">{{ brand.email }}</a>
            </li>
            <li>
              <i class="fa-brands fa-instagram" aria-hidden="true"></i>
              <a :href="brand.instagram" target="_blank" rel="noopener">{{ brand.instagramHandle }}</a>
            </li>
            <li>
              <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
              <span>{{ brand.address }}</span>
            </li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; {{ year }} {{ brand.name }}. Todos los derechos reservados.</p>
        <p>Atención local desde {{ brand.foundedYear }}.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.footer {
  background: $key-900;
  color: $text-on-dark;
}

.footer-inner {
  @include container;
  @include stack($space-12);
  padding-block: $space-16 $space-8;
}

.footer-top {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: $space-10;
}

.col {
  @include stack($space-4);
  flex: 1 1 260px;

  &.brand-col {
    max-width: 340px;
  }

  p {
    @include body-text($text-on-dark-muted, $text-body-sm);
  }

  h2 {
    @include eyebrow($cyan-soft);
    margin-bottom: $space-1;
  }
}

.social {
  @include row($space-2);
  margin-top: $space-1;

  a {
    display: flex;
    width: 42px;
    height: 42px;
    align-items: center;
    justify-content: center;
    border: 1px solid $border-on-dark;
    border-radius: $radius-pill;
    color: $text-on-dark;
    transition: background $duration-base $ease-out, border-color $duration-base $ease-out,
      transform $duration-base $ease-out;
    @include focus-ring($brand-300);

    &:hover {
      border-color: $brand-500;
      background: $brand-500;
      transform: translateY(-2px);
    }
  }
}

.hours {
  @include stack($space-2);

  div {
    display: flex;
    justify-content: space-between;
    gap: $space-4;
    padding-bottom: $space-2;
    border-bottom: 1px solid $border-on-dark;
  }

  dt {
    color: $text-on-dark-muted;
    font-size: $text-body-sm;
  }

  dd {
    @include mono-data($text-on-dark, $text-body-sm);
  }
}

.contact {
  @include stack($space-3);

  li {
    display: flex;
    align-items: flex-start;
    gap: $space-3;
    color: $text-on-dark-muted;
    font-size: $text-body-sm;
    line-height: $leading-body;
  }

  i {
    width: 16px;
    padding-top: 4px;
    color: $brand-400;
  }

  a {
    transition: color $duration-base $ease-out;
    @include focus-ring($brand-300);

    &:hover {
      color: $brand-300;
    }
  }
}

.footer-bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: $space-4;
  padding-top: $space-6;
  border-top: 1px solid $border-on-dark;
  @include mono-data($key-400, $text-eyebrow);
}

@include until($bp-md) {
  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }
}
</style>
