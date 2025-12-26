interface TextItem {
  id: string;
  titulo: string;
  tipo: string;
  rol: string;
  universo?: string | null;
  dependeDe?: string | null;
  parrafos?: string[] | null;
  slug: string;
}

export async function loadCorpus(): Promise<TextItem[]> {
  try {
    const response = await fetch('/api/textos');
    return await response.json();
  } catch (error) {
    console.error('Error loading corpus:', error);
    return [];
  }
}

export async function addTextAPI(text: Omit<TextItem, 'id'>): Promise<TextItem | null> {
  try {
    const response = await fetch('/api/textos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(text)
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding text:', error);
    return null;
  }
}

export async function updateTextAPI(id: string, text: Omit<TextItem, 'id'>): Promise<TextItem | null> {
  try {
    const response = await fetch(`/api/textos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(text)
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating text:', error);
    return null;
  }
}

export async function deleteTextAPI(id: string): Promise<boolean> {
  try {
    await fetch(`/api/textos/${id}`, { method: 'DELETE' });
    return true;
  } catch (error) {
    console.error('Error deleting text:', error);
    return false;
  }
}