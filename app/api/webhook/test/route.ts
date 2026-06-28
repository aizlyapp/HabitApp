import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('🧪 TEST endpoint reached!');
  console.log('headers:', Object.fromEntries(request.headers.entries()));

  let raw: string | undefined;
  try {
    raw = await request.text();
    console.log('body:', raw);
  } catch (e) {
    console.error('error reading body:', e);
  }

  return NextResponse.json({ ok: true, message: 'Evento Recibido' });
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
