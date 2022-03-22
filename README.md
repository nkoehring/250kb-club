# 250kb-club

An exclusive members-only club for web pages weighing no more than 250kb.

Inspired by [Bradley Taunt's 1MB.club](https://1mb.club/).

## But why?

I love the idea of a list of webpages that are still reasonably usable with a slow internet connection. But 1MB is, in my honest opinion, still way too much. Nobody wants to wait 10 seconds — on good days — to load a web site. And a very large chunk of the world population isn't gifted with Gigabit internet connections.

Of course, the absolute size of a website is not a perfect indicator. A page might contain a lot of text or images as important part of their content. It would be unfair to call them bloated in this case. This is why, additionally to the absolute size the ratio of visible to invisible content is shown as well.

## Adding a web page

Please send a patch or pull request. If unsure, you can also write a ticket mentioning the website(s). The website(s) will be added after passing the review and measured for changes about once every week.

## What are those values?

The values shown in the list are URL, Total Weight, Content Ratio.

Websites listed here are downloaded and analyzed with
[YellowLabTools](https://yellowlab.tools).
The total weight is counted and then the size of actual content is measured
and shown as a ratio. A higher ratio means more of the size is actual content.

For example: If a website has a total weight of 100kb and 60kb are the
documents structure, text, images, videos and so on, then the content ratio
is 60%. The rest are extras like CSS, JavaScript and so on. It is hard to
say what a good ratio is but my gut feeling is that everything above 20% is
pretty good already.

## All shiny

This page got completely rebuild and several issues of the old version got solved. It now has pagination (100 pages per... well, page) and detail pages for every entry that you can link to.

## Hacking this page

This page needs three components to work:

### [Deno](https://deno.land/)

The application that updates the page information is build with Typescript 4.6 and Deno 1.20. It uses no external packages except `encoding/toml` from the standard library.

### [YellowLabTools](https://yellowlab.tools/)

A local (docker) version of YellowLabTools is used for the page analysis. It uses [Phantomas](https://github.com/macbre/phantomas) as well as other tools to create a exhaustive metric.

### [Zola](https://www.getzola.org/)

The page analyser application generates markdown files that are rendered to a static web page by Zola.

```sh
git clone https://git.sr.ht/~koehr/the-250kb-club 250kb-club
# or: git clone https://github.com/nkoehring/250kb-club.git
cd 250kb-club
mkdir -m a+rwx yltresults # for access to YLT results
```

And build the page with `yarn build`.

The website analysis is done by `compile-list.js` which reads `pages.txt` and
writes the results to `src/components/pages.mjs`. `pages.txt` is curated by hand.
