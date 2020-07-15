package main

import (
	"errors"
	"fmt"
	"time"
)

func main() {
	if e := doThisThing(); e != nil {
		fmt.Printf("doThisThing failed.\n%v", e)
	} else {
		fmt.Printf("doThisThing worked.\n")

	}
}

func doThisThing() error {

	ec := make(chan string, 8)

	go func() {

		// If we're all good then do stuff
		// …

		// If we hit an error then log an error
		ec <- fmt.Sprintf("here is an error from the go routine :(\n")
		ec <- fmt.Sprintf("here is another error from the go routine :(\n")
		close(ec)
	}()

	// Do all our stuff in the function that we need to
	// …
	time.Sleep(2 * time.Second)
	// pretend we're doing stuff
	// …

	// When we're ready to return, check if the go routine has sent errors
	// Note that we're relying on the Go routine to close the channel, otherwise
	// we deadlock.
	// If there are no errors then the channel is simply closed and we read no values.
	done := false
	var e string
	for !done {
		if t, o := <-ec; o == false {
			// o is false if we've read all the values and the channel is closed
			// If that's the case, then we're done here
			done = true
		} else {
			// We've read a value so let's concatenate it with the others
			// that we've got
			e += t
		}
	}

	if len(e) > 0 {
		// If we've got any errors, then return an error to the caller
		return errors.New(e)
	}

	// assuming everything has gone ok return no error
	return nil

}
