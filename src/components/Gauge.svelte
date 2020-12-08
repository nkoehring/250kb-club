<script>
const radius = 40
const dashes = 2 * Math.PI * radius

export let max = 100
export let value = 1

$: offset = dashes * value / max * -1

</script>

<div class="gauge-box">
  <svg viewBox="0 0 100 100" class="gauge">
    <circle class="dial" cx="50" cy="50" r={radius} />
    <circle class="dial value" cx="50" cy="50" r={radius}
      stroke-dasharray={dashes}
      stroke-dashoffset={offset}
    />
    <circle class="dial value2" cx="50" cy="50" r={radius}
      stroke-dasharray={dashes}
      stroke-dashoffset={offset*1.2}
    />
  </svg>
</div>

<style>
.gauge-box {
  width: 60px;
  height: 60px;
  margin-top: -10px;
}
.gauge {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.dial {
  fill: none;
  stroke: #333;
  stroke-width: 4;
}
.value { stroke: green; }
.value2 { stroke: yellow; }
</style>
