<script>
  import InfoPopup from './InfoPopup.svelte'
  import Link from './Link.svelte'
  import data from './pages.json'

  const yellowSizeThreshhold = 200
  const redSizeThreshhold = 225

  const yellowRatioThreshhold = 50
  const redRatioThreshhold = 25

  const pages = data.map(page => {
    const totalWeigth = page.contentWeight + page.extraWeight
    const size = Math.round(totalWeigth / 1024)
    const ratio = Math.round(page.contentWeight * 100 / totalWeigth)

    return { url: page.url, size, ratio }
  })

  const sortParameters = ['size', 'ratio']
  let sortParam = sortParameters[0]
  let showInfoPopup = false

  $: sortedPages = pages.sort((a, b) => {
    return sortParam === 'size' ? a.size - b.size : b.ratio - a.ratio
  })

  function stripped (url) {
    return url.replaceAll(/(^https?:\/\/|\/$)/g, '')
  }

  function toggleInfo () { showInfoPopup = !showInfoPopup }
</script>

<header>
  Sort by:
  <select bind:value={sortParam}>
    {#each sortParameters as param}
    <option value={param}>content-{param}</option>
    {/each}
  </select>
  <button class="float-right" on:click={toggleInfo}>{showInfoPopup ? 'x' : 'How does this work?'}</button>
</header>

{#if showInfoPopup}
<InfoPopup />
{/if}

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
