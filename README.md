# Istanbul 3D

Istanbul'un gerçek zamanlı 3 boyutlu ulaşım ve kentsel veri haritası. Otobüs, metro, Marmaray, tramvay ve vapurların anlık konumları GTFS verisi üzerinden hesaplanarak 3 boyutlu harita üzerinde gösterilir. ISPARK otopark bilgisi, bisiklet yolları, yeşil alanlar, tarihi yapılar ve daha fazlası katman olarak açılıp kapatılabilir. Adres arama ve Valhalla routing engine ile yol tarifi de desteklenmektedir.

## Teknolojiler

| | |
|---|---|
| Arayüz | React 18, TypeScript |
| Harita | MapLibre GL JS |
| 3D katmanlar | Deck.gl |
| Stil | Tailwind CSS |
| Routing | Valhalla |
| Geocoding | Nominatim (OpenStreetMap) |
| Veri | IBB Açık Veri Portali, Geofabrik OSM |
| Build | Vite, nginx, Docker |

## Kurulum

```bash
npm install
npm run dev
```

Docker ile tam ortam (frontend + Valhalla routing):

```bash
docker compose up -d --build
```

## Canlı

[map.mertpeker.com](https://map.mertpeker.com)
