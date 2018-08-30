<template>
  <div>
    <canvas ref="canvas" :width="width" :height="height" :style="`width:${width}px;height:${height}px;`"></canvas>
    <div class="touch-board" style="width: 100%; height: 100%;" @touchstart.stop.prevent="touchstart" @touchmove.stop.prevent="touchmove" @touchend.stop.prevent="touchend" />
    <div class="x-scroll-board">
      <div class="x-scroll-wrap" :style="`width: ${width}px; left: 0px; display: block; bottom: 0px;`">
        <div class="x-scroll-box" :style="`width: ${scrollBoxWidth}px; transform: translateX(${scrollLeft}px);`"></div>
      </div>
    </div>
    <div class="y-scroll-board">
      <div class="y-scroll-wrap" :style="`height: ${height}px;display: block; right: 0px;`">
        <div class="y-scroll-box" :style="`height: ${scrollBoxHeight}px; transform: translateY(${scrollTop}px);`"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Model, Watch } from 'vue-property-decorator';

const SCROLL_LIMIT_PIXEL = 1;
const QUICK_SCROLL_TIME = 300;
@Component
export default class Excel extends Vue {
  get ctx(): CanvasRenderingContext2D | null {
    if (this.$refs.canvas) {
      const $canvas = this.$refs.canvas as HTMLCanvasElement;
      return $canvas.getContext('2d');
    }
    return null;
  }

  // canvas width & height
  public width: number = 0;
  public height: number = 0;

  // total columns and rows, without header and sequence
  public totalColumns: number = 26;
  public totalRows: number = 5000;

  // excel item's size
  public itemHeight: number = 35;
  public itemWidth: number = 94;

  // current order for row and column
  public curColumnIndex: number = 0;
  public curRowIndex: number = 0;
  public maxRowIndex: number = 0;
  public maxColumnIndex: number = 0;

  // scrollbox size
  public scrollBoxWidth: number = 55;
  public scrollBoxHeight: number = 24;
  public scrollLeft: number = 0;
  public scrollTop: number = 0;

  // item count in one page
  public rowCount: number = 0;
  public columnCount: number = 0;

  public colors = {
    headerColor: '#333333',
    textColor: '#666666',
    borderColor: '#d4d4d4',
    white: '#ffffff',
    shadowColor: 'rgba(0,0,0,0.2)',
    fillColor: '#f9f9f9',
    headFillColor: '#f2f2f2',
  };

  // touch event
  public prevPageX = 0;
  public prevPageY = 0;
  public touchStartPageX = 0;
  public touchStartPageY = 0;
  public touchStartTime: number = 0;

  public scrollTimer: number = 0;

  constructor(props: any) {
    super(props);
  }

  public mounted() {
    window.addEventListener('resize', () => {
      this.initCanvas();
    });
    this.initCanvas();
  }

  public beforeDestroy() {
    if (this.scrollTimer) {
      clearInterval(this.scrollTimer);
    }
  }

  public initCanvas() {
    this.initSize();
    window.requestAnimationFrame(() => {
      this.paint();
    });
  }

  public initSize() {
    // init canvas size
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // set one page count
    const columnCount = Math.ceil(this.width / this.itemWidth);
    const rowCount = Math.ceil(this.height / this.itemHeight);
    this.columnCount = columnCount;
    this.rowCount = rowCount;

    // set scrollbox size
    const scrollBoxHeight = (this.rowCount / (this.totalRows + 1)) * this.height;
    const scrollBoxWidth = (this.columnCount / (this.totalColumns + 1)) * this.width;
    this.scrollBoxHeight = scrollBoxHeight < 24 ? 24 : scrollBoxHeight;
    this.scrollBoxWidth = scrollBoxWidth < 24 ? 24 : scrollBoxWidth;

    this.maxRowIndex = (this.totalRows - this.rowCount + 2);
    this.maxColumnIndex = (this.totalColumns - this.columnCount + 2);
  }

  @Watch('curColumnIndex')
  public onCurColumnIndexChange(val: number, oldVal: number) {
    this.scrollLeft = (val / this.totalColumns) * (this.width - this.scrollBoxWidth);
  }

  @Watch('curRowIndex')
  public onCurRowIndexChange(val: number, oldVal: number) {
    this.scrollTop = (val / this.totalRows) * (this.height - this.scrollBoxHeight);
  }

  public clearPainting() {
    if (this.ctx) { this.ctx.clearRect(0, 0, this.width, this.height); }
  }

  public paint() {
    if (!this.ctx) { return; }
    const { columnCount, rowCount } = this;
    this.paintTableLine(columnCount, rowCount);
    this.paintSequence(columnCount, rowCount);
    this.paintHeader(columnCount, rowCount);
  }

  public repain() {
    this.clearPainting();
    this.paint();
  }

  public paintHeader(columnLength: number, rowLength: number) {
    if (!this.ctx) { return; }
    const ctx = this.ctx;
    for (let i = 1; i <= columnLength; i++) {
      ctx.beginPath();
      ctx.fillStyle = this.colors.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px PingFang SC';
      ctx.fillText(`${String.fromCharCode(64 + this.curColumnIndex + i)}`,
        (i + 0.5) * this.itemWidth, this.itemHeight / 2);
      ctx.stroke();
    }
  }

  public setCurRowIndex(patch: number = 1) {
    let next: number;
    next = this.curRowIndex + patch;
    const max = (this.totalRows - this.rowCount + 2);
    if (next > this.maxRowIndex) {
      this.curRowIndex = this.maxRowIndex;
    } else if (next < 0) {
      this.curRowIndex = 0;
    } else {
      this.curRowIndex = next;
    }
  }

  public setCurColumnIndex(patch: number = 1) {
    let next: number;
    next = this.curColumnIndex + patch;
    if (next > this.maxColumnIndex) {
      this.curColumnIndex = this.maxColumnIndex;
    } else if (next < 0) {
      this.curColumnIndex = 0;
    } else {
      this.curColumnIndex = next;
    }
  }

  public touchstart(e: TouchEvent) {
    if (this.scrollTimer) {
      clearInterval(this.scrollTimer);
    }
    const { pageX, pageY } = e.touches[0];
    this.prevPageX = pageX;
    this.prevPageY = pageY;
    this.touchStartPageX = pageX;
    this.touchStartPageY = pageY;
    this.touchStartTime = +new Date();
  }

  public touchmove(e: TouchEvent) {
    const { pageX, pageY } = e.touches[0];
    const diffX: number = pageX - this.prevPageX;
    const diffy: number = pageY - this.prevPageY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffy);
    if (absDiffX > absDiffY) {
      if (absDiffX > SCROLL_LIMIT_PIXEL) {
        this.setCurColumnIndex(diffX > 0 ? -1 : 1);
      }
    } else {
      if (absDiffY > SCROLL_LIMIT_PIXEL) {
        this.setCurRowIndex(diffy > 0 ? -1 : 1);
      }
    }
    this.prevPageX = pageX;
    this.prevPageY = pageY;
    window.requestAnimationFrame(() => {
      this.repain();
    });
  }

  public touchend(e: TouchEvent) {
    const { pageX, pageY } = e.changedTouches[0];
    const diffX: number = pageX - this.touchStartPageX;
    const diffy: number = pageY - this.touchStartPageY;
    const absDiffX = Math.abs(diffX);
    const absDiffY = Math.abs(diffy);
    const isScroolX = absDiffX > absDiffY;
    const maxRound = isScroolX ? absDiffX : absDiffY;
    const now = +new Date();
    if (now - this.touchStartTime < QUICK_SCROLL_TIME && maxRound > 250) {
      const tempRowIndex = this.curRowIndex;
      const tempColumnIndex = this.curColumnIndex;
      this.scrollTimer = window.setInterval(() => {
        if (isScroolX) {
          if (diffX > 0) {
            if (this.curColumnIndex < tempColumnIndex - 10 || this.curColumnIndex === 0) {
              return clearInterval(this.scrollTimer);
            }
            this.setCurColumnIndex(-this.columnCount);
          } else {
            if (this.curColumnIndex > tempColumnIndex + 10 || this.curColumnIndex >= this.maxColumnIndex) {
              return clearInterval(this.scrollTimer);
            }
            this.setCurColumnIndex(this.columnCount);
          }
        } else {
          if (diffy > 0) {
            if (this.curRowIndex < tempRowIndex - 500 || this.curRowIndex === 0) {
              return clearInterval(this.scrollTimer);
            }
            this.setCurRowIndex(-this.rowCount);
          } else {
            if (this.curRowIndex > tempRowIndex + 500 || this.curRowIndex >= this.maxRowIndex) {
              return clearInterval(this.scrollTimer);
            }
            this.setCurRowIndex(this.rowCount);
          }
        }
        this.repain();
      }, 100);
    }
  }

  public paintSequence(columnLength: number, rowLength: number) {
    if (!this.ctx) { return; }
    const ctx = this.ctx;
    for (let i = 1; i <= rowLength; i++) {
      ctx.beginPath();
      ctx.fillStyle = this.colors.textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px PingFang SC';
      ctx.fillText(`${i + this.curRowIndex}`, this.itemWidth / 2, (i + 0.5) * this.itemHeight);
      ctx.stroke();
    }
  }

  public paintTableLine(columnLength: number, rowLength: number) {
    if (!this.ctx) { return; }
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.lineWidth = 1;
    // 纵线
    for (let i = 0; i <= columnLength; i++) {
      const x = i * this.itemWidth + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
    }
    // 横线
    for (let i = 0; i <= rowLength; i++) {
      const y = i * this.itemHeight + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
    }
    ctx.stroke();
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="less">
.touch-board {
  position: absolute;
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: 101;
  background-color: rgba(255, 255, 255, 0);
}
.x-scroll-board {
  position: absolute;
  overflow: hidden;
  bottom: 0;
  left: 0;
  right: 0;
  height: 14px;
  z-index: 102;
  background-color: #f4f5f8;
  border-left: 1px solid #d8dade;
  cursor: auto;
}
.x-scroll-wrap {
  position: absolute;
  height: 14px;
  padding: 2px 0;
  bottom: 0;
  box-sizing: border-box;
  user-select: none;
  z-index: 102;
  background-color: #fff;
}
.x-scroll-box {
  position: absolute;
  height: 10px;
  bottom: 2px;
  background-color: #000;
  opacity: 0.2;
  left: 0;
  border-radius: 4px;
}
.y-scroll-board {
  position: absolute;
  overflow: hidden;
  right: 0;
  top: 0;
  bottom: 0;
  width: 14px;
  z-index: 102;
  background-color: #f4f5f8;
  border-top: 1px solid #d8dade;
}
.y-scroll-wrap {
  position: absolute;
  width: 14px;
  right: 0;
  padding: 0 2px;
  box-sizing: border-box;
  user-select: none;
  z-index: 102;
  background-color: #fff;
  transition: right 0.5s ease;
}
.y-scroll-box {
  position: absolute;
  width: 10px;
  right: 2px;
  background-color: #000;
  opacity: 0.2;
  top: 0;
  border-radius: 4px;
}
</style>
