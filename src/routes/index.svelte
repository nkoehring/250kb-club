<script>
  import { onMount } from 'svelte'

  import MainHeader from '$components/MainHeader.svelte'
  import MainFooter from '$components/MainFooter.svelte'
  import InfoPopup from '$components/InfoPopup.svelte'
  import PageList from '$components/PageList.svelte'

  const sortParameters = ['size', 'ratio']
  let sortParam = sortParameters[0]

  let showSortingOptions = false

  onMount(() => {
    // only shows sorting options when JS is enabled
    console.log('mounted!')
    showSortingOptions = true
  })
</script>

<MainHeader />

<main id="members-table">
  <aside>
    <div class:hidden={!showSortingOptions}>
      Sort by:
      <select bind:value={sortParam}>
        {#each sortParameters as param}
        <option value={param}>content-{param}</option>
        {/each}
      </select>
    </div>
    <InfoPopup />
  </aside>

  <PageList {sortParam} />
</main>

<MainFooter />
