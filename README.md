# 250kb-club

An exclusive members-only club for web pages weighing no more than [256kb](https://256kb.club).

Inspired by [Bradley Taunt's 1MB.club](https://1mb.club/).

## But why?

I love the idea of a list of webpages that are still reasonably usable with a slow internet connection. But 1MB is, in my honest opinion, still way too much. Nobody wants to wait 10 seconds — on good days — to load a web site. And a very large chunk of the world population isn't gifted with Gigabit internet connections. The carbon food print of a web site is also directly related to the data transfered over the wire.
The 250kB Club, for example is [extremely efficient](https://www.websitecarbon.com/website/250kb-club/) thanks to its small size.

Of course, the absolute size of a website is not a perfect indicator. A page might contain a lot of text or images as important part of their content. It would be unfair to call them bloated in this case. This is why, additionally to the absolute size the ratio of visible to invisible content is shown as well.

## Adding a web page

~~Please send a patch or pull request.~~ Please write an issue/ticket mentioning the website(s). The website(s) will be added after passing the review. Content checks are repeated in irregular intervals.

If you read this on Github, use the corresponding [issue template for requesting membership](https://github.com/nkoehring/250kb-club/issues/new?assignees=nkoehring&labels=Membership%20Request&projects=&template=request-membership.md&title=%5BSITE+REQUEST%5D%20https%3A%2F%2FPLEASE_ADD_URL).

## Updating a web page

Please write an issue/ticket mentioning which URL should be updated to what.

If you read this on Github, use the corresponding [issue template for updating an URL](https://github.com/nkoehring/250kb-club/issues/new?assignees=nkoehring&labels=Membership%20Update&projects=&template=update-membership.md&title=%5BSITE+UPDATE%5D%20https%3A%2F%2FOLD_URL%20to%20https%3A%2F%2FNEW_URL).

## Removing a web page

Please write an issue/ticket mentioning which URL should be removed and add a proof that it was you who initially requested to add it.

If you read this on Github, use the corresponding [issue template for removing an URL](https://github.com/nkoehring/250kb-club/issues/new?assignees=nkoehring&labels=Membership%20Update&projects=&template=cancel-membership.md&title=%5BSITE+UPDATE%5D%20remove%20https%3A%2F%2FURL).

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

The website analysis functionality is implemented in `analyser/metrics.ts`, everything else either in `analyser/toolkit.ts`, `index.ts` or the corresponding Zola templates. Results are written as TOML front matter to `content/:page-slug:.md` and rendered by Zola in a later step. `pages.txt` is curated by hand.
