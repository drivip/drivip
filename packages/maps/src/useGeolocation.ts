import { useState, useEffect, useCallback, useRef } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  isTracking: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export default function useGeolocation() {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    altitude: null,
    heading: null,
    speed: null,
    isTracking: false,
    error: null,
    lastUpdated: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setLocation({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      isTracking: true,
      error: null,
      lastUpdated: new Date(),
    });
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    let errorMsg = "Error desconocido de ubicacion";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMsg = "Permiso de ubicacion denegado";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMsg = "Ubicacion no disponible";
        break;
      case error.TIMEOUT:
        errorMsg = "Tiempo de espera agotado";
        break;
    }
    setLocation((prev) => ({
      ...prev,
      isTracking: false,
      error: errorMsg,
    }));
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation((prev) => ({
        ...prev,
        error: "Geolocalizacion no soportada por el navegador",
      }));
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      options
    );

    setLocation((prev) => ({ ...prev, isTracking: true, error: null }));
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocation((prev) => ({ ...prev, isTracking: false }));
  }, []);

  const getCurrentPosition = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    ...location,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
}
