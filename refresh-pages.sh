#!/bin/sh

node ./compile-list.mjs &&
yarn build &&
scp -r build/* 250kb.club:/srv/http/250kb.club/ &&
git commit -am 'updates URLs' &&
git push sourcehut main && git push origin main
