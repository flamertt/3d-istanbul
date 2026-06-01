package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strconv"
)

type busRawFeature struct {
	Type       string                 `json:"type"`
	Geometry   json.RawMessage        `json:"geometry"`
	Properties map[string]interface{} `json:"properties"`
}

type busOutProps struct {
	HatKodu    string `json:"HAT_KODU"`
	HatAdi     string `json:"HAT_ADI"`
	GuzergahNo int    `json:"guzergahNo"` // bu hat kaç güzergaha sahip
}

type busOutFeature struct {
	Type       string      `json:"type"`
	Geometry   json.RawMessage `json:"geometry"`
	Properties busOutProps `json:"properties"`
}

func str(v interface{}) string {
	if v == nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

func runBusRoutesFreq(_ []string) error {
	inPath := filepath.Join(dataDir(), "turkey_overlays", "bus_routes.geojson")
	outPath := filepath.Join(dataDir(), "turkey_overlays", "bus_routes_freq.geojson")

	data, err := os.ReadFile(inPath)
	if err != nil {
		return fmt.Errorf("bus_routes.geojson okunamadı: %w", err)
	}

	var fc struct {
		Type     string          `json:"type"`
		Features []busRawFeature `json:"features"`
	}
	if err := json.Unmarshal(data, &fc); err != nil {
		return err
	}
	fmt.Printf("Yüklendi: %d feature\n", len(fc.Features))

	type hatEntry struct {
		hatAdi   string
		gidis    *busRawFeature
		donus    *busRawFeature
		count    int // toplam güzergah sayısı
	}
	hatlar := map[string]*hatEntry{}

	for i := range fc.Features {
		f := &fc.Features[i]
		hatKodu := str(f.Properties["HAT_KODU"])
		hatAdi := str(f.Properties["HAT_ADI"])
		yon := str(f.Properties["YON"])

		entry, ok := hatlar[hatKodu]
		if !ok {
			entry = &hatEntry{hatAdi: hatAdi}
			hatlar[hatKodu] = entry
		}
		entry.count++

		// GİDİŞ varsa onu tercih et, yoksa DÖNÜŞ al
		if yon == "GİDİŞ" && entry.gidis == nil {
			entry.gidis = f
		} else if yon == "DÖNÜŞ" && entry.donus == nil {
			entry.donus = f
		}
	}

	fmt.Printf("Benzersiz hat: %d\n", len(hatlar))

	// Hat başına ortalama güzergah sayısı dağılımı
	guzCounts := map[int]int{}
	for _, e := range hatlar {
		guzCounts[e.count]++
	}
	keys := []int{}
	for k := range guzCounts {
		keys = append(keys, k)
	}
	sort.Ints(keys)
	for _, k := range keys {
		fmt.Printf("  %d güzergahlı hat: %d\n", k, guzCounts[k])
	}

	// Output: her hat için en uzun güzergahı seç
	outFeatures := make([]busOutFeature, 0, len(hatlar))
	hatKoduList := make([]string, 0, len(hatlar))
	for k := range hatlar {
		hatKoduList = append(hatKoduList, k)
	}
	sort.Strings(hatKoduList)

	for _, hatKodu := range hatKoduList {
		entry := hatlar[hatKodu]

		// GİDİŞ tercih et, yoksa DÖNÜŞ al
		src := entry.gidis
		if src == nil {
			src = entry.donus
		}
		if src == nil {
			continue
		}

		// En uzun güzergahı bul (bu hattaki tüm GİDİŞ varyantları arasında)
		longestSrc := src
		longestLen := geometryLength(src.Geometry)
		for i := range fc.Features {
			f := &fc.Features[i]
			if str(f.Properties["HAT_KODU"]) != hatKodu {
				continue
			}
			if str(f.Properties["YON"]) != "GİDİŞ" {
				continue
			}
			if l := geometryLength(f.Geometry); l > longestLen {
				longestLen = l
				longestSrc = f
			}
		}

		outFeatures = append(outFeatures, busOutFeature{
			Type:     "Feature",
			Geometry: longestSrc.Geometry,
			Properties: busOutProps{
				HatKodu:    hatKodu,
				HatAdi:     entry.hatAdi,
				GuzergahNo: entry.count,
			},
		})
	}

	// Geometrileri basitleştir (koordinat sayısını azalt)
	simplifiedFeatures := make([]map[string]interface{}, 0, len(outFeatures))
	for _, f := range outFeatures {
		simplified := simplifyBusGeometry(f.Geometry, 0.00005) // ~5m tolerans
		simplifiedFeatures = append(simplifiedFeatures, map[string]interface{}{
			"type":       "Feature",
			"geometry":   simplified,
			"properties": f.Properties,
		})
	}

	output := map[string]interface{}{
		"type":     "FeatureCollection",
		"features": simplifiedFeatures,
	}

	outData, err := json.Marshal(output)
	if err != nil {
		return err
	}
	if err := os.WriteFile(outPath, outData, 0644); err != nil {
		return err
	}

	fmt.Printf("\nYazıldı: %s (%.1f MB, %d hat)\n",
		outPath, float64(len(outData))/(1024*1024), len(outFeatures))
	return nil
}

func simplifyBusGeometry(raw json.RawMessage, tolerance float64) interface{} {
	var geom struct {
		Type        string      `json:"type"`
		Coordinates interface{} `json:"coordinates"`
	}
	if err := json.Unmarshal(raw, &geom); err != nil {
		return json.RawMessage(raw)
	}
	switch geom.Type {
	case "LineString":
		coords := extractRawCoords("LineString", geom.Coordinates)
		simplified := douglasPeucker(coords, tolerance)
		return map[string]interface{}{"type": "LineString", "coordinates": simplified}
	case "MultiLineString":
		lines, ok := geom.Coordinates.([]interface{})
		if !ok {
			return json.RawMessage(raw)
		}
		newLines := make([][][2]float64, 0, len(lines))
		for _, line := range lines {
			if pts, ok2 := line.([]interface{}); ok2 {
				coords := parseRawCoordArray(pts)
				newLines = append(newLines, douglasPeucker(coords, tolerance))
			}
		}
		return map[string]interface{}{"type": "MultiLineString", "coordinates": newLines}
	}
	return json.RawMessage(raw)
}

func geometryLength(raw json.RawMessage) float64 {
	var geom struct {
		Type        string      `json:"type"`
		Coordinates interface{} `json:"coordinates"`
	}
	if err := json.Unmarshal(raw, &geom); err != nil {
		return 0
	}

	coords := extractRawCoords(geom.Type, geom.Coordinates)
	total := 0.0
	for i := 1; i < len(coords); i++ {
		dx := coords[i][0] - coords[i-1][0]
		dy := coords[i][1] - coords[i-1][1]
		total += math.Sqrt(dx*dx + dy*dy)
	}
	return total
}

func extractRawCoords(gtype string, raw interface{}) [][2]float64 {
	switch gtype {
	case "LineString":
		arr, ok := raw.([]interface{})
		if !ok {
			return nil
		}
		return parseRawCoordArray(arr)
	case "MultiLineString":
		lines, ok := raw.([]interface{})
		if !ok {
			return nil
		}
		var all [][2]float64
		for _, line := range lines {
			if pts, ok2 := line.([]interface{}); ok2 {
				all = append(all, parseRawCoordArray(pts)...)
			}
		}
		return all
	}
	return nil
}

func parseRawCoordArray(raw []interface{}) [][2]float64 {
	coords := make([][2]float64, 0, len(raw))
	for _, item := range raw {
		pt, ok := item.([]interface{})
		if !ok || len(pt) < 2 {
			continue
		}
		coords = append(coords, [2]float64{toRawFloat(pt[0]), toRawFloat(pt[1])})
	}
	return coords
}

func toRawFloat(v interface{}) float64 {
	switch vv := v.(type) {
	case float64:
		return vv
	case string:
		f, _ := strconv.ParseFloat(vv, 64)
		return f
	}
	return 0
}
