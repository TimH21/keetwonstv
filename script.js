// =======================================================
// KEET WONS TV - NOODOMGEVING (ZONDER FIREBASE)
// =======================================================

// 1. SLIDE SYSTEEM
let slides = document.querySelectorAll('.slide');
let idx = 0;
const TIME = 20000;
let currentNextTitleStr = "...";

function next() {
    if (!slides || slides.length === 0) return;
    
    // DE FIX: Haal eerst overal de 'active' class weg voordat we verder gaan!
    slides.forEach(s => s.classList.remove('active'));
    
    // Blijf zoeken tot we een slide vinden die NIET overgeslagen mag worden
    let attempts = 0;
    do {
        idx = (idx + 1) % slides.length;
        attempts++;
    } while (slides[idx].classList.contains('skip-slide') && attempts < slides.length);
    
    const nextSlideEl = slides[idx];
    nextSlideEl.classList.add('active');
    
    // Volgende titel voor footer
    const nextIdx = (idx + 1) % slides.length;
    let nextTitleSearch = nextIdx;
    while(slides[nextTitleSearch].classList.contains('skip-slide')) {
        nextTitleSearch = (nextTitleSearch + 1) % slides.length;
    }
    const nextTitle = slides[nextTitleSearch].getAttribute('data-title') || "...";
    currentNextTitleStr = nextTitle;
    
    const footerTitleEl = document.getElementById('footer-next-title');
    if(footerTitleEl) footerTitleEl.textContent = nextTitle;
    
    // Voortgangsbalk resetten
    let bar = document.getElementById('global-progress-bar');
    if(bar) {
        bar.style.transition = 'none'; 
        bar.style.width = '0%';
        setTimeout(() => { 
            bar.style.transition = `width ${TIME}ms linear`; 
            bar.style.width = '100%'; 
        }, 50);
    }

    // Effecten beheren (Regen e.d.)
    const fx = document.getElementById('weather-fx');
    if(fx) {
        fx.style.opacity = (nextSlideEl.id === 'slide-weather') ? '1' : '0';
    }
}

// Start de cyclus
let slideTimer = setInterval(next, TIME);
setTimeout(() => { 
    let bar = document.getElementById('global-progress-bar');
    if(bar) {
        bar.style.transition = `width ${TIME}ms linear`;
        bar.style.width = '100%';
    }
    next(); // Pak direct de eerste slide logica op
}, 100);

// ===============================================
// 2. KLOK & DATUM
// ===============================================
setInterval(() => {
    const n = new Date();
    const hours = String(n.getHours()).padStart(2, '0');
    const minutes = String(n.getMinutes()).padStart(2, '0');
    
    document.getElementById('time').innerHTML = `${hours}<span class="blink-colon">:</span>${minutes}`;
    
    const dStr = n.toLocaleDateString('nl-NL', {weekday:'long', day:'numeric', month:'long'});
    document.getElementById('date').textContent = dStr.charAt(0).toUpperCase() + dStr.slice(1);
}, 1000);

// ===============================================
// 3. STATISCHE TICKER (NIEUWSZENDER ONDERIN)
// ===============================================
let msgs = [
    "WELKOM BIJ KEET WONS", 
    "1 MUNT = € 1,50", 
    "ROKEN OF VAPEN? GA NAAR BUITEN!",
    "BETALEN KAN VIA TIKKIE OF CONTANT AAN DE BAR",
    "WEBSITE TIJDELIJK OFFLINE WEGENS ONDERHOUD",
    "LAAT PLASTIC BEKERS BINNEN!"
];
let mIdx = 0;
let tickerTickCount = 0; 

function tick() {
    const el = document.getElementById('fade-ticker');
    const footerLeft = document.querySelector('.ticker-left-next');
    if(!el) return;
    
    const footerToontAlarm = footerLeft && footerLeft.classList.contains('alarm-active');

    el.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
    el.style.opacity = 0; 
    el.style.transform = 'translateY(-15px)';
    
    setTimeout(() => {
        let currentText = "";
        let isSmokeAlert = false;

        if (footerToontAlarm && tickerTickCount % 2 !== 0) {
            currentText = `<span style="color:#48bb78">ZO METEEN:</span> ${currentNextTitleStr.toUpperCase()}`;
        } else {
            currentText = msgs[mIdx];
            if (currentText.includes("ROKEN") || currentText.includes("VAPEN")) isSmokeAlert = true;
            mIdx = (mIdx + 1) % msgs.length;
        }
        
        el.innerHTML = currentText;

        const footerBar = document.querySelector('.ticker-bar-new');
        if (isSmokeAlert) footerBar.classList.add('footer-red-wave');
        else footerBar.classList.remove('footer-red-wave');
        
        tickerTickCount++;
        
        el.style.transition = 'none'; 
        el.style.transform = 'translateY(15px)';
        void el.offsetWidth;
        
        el.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        el.style.opacity = 1; 
        el.style.transform = 'translateY(0)';
    }, 500); 
}
setInterval(tick, 6000);

// ===============================================
// 4. STATISCHE PRIJZENLIJST ZIJBALK
// ===============================================
const mainPricesList = [
    { name: 'MUNT', val: '€ 1,50' },
    { name: 'BIER / WIJN', val: '1 Munt' },
    { name: 'FRIS', val: '0,5 Munt' },
    { name: 'MIXDRANK', val: '1,5 Munt' },
    { name: 'STELZ', val: '2 Munten' },
    { name: 'SHOTJE', val: '1 Munt' },
    { name: 'SNACK', val: '1 Munt' },
    { name: '+ SAUS', val: '0,5 Munt Extra' }
];

const assortimenten = [
    { type: 'DRANKEN', items: [{name: 'Bier/Wijn/0.0', val: '1 Munt'}, {name: 'Mixdrank', val: '1,5 Munt'}, {name: 'Stelz', val: '2 Munten'}, {name: 'Shotjes', val: '1 Munt'}] },
    { type: 'FRIS', items: [{name: 'Cola / Sinas / Ice Tea', val: '0,5 Munt'}, {name: 'Water', val: '0,5 Munt'}] },
    { type: 'SNACKS', items: [
        {name: 'Snack zonder saus', val: '1 Munt'},
        {name: 'Snack met saus', val: '1,5 Munt'},
        {name: 'Patat zonder saus', val: '1 Munt'},
        {name: 'Patat met saus', val: '1,5 Munt'}
    ] }
];

let normalScrollIndex = 0;
let specificScrollIndex = 0;

function renderSpecificList(categorie) {
    const track = document.getElementById('sidebar-price-track-specific');
    const header = document.getElementById('sidebar-cat-header');
    if (!track || !header) return;

    specificScrollIndex = 0;
    track.style.transform = 'translateY(0)';
    header.innerHTML = `<span>${categorie.type}</span>`;
    
    track.innerHTML = categorie.items.map(p => `
        <div class="price-row"><span>${p.name.toUpperCase()}</span> <strong>${p.val}</strong></div>
    `).join('');
}

function startSidebarMasterController() {
    const normalTrack = document.getElementById('sidebar-price-track-normal');
    if (!normalTrack) return;

    normalTrack.innerHTML = mainPricesList.map(p => `
        <div class="price-row"><span>${p.name.toUpperCase()}</span> <strong>${p.val}</strong></div>
    `).join('');

    const normalBox = document.getElementById('sidebar-normal-box');
    const specificBox = document.getElementById('sidebar-specific-box');
    let isShowingCategory = false;

    setInterval(() => {
        if (isShowingCategory) return;
        isShowingCategory = true;
        const cat = assortimenten[Math.floor(Math.random() * assortimenten.length)];
        
        renderSpecificList(cat);
        normalBox.className = "price-normal-list-box c-panel-reveal-out";
        specificBox.style.display = 'block'; 
        specificBox.className = "price-specific-list-box c-panel-reveal-in"; 

        setTimeout(() => {
            isShowingCategory = false;
            specificBox.className = "price-specific-list-box c-panel-reveal-out";
            normalBox.className = "price-normal-list-box c-panel-reveal-in";
            setTimeout(() => { specificBox.style.display = 'none'; }, 1000);
        }, 20000); 
    }, 40000);

    setInterval(() => {
        const track = isShowingCategory ? document.getElementById('sidebar-price-track-specific') : normalTrack;
        const visibleItems = isShowingCategory ? 2 : 3; 

        if (!track || track.children.length <= visibleItems) return; 

        const item = track.children[0];
        const style = window.getComputedStyle(item);
        const margin = parseFloat(style.marginBottom) || parseFloat(style.marginTop) || 0;
        const itemHeight = item.getBoundingClientRect().height + margin;
        
        if (itemHeight === 0) return;
        track.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';

        let currentScrollIndex = isShowingCategory ? specificScrollIndex : normalScrollIndex;
        let previousIndex = currentScrollIndex;
        currentScrollIndex += 2; 
        const maxIndex = track.children.length - visibleItems; 

        if (currentScrollIndex > maxIndex) {
            currentScrollIndex = (previousIndex === maxIndex) ? 0 : maxIndex;
        }

        const totalMove = currentScrollIndex * itemHeight;
        track.style.transform = `translateY(-${totalMove}px)`;
        
        if (isShowingCategory) specificScrollIndex = currentScrollIndex; 
        else normalScrollIndex = currentScrollIndex; 

    }, 4500);
}
setTimeout(startSidebarMasterController, 3000);

// ===============================================
// 5. EXTERNE APIS: WEER (OPEN-METEO)
// ===============================================
async function getWeather() {
    try {
        const url = "https://api.open-meteo.com/v1/forecast?latitude=53.078&longitude=5.425&current_weather=true&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,windspeed_10m&timezone=Europe%2FAmsterdam";
        const res = await fetch(url);
        const d = await res.json();
        
        const curH = new Date().getHours();

        if(d.current_weather) {
            const temp = Math.round(d.current_weather.temperature);
            const wind = Math.round(d.current_weather.windspeed);
            let code = d.current_weather.weathercode;
            const isDay = d.current_weather.is_day;
            
            let currentRainAmount = 0;
            if (d.hourly && d.hourly.precipitation && d.hourly.precipitation[curH] !== undefined) {
                currentRainAmount = d.hourly.precipitation[curH];
            }
            if (currentRainAmount > 0.1 && code <= 48) code = 61;

            const fx = document.getElementById('weather-fx');
            if(fx) {
                fx.className = 'weather-fx'; 
                let effect = '';
                if (code <= 1 && isDay) effect = 'fx-sunny';       
                else if (code <= 1 && !isDay) effect = 'fx-cloudy'; 
                else if (code <= 3) effect = 'fx-cloudy';          
                else if (code >= 45 && code <= 48) effect = 'fx-fog'; 
                else if (code >= 51 && code <= 55) effect = 'fx-drizzle';
                else if (code >= 56 && code <= 57) effect = 'fx-ice';     
                else if (code >= 61 && code <= 63) effect = 'fx-rain';    
                else if (code == 65) effect = 'fx-heavy';                 
                else if (code >= 66 && code <= 67) effect = 'fx-ice';     
                else if (code >= 71 && code <= 77) effect = 'fx-snow'; 
                else if (code >= 80 && code <= 82) effect = 'fx-heavy';   
                else if (code >= 85 && code <= 86) effect = 'fx-snow'; 
                else if (code >= 95) effect = 'fx-storm';          
                if(effect) fx.classList.add(effect);
            }

            let iClass = "fa-cloud";
            if (code <= 3) iClass = isDay ? "fa-cloud-sun" : "fa-moon";
            else if (code >= 51 && code <= 67) iClass = "fa-cloud-rain";
            else if (code >= 71 && code <= 86) iClass = "fa-snowflake";
            else if (code >= 95) iClass = "fa-bolt";
            
            document.getElementById('temp').textContent = temp + "°";
            const windEl = document.getElementById('wind-sidebar');
            if(windEl) windEl.textContent = wind + " km/u";
            document.getElementById('weather-icon').className = `fa-solid ${iClass}`;

            const heroTemp = document.getElementById('hero-temp');
            if(heroTemp) {
                heroTemp.textContent = temp + "°";
                document.getElementById('hero-wind').textContent = wind + " km/u";
                document.getElementById('hero-weather-icon').innerHTML = `<i class="fa-solid ${iClass}"></i>`;
                
                if(d.hourly && d.hourly.apparent_temperature[curH] !== undefined) {
                    const feelsLike = Math.round(d.hourly.apparent_temperature[curH]);
                    const feelEl = document.getElementById('hero-feels-like');
                    if(feelEl) feelEl.innerHTML = `Gevoel: <b>${feelsLike}°</b>`;
                }
            }
        }
        renderForecast(d, curH);
    } catch(e){ console.error("Weer error:", e); }
}

function renderForecast(d, curH) {
    let rainStart = -1;
    let totalRain = 0;
    let willRain = false;
    if (d.hourly && d.hourly.precipitation) {
        for(let i = curH; i < curH + 6; i++) {
            const mm = d.hourly.precipitation[i] || 0;
            if (mm > 0.1) { 
                if (!willRain) { rainStart = i % 24; willRain = true; }
                totalRain += mm;
            }
        }
    }
    const alertBox = document.getElementById('rain-alert-box');
    const alertText = document.getElementById('rain-text');
    if(alertBox) {
        if (willRain) {
            alertBox.className = "rain-alert danger";
            const tStr = `${rainStart.toString().padStart(2,'0')}:00`;
            alertText.innerHTML = `<i class="fa-solid fa-umbrella"></i> &nbsp; REGEN VANAF <b>${tStr}</b> <span style="opacity:0.9; margin-left:5px;">(${totalRain.toFixed(1)} mm)</span>`;
        } else {
            alertBox.className = "rain-alert safe";
            alertText.innerHTML = `<i class="fa-solid fa-check-circle"></i> &nbsp; HET BLIJFT DEZE UREN DROOG`;
        }
    }

    const grid = document.getElementById('forecast-grid');
    if(grid && d.hourly) {
        grid.innerHTML = '';
        for(let i=curH; i<curH+5; i++) {
            if(!d.hourly.temperature_2m[i]) break;
            const t = Math.round(d.hourly.temperature_2m[i]);
            const prob = d.hourly.precipitation_probability[i];
            const mm = d.hourly.precipitation[i]; 
            const wind = Math.round(d.hourly.windspeed_10m[i]);
            const dispH = i % 24;
            const dispTime = `${dispH.toString().padStart(2, '0')}:00`;
            
            let icon = "fa-cloud";
            const code = d.hourly.weathercode[i];
            const isDayHour = (dispH >= 7 && dispH <= 21);
            if (prob > 30) icon = "fa-cloud-rain";
            else if (code <= 3) icon = isDayHour ? "fa-sun" : "fa-moon";
            else if (code >= 71) icon = "fa-snowflake";
            else if (code >= 95) icon = "fa-bolt";

            const rainColor = prob > 0 ? '#63b3ed' : '#888'; 
            const rainText = mm > 0 ? `${prob}% <br><span class="f-rain-mm">(${mm}mm)</span>` : `${prob}%`;
            const delay = (i - curH) * 0.1;

            grid.innerHTML += `
                <div class="f-card" style="animation: fadeInUp 0.5s ease forwards ${delay}s; opacity: 0; transform: translateY(20px);">
                    <div class="f-time">${dispTime}</div>
                    <div class="f-icon"><i class="fa-solid ${icon}"></i></div>
                    <div class="f-temp">${t}°</div>
                    <div class="f-rain" style="color:${rainColor}"> ${rainText} </div>
                    <div class="f-wind"><i class="fa-solid fa-wind" style="font-size:0.8em"></i> ${wind}</div>
                </div>
            `;
        }
    }
}
getWeather();
setInterval(getWeather, 300000);

// ===============================================
// 6. EXTERNE APIS: KNMI ALARM
// ===============================================
let isAlarmActive = false;
let currentAlarmDetails = null;

async function checkKnmiAlarm() {
    const apiKey = '576acd776b';  
    const locatie = 'Leeuwarden'; 

    try {
        const response = await fetch(`https://weerlive.nl/api/weerlive_api_v2.php?key=${apiKey}&locatie=${locatie}`);
        const text = await response.text();
        
        if (text.trim().startsWith("Vraag") || text.trim().startsWith("Gebruik")) return;

        const data = JSON.parse(text);
        if (!data.liveweer || !data.liveweer[0]) return;

        const weer = data.liveweer[0];
        const kleur = (weer.wrschklr || "groen").toLowerCase();
        const isEchtAlarm = (weer.alarm == 1);
        const isKleurAlarm = (kleur !== 'groen' && kleur !== '');

        if (isEchtAlarm || isKleurAlarm) {
            isAlarmActive = true;
            currentAlarmDetails = weer; 
            if(!currentAlarmDetails.wrschklr || currentAlarmDetails.wrschklr === '') currentAlarmDetails.wrschklr = 'geel'; 
        } else {
            isAlarmActive = false;
            currentAlarmDetails = null;
        }
        updateFooterAlarmDisplay();
    } catch (error) { console.error("KNMI Fout:", error); }
}

function updateFooterAlarmDisplay() {
    const footerLeft = document.querySelector('.ticker-left-next');
    if (!footerLeft) return;

    if (isAlarmActive && currentAlarmDetails) {
        const weer = currentAlarmDetails;
        const kleurCode = (weer.wrschklr || "geel").toLowerCase(); 
        
        let cssClass = 'alarm-geel';
        let codeNaam = 'CODE GEEL';
        if (kleurCode === 'oranje') { cssClass = 'alarm-oranje'; codeNaam = 'CODE ORANJE'; } 
        else if (kleurCode === 'rood') { cssClass = 'alarm-rood'; codeNaam = 'CODE ROOD'; }

        const bericht = weer.lkop || weer.alarmtxt || "Gevaarlijk Weer";
        const inhoud = `${codeNaam}-${bericht}`;

        if (!footerLeft.classList.contains('alarm-active') || footerLeft.dataset.lastAlarm !== inhoud) {
            footerLeft.className = `ticker-left-next alarm-active ${cssClass}`;
            footerLeft.dataset.lastAlarm = inhoud; 
            footerLeft.innerHTML = `
                <div class="alarm-content">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <span style="margin-left:15px;">${codeNaam}: ${bericht.toUpperCase()}</span>
                </div>`;
        }
    } else {
        if (footerLeft.classList.contains('alarm-active')) {
            footerLeft.className = 'ticker-left-next'; 
            footerLeft.dataset.lastAlarm = ""; 
            footerLeft.innerHTML = `
                <span class="next-label">ZO METEEN:</span>
                <span id="footer-next-title">${currentNextTitleStr}</span>
            `; 
        }
    }
}
checkKnmiAlarm(); 
setInterval(checkKnmiAlarm, 900000);

// ===============================================
// 7. EXTERNE APIS: VOETBAL (ESPN)
// ===============================================
async function getNextMatch() {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const formatDate = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}${m}${d}`;
    };

    const dateStr = `${formatDate(today)}-${formatDate(nextWeek)}`;
    const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/ned.1/scoreboard?dates=${dateStr}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const container = document.getElementById('eredivisie-list');
        let allMatches = data.events ? data.events : [];
        
        const upcomingMatches = allMatches.filter(ev => {
            const state = ev.competitions[0].status.type.state;
            return state !== 'post'; 
        });

        if (upcomingMatches.length > 0 && container) {
            container.innerHTML = '';
            upcomingMatches.slice(0, 3).forEach(event => {
                const match = event.competitions[0];
                const homeData = match.competitors.find(c => c.homeAway === 'home');
                const awayData = match.competitors.find(c => c.homeAway === 'away');

                const date = new Date(event.date);
                const now = new Date();
                const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth();
                
                const dagNummer = date.getDate();
                const maand = date.toLocaleDateString('nl-NL', { month: 'short' }).toUpperCase().replace('.', '');
                const datumTekst = `${dagNummer} ${maand}`;
                const dagNaam = isToday ? "VANDAAG" : date.toLocaleDateString('nl-NL', { weekday: 'long' }).toUpperCase();
                const tijd = date.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

                const homeLogo = homeData.team.logo || "images/logo.png";
                const awayLogo = awayData.team.logo || "images/logo.png";
                
                const homeName = shortenName(homeData.team.shortDisplayName || homeData.team.displayName);
                const awayName = shortenName(awayData.team.shortDisplayName || awayData.team.displayName);

                container.innerHTML += `
                    <div class="match-fat-row ${isToday ? 'today' : ''}">
                        <div class="mf-teams">
                            <img src="${homeLogo}" class="mf-logo" style="background:transparent; object-fit:contain;" onerror="this.style.display='none'">
                            <div class="mf-names-box">
                                <div class="mf-name">${homeName}</div>
                                <div class="mf-vs">TEGEN</div>
                                <div class="mf-name">${awayName}</div>
                            </div>
                            <img src="${awayLogo}" class="mf-logo" style="background:transparent; object-fit:contain;" onerror="this.style.display='none'">
                        </div>
                        <div class="mf-time" style="display:flex; flex-direction:column; justify-content:center; gap:0.5vh;">
                            <div style="font-size: 2vh; opacity:0.7; line-height:1;">${dagNaam}</div>
                            <div style="font-size: 2.5vh; font-weight:900; line-height:1;">${datumTekst}</div>
                            <div style="font-size: 3.5vh; margin-top:0.5vh; color:${isToday ? 'black' : '#e74c3c'};">${tijd}</div>
                        </div>
                    </div>
                `;
            });
        } else {
            if(container) container.innerHTML = '<h2 style="color:#aaa;">GEEN WEDSTRIJDEN</h2>';
        }
    } catch (error) { console.error("⚽ Fout:", error); }
}

function shortenName(name) {
    return name.replace('SC ', '').replace('FC ', '').replace('AFC ', '')
        .replace('Heracles Almelo', 'Heracles').replace('Fortuna Sittard', 'Fortuna')
        .replace('Go Ahead Eagles', 'GA Eagles').replace('Sparta Rotterdam', 'Sparta')
        .replace('Almere City FC', 'Almere').replace('PEC Zwolle', 'PEC')
        .replace('RKC Waalwijk', 'RKC').replace('NEC', 'N.E.C.').toUpperCase();
}
getNextMatch();
setInterval(getNextMatch, 3600000);

// ===============================================
// 8. ANTI-SLAAPSTAND (FIRE STICK HACK)
// ===============================================
function preventSleepMode() {
    const wakeVideo = document.getElementById('keepAwake');
    if (wakeVideo) wakeVideo.play().catch(e => { console.log("Video autoplay blokkade"); });

    if ('wakeLock' in navigator) {
        try {
            navigator.wakeLock.request('screen').then(lock => {
                document.addEventListener('visibilitychange', async () => {
                    if (lock !== null && document.visibilityState === 'visible') navigator.wakeLock.request('screen');
                });
            });
        } catch (err) { console.error(`Wake Lock mislukt`); }
    }
}
preventSleepMode();
document.addEventListener('click', preventSleepMode, { once: true });

// ===============================================
// 9. LOKALE ADMIN CONTROLLER (MUIS BEDIENING)
// ===============================================
let mouseTimer;
let isAdminMenuOpen = false;
let isPaused = false;

// 1. Luister naar de muis
document.addEventListener('mousemove', () => {
    const btn = document.getElementById('local-admin-btn');
    if (btn && !isAdminMenuOpen) {
        btn.classList.add('visible'); // Laat knop zien
        
        clearTimeout(mouseTimer); // Reset de wekker
        
        // Verberg weer na 5 seconden
        mouseTimer = setTimeout(() => {
            btn.classList.remove('visible');
        }, 5000);
    }
});

// 2. Open / Sluit het menu
function toggleAdminMenu() {
    const modal = document.getElementById('local-admin-modal');
    const btn = document.getElementById('local-admin-btn');
    isAdminMenuOpen = !isAdminMenuOpen;

    if (isAdminMenuOpen) {
        modal.style.display = 'flex';
        btn.classList.add('visible');
        clearTimeout(mouseTimer); // Blijf permanent zichtbaar als menu open is
    } else {
        modal.style.display = 'none';
        mouseTimer = setTimeout(() => { btn.classList.remove('visible'); }, 5000); // Start timer weer
    }
}

// 3. Wijzigingen toepassen
function updateLocalSettings() {
    // Kleur aanpassen
    const color = document.getElementById('admin-color').value;
    document.querySelector('.bg-layer').style.backgroundColor = color;

    // Sidebar aanpassen
    const sidebar = document.getElementById('admin-sidebar').value;
    const widget = document.getElementById('sidebar-widget');
    const icon = document.getElementById('sw-icon');
    const label = document.getElementById('sw-label');
    const text = document.getElementById('sw-text');

    widget.className = 'sidebar-widget'; // reset oude klasses

    if (sidebar === 'status') {
        widget.classList.add('sw-green');
        icon.className = 'fa-solid fa-door-open';
        label.textContent = 'STATUS';
        text.textContent = 'OPEN';
    } else if (sidebar === 'frituur') {
        widget.classList.add('sw-orange');
        icon.className = 'fa-solid fa-utensils';
        label.textContent = 'FRITUUR';
        text.textContent = 'AAN';
    } else if (sidebar === 'knmi') {
        widget.classList.add('sw-yellow');
        icon.className = 'fa-solid fa-triangle-exclamation';
        label.textContent = 'KNMI';
        text.textContent = 'VEILIG'; 
        checkKnmiAlarm(); // Roep functie aan voor live update
    }
}

// 4. Pauzeknop logica
function togglePause() {
    const btn = document.getElementById('btn-pause');
    isPaused = !isPaused;
    
    if (isPaused) {
        clearInterval(slideTimer);
        btn.innerHTML = "Hervat Rotatie ▶️";
        btn.style.background = "#e74c3c";
        document.getElementById('footer-next-title').textContent = "GEPAUZEERD";
    } else {
        slideTimer = setInterval(next, TIME);
        btn.innerHTML = "Pauzeer Rotatie ⏸️";
        btn.style.background = "#333";
        document.getElementById('footer-next-title').textContent = currentNextTitleStr;
    }
}
