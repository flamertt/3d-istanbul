"""
bus_sim.json'daki her rota için stop isimlerini IETT stops.csv'den ekler.
path[i] koordinatı → en yakın IETT durağı → durak adı
Stop isimleri routes map'ine eklenir (her trip'e değil, bant genişliği için).
"""
import csv, json, os, math
from collections import defaultdict

BASE = os.path.dirname(__file__)
BUS_SIM = os.path.join(BASE, '..', 'public', 'data', 'bus_sim.json')
STOPS_CSV = os.path.join(BASE, 'gtfs_data', 'stops.csv')

def parse_iett_coord(s: str) -> float:
    """'410.191.700.005.564' → 41.01917..."""
    s = s.strip()
    clean = s.replace('.', '')
    if len(clean) < 3: return 0.0
    with_dot = clean[:2] + '.' + clean[2:]
    try: return float(with_dot)
    except: return 0.0

print("Reading IETT stops…")
stops = []  # [(lat, lon, name)]
with open(STOPS_CSV, encoding='utf-8-sig', errors='replace') as f:
    reader = csv.DictReader(f, delimiter=';')
    for r in reader:
        lat = parse_iett_coord(r.get('stop_lat', '') or '')
        lon = parse_iett_coord(r.get('stop_lon', '') or '')
        name = (r.get('stop_name') or '').strip()
        if lat and lon and name:
            stops.append((lat, lon, name))
print(f"  {len(stops)} stops loaded")

# Grid-based spatial index (0.001° cells ≈ 100m)
CELL = 0.001
grid: dict[tuple, list] = defaultdict(list)
for lat, lon, name in stops:
    grid[(round(lat / CELL), round(lon / CELL))].append((lat, lon, name))

def nearest_stop(lat: float, lon: float, max_dist_deg: float = 0.005) -> str:
    """En yakın durağı bul (max ~500m)."""
    cx, cy = round(lat / CELL), round(lon / CELL)
    best_d, best_name = float('inf'), ''
    for dx in range(-5, 6):
        for dy in range(-5, 6):
            for slat, slon, sname in grid.get((cx + dx, cy + dy), []):
                d = math.hypot(slat - lat, slon - lon)
                if d < best_d:
                    best_d, best_name = d, sname
    return best_name if best_d < max_dist_deg else ''

print("Reading bus_sim.json…")
with open(BUS_SIM, encoding='utf-8') as f:
    data = json.load(f)

print("Matching stops to routes…")
trips = data['trips']

# Her unique route short-name için ilk trip'i bul
route_trip: dict[str, dict] = {}
for t in trips:
    rk = t.get('route', '')
    if rk and rk not in route_trip:
        route_trip[rk] = t

# Ayrı bir stopsByRoute dict: route_short_name → [{name, elapsed_secs}, ...]
stops_by_route: dict[str, list] = {}
added = 0
for rk, trip in route_trip.items():
    path = trip.get('path', [])
    ts = trip.get('timestamps', [])
    if len(path) < 2: continue
    stop_list = []
    for i, (lon, lat) in enumerate(path):
        name = nearest_stop(lat, lon)
        elapsed = int(ts[i] - ts[0]) if ts and i < len(ts) else i * 60
        stop_list.append({'name': name, 'elapsed_secs': elapsed})
    stops_by_route[rk] = stop_list
    added += 1

data['stopsByRoute'] = stops_by_route
print(f"  Built stopsByRoute for {added} unique routes")

with open(BUS_SIM, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False)
print(f"  Written: {BUS_SIM}  ({os.path.getsize(BUS_SIM)//1024} KB)")
print("Done!")
