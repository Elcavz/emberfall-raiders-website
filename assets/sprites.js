/* Emberfall Raiders: in-game characters as SVG.
   Ported from World.ts (drawHero / drawEnemy) by way of store-art/art.html, so the site shows
   exactly what players see in the game. Usage: <span data-sprite="knight"></span>
   or data-sprite="enemy:drake". Rendered on DOMContentLoaded by site.js (EFSprites.renderAll). */
(function () {
  'use strict';

  const col = (n, mul = 1) => {
    n = n >>> 0;
    const r = (n >>> 24) & 255, g = (n >>> 16) & 255, b = (n >>> 8) & 255, a = ((n & 255) / 255) * mul;
    return `rgba(${r},${g},${b},${a.toFixed(3)})`;
  };
  const mix = (c1, c2, k) => {
    const ch = (c, s) => (c >>> s) & 255;
    const m = (s) => Math.round(ch(c1, s) + (ch(c2, s) - ch(c1, s)) * k);
    return ((m(24) << 24) | (m(16) << 16) | (m(8) << 8) | ch(c1, 0)) >>> 0;
  };

  // Shape recorder in game (y-up) coordinates; rendered twice: dark outline pass + fill pass.
  function Shapes() {
    const list = [];
    return {
      list,
      circle: (x, y, r, c, noOutline) => list.push({ t: 'c', x, y, r, c, noOutline }),
      ellipse: (x, y, rx, ry, c, noOutline) => list.push({ t: 'e', x, y, rx, ry, c, noOutline }),
      line: (x1, y1, x2, y2, c, w) => list.push({ t: 'l', x1, y1, x2, y2, c, w }),
      arc: (x, y, r, a0, a1, c, w) => list.push({ t: 'a', x, y, r, a0, a1, c, w }),
      ring: (x, y, r, c, w) => list.push({ t: 'a', x, y, r, a0: 0, a1: Math.PI * 1.999, c, w }),
      poly: (pts, c) => list.push({ t: 'p', pts, c }),
      rect: (x, y, w, h, c) => list.push({ t: 'r', x, y, w, h, c }),
      star: (x, y, r, c) => {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r;
          pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        list.push({ t: 'p', pts, c });
      },
      glow: (x, y, r, c) => list.push({ t: 'g', x, y, r, c }),
    };
  }

  let gid = 0;
  function shapeSvg(s, ow) {
    const fy = (y) => -y;
    const dark = '#120a18';
    const fill = (c) => (ow ? dark : col(c));
    if (ow && (s.noOutline || s.t === 'g' || ((s.c >>> 0) & 255) < 200)) return '';
    const stroke = ow ? `stroke="${dark}" stroke-width="${ow}" stroke-linejoin="round"` : '';
    switch (s.t) {
      case 'c': return `<circle cx="${s.x}" cy="${fy(s.y)}" r="${s.r}" fill="${fill(s.c)}" ${stroke}/>`;
      case 'e': return `<ellipse cx="${s.x}" cy="${fy(s.y)}" rx="${s.rx}" ry="${s.ry}" fill="${fill(s.c)}" ${stroke}/>`;
      case 'r': return `<rect x="${s.x}" y="${fy(s.y + s.h)}" width="${s.w}" height="${s.h}" fill="${fill(s.c)}" ${stroke}/>`;
      case 'p': {
        const p = [];
        for (let i = 0; i < s.pts.length; i += 2) p.push(`${s.pts[i].toFixed(2)},${fy(s.pts[i + 1]).toFixed(2)}`);
        return `<polygon points="${p.join(' ')}" fill="${fill(s.c)}" stroke-linejoin="round" ${stroke}/>`;
      }
      case 'l':
        return `<line x1="${s.x1}" y1="${fy(s.y1)}" x2="${s.x2}" y2="${fy(s.y2)}" stroke="${fill(s.c)}" stroke-width="${s.w + (ow || 0)}" stroke-linecap="round"/>`;
      case 'a': {
        const x0 = s.x + Math.cos(s.a0) * s.r, y0 = s.y + Math.sin(s.a0) * s.r;
        const x1 = s.x + Math.cos(s.a1) * s.r, y1 = s.y + Math.sin(s.a1) * s.r;
        const large = s.a1 - s.a0 > Math.PI ? 1 : 0;
        return `<path d="M${x0},${fy(y0)} A${s.r},${s.r} 0 ${large} 0 ${x1},${fy(y1)}" fill="none" stroke="${fill(s.c)}" stroke-width="${s.w + (ow || 0)}" stroke-linecap="round"/>`;
      }
      case 'g': {
        const id = 'efg' + ++gid;
        return `<radialGradient id="${id}"><stop offset="0" stop-color="${col(s.c)}"/><stop offset="1" stop-color="${col(s.c, 0)}"/></radialGradient><circle cx="${s.x}" cy="${fy(s.y)}" r="${s.r}" fill="url(#${id})"/>`;
      }
    }
    return '';
  }

  function svg(build, half, outline, cy = 0) {
    const L = Shapes();
    build(L);
    const out = L.list.map((s) => shapeSvg(s, outline)).join('');
    const body = L.list.map((s) => shapeSvg(s, 0)).join('');
    return `<svg viewBox="${-half} ${-half + cy} ${half * 2} ${half * 2}" aria-hidden="true" focusable="false">${out}${body}</svg>`;
  }

  // ---------------- heroes (drawHero, facing the viewer) ----------------
  const HERO = {
    knight: { color: 0x5484e4ff, trim: 0xe6ecfaff },
    ranger: { color: 0x46be6eff, trim: 0xa06e3cff },
    mage: { color: 0x965ae1ff, trim: 0xffbe46ff },
  };

  function hero(cls, wf) {
    const s = 1;
    return (L) => {
      const d = HERO[cls];
      const x = 0, y = 0, fx = 0;
      L.ellipse(x, y - 20 * s, 24 * s, 8 * s, 0x00000077, true);
      L.circle(x - 9 * s, y - 16 * s, 7 * s, 0x2a2a38ff);
      L.circle(x + 9 * s, y - 16 * s, 7 * s, 0x2a2a38ff);
      const wx = x + Math.cos(wf) * 22 * s, wy = y + Math.sin(wf) * 22 * s;
      if (cls === 'knight') {
        const wa = wf - 0.4;
        const tx = wx + Math.cos(wa) * 44 * s, ty = wy + Math.sin(wa) * 44 * s;
        L.glow((wx + tx) / 2, (wy + ty) / 2, 26 * s, 0xffb04755);
        L.line(wx, wy, tx, ty, 0xdfe6f0ff, 7 * s);
        L.line(wx + Math.cos(wa) * 8, wy + Math.sin(wa) * 8, tx - Math.cos(wa) * 4, ty - Math.sin(wa) * 4, 0xffffffcc, 2);
        L.line(wx - Math.cos(wa + 1.57) * 10, wy - Math.sin(wa + 1.57) * 10, wx + Math.cos(wa + 1.57) * 10, wy + Math.sin(wa + 1.57) * 10, 0xc09030ff, 5);
        L.circle(wx - Math.cos(wa) * 5, wy - Math.sin(wa) * 5, 3.5, 0xffd060ff);
      } else if (cls === 'ranger') {
        L.arc(wx, wy, 20, wf - 1.2, wf + 1.2, 0x9a6a38ff, 5);
        L.line(wx + Math.cos(wf - 1.2) * 20, wy + Math.sin(wf - 1.2) * 20, wx + Math.cos(wf + 1.2) * 20, wy + Math.sin(wf + 1.2) * 20, 0xf0f0f0dd, 2);
        const ax = wx + Math.cos(wf) * 6, ay = wy + Math.sin(wf) * 6;
        L.line(ax - Math.cos(wf) * 16, ay - Math.sin(wf) * 16, ax + Math.cos(wf) * 24, ay + Math.sin(wf) * 24, 0xd8c09aff, 2.4);
        const hx = ax + Math.cos(wf) * 27, hy = ay + Math.sin(wf) * 27;
        L.poly([hx, hy, hx - Math.cos(wf - 0.5) * 7, hy - Math.sin(wf - 0.5) * 7, hx - Math.cos(wf + 0.5) * 7, hy - Math.sin(wf + 0.5) * 7], 0xe8eef8ff);
      } else {
        const sx = x + Math.cos(wf + 0.7) * 22, sy = y + Math.sin(wf + 0.7) * 22;
        L.line(sx, sy - 22, sx, sy + 26, 0x8a5a30ff, 5);
        L.glow(sx, sy + 30, 22, 0xff8a30aa);
        L.circle(sx, sy + 30, 10, 0xffb040ff);
        L.circle(sx, sy + 30, 5, 0xfff0c0ff);
      }
      L.circle(x, y, 22, mix(d.color, 0x000000ff, 0.25));
      L.circle(x, y + 2, 19, d.color);
      L.ellipse(x - 7, y + 8, 7, 4.5, 0xffffff40, true);
      if (cls === 'knight') {
        L.circle(x, y + 10, 14, 0xc8d0e0ff);
        L.ellipse(x - 5, y + 16, 5, 3, 0xffffff70, true);
        L.rect(x - 10 + fx * 3, y + 8, 20, 4, 0x30384aff);
        L.rect(x - 7, y + 9, 4, 2, 0xffd070ff);
        L.rect(x + 3, y + 9, 4, 2, 0xffd070ff);
        L.poly([x - 3, y + 22, x + 3, y + 22, x, y + 36], 0xff5040ff);
      } else if (cls === 'ranger') {
        L.circle(x, y + 10, 14, 0xf0c8a0ff);
        L.poly([x - 16, y + 10, x + 16, y + 10, x, y + 32], 0x2f8a4aff);
        L.circle(x - 5, y + 7, 2.5, 0x202020ff);
        L.circle(x + 5, y + 7, 2.5, 0x202020ff);
      } else {
        L.circle(x, y + 10, 13, 0xf0d0b0ff);
        L.poly([x - 19, y + 14, x + 19, y + 14, x + 4, y + 44], 0x6a3ab8ff);
        L.star(x + 2, y + 24, 4, 0xffe070ff);
        L.circle(x - 5, y + 7, 2.5, 0x202020ff);
        L.circle(x + 5, y + 7, 2.5, 0x202020ff);
      }
      L.circle(x - 10, y - 2, 4, d.trim);
    };
  }

  // ---------------- monsters + bosses (drawEnemy) ----------------
  const ENEMY = {
    slime: { c: 0x6ecd5aff, r: 30 }, bat: { c: 0x966ec3ff, r: 24 }, skel: { c: 0xe4dec8ff, r: 30 },
    archer: { c: 0xcdc3a5ff, r: 30 }, imp: { c: 0xf56e3cff, r: 28 }, brute: { c: 0x7d9655ff, r: 34 },
    king: { c: 0x5ad76eff, r: 40 }, lord: { c: 0xd7cdf5ff, r: 36 }, drake: { c: 0xf05c32ff, r: 36 },
  };

  function enemy(type) {
    const def = ENEMY[type];
    const r = def.r, C = def.c, dark = mix(C, 0x000000ff, 0.35);
    const face = -Math.PI / 2, fx = Math.cos(face), fy = Math.sin(face);
    return (L) => {
      const x = 0, y = 0;
      L.ellipse(x, y - r * 0.85, r * 1.05, r * 0.38, 0x00000066, true);
      const eyes = (ey, sp, er, c = 0xffffffff, pupil = 0x101010ff) => {
        L.circle(x - sp + fx * 3, y + ey + fy * 2, er, c);
        L.circle(x + sp + fx * 3, y + ey + fy * 2, er, c);
        if (pupil) {
          L.circle(x - sp + fx * 5, y + ey + fy * 3, er * 0.5, pupil);
          L.circle(x + sp + fx * 5, y + ey + fy * 3, er * 0.5, pupil);
        }
      };
      switch (type) {
        case 'slime':
        case 'king': {
          L.ellipse(x, y - r * 0.1, r * 1.1, r * 0.9, dark);
          L.ellipse(x, y, r, r * 0.85, C);
          L.circle(x - r * 0.4, y + r * 0.35, r * 0.2, 0xffffff66);
          eyes(r * 0.15, r * 0.35, r * 0.2);
          if (type === 'king') {
            const cy = y + r * 0.85;
            L.poly([x - r * 0.6, cy, x + r * 0.6, cy, x + r * 0.7, cy + r * 0.55, x + r * 0.3, cy + r * 0.3, x, cy + r * 0.65, x - r * 0.3, cy + r * 0.3, x - r * 0.7, cy + r * 0.55], 0xffd040ff);
            L.circle(x, cy + r * 0.2, r * 0.1, 0xff3060ff);
          }
          break;
        }
        case 'bat': {
          const wy = y + r * 0.3;
          L.poly([x - r * 0.4, wy, x - r * 2.2, wy + r * 0.9, x - r * 1.6, wy - r * 0.3, x - r, wy - r * 0.1], dark);
          L.poly([x + r * 0.4, wy, x + r * 2.2, wy + r * 0.9, x + r * 1.6, wy - r * 0.3, x + r, wy - r * 0.1], dark);
          L.circle(x, y + r * 0.3, r, C);
          eyes(r * 0.4, r * 0.35, r * 0.18, 0xff4040ff, 0);
          break;
        }
        case 'skel':
        case 'archer':
        case 'lord': {
          if (type === 'lord') L.glow(x, y + r * 0.2, r * 2, 0xa070ff55);
          L.ellipse(x, y - r * 0.2, r * 0.75, r * 0.7, dark);
          L.circle(x, y + r * 0.3, r * 0.9, C);
          L.rect(x - r * 0.45, y - r * 0.35, r * 0.9, r * 0.3, C);
          eyes(r * 0.35, r * 0.35, r * 0.22, 0x1a1020ff, type === 'lord' ? 0xc070ffff : 0xff5030ff);
          L.rect(x - r * 0.3, y - r * 0.25, r * 0.12, r * 0.2, 0x1a1020cc);
          L.rect(x + r * 0.18, y - r * 0.25, r * 0.12, r * 0.2, 0x1a1020cc);
          if (type === 'archer') L.arc(x + r * 0.95, y, r * 0.9, -1.1, 1.1, 0x8a6030ff, 4);
          if (type === 'lord') {
            L.ring(x, y + r * 0.2, r * 1.35, 0xa070ff66, 5);
            L.poly([x - r * 0.75, y + r * 0.8, x - r * 1.2, y + r * 1.6, x - r * 0.35, y + r * 1.05], 0x504070ff);
            L.poly([x + r * 0.75, y + r * 0.8, x + r * 1.2, y + r * 1.6, x + r * 0.35, y + r * 1.05], 0x504070ff);
          }
          break;
        }
        case 'imp': {
          L.circle(x, y, r, dark);
          L.circle(x, y + 2, r * 0.9, C);
          L.poly([x - r * 0.7, y + r * 0.5, x - r * 0.9, y + r * 1.4, x - r * 0.2, y + r * 0.8], 0xffd060ff);
          L.poly([x + r * 0.7, y + r * 0.5, x + r * 0.9, y + r * 1.4, x + r * 0.2, y + r * 0.8], 0xffd060ff);
          eyes(r * 0.2, r * 0.33, r * 0.2, 0xfff060ff, 0x200000ff);
          break;
        }
        case 'brute': {
          L.circle(x, y, r, dark);
          L.circle(x, y + 3, r * 0.92, C);
          L.circle(x - r * 0.9, y + r * 0.1, r * 0.35, dark);
          L.circle(x + r * 0.9, y + r * 0.1, r * 0.35, dark);
          eyes(r * 0.3, r * 0.3, r * 0.14, 0xffe060ff, 0x200000ff);
          L.poly([x - r * 0.35, y - r * 0.15, x - r * 0.2, y + r * 0.2, x - r * 0.1, y - r * 0.15], 0xfff8e0ff);
          L.poly([x + r * 0.35, y - r * 0.15, x + r * 0.2, y + r * 0.2, x + r * 0.1, y - r * 0.15], 0xfff8e0ff);
          break;
        }
        case 'drake': {
          L.glow(x, y, r * 2.4, 0xff4a1a44);
          L.poly([x - r * 0.4, y + r * 0.2, x - r * 2, y + r * 1.35, x - r * 1.5, y - r * 0.2, x - r * 0.8, y - r * 0.4], 0xa03020ff);
          L.poly([x + r * 0.4, y + r * 0.2, x + r * 2, y + r * 1.35, x + r * 1.5, y - r * 0.2, x + r * 0.8, y - r * 0.4], 0xa03020ff);
          L.line(x - r * 0.6, y + r * 0.1, x - r * 1.7, y + r * 0.9, 0x6a1a10cc, r * 0.06);
          L.line(x + r * 0.6, y + r * 0.1, x + r * 1.7, y + r * 0.9, 0x6a1a10cc, r * 0.06);
          L.circle(x, y, r, dark);
          L.circle(x, y + 4, r * 0.9, C);
          L.ellipse(x, y - r * 0.25, r * 0.5, r * 0.4, 0xffb070aa, true);
          const hx = x + fx * r * 0.55, hy = y + fy * r * 0.55 + r * 0.2;
          L.poly([x - r * 0.4, y + r * 0.75, x - r * 0.6, y + r * 1.3, x - r * 0.15, y + r * 0.85], 0xffd080ff);
          L.poly([x + r * 0.4, y + r * 0.75, x + r * 0.6, y + r * 1.3, x + r * 0.15, y + r * 0.85], 0xffd080ff);
          L.circle(hx, hy, r * 0.5, C);
          eyes(r * 0.35, r * 0.28, r * 0.15, 0xffe040ff, 0x301000ff);
          L.glow(x - r * 0.28, y + r * 0.35, r * 0.25, 0xffe04066);
          L.glow(x + r * 0.28, y + r * 0.35, r * 0.25, 0xffe04066);
          break;
        }
      }
    };
  }

  // view box half-size (+ vertical offset) so each sprite fills its box
  const BOX = {
    knight: [74, -14], ranger: [62, -8], mage: [60, -12],
    slime: [44, -6], bat: [58, -8], skel: [42, -6], archer: [46, -6], imp: [44, -8], brute: [52, -4],
    king: [66, -14], lord: [64, -14], drake: [86, -18],
  };
  const HERO_ANGLE = { knight: 1.0, ranger: -0.15, mage: -Math.PI / 2 };

  function sprite(name) {
    const kind = name.replace(/^enemy:/, '');
    const box = BOX[kind];
    if (!box) return '';
    const build = HERO[kind] ? hero(kind, HERO_ANGLE[kind]) : enemy(kind);
    return svg(build, box[0], HERO[kind] ? 4 : 3.5, box[1]);
  }

  function renderAll(root) {
    (root || document).querySelectorAll('[data-sprite]').forEach((el) => {
      if (!el.firstChild) el.innerHTML = sprite(el.getAttribute('data-sprite'));
    });
  }

  window.EFSprites = { sprite, renderAll };
})();
