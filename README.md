# 250kb-club

An exclusive members-only club for web pages weighing no more than 250kb.

Inspired by [Bredley Taunts 1MB.club](https://1mb.club/).

## But why?

I love the idea of a list of webpages that are still reasonably usable with a slow internet connection. But 1MB is, in my honest opinion, still way too much. Nobody wants to wait 10 seconds — on good days — to load a web site. But a very large chunk of the world population isn't gifted with Gigabit internet connections.

## Adding a web page

Please add a PR in Github that adds a page to `src/pages.json`. If unsure, you can also write an issue mentioning the website. The website will be added after passing the review.

## What are those values?

The values shown in the list are URL, Total Weight, Content Ratio.

Websites listed here are downloaded and analyzed with
(Phantomas)[https://github.com/macbre/phantomas].
The total weight is counted and then the size of actual content is measured
and shown as a ratio.

For example: If a website has a total weight of 100kb and 60kb are the
documents structure, text, images, videos and so on, then the content ratio
is 60%. The rest are extras like CSS, JavaScript and so on. It is hard to
say what a good ratio is but my gut feeling is that everything above 20% is
pretty good already.

## Hacking this page

This page is built with [Svelte](https://svelte.dev). You can clone the repository and run the application in development mode like this:

```
git clone https://github.com/nkoehring/250kb-club.git
cd 250kb-club
yarn
yarn dev
```

And build the page with `yarn build`.

The website analysis is done by `compile-list.js` which reads `pages.txt` and
writes the results to `src/pages.json`.
