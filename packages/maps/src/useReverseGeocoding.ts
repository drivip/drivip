import { useState, useCallback } from "react";
import { isInVenezuela } from "./venezuela";
import { reverseVenezuelaPlace } from "./venezuelaGeocoder";

interface ReverseGeocodingResult {
  displayName: string;
  street: string;
  city: string;
  state: string;
  country: string;
}

export default function useReverseGeocoding() {
  const [result, setResult] = useState<ReverseGeocodingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reverse = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    setError(null);

    if (!isInVenezuela(lat, lng)) {
      setError("Drivip solo está disponible en Venezuela.");
      setResult(null);
      setLoading(false);
      return;
    }

    const place = await reverseVenezuelaPlace(lat, lng);

    if (!place) {
      setError("No pudimos obtener la dirección de ese punto.");
      setResult(null);
      setLoading(false);
      return;
    }

    setResult({
      displayName: place.displayName,
      street: place.primary,
      city: place.city ?? "",
      state: place.state ?? "",
      country: "Venezuela",
    });
    setLoading(false);
  }, []);

  return { result, loading, error, reverse };
}
