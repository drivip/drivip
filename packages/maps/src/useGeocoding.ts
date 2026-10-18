import { useState, useCallback } from "react";

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  address: Record<string, string>;
}

export default function useGeocoding() {
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "5",
        addressdetails: "1",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "User-Agent": "DrivipApp/1.0 (drivip.app)",
          },
        }
      );
      if (!response.ok) throw new Error("Error en la busqueda");
      const data = await response.json();
      const mapped: GeocodingResult[] = data.map(
        (item: Record<string, unknown>) => ({
          lat: parseFloat(item.lat as string),
          lng: parseFloat(item.lon as string),
          displayName: item.display_name as string,
          address: (item.address as Record<string, string>) || {},
        })
      );
      setResults(mapped);
    } catch {
      setError("Error al buscar direccion");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
