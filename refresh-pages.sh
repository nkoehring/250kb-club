#!/bin/sh

node ./compile-list.js &&
yarn build &&
scp -r public/* 250kb.club:/srv/http/250kb.club/ &&
git commit -am 'updates URLs' &&
git push sourcehut main && git push origin main
