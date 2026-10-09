import { latestPrices, convert } from "./rates.js";

const PRICES_URL = "https://interview.switcheo.com/prices.json";
const ICON_URL = (c) => `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${ICONS[c] ?? c}.svg`;
// The feed upper-cases these; the icon repo uses their real casing.
const ICONS = { RATOM: "rATOM", STATOM: "stATOM", STEVMOS: "stEVMOS", STLUNA: "stLUNA", STOSMO: "stOSMO" };

const $ = (id) => document.getElementById(id);
const fromInput = $("input-amount");
const toInput = $("output-amount");
const submit = $("submit");
const picker = $("picker");
const search = $("search");
const list = $("token-list");

const fmt = (n, digits = 6) =>
  n.toLocaleString("en-US", { maximumFractionDigits: n >= 1 ? Math.min(digits, 4) : digits });
const usd = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

let prices = new Map();
const state = { from: "ETH", to: "USDC", edited: "from", pickingFor: null, busy: false };

function icon(currency, size = "size-6") {
  const img = document.createElement("img");
  img.src = ICON_URL(currency);
  img.alt = "";
  img.className = `${size} shrink-0 rounded-full`;
  // Fall back to a letter badge if the icon is missing.
  img.onerror = () => img.replaceWith(Object.assign(document.createElement("span"), {
    className: `${size} shrink-0 grid place-items-center rounded-full bg-linear-135 from-violet-500 to-teal-400 text-xs font-bold`,
    textContent: currency[0],
  }));
  return img;
}

function renderTokenButtons() {
  for (const btn of document.querySelectorAll(".token-btn")) {
    const c = state[btn.dataset.side];
    btn.replaceChildren(icon(c), Object.assign(document.createElement("span"), { textContent: c }), chevron());
    btn.setAttribute("aria-label", `${btn.dataset.side === "from" ? "Send" : "Receive"} token: ${c}. Change`);
  }
}

function chevron() {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("width", "16");
  s.setAttribute("height", "16");
  s.setAttribute("class", "text-slate-400");
  s.innerHTML = '<path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  return s;
}

// Returns a number, NaN for garbage, or null for empty.
function parse(value) {
  if (value.trim() === "") return null;
  return /^\d*\.?\d*$/.test(value) && value !== "." ? Number(value) : NaN;
}

function update() {
  const [src, dst] = state.edited === "from" ? [fromInput, toInput] : [toInput, fromInput];
  const amount = parse(src.value);
  const pFrom = prices.get(state.from);
  const pTo = prices.get(state.to);
  const ready = pFrom && pTo;

  let error = "";
  if (Number.isNaN(amount)) error = "Please enter a valid number.";
  else if (amount !== null && amount > 0 && amount < 1e-12) error = "Amount is too small.";

  if (ready && amount && !error) {
    const out = state.edited === "from" ? convert(amount, pFrom, pTo) : convert(amount, pTo, pFrom);
    dst.value = Number(out.toPrecision(10)).toString();
  } else {
    dst.value = "";
  }

  const sendAmt = parse(fromInput.value);
  const recvAmt = parse(toInput.value);
  $("from-usd").textContent = ready && sendAmt > 0 ? usd(sendAmt * pFrom) : "";
  $("to-usd").textContent = ready && recvAmt > 0 ? usd(recvAmt * pTo) : "";
  $("rate").textContent = ready ? `1 ${state.from} ≈ ${fmt(pFrom / pTo)} ${state.to}` : "";

  $("error").textContent = error;
  src.classList.toggle("text-rose-400", !!error);
  dst.classList.remove("text-rose-400");

  const valid = ready && sendAmt > 0 && !error;
  submit.disabled = !valid || state.busy;
  if (!state.busy) {
    submit.textContent = !prices.size ? "Loading prices…" : error ? "Fix the amount" : valid ? "Confirm swap" : "Enter an amount";
  }
}

function onType(e) {
  // Accept commas as decimal separators and strip anything that's not a number.
  e.target.value = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
  state.edited = e.target === fromInput ? "from" : "to";
  update();
}

function openPicker(side) {
  state.pickingFor = side;
  search.value = "";
  renderList();
  picker.showModal();
  search.focus();
}

function renderList() {
  const q = search.value.trim().toUpperCase();
  const current = state[state.pickingFor];
  const items = [...prices.keys()]
    .filter((c) => c.toUpperCase().includes(q))
    .sort((a, b) => a.localeCompare(b, "en", { sensitivity: "base" }))
    .map((c) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "option";
      btn.ariaSelected = String(c === current);
      btn.className = `flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer outline-none hover:bg-white/5 focus-visible:bg-white/5 ${c === current ? "bg-violet-500/15" : ""}`;
      btn.append(icon(c, "size-8"), Object.assign(document.createElement("span"), { className: "flex-1 font-semibold", textContent: c }),
        Object.assign(document.createElement("span"), { className: "text-sm text-slate-400", textContent: usd(prices.get(c)) }));
      btn.onclick = () => pick(c);
      li.append(btn);
      return li;
    });
  list.replaceChildren(...(items.length ? items : [Object.assign(document.createElement("li"), { className: "p-6 text-center text-slate-400", textContent: "No tokens found" })]));
}

function pick(currency) {
  const side = state.pickingFor;
  const other = side === "from" ? "to" : "from";
  // Picking the token already on the other side flips the pair instead of erroring.
  if (state[other] === currency) state[other] = state[side];
  state[side] = currency;
  picker.close();
  renderTokenButtons();
  update();
}

function flip() {
  [state.from, state.to] = [state.to, state.from];
  [fromInput.value, toInput.value] = [toInput.value, fromInput.value];
  state.edited = state.edited === "from" ? "to" : "from";
  renderTokenButtons();
  update();
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.replace("opacity-0", "opacity-100");
  t.classList.replace("translate-y-5", "translate-y-0");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    t.classList.replace("opacity-100", "opacity-0");
    t.classList.replace("translate-y-0", "translate-y-5");
  }, 3500);
}

async function onSubmit(e) {
  e.preventDefault();
  if (submit.disabled) return;
  const summary = `Swapped ${fmt(parse(fromInput.value))} ${state.from} for ${fmt(parse(toInput.value))} ${state.to}`;
  state.busy = true;
  submit.disabled = true;
  submit.classList.add("animate-pulse");
  submit.textContent = "Swapping…";
  // shortcut: no backend exists, so the swap is simulated with a delay; replace with the real API call.
  await new Promise((r) => setTimeout(r, 1400));
  state.busy = false;
  submit.classList.remove("animate-pulse");
  fromInput.value = toInput.value = "";
  update();
  toast(summary);
}

async function loadPrices() {
  try {
    const res = await fetch(PRICES_URL);
    if (!res.ok) throw new Error(res.status);
    prices = latestPrices(await res.json());
    if (!prices.has(state.from)) state.from = prices.keys().next().value;
    if (!prices.has(state.to) || state.to === state.from) state.to = [...prices.keys()].find((c) => c !== state.from);
    renderTokenButtons();
    update();
  } catch {
    submit.textContent = "Prices unavailable";
    $("error").textContent = "Couldn't load prices. Check your connection and reload.";
  }
}

fromInput.addEventListener("input", onType);
toInput.addEventListener("input", onType);
document.querySelectorAll(".token-btn").forEach((b) => (b.onclick = () => openPicker(b.dataset.side)));
$("flip").onclick = flip;
search.addEventListener("input", renderList);
// Enter in search picks the first match.
search.addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); list.querySelector("button")?.click(); }
});
picker.addEventListener("click", (e) => e.target === picker && picker.close());
$("swap-form").addEventListener("submit", onSubmit);

renderTokenButtons();
update();
loadPrices();
