package main

import (
	"fmt"

	"gopkg.in/confluentinc/confluent-kafka-go.v1/kafka"
)

func main() {

	topic := "ratings"

	// --
	// Create Consumer instance
	// https://docs.confluent.io/current/clients/confluent-kafka-go/index.html#NewConsumer

	// Store the config
	cm := kafka.ConfigMap{
		"bootstrap.servers":        "localhost:9092",
		"go.events.channel.enable": true,
		"group.id":                 "rmoff_learning_go",
		"enable.partition.eof":     true}

	// Variable p holds the new Consumer instance.
	c, e := kafka.NewConsumer(&cm)

	// Check for errors in creating the Consumer
	if e != nil {
		if ke, ok := e.(kafka.Error); ok == true {
			switch ec := ke.Code(); ec {
			case kafka.ErrInvalidArg:
				fmt.Printf("😢 Can't create the Consumer because you've configured it wrong (code: %d)!\n\t%v\n\nTo see the configuration options, refer to https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md", ec, e)
			default:
				fmt.Printf("😢 Can't create the Consumer (Kafka error code %d)\n\tError: %v\n", ec, e)
			}
		} else {
			// It's not a kafka.Error
			fmt.Printf("😢 Oh noes, there's a generic error creating the Consumer! %v", e.Error())
		}

	} else {

		// For signalling termination from main to go-routine
		termChan := make(chan bool, 1)
		// For signalling that termination is done from go-routine to main
		doneChan := make(chan bool)

		// Subscribe to the topic
		if e := c.Subscribe(topic, nil); e != nil {
			fmt.Printf("☠️ Uh oh, there was an error subscribing to the topic :\n\t%v\n", e)
			termChan <- true
		}

		// Handle the events that we get
		go func() {
			doTerm := false
			for !doTerm {
				// The `select` blocks until one of the `case` conditions
				// are met - therefore we run it in a Go Routine.
				select {
				case ev := <-c.Events():
					// Look at the type of Event we've received
					switch ev.(type) {

					case *kafka.Message:
						// It's a message
						km := ev.(*kafka.Message)
						fmt.Printf("✅ Message '%v' received from topic '%v' (partition %d at offset %d)\n",
							string(km.Value),
							string(*km.TopicPartition.Topic),
							km.TopicPartition.Partition,
							km.TopicPartition.Offset)
					case kafka.PartitionEOF:
						// We've finished reading messages on this partition so let's wrap up
						// n.b. this is a BIG assumption that we are only consuming from one partition
						pe := ev.(kafka.PartitionEOF)
						fmt.Printf("🌆 Got to the end of partition %v on topic %v at offset %v\n",
							pe.Partition,
							string(*pe.Topic),
							pe.Offset)
						termChan <- true
					case kafka.OffsetsCommitted:
						continue
					case kafka.Error:
						// It's an error
						em := ev.(kafka.Error)
						fmt.Printf("☠️ Uh oh, caught an error:\n\t%v\n", em)
					default:
						// It's not anything we were expecting
						fmt.Printf("Got an event that's not a Message, Error, or PartitionEOF 👻\n\t%v\n", ev)

					}
				case <-termChan:
					doTerm = true

				}
			}
			close(doneChan)
		}()

		// We'll wait for the Go routine to exit, which will happen once we've read all the messages on the topic
		<-doneChan
		// Now we can exit
		c.Close()

	}

}
