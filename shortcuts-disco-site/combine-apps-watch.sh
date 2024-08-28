#!/bin/bash
echo "File change detected:"  $1
npm run prettify 
npm run export-data
# Restart fswatch, which exist after a single event
# Otherwise, fswatch will "queue" all events from the prettify output
# and end up in an endless loop. There is probably a better way around this!
npm run export-data:watch