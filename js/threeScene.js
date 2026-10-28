/**
 * WUTHERING WAVES // AKADEMIYA TERMINAL
 * threeScene.js - Dynamic Soundwave & Tacet Field Particle Background
 * Inspired by wuwa.akademiya.app Sci-Fi Aesthetic
 */

class WuWaBackgroundCanvas {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.particles = [];
    this.soundwaves = [];
    this.time = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate floating resonance particles
    const particleCount = Math.min(80, Math.floor(window.innerWidth / 20));
    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: 1 + Math.random() * 2.5,
        alpha: 0.2 + Math.random() * 0.6,
        color: Math.random() > 0.65 ? '#d4b475' : (Math.random() > 0.4 ? '#38bdf8' : '#a855f7')
      });
    }

    // Soundwave frequency ripples
    for (let i = 0; i < 3; i++) {
      this.soundwaves.push({
        yOffset: this.height * (0.35 + i * 0.2),
        amplitude: 15 + i * 8,
        frequency: 0.003 + i * 0.001,
        speed: 0.02 + i * 0.015,
        color: i === 0 ? 'rgba(212, 180, 117, 0.08)' : (i === 1 ? 'rgba(56, 189, 248, 0.06)' : 'rgba(168, 85, 247, 0.05)')
      });
    }

    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  animate() {
    this.time += 0.015;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Deep Sci-Fi Background Gradient
    const bgGrad = ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.35, 100,
      this.width * 0.5, this.height * 0.5, this.width * 0.8
    );
    bgGrad.addColorStop(0, '#0e121e');
    bgGrad.addColorStop(0.6, '#0a0c10');
    bgGrad.addColorStop(1, '#05070a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Coordinate Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 60;
    for (let x = 0; x < this.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = 0; y < this.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Soundwaves
    this.soundwaves.forEach(sw => {
      ctx.strokeStyle = sw.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < this.width; x += 15) {
        const y = sw.yOffset + Math.sin(x * sw.frequency + this.time * sw.speed * 40) * sw.amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Floating Resonance Particles
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    requestAnimationFrame(() => this.animate());
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.wuwaBackground = new WuWaBackgroundCanvas();
});
