import type { FeatureCollection, Point } from 'geojson'

export interface TravellerPeakProperties {
  name: string
  elevation?: number
  priority: number
  osmId: number
}

// A deliberately small region-view index of notable peaks from OpenStreetMap.
// General-purpose vector tiles drop POIs at low zooms, so these landmarks are
// bundled with the app and stay visible online, after a style switch, and in a
// downloaded map. OpenStreetMap remains the source of truth; osmId makes every
// record auditable and refreshable. Less prominent peaks continue to come from
// the basemap when the traveller zooms closer.
export const TRAVELLER_PEAKS: FeatureCollection<Point, TravellerPeakProperties> = {
  type: 'FeatureCollection',
  features: [
    peak(992057105, 'Reo Purgyil', 31.8854712, 78.7412784, 6816, 1),
    peak(5239432090, 'Leo Pargial', 31.9022342, 78.7427484, 6791, 2),
    peak(4556618045, 'Manirang', 31.9536655, 78.3644806, 6593, 2),
    peak(5239099942, 'Parvati Parbat', 32.0905372, 77.7346698, 6632, 2),
    peak(806307629, 'Deo Tibba', 32.195623, 77.3825221, 6001, 2),
    peak(4094234994, 'Indrasan', 32.2137934, 77.396441, 6221, 2),
    peak(3157402860, 'Mulkila', 32.545996, 77.4115377, 6517, 2),
    peak(4772331552, 'Gya', 32.5306879, 78.3951122, 6794, 2),
    peak(6696701661, 'Gonbo Rangjon', 32.9570253, 77.2571642, 5520, 1),
    peak(1659348370, 'Chamser Kangri', 32.9613332, 78.4426315, 6622, 2),
    peak(1659348386, 'Lungser Kangri', 32.9330104, 78.4571556, 6666, 2),
    peak(7061438821, 'Menthosa', 32.9195565, 76.711167, 6416, 2),
    peak(2462905003, 'Chalung', 33.1285977, 78.443518, 6546, 3),
    peak(7061438822, 'Cerro Kishtwar', 33.3488938, 76.5768635, 6155, 2),
    peak(5269521752, 'Hagshu', 33.5449055, 76.4645133, 6515, 2),
    peak(1463864282, 'Doda', 33.6754894, 76.3080079, 6573, 2),
    peak(551425652, 'Kang Yatze I', 33.748507, 77.5568418, 6400, 1),
    peak(493502723, 'Stok Kangri', 33.9862911, 77.4421487, 6140, 1),
    peak(4544767046, 'Nun', 33.9820894, 76.0243674, 7135, 1),
    peak(4544784597, 'Kun', 34.0139272, 76.0566116, 7077, 1),
    peak(7501666211, 'Machu Kangri', 34.02948, 76.7931368, 6086, 3),
    peak(7136065126, 'Tiger Hill, Kargil', 34.4837516, 75.66172, 5062, 1),
    peak(5250415366, 'Saser Kangri II', 34.8044772, 77.8053996, 7513, 2),
    peak(5250415378, 'Saser Kangri III', 34.8448012, 77.7845675, 7495, 3),
    peak(5240975511, 'Mamostong Kangri', 35.1421531, 77.5773882, 7516, 1),
    peak(4770525720, 'K12', 35.2954518, 77.0218678, 7428, 2),
    peak(1975850546, 'Saltoro Kangri', 35.3995612, 76.8473288, 7742, 1),
  ],
}

function peak(osmId: number, name: string, lat: number, lng: number, elevation: number, priority: number) {
  return {
    type: 'Feature' as const,
    geometry: { type: 'Point' as const, coordinates: [lng, lat] },
    properties: { osmId, name, elevation, priority },
  }
}
