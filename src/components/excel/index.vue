<template>
  <canvas ref="canvas" :width="width" :height="height" :style="`width:${width}px;height:${height}px;`"></canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Model } from 'vue-property-decorator';

@Component
export default class Excel extends Vue {
  get ctx(): CanvasRenderingContext2D | null {
    if (this.$refs.canvas) {
      const $canvas = this.$refs.canvas as HTMLCanvasElement;
      return $canvas.getContext('2d');
    }
    return null;
  }
  public width: number = 0;
  public height: number = 0;
  public colors = {
    headerColor: '#333333',
    textColor: '#666666',
    borderColor: '#d4d4d4',
    white: '#ffffff',
    shadowColor: 'rgba(0,0,0,0.2)',
    fillColor: '#f9f9f9',
    headFillColor: '#f2f2f2',
    buttonColor: '#20a0ff',
    focusColor: '#4285f4',
    selectColor: '#6bc9ff',
    selectAreaColor: 'rgba(160, 195, 255, 0.2)',
    selectRowColor: '#f6f6f6',
    dotColor: '#74d337',
  };

  constructor(props: any) {
    super(props);
    this.initSize();
  }

  public initSize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
  }

  public clearPainting() {
    if (this.ctx) { this.ctx.clearRect(0, 0, this.width, this.height); }
  }

  public paint() {
    if (!this.ctx) { return; }
    const columnLength = Math.ceil(this.width / 75);
    const rowLength = Math.ceil(this.height / 50);
    this.paintTableLine(columnLength, rowLength);
  }
  public paintTableLine(columnLength: number, rowLength: number) {
    if (!this.ctx) { return; }
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.lineWidth = 1;
    // 纵线
    for (let i = 0; i < columnLength; i++) {
      const x = i * 75 + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    // 横线
    for (let i = 0; i < rowLength; i++) {
      const y = i * 50 + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();
  }

  private mounted() {
    this.initSize();
    window.requestAnimationFrame(() => {
      this.paint();
    });
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
</style>
