// =======================================================
// 0. KEET WONS TV - NOODOMGEVING (ZONDER FIREBASE)
// =======================================================

// ===============================================
// 1. ATOMIC CLOCK SLIDE SYSTEEM (MET HANDMATIGE BEDIENING)
// ===============================================
let slideTimer;
const DEFAULT_TIME = 20000;
let globalTimeOffset = 0; 
let pauseStartTime = 0;   
let isPaused = false;            // DEZE WAS WEG!
let currentNextTitleStr = "..."; // DEZE WAS OOK WEG!

function syncScreens() {
    const allActiveSlides = Array.from(document.querySelectorAll('.slide:not(.skip-slide)'));
    if (allActiveSlides.length === 0) return;

    let totalCycleMs = 0;
    const timings = [];
    allActiveSlides.forEach(slide => {
        const dur = parseInt(slide.getAttribute('data-time')) || DEFAULT_TIME;
        timings.push({ el: slide, duration: dur });
        totalCycleMs += dur;
    });

    let now = Date.now();
    
    // Als we gepauzeerd zijn, loopt de tijd voor de diashow niet verder
    if (isPaused) {
        globalTimeOffset -= (now - pauseStartTime);
        pauseStartTime = now;
    }

    let elapsedInCycle = (now + globalTimeOffset) % totalCycleMs;
    if (elapsedInCycle < 0) elapsedInCycle += totalCycleMs;

    let currentSlideIdx = 0;
    for (let i = 0; i < timings.length; i++) {
        if (elapsedInCycle < timings[i].duration) {
            currentSlideIdx = i;
            break;
        }
        elapsedInCycle -= timings[i].duration;
    }

    const currentSlide = timings[currentSlideIdx].el;
    const timeRemaining = timings[currentSlideIdx].duration - elapsedInCycle;

    document.querySelectorAll('.slide').forEach(s => s.classList.remove('active'));
    currentSlide.classList.add('active');
    // ACTIVEER FULLSCREEN EN JOURNAAL MODUS VOOR KNMI & OMROP
    const m = new Date();
    const isTopOfHour = m.getMinutes() < 5; // Eerste 5 minuten van het uur

    // Dynamische tijdsverlenging voor het elk-uur-journaal instellen in de loop
    timings.forEach(t => {
        if (t.el.id === 'slide-omrop' && isTopOfHour) {
            t.duration = 65000; // Geef het journaal een dikke minuut leestijd!
        }
    });

    if (currentSlide.id === 'slide-knmi') {
        document.body.classList.add('fullscreen-mode');
    } else {
        document.body.classList.remove('fullscreen-mode');
    }

    // Specifieke Omrop Logica triggeren bij activatie
    if (currentSlide.id === 'slide-omrop') {
        const slideEl = document.getElementById('slide-omrop');
        if (isTopOfHour) {
            slideEl.classList.add('journaal-active');
            document.getElementById('omrop-mode-badge').textContent = "LIVESTREAM KEET-JOURNAAL";
            renderOmropJournaal();
        } else {
            slideEl.classList.remove('journaal-active');
            document.getElementById('omrop-mode-badge').textContent = "LIVE NIJSFEER";
            startOmrop112Sequence();
        }
    } else {
        stopOmropSequences(); // Rust op de achtergrond als de slide weg is
    }

    const nextIdx = (currentSlideIdx + 1) % timings.length;
    const nextTitle = timings[nextIdx].el.getAttribute('data-title') || "...";
    const footerTitleEl = document.getElementById('footer-next-title');
    
    if (footerTitleEl) {
        if (isPaused) footerTitleEl.textContent = "GEPAUZEERD";
        else footerTitleEl.textContent = nextTitle;
    }

    let bar = document.getElementById('global-progress-bar');
    if (bar) {
        bar.style.transition = 'none';
        let startPercentage = (elapsedInCycle / timings[currentSlideIdx].duration) * 100;
        bar.style.width = startPercentage + '%';
        
        if (!isPaused) {
            setTimeout(() => {
                bar.style.transition = `width ${timeRemaining}ms linear`;
                bar.style.width = '100%';
            }, 50);
        }
    }

    clearTimeout(slideTimer);
    if (!isPaused) {
        slideTimer = setTimeout(syncScreens, timeRemaining);
    }
}
setTimeout(syncScreens, 200);

// ===============================================
// 2. BEDIENINGSKNOPPEN & TIJD EN DATUM
// ===============================================

setInterval(() => {
    const n = new Date();
    const hours = String(n.getHours()).padStart(2, '0');
    const minutes = String(n.getMinutes()).padStart(2, '0');
    
    const timeEl = document.getElementById('time');
    if (timeEl) timeEl.innerHTML = `${hours}<span class="blink-colon">:</span>${minutes}`;
    
    const dStr = n.toLocaleDateString('nl-NL', {weekday:'long', day:'numeric', month:'long'});
    const dateEl = document.getElementById('date');
    if (dateEl) dateEl.textContent = dStr.charAt(0).toUpperCase() + dStr.slice(1);
}, 1000);

// BEDIENINGSKNOPPEN (AGRESSIEVE FORCE NEXT)
window.next = function() {
    const allActiveSlides = Array.from(document.querySelectorAll('.slide:not(.skip-slide)'));
    const currentActive = document.querySelector('.slide.active');
    if(!currentActive || allActiveSlides.length === 0) return;
    
    // Pak de duur van de dia waar we nu op zitten
    let dur = parseInt(currentActive.getAttribute('data-time')) || DEFAULT_TIME;
    
    // Geef de wereldwijde tijdlijn een zet van precies één dia-lengte
    globalTimeOffset += dur;
    
    if (isPaused) pauseStartTime = Date.now();
    syncScreens();
};

window.togglePause = function() {
    const btn = document.getElementById('btn-pause');
    isPaused = !isPaused;
    
    if (isPaused) {
        pauseStartTime = Date.now();
        clearTimeout(slideTimer);
        btn.innerHTML = "Hervat Rotatie ▶️";
        btn.style.background = "#2ecc71"; // Groen om weer aan te zetten
        btn.style.color = "black";
        
        let bar = document.getElementById('global-progress-bar');
        if (bar) {
            let currentWidth = window.getComputedStyle(bar).width;
            bar.style.transition = 'none';
            bar.style.width = currentWidth; // Bevries de neon balk
        }
        document.getElementById('footer-next-title').textContent = "GEPAUZEERD";
    } else {
        btn.innerHTML = "Pauzeer Rotatie ⏸️";
        btn.style.background = "#333";
        btn.style.color = "white";
        syncScreens(); // Start motor weer op
    }
};

// ===============================================
// 3. STATISCHE TICKER (NIEUWSZENDER ONDERIN)
// ===============================================
let msgs = [
    "WELKOM BIJ KEET WONS", 
    "1 MUNT = € 1,50", 
    "ROKEN OF VAPEN? GA NAAR BUITEN!",
    "BETALEN KAN VIA PIN OF CONTANT AAN DE BAR",
    "WEBSITE TIJDELIJK OFFLINE WEGENS TECHNISCHE PROBLEMEN",
    "LAAT PLASTIC BEKERS BINNEN!",
    "HEB JIJ AL DE NIEUWE ZONNEBRIL?",
    "VOLG ONS OP TIKTOK, INSTA & FACEBOOK!",
    "BRENG LEGE FLESJES EN BLIKJES TERUG NAAR DE BAR!"
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
// 4. STATISCHE PRIJZENLIJST ZIJBALK (SCROLL FIX)
// ===============================================
const mainPricesList = [
    { name: 'MUNT', val: '€ 1,50' },
    { name: 'BIER / WIJN / 0.0', val: '1 Munt' },
    { name: 'MIXDRANK', val: '1,5 Munt' },
    { name: 'STELZ', val: '2 Munten' },
    { name: 'SHOTJE', val: '1 Munt' },
    { name: 'FRIS', val: '0,5 Munt' },
    { name: 'SNACK (ZONDER SAUS)', val: '1 Munt' },
    { name: 'SNACK (MET SAUS)', val: '1,5 Munt' }
];

let normalScrollIndex = 0;

// STATISCHE PRIJZENLIJST ZIJBALK (PRECISIE SCROLL)
function startSidebarMasterController() {
    const normalTrack = document.getElementById('sidebar-price-track-normal');
    const container = document.querySelector('.train-ticker-sub-container');
    if (!normalTrack || !container) return;

    // We dwingen elk vakje om EXACT 1/3e van de beschikbare ruimte in te nemen
    const exactRowHeight = container.clientHeight / 3;

    normalTrack.innerHTML = mainPricesList.map(p => `
        <div class="price-row" style="height: ${exactRowHeight}px; margin-bottom: 0; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between;">
            <span>${p.name}</span> <strong>${p.val}</strong>
        </div>
    `).join('');

    setInterval(() => {
        const trackHeight = normalTrack.scrollHeight;
        const viewHeight = container.clientHeight;
        const maxScroll = trackHeight - viewHeight;

        if (maxScroll <= 5) {
            normalTrack.style.transform = 'translateY(0)';
            normalScrollIndex = 0; // Index netjes resetten!
            return;
        }

        // De stapgrootte is nu precies de hoogte van één vakje
        const step = exactRowHeight; 
        
        normalTrack.style.transition = 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
        
        normalScrollIndex++;
        let targetY = normalScrollIndex * step;

        if (targetY > maxScroll + 5) { // Extra marge voor de reset
            normalScrollIndex = 0;
            targetY = 0;
        } else if (targetY > maxScroll) {
            targetY = maxScroll;
        }

        normalTrack.style.transform = `translateY(-${targetY}px)`;
    }, 5000); 
}
// Start de scroll motor na 3 seconden
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
// 6. EXTERNE APIS: KNMI ALARM & SMART SCANNER
// ===============================================
let isAlarmActive = false;
let currentAlarmDetails = null;

async function checkKnmiAlarm() {
    const apiKey = '576acd776b';  
    const locatie = 'Leeuwarden'; 

    try {
        const response = await fetch(`https://weerlive.nl/api/weerlive_api_v2.php?key=${apiKey}&locatie=${locatie}`);
        if (!response.ok) throw new Error("Netwerkfout bij KNMI API");
        
        const text = await response.text();
        if (text.trim().startsWith("Vraag") || text.trim().startsWith("Gebruik")) return;

        const data = JSON.parse(text);
        if (!data.liveweer || !data.liveweer[0]) return;

        const weer = data.liveweer[0];
        const kleur = (weer.wrschklr || "groen").toLowerCase();
        const isEchtAlarm = (weer.alarm == 1);
        const isKleurAlarm = (kleur !== 'groen' && kleur !== '');

        const wrapper = document.getElementById('slide-knmi');
        const titelEl = document.getElementById('knmi-title');
        const infoEl = document.getElementById('knmi-info');
        const iconBox = document.getElementById('knmi-icons');

        if (isEchtAlarm || isKleurAlarm) {
            isAlarmActive = true;
            currentAlarmDetails = weer; 
            if(!currentAlarmDetails.wrschklr || currentAlarmDetails.wrschklr === '') currentAlarmDetails.wrschklr = 'geel'; 
            
            // --- KNMI SLIDE AANZETTEN (Smart Scanner) ---
            if (wrapper) {
                wrapper.classList.remove('skip-slide'); // Haal hem uit de verberg-modus
                const codeTxt = currentAlarmDetails.wrschklr.toLowerCase();
                const alertText = currentAlarmDetails.lkop || currentAlarmDetails.alarmtxt || "Gevaarlijk weer op komst. Blijf alert.";
                
                // Zet de juiste kleur-class op de slide (knmi-geel, knmi-oranje, etc)
                wrapper.className = `slide knmi-${codeTxt}`;
                if (titelEl) titelEl.textContent = `CODE ${codeTxt.toUpperCase()}`;
                if (infoEl) infoEl.textContent = alertText;

                // De Woord-Scanner voor de iconen!
                const textToAnalyze = alertText.toLowerCase();
                let activeIcons = [];

                if (textToAnalyze.includes("onweer") || textToAnalyze.includes("bliksem")) activeIcons.push('<i class="fa-solid fa-bolt" style="color:#f1c40f;"></i>');
                if (textToAnalyze.includes("regen") || textToAnalyze.includes("neerslag")) activeIcons.push('<i class="fa-solid fa-cloud-showers-heavy" style="color:#3498db;"></i>');
                if (textToAnalyze.includes("hagel")) activeIcons.push('<i class="fa-solid fa-cloud-meatball" style="color:#ecf0f1;"></i>');
                if (textToAnalyze.includes("wind") || textToAnalyze.includes("storm") || textToAnalyze.includes("stoten")) activeIcons.push('<i class="fa-solid fa-wind" style="color:#bdc3c7;"></i>');
                if (textToAnalyze.includes("sneeuw") || textToAnalyze.includes("winter")) activeIcons.push('<i class="fa-regular fa-snowflake" style="color:#fff;"></i>');
                if (textToAnalyze.includes("glad") || textToAnalyze.includes("ijzel")) activeIcons.push('<i class="fa-solid fa-icicles" style="color:#81ecec;"></i>');
                if (textToAnalyze.includes("mist")) activeIcons.push('<i class="fa-solid fa-smog" style="color:#95a5a6;"></i>');
                if (textToAnalyze.includes("hitte") || textToAnalyze.includes("warmte")) activeIcons.push('<i class="fa-solid fa-temperature-arrow-up" style="color:#e74c3c;"></i>');

                if (activeIcons.length === 0) activeIcons.push('<i class="fa-solid fa-triangle-exclamation" style="color:#fff;"></i>');
                
                if (iconBox) iconBox.innerHTML = activeIcons.join('');
            }
        } else {
            isAlarmActive = false;
            currentAlarmDetails = null;
            // --- KNMI SLIDE VERBERGEN ALS HET VEILIG IS ---
            if (wrapper) wrapper.classList.add('skip-slide');
        }
        
        updateFooterAlarmDisplay(); // Update de Ticker balk onderin
    } catch (error) { 
        console.error("KNMI Fout:", error); 
    }
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
setInterval(checkKnmiAlarm, 900000); // Check elke 15 minuten

// ===============================================
// 7. EXTERNE APIS: VOETBAL (WK 2026 FIFA WORLD CUP)
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
    // NIEUW: fifa.world API in plaats van ned.1
    const apiUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${dateStr}`;

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
            if(container) container.innerHTML = '<h2 style="color:#aaa;">GEEN WEDSTRIJDEN DEZE WEEK</h2>';
        }
    } catch (error) { console.error("⚽ Fout:", error); }
}

function shortenName(name) {
    // Korte namen voor landen om het strak te houden
    return name.replace('United States', 'USA')
               .replace('South Korea', 'Zuid-Korea')
               .replace('Netherlands', 'Nederland')
               .toUpperCase();
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

// 1. Luister naar de muis
document.addEventListener('mousemove', () => {
    const btn = document.getElementById('local-admin-btn');
    const closeBtn = document.getElementById('local-calamity-close-btn');
    
    if (!isAdminMenuOpen) {
        if (btn) btn.classList.add('visible'); 
        if (closeBtn) closeBtn.classList.add('visible'); 
        
        clearTimeout(mouseTimer); 
        
        mouseTimer = setTimeout(() => {
            if (btn) btn.classList.remove('visible');
            if (closeBtn) closeBtn.classList.remove('visible'); 
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
        clearTimeout(mouseTimer); 
    } else {
        modal.style.display = 'none';
        mouseTimer = setTimeout(() => { btn.classList.remove('visible'); }, 5000); 
    }
}

// 3. Wijzigingen toepassen
function updateLocalSettings() {
    const color = document.getElementById('admin-color').value;
    document.querySelector('.bg-layer').style.backgroundColor = color;

    const sidebar = document.getElementById('admin-sidebar').value;
    const widget = document.getElementById('sidebar-widget');
    const icon = document.getElementById('sw-icon');
    const label = document.getElementById('sw-label');
    const text = document.getElementById('sw-text');

    widget.className = 'sidebar-widget';

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
        checkKnmiAlarm(); 
    }
}

// ==========================================
// 🚨 COMPLETE KEET MATRIX ENGINE (OFFLINE)
// ==========================================

const MATRIX_OORZAKEN_GROUPED = [
    {
        title: "🆘 Incidenten & Veiligheid", color: "#e53e3e",
        items: [
            { label: "🆘 Medisch Incident", val: "een medisch incident", type: "event" },
            { label: "🚑 Ongeval", val: "een ongeval", type: "event" },
            { label: "🔥 Brand / Rook", val: "brand of rookontwikkeling", type: "event" },
            { label: "🚨 Afgaande Melder", val: "een afgaande brandmelder", type: "event" },
            { label: "🤛 Geweldpleging", val: "een incident met geweldpleging", type: "event" },
            { label: "🧨 Vandalisme", val: "vernieling of vandalisme", type: "event" },
            { label: "⚠️ Incident Elders", val: "een incident elders op het terrein", type: "event" },
            { label: "❓ Onbekend Incident", val: "een onbekend incident", type: "event" },
            { label: "🥷 Diefstal", val: "diefstal", type: "event" },
            { label: "🧍‍♂️ Overvolle Keet", val: "een overvolle keet en kans op verdrukking", type: "event" }
        ]
    },
    {
        title: "👮 Op Last Van...", color: "#d69e2e",
        items: [
            { label: "🌾 Grondeigenaar", val: "de grondeigenaar", type: "person" },
            { label: "🏠 Ecohûs", val: "Ecohûs", type: "person" },
            { label: "🚓 Hulpdiensten", val: "de hulpdiensten", type: "person" },
            { label: "👮 Politie", val: "de politie", type: "person" },
            { label: "⚖️ Handhaving", val: "de handhaving", type: "person" },
            { label: "🤝 Bestuur Keet Wûns", val: "het bestuur van Keet Wûns", type: "person" },
            { label: "🏘️ Omwonenden", val: "omwonenden", type: "person" }
        ]
    },
    {
        title: "🔌 Techniek & Storingen", color: "#805ad5",
        items: [
            { label: "🔌 Stroomuitval", val: "stroomuitval", type: "event" },
            { label: "🌐 Internetstoring", val: "een internetstoring", type: "event" },
            { label: "🚰 Water- of Gaslek", val: "een vermoedelijk water- of gaslek", type: "event" },
            { label: "⚙️ Technische Problemen", val: "technische problemen", type: "event" },
            { label: "🚧 Urgente Werkzaamheden", val: "urgente werkzaamheden", type: "event" },
            { label: "🔨 Werkzaamheden Binnen", val: "werkzaamheden binnen de keet", type: "event" },
            { label: "🚜 Werkzaamheden Buiten", val: "werkzaamheden buiten de keet", type: "event" },
            { label: "🔥 Kachel / Verwarming Storing", val: "een storing aan de kachel of verwarming", type: "event" }
        ]
    },
    {
        title: "🌿 Natuur & Omgeving", color: "#38a169",
        items: [
            { label: "⛈️ Noodweer", val: "noodweer", type: "event" },
            { label: "⚡ Onweer", val: "onweer", type: "event" },
            { label: "🌡️ Extreme Hitte", val: "extreme hitte", type: "event" },
            { label: "🌊 Wateroverlast", val: "wateroverlast", type: "event" },
            { label: "💨 Stank / Geur", val: "stank- of geurhinder", type: "event" },
            { label: "🧹 Schoonmaak", val: "schoonmaakwerkzaamheden", type: "event" },
            { label: "☕ Pauze Personeel", val: "een pauze van het personeel", type: "event" }
        ]
    },
    {
        title: "📄 Algemeen & Huisregels", color: "#718096",
        items: [
            { label: "🌙 Einde Avond", val: "het einde van de avond", type: "event" },
            { label: "⏰ Vroege Sluiting", val: "een vroege sluiting van de keet", type: "event" },
            { label: "🎉 Evenement / Feest", val: "een besloten evenement", type: "event" },
            { label: "🛑 Huisregels", val: "overtreding van de huisregels", type: "event" },
            { label: "🔍 Gevonden Voorwerp", val: "een gevonden voorwerp", type: "event" },
            { label: "🚕 Taxi Gearriveerd", val: "gearriveerd vervoer", type: "event" },
            { label: "🍕 Voedselbezorging", val: "de bezorging van eten of snacks", type: "event" }
        ]
    }
];

const MATRIX_GEVOLGEN_GROUPED = [
    {
        title: "✅ Geen / Standaard", color: "#718096",
        items: [
            { label: "✅ Geen specifiek gevolg", val: "", type: "none" }
        ]
    },
    {
        title: "🔌 Techniek & Storingen", color: "#805ad5",
        items: [
            { label: "🔌 Stroomuitval", val: "een stroomuitval", type: "situation" },
            { label: "🌐 Geen WiFi", val: "het uitvallen van het WiFi-netwerk", type: "situation" },
            { label: "💡 Defecte Verlichting", val: "defecte verlichting", type: "situation" },
            { label: "🔊 Defect Geluid/Muziek", val: "een storing in de geluidsapparatuur", type: "situation" },
            { label: "⚙️ Defecte Apparatuur", val: "defecte apparatuur", type: "situation" },
            { label: "❄️ Defecte Koelkasten", val: "defecte koelkasten", type: "situation" },
            { label: "🚽 Defecte / Gesloten WC", val: "een gesloten of defecte sanitaire voorziening", type: "situation" },
            { label: "🍟 Frituur / Keuken Defect", val: "een defect aan de frituur of keukenapparatuur", type: "situation" }
        ]
    },
    {
        title: "🍺 Bar, Kassa & Regels", color: "#3182ce",
        items: [
            { label: "💻 Storing Kassasysteem", val: "een storing in het kassasysteem", type: "situation" },
            { label: "💳 Alleen Pinnen", val: "het dat er tijdelijk uitsluitend gepind kan worden", type: "situation" },
            { label: "🪙 Alleen Contant", val: "het tijdelijk uitsluitend contant betaald kan worden", type: "situation" },
            { label: "🛑 Stop Alcoholverkoop", val: "het tijdelijk stopzetten van de alcoholverkoop", type: "situation" },
            { label: "🍺 Geen Bier & Fris", val: "een tekort aan bier en fris in de koelkasten", type: "situation" },
            { label: "🏃 Onderbezetting Bar", val: "onderbezetting van het barpersoneel", type: "situation" },
            { label: "💰 Facturen Afbetalen", val: "uw openstaande facturen direct te voldoen", type: "action" },
            { label: "🆔 Legitimatie Tonen", val: "uw legitimatiebewijs gereed te houden", type: "action" },
            { label: "🍻 Glazen Inleveren", val: "alle lege glazen en flessen direct in te leveren bij de bar", type: "action" }
        ]
    },
    {
        title: "🚗 Logistiek & Voertuigen", color: "#2d3748",
        items: [
            { label: "🚑 Weg Vrijmaken", val: "de toegangsweg direct vrij te maken voor hulpdiensten", type: "action" },
            { label: "🚪 Nooduitgangen Vrij", val: "alle nooduitgangen direct vrij te maken", type: "action" },
            { label: "🚗 Auto's Betonpad Weg", val: "uw auto op het betonpad richting de windmolen te verplaatsen", type: "action" },
            { label: "🚗 Auto's Uitgang Weg", val: "uw auto voor de uitgang te verplaatsen", type: "action" },
            { label: "🚲 Fietsen Betonpad Weg", val: "uw fiets op het betonpad richting de windmolen te verplaatsen", type: "action" },
            { label: "🚲 Fietsen Uitgang Weg", val: "uw fiets voor de uitgang te verplaatsen", type: "action" }
        ]
    },
    {
        title: "🤫 Gedrag & Overig", color: "#d69e2e",
        items: [
            { label: "🔕 Muziek Zachter/Uit", val: "het verzoek om de muziek tijdelijk uit te zetten", type: "situation" },
            { label: "🤫 Stilte Buiten", val: "buiten stilte te bewaren om overlast te voorkomen", type: "action" },
            { label: "🚭 Buiten Roken", val: "uitsluitend buiten te roken of vapen", type: "action" },
            { label: "❌ Niet Op Terrein Ecohûs", val: "om niet het terrein van Ecohûs te betreden", type: "action" }
        ]
    }
];

let matrixOorzaak = null;
let matrixGevolg = null;

// NIEUW: Functie die het menu bouwt (wordt direct aangeroepen!)
function initMatrixMenu() {
    const oorzaakBox = document.getElementById('matrix-col-oorzaak');
    const gevolgBox = document.getElementById('matrix-col-gevolg');
    if (!oorzaakBox || !gevolgBox) return;

    // 1. Teken Oorzaken 
    let oorzaakHtml = MATRIX_OORZAKEN_GROUPED.map(cat => {
        const buttons = cat.items.map(o => `
            <button class="cal-btn" style="background:${cat.color}; color:white; border:none; margin-bottom:5px;" onclick="selectMatrixPart('oorzaak', this, '${o.val}')">${o.label}</button>
        `).join('');
        return `<details style="margin-bottom: 10px; border: 1px solid ${cat.color}; border-radius: 8px; background: white;"><summary style="padding: 10px; cursor: pointer; font-weight: bold; color: ${cat.color}; list-style: none; display: flex; justify-content: space-between;"><span>${cat.title}</span> <span>▼</span></summary><div style="padding: 10px; display: flex; flex-direction: column;">${buttons}</div></details>`;
    }).join('');

    oorzaakHtml += `
        <div style="margin-top: 15px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
            <label style="font-size:0.8rem; font-weight:bold; color:#4a5568;">✍️ ANDERS, NAMELIJK:</label>
            <input type="text" id="manual-oorzaak" class="input-field" placeholder="Typ eigen oorzaak..." oninput="kiesHandmatigeOorzaak(this.value)" style="width:100%; margin-top:5px; border:1px solid #cbd5e0; padding:8px; border-radius:5px;">
        </div>`;
    oorzaakBox.innerHTML = oorzaakHtml;

    // 2. Teken Gevolgen
    let gevolgHtml = MATRIX_GEVOLGEN_GROUPED.map(cat => {
        const buttons = cat.items.map(o => `
            <button class="cal-btn" style="background:${cat.color}; color:white; border:none; margin-bottom:5px;" onclick="selectMatrixPart('gevolg', this, '${o.val}')">${o.label}</button>
        `).join('');
        return `<details style="margin-bottom: 10px; border: 1px solid ${cat.color}; border-radius: 8px; background: white;"><summary style="padding: 10px; cursor: pointer; font-weight: bold; color: ${cat.color}; list-style: none; display: flex; justify-content: space-between;"><span>${cat.title}</span> <span>▼</span></summary><div style="padding: 10px; display: flex; flex-direction: column;">${buttons}</div></details>`;
    }).join('');

    gevolgHtml += `
        <div style="margin-top: 15px; border-top: 2px solid #e2e8f0; padding-top: 15px;">
            <label style="font-size:0.8rem; font-weight:bold; color:#4a5568;">✍️ ANDERS, NAMELIJK:</label>
            <input type="text" id="manual-gevolg" class="input-field" placeholder="Typ eigen gevolg/situatie..." oninput="kiesHandmatigGevolg(this.value)" style="width:100%; margin-top:5px; border:1px solid #cbd5e0; padding:8px; border-radius:5px;">
        </div>`;
    gevolgBox.innerHTML = gevolgHtml;
}

// ROEP DE FUNCTIE DIRECT AAN!
initMatrixMenu();

// Standaard knoppen selectie
window.selectMatrixPart = function(type, btn, waarde) {
    const container = type === 'oorzaak' ? 'matrix-col-oorzaak' : 'matrix-col-gevolg';
    document.querySelectorAll(`#${container} .cal-btn`).forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    if (type === 'oorzaak') {
        const alleOorzaken = MATRIX_OORZAKEN_GROUPED.flatMap(c => c.items);
        matrixOorzaak = alleOorzaken.find(o => o.val === waarde);
        document.getElementById('manual-oorzaak').value = ''; 
    } else {
        const alleGevolgen = MATRIX_GEVOLGEN_GROUPED.flatMap(c => c.items);
        matrixGevolg = alleGevolgen.find(g => g.val === waarde);
        document.getElementById('manual-gevolg').value = ''; 
    }
    updateMatrixPreview();
};

window.kiesHandmatigeOorzaak = function(val) {
    document.querySelectorAll('#matrix-col-oorzaak .cal-btn').forEach(b => b.classList.remove('selected'));
    if(val.trim() === "") { matrixOorzaak = null; } 
    else { matrixOorzaak = { val: val.trim(), type: "event", label: "✍️ " + val.trim() }; }
    updateMatrixPreview();
};

window.kiesHandmatigGevolg = function(val) {
    document.querySelectorAll('#matrix-col-gevolg .cal-btn').forEach(b => b.classList.remove('selected'));
    if(val.trim() === "") { matrixGevolg = null; } 
    else { matrixGevolg = { val: val.trim(), type: "situation" }; }
    updateMatrixPreview();
};

function buildCalamitySentence(oorzaak, gevolg, actionType, customInstr) {
    if (!oorzaak) return "Kies of typ eerst een oorzaak om de zin te bouwen...";

    let zin = "";
    const oCaps = oorzaak.val.toUpperCase();
    const gCaps = gevolg && gevolg.val ? gevolg.val.toUpperCase() : "";

    let aanloop = oorzaak.type === "person" ? `Op verzoek van **${oCaps}**` : `In verband met **${oCaps}**`;
    let midden = "";
    let heeftGevolg = gevolg && gevolg.type !== "none";

    if (heeftGevolg) {
        if (gevolg.type === "situation") midden = ` melden wij dat er sprake is van **${gCaps}**.`;
        else if (gevolg.type === "action") midden = ` is er het dringende verzoek om **${gCaps}**.`;
    }

    let slot = "";
    const excuses = "<br><br>Onze excuses voor het ongemak.";

    if (actionType) {
        if (actionType === 'verlaat') {
            slot = heeftGevolg ? ` Daarbij wordt er verzocht om de keet direct rustig te **VERLATEN** via de dichtstbijzijnde uitgang.${excuses}` : ` wordt er verzocht om de keet direct rustig te **VERLATEN** via de dichtstbijzijnde uitgang.${excuses}`;
        } else if (actionType === 'binnen') {
            slot = heeftGevolg ? ` Daarbij is het verzoek om **BINNEN TE BLIJVEN** tot de situatie verholpen is.${excuses}` : ` is het verzoek om **BINNEN TE BLIJVEN** tot de situatie verholpen is.${excuses}`;
        } else if (actionType === 'dicht-full') {
            slot = heeftGevolg ? ` Hierdoor is de bar momenteel **GESLOTEN**.${excuses}` : ` is de bar momenteel **GESLOTEN**.${excuses}`;
        } else if (actionType === 'dicht-side') {
            slot = heeftGevolg ? ` Hierdoor is de bar tijdelijk gesloten.` : ` is de bar tijdelijk gesloten.`;
        } else if (actionType === 'info-side' || actionType === 'info-full') {
            slot = heeftGevolg ? ` Bedankt voor de medewerking.` : ` vragen wij jouw aandacht voor deze mededeling. Bedankt voor de medewerking.`;
        } else if (actionType === 'verlichting') {
            slot = heeftGevolg ? ` Deze schermen dienen als **NOODVERLICHTING**.` : ` dienen deze schermen als **NOODVERLICHTING**.`;
        }
    } else {
        if (!heeftGevolg) slot = " <i>... (kies rechts een uitzend-actie om de zin af te maken)</i>";
    }

    let finalZin = "";
    if (!actionType) {
        finalZin = zin + aanloop + midden + slot; 
    } else {
        if (actionType === 'dicht-side' || actionType === 'info-side') {
            finalZin = aanloop + midden + slot;
        } else {
            finalZin = zin + aanloop + midden + slot;
        }
    }

    if (customInstr && customInstr.trim() !== "") {
        let extraTekst = ` **${customInstr.trim().toUpperCase()}**.`;
        if (finalZin.includes(excuses)) {
            finalZin = finalZin.replace(excuses, extraTekst + excuses);
        } else {
            finalZin += extraTekst;
        }
    }

    return finalZin;
}

window.updateMatrixPreview = function() {
    const preview = document.getElementById('matrix-preview');
    const buttons = document.getElementById('matrix-action-buttons');
    
    if (!matrixOorzaak) {
        preview.innerHTML = "Kies of typ eerst een oorzaak om de zin te bouwen...";
        buttons.style.opacity = "0.3"; buttons.style.pointerEvents = "none";
        return;
    }

    const instrVeld = document.getElementById('calamity-custom-instruction');
    const customInstr = instrVeld ? instrVeld.value : "";
    const previewZin = buildCalamitySentence(matrixOorzaak, matrixGevolg, null, customInstr);

    preview.innerHTML = `<small>VOORVERTONING:</small><br><strong style="font-size: 1.1rem; line-height: 1.4;">${previewZin}</strong>`;
    buttons.style.opacity = "1";
    buttons.style.pointerEvents = "all";
};

window.zendCalamiteitMatrix = function(actionType) {
    const overlay = document.getElementById('calamity-overlay');

    // Verberg het rode kruisje weer!
    const closeBtn = document.getElementById('local-calamity-close-btn');
    if (closeBtn) closeBtn.style.display = 'none';
    if (actionType === 'geen') {
        if(!confirm("Weet je zeker dat je alle noodschermen op veilig/normaal wilt zetten?")) return;
        overlay.style.display = 'none'; 
        overlay.innerHTML = ''; 
        overlay.classList.remove('calamity-white-mode');
        resetCalamityModal();
        return;
    }

    const instrVeld = document.getElementById('calamity-custom-instruction');
    const customInstr = instrVeld ? instrVeld.value : "";
    const finalMsg = buildCalamitySentence(matrixOorzaak, matrixGevolg, actionType, customInstr);
    const timeInput = document.getElementById('calamity-time-input').value;
    const cleaneTitel = matrixOorzaak.label.split(' ').slice(1).join(' ').trim() || matrixOorzaak.val;

    let payload = {
        eindTijd: timeInput || null,
        scenarioTekst: cleaneTitel, 
        icoon: getIcoonVoorScenario(matrixOorzaak.val),
        tekst: finalMsg,
        whiteMode: false
    };

    if (actionType === 'verlaat') {
        payload.kleur = '#e53e3e'; payload.animatie = 'verlaten'; payload.categorie = 'VERLAAT DE KEET';
    } else if (actionType === 'binnen') {
        payload.kleur = '#e53e3e'; payload.animatie = 'binnen'; payload.categorie = 'BLIJF BINNEN';
    } else if (actionType === 'dicht-full' || actionType === 'dicht-side') {
        payload.kleur = '#d69e2e'; payload.animatie = 'dicht'; payload.categorie = 'BAR GESLOTEN';
    } else if (actionType === 'info-side' || actionType === 'info-full') {
        payload.kleur = '#3182ce'; payload.categorie = 'MEDEDELING'; payload.animatie = 'info';
    } else if (actionType === 'verlichting') {
        payload.kleur = '#ffffff'; payload.whiteMode = true; payload.categorie = 'NOODVERLICHTING'; payload.animatie = 'info';
    }

    if (!confirm(`Direct op dit scherm tonen?\n\n"${finalMsg.replace(/<br>/g, '\n')}"`)) return;

    toonLokaleCalamiteit(payload);
    document.getElementById('calamity-control-modal').style.display = 'none';
};

function toonLokaleCalamiteit(data) {
    const overlay = document.getElementById('calamity-overlay');
    const msg = (data.tekst || "").replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    if (data.whiteMode) overlay.classList.add('calamity-white-mode');
    else overlay.classList.remove('calamity-white-mode');

    let mainIcon = 'fa-triangle-exclamation'; 
    if (data.animatie === 'verlaten') mainIcon = 'fa-person-walking-dashed-line-arrow-right'; 
    else if (data.animatie === 'binnen') mainIcon = 'fa-person-shelter';
    else if (data.animatie === 'dicht') mainIcon = 'fa-lock';
    else if (data.animatie === 'info' || data.whiteMode) mainIcon = 'fa-circle-info';
    else if (data.icoon) mainIcon = data.icoon; 

    overlay.innerHTML = `
        <div class="hazard-border top"></div>
        <div class="calamity-content-box">
            <i class="fa-solid ${mainIcon} calamity-icon-huge"></i>
            <div class="calamity-text-wrapper">
                <h1 class="calamity-title">${data.categorie}</h1>
                <div class="calamity-text">${msg}</div>
                ${data.eindTijd ? `<div class="calamity-time">Verwachting: tot ca. ${data.eindTijd} uur</div>` : ''}
            </div>
        </div>
        <div class="hazard-border bottom"></div>
    `;
    
    overlay.style.backgroundColor = data.kleur;
    overlay.style.display = 'flex';
    // Toon het rode kruisje!
    const closeBtn = document.getElementById('local-calamity-close-btn');
    if (closeBtn) closeBtn.style.display = 'flex';
}

function getIcoonVoorScenario(tekst) {
    const t = tekst.toLowerCase();
    if (t.includes('brand') || t.includes('rook')) return 'fa-fire';
    if (t.includes('medisch') || t.includes('ongeval') || t.includes('ehbo')) return 'fa-truck-medical';
    if (t.includes('geweld') || t.includes('verdrukking') || t.includes('vandalisme')) return 'fa-triangle-exclamation';
    if (t.includes('stroom')) return 'fa-bolt';
    if (t.includes('internet') || t.includes('wifi')) return 'fa-wifi';
    if (t.includes('verlichting')) return 'fa-lightbulb';
    if (t.includes('geluid') || t.includes('muziek') || t.includes('stilte')) return 'fa-volume-xmark';
    if (t.includes('koelkast')) return 'fa-snowflake';
    if (t.includes('wc') || t.includes('sanitair')) return 'fa-restroom';
    if (t.includes('kassa') || t.includes('pin') || t.includes('contant')) return 'fa-cash-register';
    if (t.includes('bier') || t.includes('fris') || t.includes('alcohol') || t.includes('glazen')) return 'fa-beer-mug-empty';
    if (t.includes('weer') || t.includes('water') || t.includes('noodweer')) return 'fa-cloud-showers-water';
    if (t.includes('hitte')) return 'fa-temperature-high';
    if (t.includes('stank') || t.includes('geur') || t.includes('gaslek')) return 'fa-wind';
    if (t.includes('roken') || t.includes('vapen')) return 'fa-ban-smoking';
    if (t.includes('schoonmaak')) return 'fa-broom';
    if (t.includes('auto') || t.includes('hulpdiensten') || t.includes('weg vrijmaken')) return 'fa-car';
    if (t.includes('fiets')) return 'fa-bicycle';
    if (t.includes('gevonden')) return 'fa-magnifying-glass';
    if (t.includes('taxi') || t.includes('vervoer')) return 'fa-taxi';
    if (t.includes('legitimatie') || t.includes('id')) return 'fa-id-card';
    if (t.includes('politie') || t.includes('handhaving')) return 'fa-building-shield';
    if (t.includes('personeel') || t.includes('omwonenden') || t.includes('bestuur') || t.includes('huisregels')) return 'fa-users';
    if (t.includes('einde') || t.includes('sluiting') || t.includes('nooduitgang')) return 'fa-door-open';
    if (t.includes('kachel') || t.includes('verwarming') || t.includes('hitte')) return 'fa-temperature-high';
    if (t.includes('eten') || t.includes('voedsel') || t.includes('pizza') || t.includes('snack') || t.includes('frituur')) return 'fa-pizza-slice';
    return 'fa-circle-exclamation';
}

function resetCalamityModal() {
    document.querySelectorAll('.cal-btn').forEach(b => b.classList.remove('selected'));
    matrixOorzaak = null; 
    matrixGevolg = null;
    const previewBox = document.getElementById('matrix-preview');
    if (previewBox) previewBox.innerHTML = "Kies een oorzaak en gevolg om de zin te bouwen...";
    const actieKnoppen = document.getElementById('matrix-action-buttons');
    if (actieKnoppen) { actieKnoppen.style.opacity = "0.3"; actieKnoppen.style.pointerEvents = "none"; }
    const timeInput = document.getElementById('calamity-time-input');
    if(timeInput) timeInput.value = '';
    document.getElementById('calamity-control-modal').style.display = 'none';
}

// ===============================================
// 10. EXTERNE APIS: LIVE OMROP FRYSLÂN NIJSFEER
// ===============================================
let omropAllNews = [];
let omrop112News = [];
let omropNormalNews = [];
let current112BatchStart = 0;
let omropSequenceTimers = [];
let lastRandomArticleIndex = 0;

async function fetchOmropFryslanNews() {
    const rssFeedUrl = 'https://www.omropfryslan.nl/rss/nijs.xml';
    const apiUrl = `https://corsproxy.io/?${encodeURIComponent(rssFeedUrl)}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Omrop API weigert de verbinding");
        
        const textData = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(textData, "text/xml");
        const items = xmlDoc.querySelectorAll("item");

        if (items.length > 0) {
            omropAllNews = Array.from(items).map(item => ({
                title: item.querySelector("title").textContent.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
                description: item.querySelector("description") ? item.querySelector("description").textContent.replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : ""
            }));
        } else {
            throw new Error("Lege feed ontvangen");
        }
    } catch (e) {
        console.warn("Omrop Fryslân Error:", e);
        return; // Stop hier als het misgaat, zo blijft het oude nieuws gewoon staan
    }
        
    // REGEX WOORDSCANNER (Voorkomt dat 'Sybrand' wordt gezien als 'brand')
    const keywords112 = /\b(112|ûngelok|ongeluk|plysje|politie|brân|brand|brânwar|brandweer|trauma|arrest|botsing|ûngemak|gewond|sikehûs|ziekenhuis|spoar|spoor|ferkear|verkeer)\b/i;
    
    omrop112News = [];
    omropNormalNews = [];

    omropAllNews.forEach(item => {
        let rawTitle = item.title;
        let cleanDescText = (item.description || "").replace(/<[^>]*>/g, '').trim();

        // 1. FILTER DE 'LUIE' OMROP TEKSTEN ERUIT
        if (cleanDescText.toLowerCase().includes("hjir fynst in oersjoch") || cleanDescText.toLowerCase().includes("hier vind je een overzicht")) {
            cleanDescText = "Foar dizze melding is gjin gearfetting beskikber. Sjoch op de webside as yn de app fan Omrop Fryslân foar alle krekte details en updates oer dizze situaasje.";
        }

        let searchStr = (rawTitle + " " + cleanDescText);
        let is112 = keywords112.test(searchStr) || rawTitle.includes("112");

        if (is112 && rawTitle.includes('|')) {
            let subTitles = rawTitle.split('|');
            subTitles.forEach(subTitle => {
                let cleanSub = subTitle.trim();
                if (cleanSub.length > 5) {
                    omrop112News.push({
                        cleanTitle: cleanSub,
                        cleanDesc: "Sjoch foar de folsleine details en it lêste nijs fan dizze 112-melding op de webside of yn de app fan Omrop Fryslân."
                    });
                }
            });
        } 
        else if (is112) {
            omrop112News.push({
                cleanTitle: rawTitle,
                cleanDesc: cleanDescText // 2. TEKSTEN WORDEN NIET MEER AFGEHAKT!
            });
        } 
        else {
            omropNormalNews.push({
                cleanTitle: rawTitle,
                cleanDesc: cleanDescText
            });
        }
    });

    // 3. GEEN VERWARRING MEER: EEN VAST BERICHT ALS ER GEEN 112 NIEUWS IS
    if (omrop112News.length === 0) {
        omrop112News.push({
            cleanTitle: "GJIN AKTUEL 112-NIJS",
            cleanDesc: "Op dit stuit binne der gjin grutte 112-meldingen as needgefallen yn Fryslân. Hâld de kanalen fan Omrop Fryslân yn 'e gaten foar eventuele updates."
        });
    }

    rotateRandomArticle();
}

function rotateRandomArticle() {
    if (omropNormalNews.length === 0) return;
    let idx = Math.floor(Math.random() * omropNormalNews.length);
    let art = omropNormalNews[idx];
    
    const container = document.getElementById('omrop-random-article');
    if (container) {
        container.innerHTML = `
            <h3 class="art-title">${art.cleanTitle}</h3>
            <p class="art-body">${art.cleanDesc}</p>
        `;
    }
}

fetchOmropFryslanNews();
setInterval(fetchOmropFryslanNews, 900000);
setInterval(rotateRandomArticle, 180000);

function startOmrop112Sequence() {
    stopOmropSequences(); 
    
    const track = document.getElementById('omrop-112-track');
    if (!track || omrop112News.length === 0) return;

    let batch = omrop112News.slice(current112BatchStart, current112BatchStart + 5);
    if (batch.length === 0) {
        current112BatchStart = 0; 
        batch = omrop112News.slice(0, 5);
    }

    track.innerHTML = batch.map((art, i) => `
        <div class="omrop-112-item" id="omrop-item-${i}">
            <h4>${art.cleanTitle}</h4>
            <p>${art.cleanDesc}</p>
        </div>
    `).join('');

    track.style.transition = 'none';
    track.style.transform = 'translateY(0)';

    let scrollDuration = 6000;
    track.style.transition = `transform ${scrollDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    track.style.transform = 'translateY(-15vh)';

    omropSequenceTimers.push(setTimeout(() => {
        track.style.transition = 'transform 1s ease-in-out';
        track.style.transform = 'translateY(0)';
    }, scrollDuration / 2));

    let currentItemIdx = 0;
    
    function expandNextItem() {
        document.querySelectorAll('.omrop-112-item').forEach(el => el.classList.remove('expanded'));
        
        let targetItem = document.getElementById(`omrop-item-${currentItemIdx}`);
        if (targetItem) {
            targetItem.classList.add('expanded');
            
            let textLength = targetItem.innerText.length;
            let readTime = Math.max(5000, textLength * 55); 
            
            currentItemIdx++;
            if (currentItemIdx < batch.length) {
                omropSequenceTimers.push(setTimeout(expandNextItem, readTime));
            }
        }
    }

    omropSequenceTimers.push(setTimeout(expandNextItem, scrollDuration + 1000));

    current112BatchStart += 5;
}

// HET ELK-UUR-JOURNAAL COMPILEREN (MODUS B)
function renderOmropJournaal() {
    const listContainer = document.getElementById('omrop-journaal-list');
    if (!listContainer || omropAllNews.length === 0) return;

    // Pak de top 5 allerlaatste headlines uit Friesland
    let topNews = omropAllNews.slice(0, 5);
    
    listContainer.innerHTML = topNews.map((art, i) => {
        // Genereer een fictief live-tijdstip
        let currentHour = new Date().getHours();
        let minutePlaceholder = 55 - (i * 12);
        if (minutePlaceholder < 0) minutePlaceholder = "02";
        let timeStr = `${String(currentHour).padStart(2,'0')}:${String(minutePlaceholder).padStart(2,'0')}`;

        // FIX: Gebruik art.title en art.description, en kap te lange tekst netjes af
        let veiligeTekst = (art.description || "").replace(/<[^>]*>/g, '').trim();
        if (veiligeTekst.length > 160) veiligeTekst = veiligeTekst.substring(0, 160) + "...";

        return `
            <div class="journaal-row">
                <div class="jr-time">${timeStr}</div>
                <div class="jr-body">
                    <b>${art.title}</b>
                    <span>${veiligeTekst}</span>
                </div>
            </div>
        `;
    }).join('');
}
function stopOmropSequences() {
    omropSequenceTimers.forEach(t => clearTimeout(t));
    omropSequenceTimers = [];
}
