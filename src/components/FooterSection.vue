<script setup lang="ts">
import { brand, whatsappLink } from '@/config/brand'
import BrandMark from '@/components/BrandMark.vue'
import { useStoreInfo } from '@/composables/useStoreInfo'

const { city, branches } = useStoreInfo()

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
          <p>
            <template v-for="branch in branches" :key="branch.name">{{ branch.address }}<br /></template>
            {{ city }}
          </p>
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
          <h2>Sucursales y horarios</h2>
          <div class="branches">
            <div v-for="branch in branches" :key="branch.name" class="branch">
              <p class="branch-name">{{ branch.name }}</p>
              <p class="branch-address">{{ branch.address }}</p>
              <a v-if="branch.mapsUrl" :href="branch.mapsUrl" target="_blank" rel="noopener" class="maps">
                <i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> Ver en Google Maps
              </a>
              <dl class="hours">
                <div v-for="slot in branch.hours" :key="slot.days">
                  <dt>{{ slot.days }}</dt>
                  <dd>{{ slot.time }}</dd>
                </div>
              </dl>
            </div>
          </div>
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
            <li v-for="branch in branches" :key="branch.name">
              <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
              <a v-if="branch.mapsUrl" :href="branch.mapsUrl" target="_blank" rel="noopener">{{ branch.address }}</a>
              <span v-else>{{ branch.address }}</span>
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

.branches {
  @include stack($space-6);
}

.branch {
  @include stack($space-2);

  .branch-name {
    @include mono-data($cyan-soft, $text-eyebrow);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .branch-address {
    color: $text-on-dark;
  }
}

.maps {
  display: flex;
  align-items: center;
  align-self: flex-start;
  gap: $space-2;
  color: $brand-300;
  font-size: $text-body-sm;
  transition: color $duration-base $ease-out;
  @include focus-ring($brand-300);

  &:hover {
    color: $text-on-dark;
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
