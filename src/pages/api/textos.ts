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

export async function GET() {
  const textos = readData();
  return new Response(JSON.stringify(textos), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST({ request }: { request: Request }) {
  try {
    const newText = await request.json();
    const textos = readData();
    newText.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    textos.push(newText);
    writeData(textos);
    return new Response(JSON.stringify(newText), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in POST:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}