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
  city: 'Guayaquil, Ecuador',
  foundedYear: 2008,
  /**
   * Valores por defecto de las sucursales. La web los reemplaza por lo que el
   * equipo guarda en el panel (GET /settings/store/public); se usan tal cual si
   * esa llamada falla.
   */
  branches: [
    {
      name: 'Sucursal 1',
      address: 'Av. Tungurahua 103, entre Luis Vernaza y Padre Solano',
      mapsUrl: 'https://maps.app.goo.gl/whLgVu9tGFrCfpd37',
      hours: [
        { days: 'Lunes a Viernes', time: '8:30 AM – 7:00 PM' },
        { days: 'Sábado', time: '9:00 AM – 5:00 PM' },
      ],
      active: true,
    },
    {
      name: 'Sucursal 2',
      address: 'Av. Tungurahua 205 y Luis Urdaneta',
      mapsUrl: 'https://maps.app.goo.gl/RTPBZoKzijt7rzub9',
      hours: [
        { days: 'Lunes a Viernes', time: '8:30 AM – 7:00 PM' },
        { days: 'Sábado', time: '9:00 AM – 5:00 PM' },
        { days: 'Domingo', time: '10:00 AM – 2:00 PM' },
      ],
      active: true,
    },
  ],
}

/**
 * Constructor unico de enlaces de WhatsApp. El numero estaba escrito a mano en
 * cinco vistas distintas mientras `whatsappRaw` quedaba sin usar: cambiarlo
 * obligaba a recordar los cinco sitios.
 */
export const whatsappLink = (message: string) =>
  `https://wa.me/${brand.whatsappRaw}?text=${encodeURIComponent(message)}`
