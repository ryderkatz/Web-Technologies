# Reflection (HW2 — Undergraduate)

**Q4(a). Example where an arrow function preserved `this`:**  
In `Game.js`, the `tick` function for `requestAnimationFrame` is declared as an arrow:
```js
this.tick = (ts) => { /* ... */ };
```
Because arrow functions **lexically bind `this`**, `this` remains the `Game` instance when `tick` is passed to `requestAnimationFrame`. A normal method would lose context unless we also did `.bind(this)`.

**Q4(b). Example where `.bind` was more appropriate than an arrow function:**  
For keyboard listeners in `Input`, we used:
```js
this._onKeyDown = this.onKeyDown.bind(this);
this._onKeyUp = this.onKeyUp.bind(this);
```
We keep exact references so we can call `removeEventListener` with the same function later in `dispose()`. Using inline arrow functions directly in `addEventListener` would make removal tricky, since each arrow would be a new function reference.

**Q4(c). If I had one more week:**  
I would add a short **sprite animation** for the farmer and maybe **moving obstacles (crows)** that reduce time on contact. I would also add simple **sound effects** and a **score combo** mechanic for collecting multiple crops quickly.
