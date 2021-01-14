<script>
  import Link from '$components/Link.svelte'
</script>

<footer id="main-footer">
  <p>
    Made with &hearts; for a performant web by <Link href="https://koehr.in">Norman Köhring</Link>.
    Inspired by <Link href="https://uglyduck.ca">Bradley Taunt</Link>'s <Link href="https://1MB.club">1MB.club</Link>
    <br/>
    The code of this page is open source. You can find it on <Link href="https://github.com/nkoehring/250kb-club">Github</Link>
    and <Link href="https://sr.ht/~koehr/the-250kb-club/">Sourcehut</Link>.
  </p>
</footer>

<style>
#main-footer {
  border-top: 1px solid lightgrey;
  margin: 3rem auto 0;
  font-size: 85%;
}
</style>
