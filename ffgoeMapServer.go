package main

import (
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
	fmt.Println(filesCount)
	datafiles := make([]DataFile, filesCount)

	for count, f := range files {
		fmt.Println(count)
		filename := f.Name()
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
	}
	fmt.Println(datafiles)
}

func test(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "test! RequestURI is %q", r.RequestURI)
}

func fastHTTPHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hi there! RequestURI is %q", r.RequestURI)
}
