"use client";

import { useState, useCallback } from "react";

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

    try {
      const params = new URLSearchParams({
        lat: lat.toString(),
        lon: lng.toString(),
        format: "jsonv2",
        addressdetails: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          headers: {
            "User-Agent": "DrivipApp/1.0 (drivip.app)",
          },
        }
      );

      if (!response.ok) throw new Error("Error en reverse geocoding");

      const data = await response.json();
      const addr = data.address || {};

      setResult({
        displayName: data.display_name || "",
        street: addr.road || addr.pedestrian || "",
        city: addr.city || addr.town || addr.village || "",
        state: addr.state || "",
        country: addr.country || "",
      });
    } catch (err) {
      setError("Error al obtener direccion");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, reverse };
}
