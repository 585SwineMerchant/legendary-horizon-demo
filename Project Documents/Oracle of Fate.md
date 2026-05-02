# Oracle of Fate

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legendary Horizon: The Quest of Fate</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;700&family=Playfair+Display:italic&display=swap" rel="stylesheet">
    <style>
        :root {
            --midnight: #0a0c10;
            --amber: #f59e0b;
            --gold: #d97706;
            --slate: #94a3b8;
            --highlight: #f1f5f9;
            --ethereal: #6366f1; /* Indigo for a mystical touch */
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--midnight);
            background-image: 
                radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 70%),
                url('https://www.transparenttextures.com/patterns/dark-matter.png');
            color: var(--highlight);
            margin: 0;
            padding: 0;
            overflow-x: hidden;
        }

        /* Prevent Google Sites horizontal scroll and force vertical flow */
        .app-shell {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 1.5rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }

        .cinzel { font-family: 'Cinzel', serif; }
        .playfair { font-family: 'Playfair Display', serif; }

        .quest-card {
            background: rgba(10, 12, 18, 0.9);
            backdrop-filter: blur(15px);
            border: 2px solid var(--gold);
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(245, 158, 11, 0.05);
            width: 100%;
        }

        /* Fate Grid Styling */
        .fate-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
            gap: 0.5rem;
            width: 100%;
        }

        .relic-box {
            aspect-ratio: 1 / 1;
            background: rgba(99, 102, 241, 0.1);
            border: 1px solid var(--ethereal);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            animation: emerge 0.4s ease-out forwards;
        }

        @keyframes emerge {
            0% { transform: translateY(10px); opacity: 0; filter: blur(5px); }
            100% { transform: translateY(0); opacity: 1; filter: blur(0); }
        }

        .relic-box:hover {
            background: var(--gold);
            color: white;
            border-color: white;
            box-shadow: 0 0 20px var(--amber);
            transform: scale(1.1);
            z-index: 10;
        }

        .amber-glow { text-shadow: 0 0 20px rgba(245, 158, 11, 0.9); }
        .mystic-glow { text-shadow: 0 0 15px rgba(99, 102, 241, 0.8); }

        .btn-oracle {
            background: linear-gradient(135deg, #4338ca 0%, #b45309 100%);
            border: 1px solid var(--amber);
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.3);
            transition: all 0.3s ease;
        }

        .btn-oracle:hover {
            box-shadow: 0 0 35px rgba(245, 158, 11, 0.5);
            transform: translateY(-2px);
        }

        .btn-oracle:active { transform: scale(0.96); }

        @keyframes rune-flicker {
            0%, 100% { opacity: 0.4; filter: blur(2px); color: var(--ethereal); }
            50% { opacity: 1; filter: blur(0); color: var(--amber); }
        }
        .rune-active { animation: rune-flicker 0.1s infinite; }

        .ritual-pulsing {
            animation: pulse-ritual 3s infinite;
        }
        @keyframes pulse-ritual {
            0% { border-color: var(--gold); box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
            50% { border-color: #fff; box-shadow: 0 0 30px rgba(245, 158, 11, 0.5); }
            100% { border-color: var(--gold); box-shadow: 0 0 15px rgba(245, 158, 11, 0.2); }
        }

        #customModal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.95);
            z-index: 1000;
            display: none;
            align-items: center;
            justify-content: center;
        }

        .fog-overlay {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
            opacity: 0;
            z-index: 10;
        }
        .fog-active { animation: fog-flash 1.2s ease-out; }
        @keyframes fog-flash {
            0% { opacity: 1; transform: scale(0.5); filter: blur(0px); }
            100% { opacity: 0; transform: scale(2); filter: blur(20px); }
        }
    </style>
</head>
<body>

    <div class="app-shell">
        <!-- The Header -->
        <header class="text-center">
            <h1 class="cinzel text-3xl md:text-5xl text-amber-500 mb-1 tracking-widest amber-glow uppercase">Quest of Fate</h1>
            <p class="playfair text-sm text-indigo-400 italic">"Gaze into the mists of your true destiny"</p>
        </header>

        <!-- The Oracle's Sanctum (Altar) -->
        <section id="oracleSanctum" class="w-full">
            <div class="quest-card p-10 rounded-3xl text-center relative overflow-hidden border-indigo-900/50">
                <div id="fogFlash" class="fog-overlay"></div>
                
                <h2 class="cinzel text-[10px] mb-8 tracking-[0.6em] text-indigo-400/60 uppercase">The Divination Chamber</h2>
                
                <div id="resultDisplay" class="mb-10 min-h-[200px] flex flex-col items-center justify-center">
                    <div id="placeholderMsg" class="cinzel text-slate-700 italic text-sm tracking-widest animate-pulse">The Oracle awaits your invocation...</div>
                    
                    <div id="activeResult" class="hidden w-full">
                        <div class="cinzel text-indigo-500 text-[10px] mb-2 tracking-widest uppercase">Destiny #<span id="resNum">0</span> Deciphered</div>
                        <div id="resSymbol" class="cinzel text-7xl text-amber-500 mb-6 amber-glow">?</div>
                        <div id="resTitle" class="cinzel text-xl text-white mb-8 uppercase tracking-[0.2em] px-4 font-bold">Whispering Winds</div>
                        <a id="resLink" href="#" target="_blank" class="cinzel inline-block bg-indigo-900 hover:bg-indigo-700 text-white font-bold py-4 px-10 rounded-full transition-all text-xs uppercase tracking-[0.3em] border border-indigo-400/30">
                            Invoke Your Quest
                        </a>
                    </div>
                </div>

                <div class="relative group">
                    <button id="spinBtn" class="cinzel btn-oracle text-lg py-6 px-12 rounded-2xl w-full max-w-sm uppercase font-black tracking-[0.3em] ritual-pulsing text-white">
                        Consult the Oracle
                    </button>
                </div>

                <div id="emptyMessage" class="hidden mt-8 text-amber-600 cinzel text-xs animate-pulse uppercase tracking-[0.4em]">
                    All threads of fate have been woven.
                </div>
            </div>
        </section>

        <!-- The Hall of Records (Chronicle) -->
        <section class="w-full">
            <div class="quest-card p-6 rounded-2xl border-indigo-900/30">
                <div class="flex justify-between items-center mb-6 px-2">
                    <h3 class="cinzel text-[10px] text-slate-500 tracking-[0.3em] uppercase">The Astral Scroll</h3>
                    <div class="text-[9px] cinzel text-indigo-400 uppercase tracking-widest">
                        Woven: <span id="claimedCount" class="text-amber-500">0</span> / 41
                    </div>
                </div>
                
                <div id="grid" class="fate-grid">
                    <!-- Echoes of Prophecy appear here -->
                </div>
            </div>
        </section>

        <footer class="flex flex-col items-center gap-4 pb-12">
            <p class="cinzel text-[8px] text-slate-600 uppercase tracking-widest">Only those with courage may claim their destiny</p>
            <button id="resetBtn" class="text-[9px] text-slate-800 hover:text-indigo-400 cinzel tracking-[0.5em] uppercase transition-all duration-700">
                Clear the Oracle's Vision
            </button>
        </footer>
    </div>

    <!-- Ritual Reset Confirmation -->
    <div id="customModal">
        <div class="quest-card p-10 rounded-2xl max-w-sm w-full text-center border-indigo-900">
            <h3 class="cinzel text-amber-500 mb-4 tracking-widest uppercase">Break the Circle?</h3>
            <p class="text-slate-400 text-xs mb-8 italic tracking-wide">The visions will vanish into the void forever.</p>
            <div class="flex flex-col gap-3">
                <button id="confirmReset" class="cinzel bg-indigo-900 hover:bg-red-900 text-white py-4 rounded-xl text-[10px] uppercase tracking-widest transition-colors">Extinguish the Sacred Flame</button>
                <button id="cancelReset" class="cinzel text-slate-600 hover:text-white py-2 text-[10px] uppercase tracking-widest">Return to the Ritual</button>
            </div>
        </div>
    </div>

    <script>
        const careerLore = {
            1: { title: "Sky-Ship Architect", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Aerospace%20Engineering%20and%20Operations%20Technologists%20and%20Technicians&onetcode=17302100&location=UNITED%20STATES" },
            2: { title: "Great-Bird Mechanist", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Aircraft%20Mechanics%20and%20Service%20Technicians&onetcode=49301100&location=UNITED%20STATES" },
            3: { title: "Citadel Designer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Architects,%20Except%20Landscape%20and%20Naval&onetcode=17101100&location=UNITED%20STATES" },
            4: { title: "Iron-Steed Artificer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Automotive%20Service%20Technicians%20and%20Mechanics&onetcode=49302300&location=UNITED%20STATES" },
            5: { title: "Life-Essence Alchemist", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Biological%20Technicians&onetcode=19402100&location=UNITED%20STATES" },
            6: { title: "Heavy-Goliath Tinkerer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Bus%20and%20Truck%20Mechanics%20and%20Diesel%20Engine%20Specialists&onetcode=49303100&location=UNITED%20STATES" },
            7: { title: "Master of Beams & Joists", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Carpenters&onetcode=47203100&location=UNITED%20STATES" },
            8: { title: "Empire Bridge-Builder", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Civil%20Engineers&onetcode=17205100&location=UNITED%20STATES" },
            9: { title: "Grand Archive Overseer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Computer%20and%20Information%20Systems%20Managers&onetcode=11302100&location=UNITED%20STATES" },
            10: { title: "Void-Net Architect", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Computer%20Network%20Architects&onetcode=15124100&location=UNITED%20STATES" },
            11: { title: "Traveler Support Sage", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Computer%20User%20Support%20Specialists&onetcode=15123200&location=UNITED%20STATES" },
            12: { title: "Deep-Wood Preservationist", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Conservation%20Scientists&onetcode=19103100&location=UNITED%20STATES" },
            13: { title: "Gate & Gear Warden", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Control%20and%20Valve%20Installers%20and%20Repairers,%20Except%20Mechanical%20Door&onetcode=49901200&location=UNITED%20STATES" },
            14: { title: "Fate-Pattern Oracle", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Data%20Scientists&onetcode=15205100&location=UNITED%20STATES" },
            15: { title: "Crystal-Vault Keeper", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Database%20Administrators&onetcode=15124200&location=UNITED%20STATES" },
            16: { title: "Guardian of the Oral Seal", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Dental%20Hygienists&onetcode=29129200&location=UNITED%20STATES" },
            17: { title: "Storm-Current Summoner", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Electricians&onetcode=47211100&location=UNITED%20STATES" },
            18: { title: "Terra-Stability Artisan", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Environmental%20Engineers&onetcode=17208100&location=UNITED%20STATES" },
            19: { title: "Purification Shield-Bearer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Environmental%20Science%20and%20Protection%20Technicians,%20Including%20Health&onetcode=19404200&location=UNITED%20STATES" },
            20: { title: "Master of Visual Illusion", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Fine%20Artists,%20Including%20Painters,%20Sculptors,%20and%20Illustrators&onetcode=27101300&location=UNITED%20STATES" },
            21: { title: "Dragon-Breath Extinguisher", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Firefighters&onetcode=33201100&location=UNITED%20STATES" },
            22: { title: "Shadow-Clue Investigator", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Forensic%20Science%20Technicians&onetcode=19409200&location=UNITED%20STATES" },
            23: { title: "Stone-Speak Whisperer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Geoscientists,%20Except%20Hydrologists%20and%20Exographers&onetcode=19204200&location=UNITED%20STATES" },
            24: { title: "Sigil & Symbol Weaver", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Graphic%20Designers&onetcode=27102400&location=UNITED%20STATES" },
            25: { title: "Thermal-Aura Harmonizer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Heating,%20Air%20Conditioning,%20and%20Refrigeration%20Mechanics%20and%20Installers&onetcode=49902100&location=UNITED%20STATES" },
            26: { title: "Forge-Efficiency Strategist", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Industrial%20Engineering%20Technologists%20and%20Technicians&onetcode=17302600&location=UNITED%20STATES" },
            27: { title: "Cyber-Fortress Sentinel", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Information%20Security%20Analysts&onetcode=15121200&location=UNITED%20STATES" },
            28: { title: "Inner-Sanctum Decorator", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Interior%20Designers&onetcode=27102500&location=UNITED%20STATES" },
            29: { title: "General Lore-Technician", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Life,%20Physical,%20and%20Social%20Science%20Technicians,%20All%20Other&onetcode=19409900&location=UNITED%20STATES" },
            30: { title: "Blood-Omen Analyzer", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Medical%20and%20Clinical%20Laboratory%20Technicians&onetcode=29201200&location=UNITED%20STATES" },
            31: { title: "Healer-Script Scribe", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Medical%20Records%20Specialists&onetcode=29207200&location=UNITED%20STATES" },
            32: { title: "Siege-Engine Mechanist", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Mobile%20Heavy%20Equipment%20Mechanics,%20Except%20Engines&onetcode=49304200&location=UNITED%20STATES" },
            33: { title: "Digital Domain Warden", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Network%20and%20Computer%20Systems%20Administrators&onetcode=15124400&location=UNITED%20STATES" },
            34: { title: "High-Tier Elixir Master", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Nurse%20Practitioners&onetcode=29117100&location=UNITED%20STATES" },
            35: { title: "Limb-Recovery Adept", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Physical%20Therapist%20Assistant&onetcode=31202100&location=UNITED%20STATES" },
            36: { title: "Water-Way Alchemist", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Plumbers,%20Pipefitters,%20and%20Steamfitters&onetcode=47215200&location=UNITED%20STATES" },
            37: { title: "Digital Runeweaver", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Software%20Developers&onetcode=15125200&location=UNITED%20STATES" },
            38: { title: "Cartographer of Lost Lands", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Surveying%20and%20Mapping%20Technicians&onetcode=17303100&location=UNITED%20STATES" },
            39: { title: "Ethereal-Scroll Maker", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Web%20Developers&onetcode=15125400&location=UNITED%20STATES" },
            40: { title: "Inferno-Weld Acolyte", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Welding,%20Soldering,%20and%20Brazing%20Machine%20Setters,%20Operators,%20and%20Tenders&onetcode=51412200&location=UNITED%20STATES" },
            41: { title: "Beast-Kin Warden", url: "https://www.careeronestop.org/Toolkit/Careers/Occupations/occupation-profile.aspx?keyword=Zoologists%20and%20Wildlife%20Biologists&onetcode=19102300&location=UNITED%20STATES" }
        };

        const ancientGlyphs = ["ᚦ", "ᚱ", "ᚼ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛝ", "ᛟ", "ᛞ", "ᚠ", "ᚢ", "ᚨ", "ᚲ", "ᚷ", "ᚹ", "ᚺ"];

        let availableNumbers = Array.from({length: 41}, (_, i) => i + 1);
        let claimedNumbers = [];
        let isSpinning = false;

        const grid = document.getElementById('grid');
        const spinBtn = document.getElementById('spinBtn');
        const resetBtn = document.getElementById('resetBtn');
        const placeholderMsg = document.getElementById('placeholderMsg');
        const activeResult = document.getElementById('activeResult');
        const resSymbol = document.getElementById('resSymbol');
        const resTitle = document.getElementById('resTitle');
        const resNum = document.getElementById('resNum');
        const resLink = document.getElementById('resLink');
        const claimedCount = document.getElementById('claimedCount');
        const fogFlash = document.getElementById('fogFlash');
        const customModal = document.getElementById('customModal');

        function updateUI() {
            claimedCount.innerText = claimedNumbers.length;
            if (availableNumbers.length === 0) {
                spinBtn.disabled = true;
                spinBtn.innerText = "Destinies Fulfilled";
                spinBtn.classList.remove('ritual-pulsing');
                spinBtn.style.opacity = "0.3";
                document.getElementById('emptyMessage').classList.remove('hidden');
            } else {
                spinBtn.disabled = false;
                spinBtn.style.opacity = "1";
                document.getElementById('emptyMessage').classList.add('hidden');
            }
        }

        function showResult(num) {
            const lore = careerLore[num];
            placeholderMsg.classList.add('hidden');
            activeResult.classList.remove('hidden');
            resNum.innerText = num;
            resSymbol.innerText = num;
            resTitle.innerText = lore.title;
            resLink.href = lore.url;
            
            fogFlash.classList.remove('fog-active');
            void fogFlash.offsetWidth; 
            fogFlash.classList.add('fog-active');
        }

        function rollFate() {
            if (isSpinning || availableNumbers.length === 0) return;
            
            isSpinning = true;
            placeholderMsg.classList.add('hidden');
            activeResult.classList.remove('hidden');
            resSymbol.classList.add('rune-active');
            resLink.style.opacity = "0.2";
            resLink.style.pointerEvents = "none";
            spinBtn.innerText = "Chanting Incantation...";

            let duration = 2000;
            let interval = 60;
            let elapsed = 0;

            const anim = setInterval(() => {
                resSymbol.innerText = ancientGlyphs[Math.floor(Math.random() * ancientGlyphs.length)];
                elapsed += interval;
                if(elapsed >= duration) {
                    clearInterval(anim);
                    finalize();
                }
            }, interval);
        }

        function finalize() {
            const idx = Math.floor(Math.random() * availableNumbers.length);
            const num = availableNumbers.splice(idx, 1)[0];
            claimedNumbers.push(num);
            
            resSymbol.classList.remove('rune-active');
            showResult(num);
            
            const tile = document.createElement('div');
            tile.className = 'relic-box cinzel rounded-lg cursor-pointer font-bold text-indigo-200';
            tile.innerText = num;
            tile.onclick = () => showResult(num);
            grid.appendChild(tile);

            resLink.style.opacity = "1";
            resLink.style.pointerEvents = "auto";
            spinBtn.innerText = "Consult the Oracle";
            
            isSpinning = false;
            updateUI();
        }

        spinBtn.addEventListener('click', rollFate);
        
        resetBtn.addEventListener('click', () => customModal.style.display = 'flex');
        document.getElementById('cancelReset').addEventListener('click', () => customModal.style.display = 'none');
        document.getElementById('confirmReset').addEventListener('click', () => {
            availableNumbers = Array.from({length: 41}, (_, i) => i + 1);
            claimedNumbers = [];
            grid.innerHTML = '';
            activeResult.classList.add('hidden');
            placeholderMsg.classList.remove('hidden');
            spinBtn.innerText = "Consult the Oracle";
            updateUI();
            customModal.style.display = 'none';
        });

        updateUI();
    </script>
</body>
</html>
```
