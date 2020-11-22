<script>
  import Link from './Link.svelte'
</script>

<article id="info-popup">
  <header>
    <h1>Technical Details</h1>
  </header>
  <p>
    The values shown in the list are URL, Total Weight, Content Ratio.
  </p>
  <p>
    Websites listed here are downloaded and analyzed with
    <Link href="https://github.com/macbre/phantomas">Phantomas</Link>.
    The total weight is counted and then the size of actual content is measured
    and shown as a ratio.
  </p>
  <p>
    For example: If a website has a total weight of 100kb and 60kb are the
    documents structure, text, images, videos and so on, then the content ratio
    is 60%. The rest are extras like CSS, JavaScript and so on. It is hard to
    say what a good ratio is but my gut feeling is that everything above 20% is
    pretty good already.
  </p>
  <p>
    <strong>Disclaimer:</strong> Currently, inline scripts and styles are
    measured as content due to technical limitations of Phantomas. This will
    hopefully be fixed soon.
  </p>
</article>
