export interface ImagenComprimida {
  blob: Blob;
  width: number;
  height: number;
  mime: string;
  originalBytes: number;
}

interface OpcionesCompresion {
  maxDimension?: number;
  maxBytes?: number;
}

type FuenteImagen = ImageBitmap | HTMLImageElement;

async function cargarImagen(file: File): Promise<FuenteImagen> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // Algunos navegadores no soportan la opcion; se usa el fallback.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("No se pudo leer la imagen."));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasABlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen."))),
      type,
      quality
    );
  });
}

/**
 * Redimensiona y comprime una imagen en el navegador.
 * Intenta exportar en WebP; si el navegador no puede codificarlo,
 * usa JPEG como respaldo.
 */
export async function comprimirImagenWebp(
  file: File,
  opciones: OpcionesCompresion = {}
): Promise<ImagenComprimida> {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo seleccionado no es una imagen.");
  }

  const maxDimension = opciones.maxDimension ?? 640;
  const maxBytes = opciones.maxBytes ?? 220 * 1024;
  const fuente = await cargarImagen(file);
  const anchoOriginal = fuente.width;
  const altoOriginal = fuente.height;

  if (!anchoOriginal || !altoOriginal) {
    throw new Error("La imagen no tiene dimensiones validas.");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Este navegador no puede procesar imagenes.");

  const soportaWebp = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  const mime = soportaWebp ? "image/webp" : "image/jpeg";

  let escala = Math.min(1, maxDimension / Math.max(anchoOriginal, altoOriginal));
  let calidad = 0.82;
  let blob: Blob | null = null;
  let ancho = anchoOriginal;
  let alto = altoOriginal;

  for (let intento = 0; intento < 8; intento += 1) {
    ancho = Math.max(1, Math.round(anchoOriginal * escala));
    alto = Math.max(1, Math.round(altoOriginal * escala));
    canvas.width = ancho;
    canvas.height = alto;

    ctx.clearRect(0, 0, ancho, alto);
    if (!soportaWebp) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, ancho, alto);
    }
    ctx.drawImage(fuente, 0, 0, ancho, alto);

    blob = await canvasABlob(canvas, mime, calidad);

    if (blob.size <= maxBytes) break;
    if (calidad > 0.5) {
      calidad = Math.max(0.5, calidad - 0.12);
    } else if (escala > 0.3) {
      escala *= 0.82;
      calidad = 0.68;
    } else {
      break;
    }
  }

  if ("close" in fuente && typeof fuente.close === "function") {
    fuente.close();
  }

  if (!blob) throw new Error("No se pudo comprimir la imagen.");

  return {
    blob,
    width: ancho,
    height: alto,
    mime: blob.type || mime,
    originalBytes: file.size,
  };
}
