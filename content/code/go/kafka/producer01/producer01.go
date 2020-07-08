package main

import (
	"gopkg.in/confluentinc/confluent-kafka-go.v1/kafka"
)

func main() {

	// --
	// The topic is passed as a pointer to the Producer, so we can't
	// use a hard-coded literal. And a variable is a nicer way to do
	// it anyway ;-)
	topic := "test_topic"

	// --
	// Create Producer instance
	// https://docs.confluent.io/current/clients/confluent-kafka-go/index.html#NewProducer
	//
	// Variable p holds the new Producer instance. There's a bunch of config that we _could_
	// specify here but the only essential one is the bootstrap server.
	//
	// Note that we ignore any error that might happen, by passing _ as the second variable
	// on the left-hand side. This is, obviously, a terrible idea.

	p, _ := kafka.NewProducer(&kafka.ConfigMap{
		"bootstrap.servers": "localhost:9092"})

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
