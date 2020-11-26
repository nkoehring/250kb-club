<script>
  import Link from './Link.svelte'
</script>

<input id="info-toggle" type="checkbox" />
<label for="info-toggle">
  <span class="info-text">How does this work?</span>
  <span class="info-close"> &nbsp;x&nbsp; </span>
</label>

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

<style>
#info-toggle { display: none; }
#info-toggle ~ label { text-align: center; }
#info-toggle ~ label > .info-close { display: none; }
#info-toggle:checked ~ label > .info-close { display: inline; }
#info-toggle:checked ~ label > .info-text { display: none; }

#info-popup {
  display: none;
  position: absolute;
  top: 2.5em;
  left: -1em;
  width: calc(720px - 2em - 6px);
  max-width: calc(100vw - 2em - 6px);
  padding: 0 1em;
  background: #FFF;
  border: 3px solid #DDD;
}
#info-toggle:checked ~ #info-popup { display: block; }

@media (prefers-color-scheme: dark) {
  #info-popup { background: #000; border-color: #444; }
}
</style>
