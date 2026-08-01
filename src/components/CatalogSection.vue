<template>
  <section id="catalogo" class="catalog-section">
    <div class="container">
      <div class="section-header center">
        <span class="section-tag">Catálogo & Soluciones</span>
        <h2>Equipos, repuestos y suministros de alta gama</h2>
        <p>Selecciona el producto o servicio que necesites y realiza tu pedido de forma inmediata y segura.</p>
      </div>

      <div class="products-row">
        <div class="product-card" v-for="product in products" :key="product.id">
          <div class="product-img-box">
            <img :src="product.image" :alt="product.name" />
            <span class="category-badge">{{ product.category }}</span>
          </div>
          <div class="product-info">
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
            <div class="card-bottom">
              <span class="price">${{ product.price.toFixed(2) }}</span>
              <button class="add-btn" @click="addToCart(product)">
                <i class="fa-solid fa-cart-plus"></i>
                <span>Añadir al Carrito</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

const products = [
  {
    id: 'prod-1',
    name: 'Impresora Láser Multifunción Pro',
    category: 'Impresoras',
    description: 'Impresión dúplex automática, alta velocidad y conectividad WiFi corporativa.',
    price: 349.99,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'prod-2',
    name: 'Mantenimiento Preventivo Integral',
    category: 'Servicios',
    description: 'Limpieza profunda de cabezales, rodillos y optimización de software en oficina.',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'prod-3',
    name: 'Kit de Tintas Originales CMYK (4 Botellas)',
    category: 'Suministros',
    description: 'Tintas de rendimiento superior para máxima fidelidad de color y nitidez.',
    price: 38.50,
    image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'prod-4',
    name: 'Laptop Corporativa Core i5 / 16GB',
    category: 'Laptops',
    description: 'Equipo reacondicionado grado A con disco SSD de 512GB y garantía total.',
    price: 520.00,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'prod-5',
    name: 'Reparación Especializada de Laptop',
    category: 'Servicios',
    description: 'Diagnóstico avanzado, reballing, cambio de pantalla y recuperación de componentes.',
    price: 60.00,
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
  },
  {
    id: 'prod-6',
    name: 'Impresora Térmica de Recibos POS',
    category: 'Impresoras',
    description: 'Alta velocidad de corte, diseño compacto y conectividad versátil USB/Ethernet.',
    price: 125.00,
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=800&auto=format&fit=crop',
  },
]

const addToCart = (product: any) => {
  cartStore.addItem({
    id: product.id,
    name: product.name,
    price: product.price,
    image: product.image,
  })
}
</script>

<style scoped lang="scss">
.catalog-section {
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

.products-row {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}

.product-card {
  flex: 1;
  min-width: 320px;
  max-width: 400px;
  background: rgba(18, 18, 18, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.4s ease;

  &:hover {
    transform: translateY(-8px);
    border-color: rgba(0, 112, 243, 0.5);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.6);

    .product-img-box img {
      transform: scale(1.06);
    }
  }

  .product-img-box {
    position: relative;
    width: 100%;
    height: 220px;
    overflow: hidden;
    background: #111;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .category-badge {
      position: absolute;
      top: 16px;
      right: 16px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(10, 10, 10, 0.8);
      backdrop-filter: blur(10px);
      color: #3291ff;
      padding: 6px 14px;
      border-radius: 30px;
      border: 1px solid rgba(0, 112, 243, 0.4);
    }
  }

  .product-info {
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;

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
      flex: 1;
    }

    .card-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);

      .price {
        font-size: 24px;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.5px;
      }

      .add-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #0070f3;
        color: #fff;
        border: none;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #005bb5;
          transform: translateY(-2px);
        }
      }
    }
  }
}

@media (max-width: 900px) {
  .products-row {
    justify-content: center;
  }
}
</style>
