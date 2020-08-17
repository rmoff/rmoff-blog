// @rmoff
//
package main

import (
	"fmt"
	"log"
	"time"

	"github.com/rmoff/ksqldb-go"
)

const ksqlDBServer string = "http://localhost:8088"

func main() {

	// Do a pull query
	if e := getDogStats("medium"); e != nil {
		log.Printf("error calling getDogStats:\n%v", e)
	}

	// Do a push query (this will continue to run until you kill the program)
	if e := getDogUpdates(); e != nil {
		log.Printf("error calling getDogUpdates:\n%v", e)
	}

}

func getDogUpdates() (err error) {

	rc := make(chan ksqldb.KsqlDBMessageRow)
	k := "SELECT ROWTIME, ID, NAME, DOGSIZE, AGE FROM DOGS EMIT CHANGES;"
	var DATA_TS float64
	var ID string
	var NAME string
	var DOG_SIZE string
	var AGE string

	go func() {
		for row := range rc {
			if r := row.Row.Columns; r != nil {

				DATA_TS = r[0].(float64)
				ID = r[1].(string)
				NAME = r[2].(string)
				DOG_SIZE = r[3].(string)
				AGE = r[4].(string)

				// Handle the timestamp
				t := int64(DATA_TS)
				ts := time.Unix(t/1000, 0).Format(time.RFC822)

				log.Printf("🐾New dog logged at %v: %v is %v and %v (id %v)", ts, NAME, DOG_SIZE, AGE, ID)
			}
		}

	}()
	e := ksqldb.Push(ksqlDBServer, k, rc)

	if e != nil {
		// handle the error better here, e.g. check for no rows returned
		return fmt.Errorf("Error running Push request against ksqlDB:\n%v", e)
	}

	return nil
}

func getDogStats(s string) (e error) {

	k := "SELECT TIMESTAMPTOSTRING(WINDOWSTART,'yyyy-MM-dd HH:mm:ss','Europe/London') AS WINDOW_START, TIMESTAMPTOSTRING(WINDOWEND,'HH:mm:ss','Europe/London') AS WINDOW_END, DOG_SIZE, DOGS_CT FROM DOGS_BY_SIZE WHERE DOG_SIZE='" + s + "';"
	m, e := ksqldb.Pull(ksqlDBServer, k)

	if e != nil {
		// handle the error better here, e.g. check for no rows returned
		return fmt.Errorf("Error running Pull request against ksqlDB:\n%v", e)
	}

	var WINDOW_START string
	var WINDOW_END string
	var DOG_SIZE string
	var DOGS_CT float64
	for _, msg := range m {
		if r := msg.Row.Columns; r != nil {

			WINDOW_START = r[0].(string)
			WINDOW_END = r[1].(string)
			DOG_SIZE = r[2].(string)
			DOGS_CT = r[3].(float64)
			log.Printf("🐶 There are %v dogs size %v between %v and %v ", DOGS_CT, DOG_SIZE, WINDOW_START, WINDOW_END)
		}
	}
	return nil
}
