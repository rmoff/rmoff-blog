package main

import (
	"fmt"

	"gopkg.in/confluentinc/confluent-kafka-go.v1/kafka"
)

func main() {

	// --
	// The topic is passed as a pointer to the Producer, so we can't
	// use a hard-coded literal. And a variable is a nicer way to do
	// it anyway ;-)
	topic := "test_topic_02"

	// --
	// Create Producer instance
	// https://docs.confluent.io/current/clients/confluent-kafka-go/index.html#NewProducer
	//
	// Variable p holds the new Producer instance.

	c := kafka.ConfigMap{
		"boostrap.servers": "localhost:9092"}

	p, e := kafka.NewProducer(&c)

	if e != nil {
		fmt.Printf("😢Oh noes, there's an error creating the Producer! %v", e)
	} else {

		// --
		// Send a message using Produce()
		// https://docs.confluent.io/current/clients/confluent-kafka-go/index.html#Producer.Produce
		//
		// Only essential values are specified here - the topic, partition, and value
		//
		// There is NO handling of errors, timeouts, etc - we just fire & forget this message.
		// Did it work? ¯\_(ツ)_/¯
		p.Produce(&kafka.Message{
			TopicPartition: kafka.TopicPartition{Topic: &topic,
				Partition: 0},
			Value: []byte("Hello world")}, nil)

		// --
		// Close the producer
		p.Close()

	}

}
