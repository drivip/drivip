import { useState, useCallback } from "react";
import { searchVenezuelaPlaces } from "./venezuelaGeocoder";

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

    const places = await searchVenezuelaPlaces(query, { limit: 6 });

    if (places.length === 0) {
      setResults([]);
      setError("No encontramos esa dirección en Venezuela.");
      setLoading(false);
      return;
    }

    setResults(
      places.map((place) => ({
        lat: place.lat,
        lng: place.lng,
        displayName: place.displayName,
        address: {
          road: place.primary,
          city: place.city ?? "",
          state: place.state ?? "",
          country: "Venezuela",
        },
      }))
    );
    setLoading(false);
  }, []);

  return { results, loading, error, search };
}
