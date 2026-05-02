# Vault of Runes

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Legendary Horizon: Manifest of Destiny</title>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        :root {
            --midnight: #0a0c10;
            --amber: #f59e0b;
            --gold: #d97706;
            --slate: #94a3b8;
            --highlight: #f1f5f9;
            --ethereal: #6366f1;
            --leather: #1a1412;
        }

        body {
            background-color: var(--midnight);
            background-image: 
                radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 75%),
                url('https://www.transparenttextures.com/patterns/dark-matter.png');
            color: var(--highlight);
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 10px;
            display: flex;
            justify-content: center;
            min-height: 100vh;
        }

        .document-container {
            width: 100%;
            max-width: 900px;
            background: rgba(10, 12, 16, 0.95);
            backdrop-filter: blur(10px);
            border: 2px solid var(--gold);
            padding: 20px;
            margin: 20px 0;
            position: relative;
            box-shadow: 0 0 40px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(99, 102, 241, 0.1);
        }

        @media (min-width: 768px) {
            .document-container { padding: 40px; }
            body { padding: 20px; }
        }

        header {
            text-align: center;
            border-bottom: 1px solid var(--ethereal);
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        h1 {
            font-family: 'Cinzel', serif;
            color: var(--amber);
            text-transform: uppercase;
            letter-spacing: 5px;
            font-size: 1.8rem;
            margin: 0;
            text-shadow: 0 0 15px rgba(245, 158, 11, 0.6);
        }

        .subtitle {
            font-family: 'Playfair Display', serif;
            font-style: italic;
            color: var(--ethereal);
            font-size: 1rem;
            margin-top: 8px;
            letter-spacing: 1px;
        }

        .instructions {
            background: rgba(99, 102, 241, 0.05);
            border-left: 4px solid var(--ethereal);
            padding: 20px;
            margin-bottom: 40px;
            font-size: 0.95rem;
            line-height: 1.6;
            color: var(--slate);
        }

        .instructions span {
            color: var(--amber);
            font-weight: 600;
            font-family: 'Cinzel', serif;
            font-size: 0.8rem;
            letter-spacing: 1px;
        }

        .grid-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 20px;
            justify-items: center;
            padding-bottom: 40px;
        }

        .fate-slot {
            position: relative;
            width: 80px;
            height: 100px;
            background: var(--leather);
            border-radius: 4px 6px 6px 4px;
            border-left: 8px solid #2d2421;
            box-shadow: 
                3px 3px 10px rgba(0,0,0,0.6),
                inset -1px 0 3px rgba(255,255,255,0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overflow: visible;
        }

        .fate-slot::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 1px;
            background: rgba(217, 119, 6, 0.2);
            z-index: 2;
        }

        .fate-slot:hover {
            transform: translateY(-5px) scale(1.1);
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
            z-index: 10;
        }

        .fate-slot.discovered {
            background: #1e1b2e;
            border-left-color: #3b3561;
            box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
        }

        .slot-number {
            font-family: 'Cinzel', serif;
            color: var(--slate);
            font-size: 0.7rem;
            position: absolute;
            top: 5px;
            right: 8px;
            opacity: 0.6;
        }

        .rune-display {
            font-size: 2.2rem;
            color: var(--ethereal);
            filter: drop-shadow(0 0 5px rgba(99, 102, 241, 0.3));
            transition: all 0.3s;
            user-select: none;
        }

        .fate-slot:hover .rune-display {
            color: var(--amber);
            filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.5));
            animation: runePulse 1.5s infinite;
        }

        .fate-slot.discovered .rune-display {
            color: var(--amber);
            filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.4));
        }

        @keyframes runePulse {
            0% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.1); filter: brightness(1.5); }
            100% { transform: scale(1); filter: brightness(1); }
        }

        footer {
            margin-top: 60px;
            text-align: center;
            font-size: 0.7rem;
            color: var(--slate);
            border-top: 1px solid rgba(99, 102, 241, 0.1);
            padding-top: 20px;
            letter-spacing: 2px;
        }

        .divider {
            color: var(--amber);
            margin: 0 10px;
        }
    </style>
</head>
<body>

<div class="document-container">
    <header>
        <h1>Vault of the Ancient Runes</h1>
        <div class="subtitle">Quest of Fate</div>
    </header>

    <div class="instructions">
        === <span>THE RITUAL OF RECORDS</span> ===<br>
        Traveler, the Oracle has spoken. Once your <span>Destiny Number</span> has been deciphered in the Divination Chamber, select the corresponding seal below. Clicking a seal will open the <span>Oracle Portal</span> associated with your path.
    </div>

    <div id="manifest-grid" class="grid-container">
        <!-- Generated by Script -->
    </div>

    <footer>
        [ SPIRITUAL LINK: STABLE ] <span class="divider">✦</span> [ LEGENDARY HORIZON ] <span class="divider">✦</span> [ VAULT V4.0 ]
    </footer>
</div>

<script>
    const totalSlots = 41;
    let discoveries = {};

    const runes = ["ᚠ", "ᚢ", "ᚦ", "ᚨ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᚺ", "ᚾ", "ᛁ", "ᛃ", "ᛇ", "ᛈ", "ᛉ", "ᛊ", "ᛏ", "ᛒ", "ᛖ", "ᛗ", "ᛚ", "ᛜ", "ᛞ", "ᛟ"];

    /**
     * Mapped Links from BLS Occupational Outlook Handbook
     */
    const oracleLinks = {
        1: "https://www.bls.gov/ooh/business-and-financial/logisticians.htm#tab-1",
        2: "https://www.bls.gov/ooh/transportation-and-material-moving/delivery-truck-drivers-and-driver-sales-workers.htm",
        3: "https://www.bls.gov/ooh/sales/insurance-sales-agents.htm",
        4: "https://www.bls.gov/ooh/sales/retail-sales-workers.htm",
        5: "https://www.bls.gov/ooh/protective-service/correctional-officers.htm",
        6: "https://www.bls.gov/ooh/protective-service/security-guards.htm",
        7: "https://www.bls.gov/ooh/production/bakers.htm",
        8: "https://www.bls.gov/ooh/production/assemblers-and-fabricators.htm",
        9: "https://www.bls.gov/ooh/personal-care-and-service/barbers-hairstylists-and-cosmetologists.htm",
        10: "https://www.bls.gov/ooh/personal-care-and-service/funeral-service-occupations.htm",
        11: "https://www.bls.gov/ooh/food-preparation-and-serving/chefs-and-head-cooks.htm",
        12: "https://www.bls.gov/ooh/transportation-and-material-moving/airline-and-commercial-pilots.htm",
        13: "https://www.bls.gov/ooh/education-training-and-library/high-school-teachers.htm",
        14: "https://www.bls.gov/ooh/healthcare/registered-nurses.htm",
        15: "https://www.bls.gov/ooh/computer-and-information-technology/software-developers.htm",
        16: "https://www.bls.gov/ooh/arts-and-design/graphic-designers.htm",
        17: "https://www.bls.gov/ooh/business-and-financial/accountants-and-auditors.htm",
        18: "https://www.bls.gov/ooh/healthcare/physical-therapists.htm",
        19: "https://www.bls.gov/ooh/management/top-executives.htm",
        20: "https://www.bls.gov/ooh/architecture-and-engineering/civil-engineers.htm",
        21: "https://www.bls.gov/ooh/life-physical-and-social-science/environmental-scientists-and-specialists.htm",
        22: "https://www.bls.gov/ooh/community-and-social-service/social-workers.htm",
        23: "https://www.bls.gov/ooh/legal/lawyers.htm",
        24: "https://www.bls.gov/ooh/installation-maintenance-and-repair/industrial-machinery-mechanics-machinery-maintenance-workers-and-millwrights.htm",
        25: "https://www.bls.gov/ooh/farming-fishing-and-forestry/agricultural-workers.htm",
        26: "https://www.bls.gov/ooh/media-and-communication/public-relations-specialists.htm",
        27: "https://www.bls.gov/ooh/business-and-financial/market-research-analysts.htm",
        28: "https://www.bls.gov/ooh/transportation-and-material-moving/logisticians.htm",
        29: "https://www.bls.gov/ooh/building-and-grounds-cleaning/janitors-and-building-cleaners.htm",
        30: "https://www.bls.gov/ooh/production/welders-cutters-solderers-and-brazers.htm",
        31: "https://www.bls.gov/ooh/entertainment-and-sports/coaches-and-scouts.htm",
        32: "https://www.bls.gov/ooh/healthcare/veterinarians.htm",
        33: "https://www.bls.gov/ooh/computer-and-information-technology/computer-support-specialists.htm",
        34: "https://www.bls.gov/ooh/life-physical-and-social-science/forensic-science-technicians.htm",
        35: "https://www.bls.gov/ooh/food-preparation-and-serving/food-service-managers.htm",
        36: "https://www.bls.gov/ooh/architecture-and-engineering/architects.htm",
        37: "https://www.bls.gov/ooh/education-training-and-library/librarians.htm",
        38: "https://www.bls.gov/ooh/personal-care-and-service/recreation-and-fitness-workers.htm",
        39: "https://www.bls.gov/ooh/business-and-financial/human-resources-specialists.htm",
        40: "https://www.bls.gov/ooh/transportation-and-material-moving/heavy-and-tractor-trailer-truck-drivers.htm",
        41: "https://www.bls.gov/ooh/healthcare/emts-and-paramedics.htm"
    };

    function loadDiscoveries() {
        const saved = localStorage.getItem('vaultDiscoveries');
        discoveries = saved ? JSON.parse(saved) : {};
    }

    function saveDiscoveries() {
        localStorage.setItem('vaultDiscoveries', JSON.stringify(discoveries));
    }

    function generateManifestGrid() {
        const grid = document.getElementById('manifest-grid');
        grid.innerHTML = '';

        for (let i = 1; i <= totalSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'fate-slot';
            if (discoveries[i]) slot.classList.add('discovered');

            const slotNum = document.createElement('div');
            slotNum.className = 'slot-number';
            slotNum.textContent = i;

            const rune = document.createElement('div');
            rune.className = 'rune-display';
            rune.textContent = runes[(i - 1) % runes.length];

            slot.appendChild(slotNum);
            slot.appendChild(rune);

            slot.addEventListener('click', () => {
                discoveries[i] = true;
                saveDiscoveries();
                window.open(oracleLinks[i], '_blank');
                generateManifestGrid();
            });

            grid.appendChild(slot);
        }
    }

    loadDiscoveries();
    generateManifestGrid();
</script>

</body>
</html>
```
