<script>
  import Link from '$components/Link.svelte'
  import pageData from '$components/pages.mjs'

  export let sortParam
  const rejectThreshold = 256000
  const yellowSizeThreshhold = 200
  const yellowRatioThreshhold = 50
  const redSizeThreshhold = 225
  const redRatioThreshhold = 25

  const pages = pageData.reduce((acc, page) => {
    const totalWeight = page.contentWeight + page.extraWeight
    if (totalWeight > rejectThreshold) return acc

    const size = Math.round(totalWeight / 1024)
    const ratio = Math.round(page.contentWeight * 100 / totalWeight)

    acc.push({ url: page.url, size, ratio })
    return acc
  }, [])

  $: sortedPages = pages.sort((a, b) => {
    return sortParam === 'size' ? a.size - b.size : b.ratio - a.ratio
  })

  function stripped (url) {
    return url.replace(/(^https?:\/\/|\/$)/g, '')
  }
</script>

<ol>
  {#each sortedPages as page}
  <li style={`--size:${page.size};--ratio:${page.ratio}%`}>
    <div class="entry">
      <span class="url"><Link href={page.url}>{stripped(page.url)}</Link></span>
      <span class="size">{page.size}kb</span>
      <span class="ratio">{page.ratio}%</span>
    </div>
    <div
      class="entry-size-bar"
      class:highlighted={sortParam === 'size'}
      class:yellow={page.size > yellowSizeThreshhold}
      class:red={page.size > redSizeThreshhold}
    />
    <div
      class="entry-ratio-bar"
      class:highlighted={sortParam === 'ratio'}
      class:yellow={page.ratio > yellowRatioThreshhold}
      class:red={page.ratio > redRatioThreshhold}
    />
  </li>
  {/each}
</ol>

<style>
.entry {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  padding: .5em .5em 0;
  height: 2em;
  line-height: 2em;
  font-size: 1.3em;
}

.entry > .url {
  flex: 1 1 auto;
  width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
}
.entry > .size, .entry > .ratio {
  flex: 0 0 auto;
  width: 20%;
  text-align: right;
}

.entry-size-bar, .entry-ratio-bar {
  height: 0;
  margin-bottom: 2px;
  border-bottom: 2px solid;
}
.entry-size-bar.highlighted, .entry-ratio-bar.highlighted {
  border-bottom-width: 4px;
}
.entry-size-bar {
  border-bottom-color: #966;
  width: calc(var(--size)/250 * 100%);
}
.entry-ratio-bar {
  border-bottom-color: #669;
  width: var(--ratio);
}
</style>
