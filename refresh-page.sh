docker ps | grep yellowlabtools || docker run --privileged -p 8383:8383 -v $PWD/yltresults:/usr/src/ylt/results ousamabenyounes/yellowlabtools &
deno run --allow-read --allow-write --allow-net index.ts
