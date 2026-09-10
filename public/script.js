// ===== SUPABASE SETUP =====
// Fill these in from your Supabase project: Settings > API
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===== PEPP-LAPPAR =====
const peppLappar = [
  "Du är det bästa som har hänt mig",
  "Jag tänkter på dig hela tiden",
  "Du gör min dga ljusare",
  "Du är så otloligt fin hjärtsat, både inuti och utanpå<3",
  "Hoppas din dag blir lika bra som du är",
  "A kiss and a hug from me🥰",
  "Du är starkare än vad du tror",
  "I miss you sooooo much baby",
  "Du äår min favoritperson i helas värdeln",
  "Allting blir bättre när jsag tänkler på dig",
  "Jag älskar dig så otroligt mycjet hjärtat<3",
  "Bara för satt jag inte skriver så betyder det inte att jg inte tänker på dig konstant",
  "You are so handsome just the way you are",
  "Jag är så lyckligt lottad övet att jag har dig i mitt liv",
  "You deserve all the kindness from the wolrd",
  "Puss på dig",
  "You are my safe space and my home",
  "Jag älskar dig så mycket<3",
  "Idag är en bra dag för att du finns",
  "You are the best!!!"
];

// ===== INLOGGNING =====
let myName = '';
let room = null;

document.getElementById('login-btn').addEventListener('click', () => {
  const name = document.getElementById('name-input').value.trim();
  if (name === '') {
    alert('Du måste skriva ett gulligt namn! 💕');
    return;
  }
  myName = name;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  document.getElementById('status-text').textContent = `Du är här som ${myName} 💕`;
  initRealtime();
  loadTheirDay();
});

document.getElementById('name-input').addEventListener('keypress', (e) => {
 if (e.key === 'Enter') document.getElementById('login-btn').click();
});

// ===== REALTIME KANAL (bubblor + meddelanden) =====
function initRealtime() {
  room = db.channel('kanslo-room', {
    config: { broadcast: { self: false } }
  });

  room.on('broadcast', { event: 'color-feeling' }, ({ payload }) => {
    renderBubble('bubble-feeling', `<strong>${payload.name}</strong> känner sig: ${payload.feeling}`, payload.color);
  });

  room.on('broadcast', { event: 'sweet-message' }, ({ payload }) => {
    renderBubble('bubble-message', `<strong>${payload.name}</strong> säger: ${payload.text}`);
  });

  room.subscribe();

  // Dagskänslor: lyssna på ändringar i tabellen och visa hens senaste
  db.channel('daily-feelings-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_feelings' }, (payload) => {
      if (payload.new && payload.new.name !== myName) {
        showTheirDay(payload.new);
      }
    })
    .subscribe();
}

async function loadTheirDay() {
  const { data, error } = await db
    .from('daily_feelings')
    .select('*')
    .neq('name', myName)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (!error && data && data.length > 0) {
    showTheirDay(data[0]);
  }
}

// ===== DAGSKOLLEN =====
document.querySelectorAll('.daily-btn').forEach(btn => {
 btn.addEventListener('click', async () => {
 const color = btn.dataset.color;
 const feeling = btn.dataset.feeling;

 // Markera vald knapp
 document.querySelectorAll('.daily-btn').forEach(b => b.classList.remove('selected'));
 btn.classList.add('selected');

 // Spara dagens datum (ISO-format, bara datum)
 const today = new Date().toISOString().split('T')[0];

 // Spara till Supabase
 await db.from('daily_feelings').upsert({
   name: myName,
   color,
   feeling,
   date: today,
   updated_at: new Date().toISOString()
 });

 // Visa bekräftelse
 const confirmEl = document.getElementById('daily-confirm');
 confirmEl.innerHTML = `💛 Du känner dig <strong>${feeling}</strong> idag!`;
 confirmEl.style.background = lightenColor(color, 40);
 confirmEl.style.border = `2px solid ${color}`;
 confirmEl.classList.remove('hidden');
 });
});

// ===== HENS DAG (visa) =====
function showTheirDay(data) {
 const container = document.getElementById('their-day-container');

 container.innerHTML = `
 <div class="their-day-display">
 <div class="their-day-color" style="background: ${data.color};"></div>
 <div>
 <div class="their-day-text"><strong>${data.name}</strong> känner sig: ${data.feeling}</div>
 <div class="their-day-date">Idag (${data.date})</div>
 </div>
 </div>
 `;
}

// ===== FÄRGBUBBLOR (realtid) =====
document.querySelectorAll('.color-btn').forEach(btn => {
 btn.addEventListener('click', () => {
 const color = btn.dataset.color;
 const feeling = btn.dataset.feeling;

 room.send({ type: 'broadcast', event: 'color-feeling', payload: { name: myName, color, feeling } });
 showLocalConfirm(`Du känner dig just nu: ${feeling} 💛`);
 });
});

// ===== GULLIGA MEDDELANDEN =====
document.getElementById('sweet-send-btn').addEventListener('click', sendSweetMessage);
document.getElementById('sweet-input').addEventListener('keypress', (e) => {
if (e.key === 'Enter') sendSweetMessage();
});

function sendSweetMessage() {
const input = document.getElementById('sweet-input');
const msg = input.value.trim();
if (msg === '') return;

room.send({ type: 'broadcast', event: 'sweet-message', payload: { name: myName, text: msg } });
showLocalConfirm(`💌 Du skickade: "${msg}"`);
input.value = '';
}

// ===== BUBBLOR (delad rendering) =====
function renderBubble(className, html, color) {
const container = document.getElementById('bubble-container');
const placeholder = container.querySelector('.placeholder-text');
if (placeholder) placeholder.remove();

const bubble = document.createElement('div');
bubble.className = `bubble ${className}`;
if (color) {
  bubble.style.borderColor = color;
  bubble.style.background = lightenColor(color, 40);
}
bubble.innerHTML = html;

const time = document.createElement('div');
time.className = 'bubble-sent';
time.textContent = `för en stund sedan`;
bubble.appendChild(time);

container.prepend(bubble);

while (container.children.length > 20) {
container.lastChild.remove();
}
}

// ===== PEPP-BURK =====
document.getElementById('pepp-btn').addEventListener('click', () => {
const randomIndex = Math.floor(Math.random() * peppLappar.length);
const lapp = peppLappar[randomIndex];

const lappEl = document.getElementById('pepp-lapp');
lappEl.textContent = `💌 ${lapp}`;
lappEl.classList.remove('hidden');
});

// ===== HJÄLPFUNKTIONER =====
function lightenColor(hex, percent) {
const num = parseInt(hex.replace('#', ''), 16);
const amt = Math.round(2.55 * percent);
const R = Math.min(255, (num >> 16) + amt);
const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
const B = Math.min(255, (num & 0x0000FF) + amt);
return `rgb(${R},${G},${B})`;
}

function showLocalConfirm(text) {
const toast = document.createElement('div');
toast.style.cssText = `
position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
background: white; padding: 12px 24px; border-radius: 16px;
box-shadow: 0 4px 16px rgba(0,0,0,0.1); font-size: 14px;
z-index: 1000; animation: fadeIn 0.3s ease; border: 2px solid #fdcb6e;
`;
toast.textContent = text;
document.body.appendChild(toast);
setTimeout(() => {
toast.style.opacity = '0';
toast.style.transition = 'opacity 0.3s';
setTimeout(() => toast.remove(), 300);
}, 2000);
}
