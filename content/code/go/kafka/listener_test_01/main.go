package main

import (
	"fmt"
	"os"
)

func main() {

	// Read the first commandline argument to get the broker details
	var broker string
	if len(os.Args) == 2 {
		broker = os.Args[1]
	} else {
		fmt.Printf("ℹ️ No broker specified on commandline; defaulting to localhost:9092\n\n")
		broker = "localhost:9092"
	}
	fmt.Printf("Broker: %v\n", broker)

	// Set the topic name that we'll use
	topic := "rmoff_test_00"

	// Create Admin Connection
	// doAdmin(broker)
	// Produce message
	if e := doProduce(broker, topic); e != nil {
		fmt.Printf("\nThere was a problem calling the producer :-(\n%v", e)
	} else {
		fmt.Println("Oh joy! Oh rejoice! Calling the producer worked *just fine*.")
	}
	// Consume message
	// doConsume()
	// fin.

}
