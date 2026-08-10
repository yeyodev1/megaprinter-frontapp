import net from 'node:net'

/**
 * Direcciones que hay que comprobar antes de dar un puerto por libre.
 *
 * El comodin no basta: en macOS un `listen('0.0.0.0', 5173)` tiene exito
 * aunque otro proceso ya escuche en `[::1]:5173`, porque son direcciones
 * distintas. Ese es exactamente el caso que rompia la deteccion de conflictos
 * de Vite en este proyecto — con `server.host: true` Vite se ata al comodin,
 * el bind no falla y nunca sube de puerto, asi que dos proyectos distintos
 * acababan "en el 5173" y `localhost` resolvia al equivocado.
 */
const PROBE_HOSTS = ['0.0.0.0', '127.0.0.1', '::1'] as const

const isFreeOn = (port: number, host: string) =>
  new Promise<boolean>((resolve) => {
    const server = net.createServer()

    server.once('error', (error: NodeJS.ErrnoException) => {
      // EADDRNOTAVAIL / EAFNOSUPPORT significan que la familia de direcciones no
      // existe en esta maquina (por ejemplo IPv6 deshabilitado). Eso no es un
      // conflicto: se considera libre.
      resolve(error.code !== 'EADDRINUSE')
    })

    server.once('listening', () => server.close(() => resolve(true)))

    // exclusive evita que el SO comparta el socket y nos oculte el conflicto.
    server.listen({ port, host, exclusive: true })
  })

export async function findFreePort(basePort: number, attempts = 20): Promise<number> {
  for (let offset = 0; offset < attempts; offset += 1) {
    const port = basePort + offset
    const checks = await Promise.all(PROBE_HOSTS.map((host) => isFreeOn(port, host)))
    if (checks.every(Boolean)) return port
  }
  throw new Error(
    `No se encontró un puerto libre entre ${basePort} y ${basePort + attempts - 1}.`,
  )
}
