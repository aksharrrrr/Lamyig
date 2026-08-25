export interface CuratedPlacePhoto {
  placeId: string
  url: string
  alt: string
  credit: string
  sourceUrl: string
  license: string
  licenseUrl: string
}

const photos: CuratedPlacePhoto[] = [
  {
    placeId: '686f019d-6f74-4a14-b4a0-68be61f5a3ca',
    url: '/place-photos/castle-bijaipur.jpg',
    alt: 'The facade of Castle Bijaipur',
    credit: 'Daniel VILLAFRUELA',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Bijaipur-Castle-03-20131014.jpg',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
  },
  {
    placeId: '0e3097c1-28f1-4181-96f7-f597d8451e76',
    url: '/place-photos/chettinadu-mansion.jpg',
    alt: 'An interior courtyard at Chettinadu Mansion',
    credit: 'Jean-Pierre Dalbera',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chettinadu_Mansion_(Kanadukathan,_Inde)_(14123087643).jpg',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
  },
]

const byPlaceId = new Map(photos.map((photo) => [photo.placeId, photo]))

export function curatedPlacePhoto(placeId: string): CuratedPlacePhoto | undefined {
  return byPlaceId.get(placeId)
}

