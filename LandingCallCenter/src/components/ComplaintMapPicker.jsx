import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Loader2, Compass } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Directiva 1: Corregir iconos por defecto de Leaflet para Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Coordenadas base Cochabamba, Bolivia
const COCHABAMBA_CENTER = [-17.3895, -66.1568];
const COCHABAMBA_BOUNDS = [
  [-17.55, -66.28],
  [-17.30, -66.02],
];

const COCHA_EXACTA_URL = 'http://localhost:5011/api/district';

// Subcomponente para capturar clics en el mapa
function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Subcomponente para desplazar suavemente la cámara cuando cambian coordenadas externas
function FlyToLocation({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null) {
      map.flyTo([lat, lng], 17, { duration: 1 });
    }
  }, [lat, lng, map]);
  return null;
}

export function ComplaintMapPicker({
  lat,
  lng,
  onLocationSelect,
  address,
  onAddressChange,
  district,
  onDistrictChange,
}) {
  const [searchQuery, setSearchQuery] = useState(address || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const searchTimeoutRef = useRef(null);
  const markerRef = useRef(null);

  // Sincronizar searchQuery con address prop externa
  useEffect(() => {
    if (address && address !== searchQuery) {
      setSearchQuery(address);
    }
  }, [address]);

  // Directiva 3: Geocodificación inversa con CochaExacta (:5011) + Timeout y Fallback a Nominatim
  const reverseGeocode = useCallback(
    async (selectedLat, selectedLng) => {
      setIsGeocoding(true);

      let foundDistrict = '';
      let foundAddress = '';

      // 1. Intentar consultar CochaExacta con timeout corto (2.5s)
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const resCocha = await fetch(
          `${COCHA_EXACTA_URL}?lat=${selectedLat}&lng=${selectedLng}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (resCocha.ok) {
          const dataCocha = await resCocha.json();
          if (dataCocha?.distrito) {
            // Asegura formato ej: "Distrito 3" o "D3" -> "D3" / "Distrito 3"
            const numMatch = String(dataCocha.distrito).match(/\d+/);
            if (numMatch) {
              foundDistrict = `D${numMatch[0]}`;
            } else {
              foundDistrict = dataCocha.distrito;
            }
          }
        }
      } catch (err) {
        console.warn('[ComplaintMapPicker] CochaExacta no respondió (timeout/offline). Usando fallback.', err?.message);
      }

      // 2. Geocodificación Inversa con OpenStreetMap Nominatim
      try {
        const controllerOsm = new AbortController();
        const timeoutOsm = setTimeout(() => controllerOsm.abort(), 4000);

        const resOsm = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLat}&lon=${selectedLng}&zoom=18&addressdetails=1`,
          { signal: controllerOsm.signal }
        );
        clearTimeout(timeoutOsm);

        if (resOsm.ok) {
          const dataOsm = await resOsm.json();
          const addr = dataOsm.address || {};

          // Construir dirección amigable
          const street = addr.road || addr.pedestrian || addr.footway || addr.path || '';
          const suburb = addr.suburb || addr.neighbourhood || addr.residential || '';
          const cityDist = addr.city_district || addr.district || '';

          if (street && suburb) {
            foundAddress = `${street}, ${suburb}`;
          } else if (street) {
            foundAddress = street;
          } else if (dataOsm.display_name) {
            foundAddress = dataOsm.display_name.split(',').slice(0, 3).join(', ');
          }

          // Fallback de distrito desde Nominatim si CochaExacta falló
          if (!foundDistrict && cityDist) {
            const numMatch = cityDist.match(/\d+/);
            if (numMatch) {
              foundDistrict = `D${numMatch[0]}`;
            }
          }
        }
      } catch (err) {
        console.warn('[ComplaintMapPicker] Fallback Nominatim error:', err?.message);
      }

      // 3. Fallback a distrito por defecto si nada devolvió distrito
      if (!foundDistrict) {
        foundDistrict = district || 'D1';
      }

      // Actualizar estados
      if (foundAddress) {
        onAddressChange(foundAddress);
        setSearchQuery(foundAddress);
      }
      if (foundDistrict) {
        onDistrictChange(foundDistrict);
      }

      setIsGeocoding(false);
    },
    [district, onAddressChange, onDistrictChange]
  );

  // Manejar selección de punto en el mapa (clic o arrastre)
  const handlePickLocation = useCallback(
    (pickedLat, pickedLng) => {
      onLocationSelect(pickedLat, pickedLng);
      reverseGeocode(pickedLat, pickedLng);
    },
    [onLocationSelect, reverseGeocode]
  );

  // Drag end del marcador
  const handleMarkerDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker != null) {
      const { lat: mLat, lng: mLng } = marker.getLatLng();
      handlePickLocation(mLat, mLng);
    }
  }, [handlePickLocation]);

  // Geocodificación Directa con Búsqueda (Debounce)
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    onAddressChange(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (value.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryWithCity = value.toLowerCase().includes('cochabamba')
          ? value
          : `${value}, Cochabamba, Bolivia`;

        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryWithCity)}&limit=5&viewbox=-66.28,-17.55,-66.02,-17.30&bounded=1`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.warn('[ComplaintMapPicker] Error en búsqueda de dirección:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 450);
  };

  // Seleccionar resultado de búsqueda
  const handleSelectSearchResult = (result) => {
    const resLat = parseFloat(result.lat);
    const resLng = parseFloat(result.lon);
    const cleanAddress = result.display_name.split(',').slice(0, 3).join(', ');

    setSearchResults([]);
    setSearchQuery(cleanAddress);
    onAddressChange(cleanAddress);
    handlePickLocation(resLat, resLng);
  };

  const centerCoords = lat && lng ? [lat, lng] : COCHABAMBA_CENTER;

  return (
    <div className="space-y-3">
      {/* Barra de Búsqueda Geográfica */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71717a]">
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#7C3AED]" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchInputChange}
          placeholder="Escribe la dirección o busca una calle en Cochabamba..."
          className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#18181b] border border-white/[0.08] text-white placeholder-[#52525b] text-sm focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] transition-all"
        />
        {isGeocoding && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs text-[#38bdf8] font-medium gap-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Geocodificando...</span>
          </div>
        )}

        {/* Menú Desplegable de Resultados de Búsqueda */}
        {searchResults.length > 0 && (
          <div className="absolute z-[1000] mt-1 w-full rounded-xl bg-[#18181b] border border-white/[0.12] shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
            {searchResults.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelectSearchResult(item)}
                className="w-full px-4 py-2.5 text-left text-xs text-white hover:bg-[#7C3AED15] flex items-start gap-2.5 border-b border-white/[0.05] last:border-0 transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
                <span className="line-clamp-2 leading-relaxed">{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenedor del Mapa Leaflet */}
      <div className="relative rounded-2xl border border-white/[0.1] overflow-hidden h-72 w-full bg-[#09090b]">
        <MapContainer
          center={centerCoords}
          zoom={14}
          minZoom={12}
          maxZoom={18}
          maxBounds={COCHABAMBA_BOUNDS}
          maxBoundsViscosity={0.9}
          className="h-full w-full z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={handlePickLocation} />
          <FlyToLocation lat={lat} lng={lng} />
          {lat != null && lng != null && (
            <Marker
              position={[lat, lng]}
              draggable
              eventHandlers={{ dragend: handleMarkerDragEnd }}
              ref={markerRef}
            />
          )}
        </MapContainer>

        {/* Indicador sobre el mapa */}
        <div className="absolute top-3 right-3 z-[400] bg-[#121215]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/[0.1] text-[11px] text-white/90 flex items-center gap-1.5 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-[#A78BFA]" />
          <span>Haz clic o arrastra el marcador para fijar la ubicación</span>
        </div>

        {lat == null && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[400] bg-amber-500/90 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg pointer-events-none">
            📍 Haz clic en el mapa para marcar el punto exacto
          </div>
        )}
      </div>

      {/* Coordenadas marcadas */}
      {lat && lng && (
        <div className="flex items-center justify-between text-xs text-[#a1a1aa] px-1">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <MapPin className="w-3.5 h-3.5" /> Ubicación seleccionada
          </span>
          <span className="font-mono text-[11px] text-[#71717a]">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </div>
      )}
    </div>
  );
}
