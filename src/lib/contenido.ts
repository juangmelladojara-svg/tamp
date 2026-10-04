// ---------------------------------------------------------------------------
// Contenido de la landing compartido con los motores de respuesta.
//
// Estos textos se ven en pantalla (page.tsx) y además salen en el JSON-LD y en
// /llms.txt. Viven aquí, y no en el componente, para que la web y lo que leen
// los motores nunca se desincronicen: se edita en un solo lugar.
//
// La presentación (íconos, tamaños del bento, tarjeta oscura) se queda en
// page.tsx; aquí va solo el texto.
// ---------------------------------------------------------------------------

export const servicios = [
  {
    id: "web",
    titulo: "Desarrollo web a medida",
    desc: "Sitios y aplicaciones construidos con Next.js y React. Rápidos, propios y pensados para crecer contigo, sin plantillas genéricas.",
  },
  {
    id: "automatizacion",
    titulo: "Automatización",
    desc: "Flujos con n8n que eliminan el trabajo repetitivo.",
  },
  {
    id: "integraciones",
    titulo: "Integraciones & APIs",
    desc: "Conectamos tus herramientas para que hablen entre sí.",
  },
  {
    id: "ia",
    titulo: "Agentes de IA",
    desc: "Asistentes que responden, clasifican y ejecutan tareas por ti, día y noche.",
  },
  {
    id: "soporte",
    titulo: "Soporte & evolución",
    desc: "No desaparecemos al entregar: mantenemos y hacemos crecer lo construido.",
  },
] as const;

export type ServicioId = (typeof servicios)[number]["id"];

export const sectores = [
  {
    id: "retail",
    titulo: "Comercio & Retail",
    desc: "Catálogo, ventas y stock conectados, online y en tienda, sin planillas sueltas.",
  },
  {
    id: "profesionales",
    titulo: "Servicios Profesionales",
    desc: "Agenda, cobros y seguimiento de clientes en un solo lugar.",
  },
  {
    id: "salud",
    titulo: "Salud & Bienestar",
    desc: "Reservas, fichas y recordatorios automáticos para tus pacientes.",
  },
  {
    id: "logistica",
    titulo: "Logística & Distribución",
    desc: "Pedidos, despachos y seguimiento que avanzan sin intervención manual.",
  },
  {
    id: "educacion",
    titulo: "Educación & Formación",
    desc: "Inscripciones, pagos y contenidos en una plataforma propia.",
  },
  {
    id: "manufactura",
    titulo: "Manufactura & Industria",
    desc: "Órdenes, inventario y producción bajo control y en tiempo real.",
  },
] as const;

export type SectorId = (typeof sectores)[number]["id"];

export const proceso = [
  { n: "01", t: "Descubrimiento", d: "Entendemos tu negocio y dónde se te van las horas." },
  { n: "02", t: "Diseño", d: "Definimos la herramienta: interfaz, datos y flujos." },
  { n: "03", t: "Desarrollo", d: "Construimos con código propio, limpio y mantenible." },
  { n: "04", t: "Automatización", d: "Conectamos procesos para que trabajen solos." },
  { n: "05", t: "Soporte", d: "Medimos, ajustamos y evolucionamos contigo." },
] as const;

// ---------------------------------------------------------------------------
// Preguntas frecuentes
//
// El formato pregunta → respuesta corta y autocontenida es lo que los motores
// de respuesta citan textualmente. Se muestran en <FaqSection /> y salen
// idénticas en el JSON-LD (FAQPage) y en /llms.txt.
//
// TODO(TAMP): el preset AEO recomienda 6–8 preguntas. Candidatas, a responder
// SOLO con datos reales que entregue TAMP: cómo se cotiza un proyecto (el sitio
// no publica precios), si atienden en remoto / en qué ciudades, qué incluye el
// soporte después de la entrega, cómo es la primera llamada.
// ---------------------------------------------------------------------------
export const faqs: { pregunta: string; respuesta: string }[] = [
  {
    pregunta: "¿Trabajan con pymes o solo con empresas grandes?",
    respuesta:
      "Con ambas. Adaptamos el alcance: una pyme puede empezar con una herramienta puntual y una empresa consolidada con un sistema completo. Lo importante es resolver un problema real.",
  },
  {
    pregunta: "¿Qué significa exactamente 'automatización'?",
    respuesta:
      "Conectar tus herramientas y procesos para que tareas repetitivas (enviar correos, mover datos, generar reportes, responder consultas) ocurran solas, sin que nadie tenga que hacerlas a mano.",
  },
  {
    pregunta: "¿Me entregan el código o quedo amarrado a ustedes?",
    respuesta:
      "El código es tuyo. Construimos sobre tecnologías estándar y abiertas; puedes seguir con nosotros para evolucionarlo o llevártelo cuando quieras.",
  },
  {
    pregunta: "¿Cuánto tarda un proyecto?",
    respuesta:
      "Una herramienta acotada puede estar lista en semanas. Proyectos más grandes se entregan por etapas, con algo funcionando desde temprano.",
  },
];
