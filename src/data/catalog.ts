import type { CatalogItem } from '@/services/catalog'

const laptopImage = ''
const monitorImage = ''

const laptop = (id: string, name: string, price: number, processor: string, storage: string, ram: string, screen: string, originalPrice?: number): CatalogItem => ({
  _id: id, slug: id, name, price, originalPrice, imageUrl: laptopImage, kind: 'product', active: true,
  category: { _id: 'laptops', name: 'Laptops', slug: 'laptops' },
  description: `${processor}, ${ram}, ${storage} y pantalla de ${screen}. Incluye Windows y Office original.`,
  specifications: [{ label: 'Procesador', value: processor }, { label: 'Almacenamiento', value: storage }, { label: 'Memoria', value: ram }, { label: 'Pantalla', value: screen }, { label: 'Incluye', value: 'Windows y Office original' }],
})

const monitor = (id: string, name: string, price: number, size: string, refreshRate: string, originalPrice: number): CatalogItem => ({
  _id: id, slug: id, name, price, originalPrice, imageUrl: monitorImage, kind: 'product', active: true,
  category: { _id: 'monitores', name: 'Monitores', slug: 'monitores' },
  description: `Monitor de ${size} con frecuencia de actualización de ${refreshRate}.`,
  specifications: [{ label: 'Tamaño', value: size }, { label: 'Frecuencia', value: refreshRate }, { label: 'Categoría', value: 'Monitor' }],
})

export const catalogFallback: CatalogItem[] = [
  laptop('hp-14-dq0520la', 'HP 14-DQ0520LA', 420, 'Intel Celeron N4500', '256 GB SSD', '8 GB RAM', '14 pulgadas', 450),
  laptop('lenovo-ideapad-slim-3-r3', 'Lenovo IdeaPad Slim 3', 560, 'AMD Ryzen 3', '512 GB SSD', '8 GB RAM', '15.6 pulgadas', 590),
  laptop('lenovo-ideapad-slim-3-r7', 'Lenovo IdeaPad Slim 3', 790, 'AMD Ryzen 7 5825U', '512 GB SSD', '16 GB RAM', '15.6 pulgadas', 810),
  laptop('dell-15-dc15255', 'Dell 15 DC15255 Touch', 760, 'AMD Ryzen 7 7730U', '512 GB SSD', '16 GB RAM', '15.6 pulgadas', 790),
  laptop('asus-m1502ya-i9', 'ASUS M1502YA', 980, 'Intel Core i9 13.a generación', '1 TB SSD', '16 GB RAM', '15.6 pulgadas', 1010),
  laptop('lenovo-ideapad-slim-3-i3', 'Lenovo IdeaPad Slim 3', 620, 'Intel i3-N305', '512 GB SSD', '8 GB RAM', '15.6 pulgadas', 650),
  laptop('asus-m1502ya-r7-1tb', 'ASUS M1502YA', 800, 'Ryzen 7 7730U', '1 TB SSD', '16 GB RAM', '15.6 pulgadas', 830),
  laptop('asus-x1504va-i5', 'ASUS X1504VA', 740, 'Intel Core i5 12.a generación', '512 GB SSD', '12 GB RAM', '15.6 pulgadas', 760),
  laptop('asus-e1504fa', 'ASUS E1504FA', 760, 'Ryzen 5 7520U', '1 TB SSD', '16 GB RAM', '15.6 pulgadas', 800),
  laptop('dell-dc15250-53', 'Dell DC15250-53', 670, 'Intel Core i5 13.a generación', '512 GB SSD', '8 GB RAM', '15.6 pulgadas', 700),
  laptop('hp-15-fc0025wm', 'HP 15-FC0025WM', 720, 'Ryzen 5 7520U', '1 TB SSD', '8 GB RAM', '15.6 pulgadas', 740),
  laptop('asus-x1504za', 'ASUS X1504ZA', 660, 'Intel Core i3 12.a generación', '512 GB SSD', '8 GB RAM', '15 pulgadas', 690),
  laptop('asus-x1504va-i5-16', 'ASUS X1504VA', 785, 'Intel Core i5 12.a generación', '512 GB SSD', '16 GB RAM', '15 pulgadas', 800),
  monitor('xtratech-195', 'Xtratech 19.5 pulgadas', 90, '19.5 pulgadas', '75 Hz', 130),
  monitor('aoc-215', 'AOC 21.5 pulgadas', 130, '21.5 pulgadas', '75 Hz', 170),
  monitor('teros-24', 'Teros 24 pulgadas', 195, '24 pulgadas', '144 Hz', 230),
  monitor('msi-24', 'MSI 24 pulgadas', 340, '24 pulgadas', '180 Hz', 390),
  monitor('msi-27', 'MSI 27 pulgadas', 355, '27 pulgadas', '280 Hz', 390),
  monitor('armaggeddon-34', 'Armaggeddon 34 pulgadas', 650, '34 pulgadas', '180 Hz', 700),
]
