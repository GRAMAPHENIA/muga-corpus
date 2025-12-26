import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const prerender = false;

const dataPath = join(process.cwd(), 'src/data/textos.json');

function readData() {
  try {
    const data = readFileSync(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeData(data: any[]) {
  writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

export async function GET({ params }: { params: { id: string } }) {
  const textos = readData();
  const texto = textos.find((t: any) => t.id === params.id);
  if (!texto) {
    return new Response(JSON.stringify({ error: 'Texto no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return new Response(JSON.stringify(texto), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function PUT({ params, request }: { params: { id: string }, request: Request }) {
  const updatedText = await request.json();
  const textos = readData();
  const index = textos.findIndex((t: any) => t.id === params.id);
  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Texto no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  textos[index] = { ...textos[index], ...updatedText };
  writeData(textos);
  return new Response(JSON.stringify(textos[index]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function DELETE({ params }: { params: { id: string } }) {
  const textos = readData();
  const index = textos.findIndex((t: any) => t.id === params.id);
  if (index === -1) {
    return new Response(JSON.stringify({ error: 'Texto no encontrado' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  const deleted = textos.splice(index, 1)[0];
  writeData(textos);
  return new Response(JSON.stringify(deleted), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}