package database

import (
	"database/sql"

	_ "github.com/mattn/go-sqlite3"
)

func Open() {
	_, err := sql.Open("sqlite3", "dataSQLite/foo.db")
	checkErr(err)
}

func checkErr(err error) {
	if err != nil {
		panic(err)
	}
}
