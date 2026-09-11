export interface DistrictResult {
  latitude: number;
  longitude: number;
  distrito: string | null;
  comuna: string | null;
  nombre: string | null;
}

const COCHAEXACTA_URL = process.env.COCHAEXACTA_URL || 'http://localhost:5011';

/**
 * Llama a la API CochaExacta para obtener distrito, comuna y nombre
 * dado un par de coordenadas (lat, lng).
 */
export async function searchDistrict(lat: number, lon: number): Promise<DistrictResult | null> {
  try {
    const url = `${COCHAEXACTA_URL}/api/district?lat=${lat}&lng=${lon}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CochaExacta respondió con status ${response.status}`);
    }

    const data = await response.json() as DistrictResult;

    if (!data.distrito) return null;

    return data;
  } catch (error) {
    throw new Error(`Error al consultar CochaExacta: ${(error as Error).message}`);
  }
}
