package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
)

type DataFile struct {
	Timestamp int64
	Name      string
}

func main() {
	//var srv http.Server
	//database.Open()

	checkTimestampFile()

	fsMap := http.FileServer(http.Dir("map"))
	http.Handle("/map/", http.StripPrefix("/map/", fsMap))
	fsData := http.FileServer(http.Dir("data"))
	http.Handle("/data/", http.StripPrefix("/data/", fsData))
	http.HandleFunc("/data/nodes.json", getNodes)
	go http.ListenAndServeTLS(":8081", "localhost.cert", "localhost.key", nil)
	http.ListenAndServe(":8080", nil)
	/*http.HandleFunc("/test/", test)
	http.HandleFunc("/bar/", fastHTTPHandler)*/
	//log.Fatal(srv.ListenAndServeTLS("localhost.cert", "localhost.key"))

}

func checkTimestampFile() {
	dir := "data"
	files, _ := ioutil.ReadDir(dir)
	filesCount := len(files)
	datafiles := make([]DataFile, filesCount)

	count := 0
	for _, f := range files {
		filename := f.Name()
		if filename == "nodes.json" || filename == "timestamps.json" || filename == "graph.json" {
			continue
		}
		fmt.Println(filename)
		filepath := dir + "/" + filename
		fmt.Println(filepath)

		f, err := os.Open(filepath)
		if err != nil {
			fmt.Println("Error while opening the file.")
			return
		}

		defer f.Close()

		// Checking if the opened handle is really a file
		statinfo, err := f.Stat()
		if err != nil {
			fmt.Println("stat() failure.")
			return
		}
		timestamp := statinfo.ModTime().Unix()
		fmt.Println(timestamp)
		datafiles[count] = DataFile{
			Timestamp: timestamp,
			Name:      filename}
		count++
	}
	b, err := json.Marshal(datafiles[0:count])
	if err != nil {
		fmt.Println(err)
		return
	}
	ioutil.WriteFile("data/timestamps.json", b, 0644)

}

func getNodes(w http.ResponseWriter, r *http.Request) {
	// https://cccgoe.de/map2data/nodes.json
	resp, err := http.Get("https://cccgoe.de/map2data/nodes.json")
	if err != nil {
		// handle error
		fmt.Fprintf(w, err.Error())
		return
	}
	defer resp.Body.Close()
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		// handle error
		fmt.Fprintf(w, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprint(w, string(body))

}

func fastHTTPHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hi there! RequestURI is %q", r.RequestURI)
}
