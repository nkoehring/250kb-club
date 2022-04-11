docker ps | grep yellowlabtools || docker run --privileged -p 8383:8383 -v $PWD/yltresults:/usr/src/ylt/results ousamabenyounes/yellowlabtools &
sleep 10
deno run --allow-read --allow-write --allow-net index.ts && zola build && git add -A && git commit -m 'pages update' && git push && git push origin
