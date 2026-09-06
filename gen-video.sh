#!/bin/bash
# BARDOS — video cinematográfico para THE CRAFT
cd /home/z/my-project
mkdir -p public/videos gen-logs

z-ai video \
  -p "Extreme close-up slow motion shot of a barber's clippers cutting dark hair at a skin fade line, black and white, cinematic film grain, dramatic hard side lighting, small hair fragments falling in slow motion, shallow depth of field, editorial barbering film" \
  -q quality -s "1920x1080" --fps 30 -d 5 --poll --poll-interval 10 --max-polls 40 \
  -o gen-logs/video-result.json > gen-logs/video-gen.log 2>&1

echo "EXIT:$?" >> gen-logs/video-gen.log
cat gen-logs/video-result.json >> gen-logs/video-gen.log 2>/dev/null
