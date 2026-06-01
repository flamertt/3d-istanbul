package main

import (
	"archive/zip"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

// ────────────────────────── types ──────────────────────────

type gtfsStop struct {
	Lat  float64
	Lon  float64
	Name string
}

type gtfsRoute struct {
	ShortName string
	Color     [3]uint8
}

type stopTime struct {
	StopID   string
	Seq      int
	ArrSec   int // seconds from midnight
	DepSec   int
}

// Output format – deck.gl TripsLayer compatible
type busTrip struct {
	Route      string      `json:"route"`
	Headsign   string      `json:"headsign"`
	Color      [3]uint8    `json:"color"`
	Path       [][2]float64 `json:"path"`       // [lon, lat]
	Timestamps []int        `json:"timestamps"` // seconds from midnight
}

type routeEntry struct {
	Name  string   `json:"name"`
	Color [3]uint8 `json:"color"`
}

type busSimOutput struct {
	Routes map[string]routeEntry `json:"routes"`
	Trips  []busTrip             `json:"trips"`
}

// ────────────────────────── helpers ──────────────────────────

// Parses IETT's weird coord format: "410.191.700.005.564" → 41.0191700005564
func parseIETTCoord(s string) float64 {
	s = strings.TrimSpace(s)
	clean := strings.ReplaceAll(s, ".", "")
	if len(clean) < 3 {
		return 0
	}
	// Insert decimal after 2nd digit
	withDot := clean[:2] + "." + clean[2:]
	v, err := strconv.ParseFloat(withDot, 64)
	if err != nil {
		return 0
	}
	return v
}

func parseTime(s string) int {
	s = strings.TrimSpace(s)
	parts := strings.Split(s, ":")
	if len(parts) != 3 {
		return -1
	}
	h, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	sec, _ := strconv.Atoi(parts[2])
	return h*3600 + m*60 + sec
}

// Route color palette (by route short name prefix)
var routeColorPalette = [][3]uint8{
	{37, 99, 235},  // blue
	{220, 38, 38},  // red
	{5, 150, 105},  // green
	{217, 119, 6},  // amber
	{124, 58, 237}, // violet
	{219, 39, 119}, // pink
	{14, 165, 233}, // sky
	{234, 88, 12},  // orange
}

func routeColor(shortName string) [3]uint8 {
	h := 0
	for _, c := range shortName {
		h = h*31 + int(c)
	}
	if h < 0 {
		h = -h
	}
	return routeColorPalette[h%len(routeColorPalette)]
}

func round5(f float64) float64 {
	return math.Round(f*1e5) / 1e5
}

// ────────────────────────── main pipeline ──────────────────────────

func runGTFSSim(_ []string) error {
	base := dataDir()
	// dataDir() = pipeline/public/data; gtfs_data is at pipeline/gtfs_data
	pipelineDir := filepath.Join(base, "..", "..")
	gtfsDir := filepath.Join(pipelineDir, "gtfs_data")
	outPath := filepath.Join(base, "bus_sim.json")

	fmt.Println("GTFS Sim: stops yükleniyor…")
	stops, err := loadStops(filepath.Join(gtfsDir, "stops.csv"))
	if err != nil {
		return fmt.Errorf("stops: %w", err)
	}
	fmt.Printf("  %d durak\n", len(stops))

	fmt.Println("GTFS Sim: routes yükleniyor…")
	routes, err := loadRoutes(filepath.Join(gtfsDir, "routes.csv"))
	if err != nil {
		return fmt.Errorf("routes: %w", err)
	}
	fmt.Printf("  %d hat\n", len(routes))

	fmt.Println("GTFS Sim: trips yükleniyor (sadece hafta içi)…")
	trips, err := loadTrips(filepath.Join(gtfsDir, "trips.csv"))
	if err != nil {
		return fmt.Errorf("trips: %w", err)
	}
	fmt.Printf("  %d sefer\n", len(trips))

	fmt.Println("GTFS Sim: stop_times işleniyor…")
	zipPath := filepath.Join(pipelineDir, "gtfs_stop_times.zip")
	stopTimes, err := loadStopTimes(zipPath, trips)
	if err != nil {
		return fmt.Errorf("stop_times: %w", err)
	}
	fmt.Printf("  %d sefer için durak zamanları\n", len(stopTimes))

	fmt.Println("GTFS Sim: animasyon verisi oluşturuluyor…")
	output := buildOutput(trips, stopTimes, stops, routes)
	fmt.Printf("  %d sefer çıktıya alındı\n", len(output.Trips))

	data, err := json.Marshal(output)
	if err != nil {
		return err
	}
	if err := os.WriteFile(outPath, data, 0644); err != nil {
		return err
	}
	fmt.Printf("Yazıldı: %s (%.1f MB)\n", outPath, float64(len(data))/1e6)
	return nil
}

// ────────────────────────── loaders ──────────────────────────

func loadStops(path string) (map[string]gtfsStop, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.Comma = ';'
	r.LazyQuotes = true
	headers, err := r.Read()
	if err != nil {
		return nil, err
	}
	idx := headerIndex(headers)

	stops := make(map[string]gtfsStop)
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(row) <= idx["stop_lon"] {
			continue
		}
		lat := parseIETTCoord(row[idx["stop_lat"]])
		lon := parseIETTCoord(row[idx["stop_lon"]])
		if lat == 0 || lon == 0 {
			continue
		}
		stops[strings.TrimSpace(row[idx["stop_id"]])] = gtfsStop{
			Lat:  round5(lat),
			Lon:  round5(lon),
			Name: row[idx["stop_name"]],
		}
	}
	return stops, nil
}

func loadRoutes(path string) (map[string]gtfsRoute, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.Comma = ';'
	r.LazyQuotes = true
	headers, err := r.Read()
	if err != nil {
		return nil, err
	}
	idx := headerIndex(headers)

	routes := make(map[string]gtfsRoute)
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(row) <= idx["route_short_name"] {
			continue
		}
		id := strings.TrimSpace(row[idx["route_id"]])
		name := strings.TrimSpace(row[idx["route_short_name"]])
		routes[id] = gtfsRoute{
			ShortName: name,
			Color:     routeColor(name),
		}
	}
	return routes, nil
}

// tripInfo holds minimal info per trip (weekday only)
type tripInfo struct {
	RouteID  string
	Headsign string
}

func loadTrips(path string) (map[string]tripInfo, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	r := csv.NewReader(f)
	r.Comma = ';'
	r.LazyQuotes = true
	headers, err := r.Read()
	if err != nil {
		return nil, err
	}
	idx := headerIndex(headers)

	trips := make(map[string]tripInfo)
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(row) <= idx["service_id"] {
			continue
		}
		// Only weekday service (service_id = "0")
		if strings.TrimSpace(row[idx["service_id"]]) != "0" {
			continue
		}
		id := strings.TrimSpace(row[idx["trip_id"]])
		trips[id] = tripInfo{
			RouteID:  strings.TrimSpace(row[idx["route_id"]]),
			Headsign: strings.TrimSpace(row[idx["trip_headsign"]]),
		}
	}
	return trips, nil
}

func loadStopTimes(zipPath string, trips map[string]tripInfo) (map[string][]stopTime, error) {
	zr, err := zip.OpenReader(zipPath)
	if err != nil {
		return nil, err
	}
	defer zr.Close()

	var txtFile *zip.File
	for _, f := range zr.File {
		if strings.HasSuffix(f.Name, "stop_times.txt") {
			txtFile = f
			break
		}
	}
	if txtFile == nil {
		return nil, fmt.Errorf("stop_times.txt not found in zip")
	}

	rc, err := txtFile.Open()
	if err != nil {
		return nil, err
	}
	defer rc.Close()

	r := csv.NewReader(rc)
	r.LazyQuotes = true
	headers, err := r.Read()
	if err != nil {
		return nil, err
	}
	idx := headerIndex(headers)

	result := make(map[string][]stopTime)
	for {
		row, err := r.Read()
		if err == io.EOF {
			break
		}
		if err != nil || len(row) <= idx["departure_time"] {
			continue
		}
		tripID := strings.TrimSpace(row[idx["trip_id"]])
		if _, ok := trips[tripID]; !ok {
			continue // skip non-weekday trips
		}
		seq, _ := strconv.Atoi(strings.TrimSpace(row[idx["stop_sequence"]]))
		arr := parseTime(row[idx["arrival_time"]])
		dep := parseTime(row[idx["departure_time"]])
		// Boş zamanlı durağı -1 ile işaretle, sonra interpolate edilecek
		if arr < 0 {
			arr = -1
		}
		if dep < 0 {
			dep = -1
		}
		result[tripID] = append(result[tripID], stopTime{
			StopID: strings.TrimSpace(row[idx["stop_id"]]),
			Seq:    seq,
			ArrSec: arr,
			DepSec: dep,
		})
	}

	// Sort each trip's stops by sequence
	for id := range result {
		st := result[id]
		sort.Slice(st, func(i, j int) bool { return st[i].Seq < st[j].Seq })
		result[id] = st
	}
	return result, nil
}

// interpolateTimes fills in -1 timestamps by linear interpolation between known anchors.
func interpolateTimes(sts []stopTime) []stopTime {
	n := len(sts)
	if n == 0 {
		return sts
	}
	out := make([]stopTime, n)
	copy(out, sts)

	// Forward pass: find anchor pairs and interpolate between them
	i := 0
	for i < n {
		if out[i].DepSec >= 0 {
			// Find next anchor
			j := i + 1
			for j < n && out[j].DepSec < 0 {
				j++
			}
			if j < n && out[j].DepSec >= 0 && j > i+1 {
				// Interpolate i..j
				t0, t1 := out[i].DepSec, out[j].DepSec
				steps := j - i
				for k := i + 1; k < j; k++ {
					frac := float64(k-i) / float64(steps)
					out[k].DepSec = t0 + int(frac*float64(t1-t0))
					out[k].ArrSec = out[k].DepSec
				}
			}
			i = j
		} else {
			i++
		}
	}
	return out
}

// ────────────────────────── output builder ──────────────────────────

func buildOutput(trips map[string]tripInfo, stopTimes map[string][]stopTime, stops map[string]gtfsStop, routes map[string]gtfsRoute) busSimOutput {
	out := busSimOutput{
		Routes: make(map[string]routeEntry),
	}

	for routeID, rt := range routes {
		out.Routes[routeID] = routeEntry{Name: rt.ShortName, Color: rt.Color}
	}

	// 1. Tüm trip'leri önce işle, başlangıç zamanıyla birlikte topla
	type candidateTrip struct {
		info      tripInfo
		path      [][2]float64
		timestamps []int
	}
	var candidates []candidateTrip

	for tripID, info := range trips {
		sts, ok := stopTimes[tripID]
		if !ok || len(sts) < 2 {
			continue
		}
		sts = interpolateTimes(sts)

		var path [][2]float64
		var timestamps []int
		for _, st := range sts {
			if st.DepSec < 0 {
				continue
			}
			s, ok := stops[st.StopID]
			if !ok {
				continue
			}
			path = append(path, [2]float64{s.Lon, s.Lat})
			timestamps = append(timestamps, st.DepSec)
		}
		if len(path) < 2 {
			continue
		}
		// Path'i seyrekleştir: max 12 nokta (başlangıç + 10 ara + bitiş)
		if len(path) > 12 {
			path, timestamps = downsample(path, timestamps, 12)
		}
		candidates = append(candidates, candidateTrip{info, path, timestamps})
	}

	// 2. Başlangıç zamanına göre sırala
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].timestamps[0] < candidates[j].timestamps[0]
	})

	// 3. Headway filtresi: aynı rota+yön için min 3 dakika arayla sefer
	routeLastStart := make(map[string]int)
	const minHeadwaySec = 600 // 10 dakika

	for _, c := range candidates {
		routeKey := c.info.RouteID + "|" + c.info.Headsign
		startTime := c.timestamps[0]
		if last, exists := routeLastStart[routeKey]; exists {
			if startTime-last < minHeadwaySec {
				continue
			}
		}
		routeLastStart[routeKey] = startTime

		rt := routes[c.info.RouteID]
		out.Trips = append(out.Trips, busTrip{
			Route:      rt.ShortName,
			Headsign:   c.info.Headsign,
			Color:      rt.Color,
			Path:       c.path,
			Timestamps: c.timestamps,
		})
	}
	return out
}

// downsample reduces path/timestamps to at most maxPts points (keeping first and last).
func downsample(path [][2]float64, timestamps []int, maxPts int) ([][2]float64, []int) {
	n := len(path)
	if n <= maxPts {
		return path, timestamps
	}
	newPath := make([][2]float64, maxPts)
	newTs := make([]int, maxPts)
	newPath[0] = path[0]
	newTs[0] = timestamps[0]
	newPath[maxPts-1] = path[n-1]
	newTs[maxPts-1] = timestamps[n-1]
	for i := 1; i < maxPts-1; i++ {
		srcIdx := 1 + (i-1)*(n-2)/(maxPts-2)
		newPath[i] = path[srcIdx]
		newTs[i] = timestamps[srcIdx]
	}
	return newPath, newTs
}

// ────────────────────────── util ──────────────────────────

func headerIndex(headers []string) map[string]int {
	m := make(map[string]int, len(headers))
	for i, h := range headers {
			// Strip BOM (\xef\xbb\xbf) and whitespace
		h = strings.TrimSpace(strings.TrimPrefix(h, "\xef\xbb\xbf"))
		m[h] = i
	}
	return m
}
