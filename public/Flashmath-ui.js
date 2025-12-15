export function bootFlashUI({ root, onReadyText }) {
  const KEY = "flashmath_state_v1";

  const state = load() || {
    streak: 0,
    best: 0,
    total: 0,
    correct: 0,
    last: null
  };

  root.innerHTML = `
    <div class="wrap" id="wrap">
      <header class="top">
        <div class="brand">
          <div class="name">Flash Math</div>
          <div class="sub">two taps • one answer • go</div>
        </div>
        <div class="pill" id="envPill">WEB</div>
      </header>

      <main class="panel">
        <div class="hud">
          <div class="stat"><div class="k">STREAK</div><div class="v" id="streakV">0</div></div>
          <div class="stat"><div class="k">BEST</div><div class="v" id="bestV">0</div></div>
          <div class="stat"><div class="k">ACC</div><div class="v" id="accV">—</div></div>
        </div>

        <div class="equation" id="eq">—</div>

        <div class="choices" id="choices">
          <button class="choice" id="a" type="button">—</button>
          <button class="choice" id="b" type="button">—</button>
        </div>

        <div class="row">
          <button class="ghost" id="resetBtn" type="button">reset</button>
          <div class="toast" id="toast">${onReadyText || "ready ✓"}</div>
          <button class="ghost" id="hardBtn" type="button">hard</button>
        </div>
      </main>
    </div>
  `;

  const el = {
    env: root.querySelector("#envPill"),
    wrap: root.querySelector("#wrap"),
    streakV: root.querySelector("#streakV"),
    bestV: root.querySelector("#bestV"),
    accV: root.querySelector("#accV"),
    eq: root.querySelector("#eq"),
    a: root.querySelector("#a"),
    b: root.querySelector("#b"),
    toast: root.querySelector("#toast"),
    reset: root.querySelector("#resetBtn"),
    hard: root.querySelector("#hardBtn"),
  };

  let hard = false;
  let current = null;

  function setEnv(isMini) {
    el.env.textContent = isMini ? "MINI" : "WEB";
    el.env.classList.toggle("mini", !!isMini);
  }

  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }

  function accText(){
    if (state.total === 0) return "—";
    const pct = Math.round((state.correct / state.total) * 100);
    return `${pct}%`;
  }

  function toast(msg){
    el.toast.textContent = msg;
    el.wrap.classList.remove("pop");
    void el.wrap.offsetWidth;
    el.wrap.classList.add("pop");
  }

  function buzz(ok){
    // lightweight haptic-ish feedback
    if (navigator.vibrate) navigator.vibrate(ok ? 18 : [30, 40, 30]);
  }

  function renderHud(){
    el.streakV.textContent = String(state.streak);
    el.bestV.textContent = String(state.best);
    el.accV.textContent = accText();
  }

  function randInt(a,b){ return a + Math.floor(Math.random()*(b-a+1)); }

  function makeProblem(){
    const ops = hard ? ["+","−","×"] : ["+","−"];
    const op = ops[randInt(0, ops.length-1)];

    let x,y,ans;
    if (op === "+") { x = randInt(2, hard ? 39 : 19); y = randInt(2, hard ? 39 : 19); ans = x+y; }
    if (op === "−") { x = randInt(2, hard ? 49 : 29); y = randInt(2, hard ? 29 : 19); if (y>x) [x,y]=[y,x]; ans = x-y; }
    if (op === "×") { x = randInt(2, 12); y = randInt(2, 12); ans = x*y; }

    // decoy: near the answer but not equal
    let decoy = ans + (Math.random() < 0.5 ? -1 : 1) * randInt(1, hard ? 9 : 5);
    if (decoy === ans) decoy += 2;

    const leftIsCorrect = Math.random() < 0.5;
    const A = leftIsCorrect ? ans : decoy;
    const B = leftIsCorrect ? decoy : ans;

    return { x, y, op, ans, A, B, leftIsCorrect };
  }

  function next(){
    current = makeProblem();
    el.eq.textContent = `${current.x} ${current.op} ${current.y}`;
    el.a.textContent = String(current.A);
    el.b.textContent = String(current.B);
    el.a.disabled = false;
    el.b.disabled = false;
  }

  function pick(isLeft){
    if (!current) return;
    el.a.disabled = true;
    el.b.disabled = true;

    const ok = (isLeft && current.leftIsCorrect) || (!isLeft && !current.leftIsCorrect);

    state.total += 1;
    if (ok) state.correct += 1;

    if (ok) {
      state.streak += 1;
      state.best = Math.max(state.best, state.streak);
      toast("✓");
    } else {
      state.streak = 0;
      toast("✕");
      shake();
    }
    save();
    renderHud();
    buzz(ok);
    setTimeout(next, ok ? 180 : 260);
  }

  function shake(){
    el.eq.classList.remove("shake");
    void el.eq.offsetWidth;
    el.eq.classList.add("shake");
  }

  function reset(){
    state.streak = 0;
    state.total = 0;
    state.correct = 0;
    save();
    renderHud();
    toast("reset");
    next();
  }

  function toggleHard(){
    hard = !hard;
    el.hard.textContent = hard ? "easy" : "hard";
    toast(hard ? "hard mode" : "easy mode");
    next();
  }

  el.a.addEventListener("click", () => pick(true));
  el.b.addEventListener("click", () => pick(false));
  el.reset.addEventListener("click", reset);
  el.hard.addEventListener("click", toggleHard);

  // keyboard (desktop)
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") pick(true);
    if (e.key === "ArrowRight") pick(false);
    if (e.key.toLowerCase() === "r") reset();
    if (e.key.toLowerCase() === "h") toggleHard();
  });

  renderHud();
  next();
  toast(onReadyText || "ready ✓");

  return { setEnv };
}