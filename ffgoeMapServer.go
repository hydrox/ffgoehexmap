package main

import (
	"fmt"
	"net/http"

	"github.com/hydrox/ffgoehexmap/database"
)

func main() {
	//var srv http.Server
	database.Open()

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

func test(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "test! RequestURI is %q", r.RequestURI)
}

func fastHTTPHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hi there! RequestURI is %q", r.RequestURI)
}
