#!/bin/bash
# Start Next.js dev server directly (bypassing npm script lifecycle issues in WSL2)
cd /home/do/projects/lab-workspace/frontend
exec node node_modules/.bin/next dev -H 0.0.0.0 --webpack
