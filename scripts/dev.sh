#!/bin/sh
ulimit -n 10240 2>/dev/null
exec npx next dev -p 3008 -H 0.0.0.0
