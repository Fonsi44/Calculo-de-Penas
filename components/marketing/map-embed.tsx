/**
 * Mapa insertado vía iframe de Google Maps.
 *
 * Muestra la ubicación exacta del bufete en Google Maps embebido.
 * Se carga con lazy loading para no afectar LCP.
 */
export function MapEmbed() {
  return (
    <div className="relative w-full h-full">
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d974.4767899856768!2d-87.48733651218728!3d13.53007083082072!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8f70010003041e39%3A0xf07822fa24ed7be3!2sBufete%20Jur%C3%ADdico%20Pineda%20%26%20Asociados!5e1!3m2!1ses!2ses!4v1781961246474!5m2!1ses!2ses"
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación de Pineda y Asociados — Nacaome, Valle"
        aria-label="Mapa de Google Maps mostrando la ubicación del bufete Pineda y Asociados en Nacaome, Valle, Honduras"
      />
    </div>
  );
}
