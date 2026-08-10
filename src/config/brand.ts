export const brand = {
  name: 'Megaprinter Ecuador',
  shortName: 'Megaprinter',
  domain: 'https://megaprinter.ec',
  instagram: 'https://www.instagram.com/megaprinter.ec/',
  instagramHandle: '@megaprinter.ec',
  phone: '+593 99 802 8318',
  whatsappDisplay: '+593 99 802 8318',
  whatsappRaw: '593998028318',
  email: 'info@megaprinter.ec',
  address: 'Tungurahua 200 y Padre Solano, esquina. Guayaquil, Ecuador',
  addressShort: 'Tungurahua 200 y Padre Solano, esquina.',
  city: 'Guayaquil, Ecuador',
  foundedYear: 2008,
  hours: [
    { days: 'Lunes a viernes', time: '08:00 – 18:30' },
    { days: 'Sábados', time: '09:00 – 17:00' },
    { days: 'Domingos', time: 'Cerrado' },
  ],
}

/**
 * Constructor unico de enlaces de WhatsApp. El numero estaba escrito a mano en
 * cinco vistas distintas mientras `whatsappRaw` quedaba sin usar: cambiarlo
 * obligaba a recordar los cinco sitios.
 */
export const whatsappLink = (message: string) =>
  `https://wa.me/${brand.whatsappRaw}?text=${encodeURIComponent(message)}`
