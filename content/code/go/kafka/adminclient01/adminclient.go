package main

import (
	"context"
	"fmt"
	"time"

	"gopkg.in/confluentinc/confluent-kafka-go.v1/kafka"
)

func main() {

	// --
	// Create AdminClient instance
	// https://docs.confluent.io/current/clients/confluent-kafka-go/index.html#NewAdminClient

	// Store the config
	cm := kafka.ConfigMap{
		"bootstrap.servers": "localhost:9092"}

	// Variable p holds the new AdminClient instance.
	a, e := kafka.NewAdminClient(&cm)
	// Make sure we close it when we're done
	defer a.Close()

	// Check for errors in creating the AdminClient
	if e != nil {
		if ke, ok := e.(kafka.Error); ok == true {
			switch ec := ke.Code(); ec {
			case kafka.ErrInvalidArg:
				fmt.Printf("😢 Can't create the AdminClient because you've configured it wrong (code: %d)!\n\t%v\n\nTo see the configuration options, refer to https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md", ec, e)
			default:
				fmt.Printf("😢 Can't create the AdminClient (Kafka error code %d)\n\tError: %v\n", ec, e)
			}
		} else {
			// It's not a kafka.Error
			fmt.Printf("😢 Oh noes, there's a generic error creating the AdminClient! %v", e.Error())
		}

	} else {

		fmt.Println("✔️ Created AdminClient")

		// Create a context for use when calling some of these functions
		// This lets you set a variable timeout on invoking these calls
		// If the timeout passes then an error is returned.
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Get the ClusterID
		if c, e := a.ClusterID(ctx); e != nil {
			fmt.Printf("😢 Error getting ClusterID\n\tError: %v\n", e)
		} else {
			fmt.Printf("✔️ ClusterID: %v\n", c)
		}

		// Start the context timer again (otherwise it carries on from the original deadline)
		ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)

		// Get the ControllerID
		if c, e := a.ControllerID(ctx); e != nil {
			fmt.Printf("😢 Error getting ControllerID\n\tError: %v\n", e)
		} else {
			fmt.Printf("✔️ ControllerID: %v\n", c)
		}

		// Get some metadata
		if md, e := a.GetMetadata(nil, false, int(5*time.Second)); e != nil {
			fmt.Printf("😢 Error getting cluster Metadata\n\tError: %v\n", e)
		} else {
			// Print the originating broker info
			fmt.Printf("✔️ Metadata [Originating broker]\n")
			b := md.OriginatingBroker
			fmt.Printf("\t[ID %d] %v\n", b.ID, b.Host)

			// Print the brokers
			fmt.Printf("✔️ Metadata [brokers]\n")
			for _, b := range md.Brokers {
				fmt.Printf("\t[ID %d] %v:%d\n", b.ID, b.Host, b.Port)
			}
			// Print the topics
			fmt.Printf("✔️ Metadata [topics]\n")
			for _, t := range md.Topics {
				fmt.Printf("\t(%v partitions)\t%v\n", len(t.Partitions), t.Topic)
			}
		}
		fmt.Printf("\n\n👋 … and we're done.\n")
	}
}
