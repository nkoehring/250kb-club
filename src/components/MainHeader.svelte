<script>
  import Link from '$components/Link.svelte'
</script>

<header>
  <h1>The 250kb&nbsp;Club</h1>
  <h2>
    <Link href="https://mobiforge.com/research-analysis/the-web-is-doom">
      The Web Is Doom
    </Link>
  </h2>
  <p>Lets do something about it!</p>
  <p>
    The <em>250kb Club</em> is a collection of web pages that focus on
    performance, efficiency and accessibility.
  </p>
  <p class="big">Websites in this list must not exceed 256kb <em>compressed</em> size!</p>
  <p>
    Yes, compressed size. It makes much more sense because it allows
    for a lot of text to be transferred without having a big impact on the
    total size, while the impact of media is basically unaffected.
  </p>
  <p>
    If your pages exceeds 250kb, you might consider
    <Link href="https://512kb.club">512kB.club</Link> or
    <Link href="https://1MB.club">1MB.club</Link>.
  </p>
  <p>
    You can suggest a web page for this collection
    <Link href="https://todo.sr.ht/~koehr/the-250kb-club/">via Sourcehut</Link>
    or
    <Link href="https://github.com/nkoehring/250kb-club/issues/new">via Github</Link>.
    The site will be reviewed and, if applicable, added to the list below.
    Pages are checked again every week.
  </p>
</header>
