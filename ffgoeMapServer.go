package main

import (
	"fmt"
	"log"
	"net/http"

	"golang.org/x/net/http2"
)

func main() {
	var srv http.Server
	http2.VerboseLogs = true
	srv.Addr = ":8081"
	// This enables http2 support
	err := http2.ConfigureServer(&srv, nil)

	if err != nil {
		fmt.Printf("%s", err)
	}

	fs := http.FileServer(http.Dir("map"))
	/*http.HandleFunc("/test/", test)
	http.HandleFunc("/bar/", fastHTTPHandler)*/
	http.Handle("/map/", http.StripPrefix("/map/", fs))

	log.Fatal(srv.ListenAndServeTLS("localhost.cert", "localhost.key"))

}

func test(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "test! RequestURI is %q", r.RequestURI)
}

func fastHTTPHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hi there! RequestURI is %q", r.RequestURI)
}
