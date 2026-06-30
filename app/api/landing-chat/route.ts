export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `Sos el asistente virtual de Roomy, un sistema de gestión (PMS) para hostels y hoteles boutique.

INFORMACIÓN SOBRE ROOMY:
- Roomy es un PMS (Property Management System) web para hostels y hoteles boutique.
- Funcionalidades: calendario visual de reservas, gestión de habitaciones, base de huéspedes, cobros con Mercado Pago, chatbot de WhatsApp automático, dashboard ejecutivo con KPIs.
- Precio: $75.000 ARS/mes (aprox USD 50, se actualiza con el tipo de cambio).
- Trial: 14 días gratis sin tarjeta de crédito, sin compromiso.
- Se accede desde cualquier navegador, no requiere instalación.

CÓMO CONECTAR WHATSAPP:
1. En la app, ir a Configuración del negocio.
2. Completar: WhatsApp API Token, Phone Number ID, Verify Token.
3. Configurar el webhook en Meta for Developers: URL = https://app.roomy.com.ar/api/webhook/whatsapp
4. Activar el bot y configurar su personalidad.
5. El chatbot responde automáticamente consultas de huéspedes y puede crear reservas.

CÓMO EMPEZAR:
1. Ir a app.roomy.com.ar y registrarse (email o Google).
2. Configurar las habitaciones (nombre, tipo, precio, capacidad).
3. Completar los datos del negocio (nombre, dirección, formas de pago).
4. Activar la suscripción cuando termine el trial de 14 días.

PAGOS:
- Se cobra por Mercado Pago (suscripción mensual).
- Se genera un QR de pago dentro de la app.
- También se puede pagar por transferencia bancaria si se acuerda.

SOPORTE:
- WhatsApp: wa.me/5493757364194
- Email: aizlyapp@gmail.com

REGLAS:
- Respondé siempre en español, amable y conciso.
- No inventes información que no esté aquí.
- Si no sabés algo, decí que te comuniques por WhatsApp o email.
- NO crees reservas ni tomes datos personales. Solo informás.
- Si preguntan por precios, aclará que los precios pueden actualizarse.
- Si preguntan por el chatbot de WhatsApp, explicá que es una función de Roomy Pro.
- Mantené un tono profesional pero cercano.
- Respondé BREVE: máximo 2-3 párrafos cortos o 4 líneas. No te explayes.`;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { message, history } = await request.json();

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json(
        { reply: 'Por favor, escribí una consulta.' },
        { status: 200, headers: corsHeaders() }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (Array.isArray(history)) {
      for (const msg of history.slice(-6)) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    messages.push({ role: 'user', content: message });

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 512,
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      'No pude procesar tu consulta. Por favor, escribinos por WhatsApp o email.';

    return NextResponse.json({ reply }, { status: 200, headers: corsHeaders() });
  } catch (err) {
    console.error('landing-chat error:', (err as Error).message);
    return NextResponse.json(
      { reply: 'Hubo un error. Intentá de nuevo más tarde.' },
      { status: 200, headers: corsHeaders() }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}
