# Trial of Tongues

```jsx
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root {
  --forest: #1a3a2a;
  --leaf: #2d6a4f;
  --sage: #52b788;
  --cream: #faf7f2;
  --warm: #f4ede3;
  --gold: #c9a84c;
  --text: #1c1c1c;
  --muted: #6b7280;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--text); }
#website { display: block; }
#app-view { display: none; }
.nav { background: var(--forest); padding: 0 2rem; display: flex; align-items: center; justify-content: space-between; height: 64px; position: sticky; top: 0; z-index: 100; }
.nav-logo { display: flex; align-items: center; gap: 10px; }
.nav-logo-icon { width: 36px; height: 36px; background: var(--sage); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.nav-brand { font-family: 'Playfair Display', serif; color: #fff; font-size: 1.1rem; font-weight: 700; }
.nav-links { display: flex; gap: 1.75rem; align-items: center; }
.nav-links a { color: rgba(255,255,255,0.75); text-decoration: none; font-size: 0.88rem; font-weight: 500; transition: color 0.2s; cursor: pointer; }
.nav-links a:hover { color: #fff; }
.nav-apply { background: var(--gold) !important; color: var(--forest) !important; padding: 8px 18px; border-radius: 6px; font-weight: 700 !important; }
.nav-apply:hover { background: #dbb84a !important; }
.hero { background: linear-gradient(135deg, var(--forest) 0%, var(--leaf) 60%, #3a7a5a 100%); min-height: 480px; display: flex; align-items: center; padding: 4rem 2rem; position: relative; overflow: hidden; }
.hero::before { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); }
.hero-inner { max-width: 640px; position: relative; z-index: 1; }
.hero-badge { display: inline-block; background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.9); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 14px; border-radius: 99px; margin-bottom: 1.25rem; border: 1px solid rgba(255,255,255,0.2); }
.hero h1 { font-family: 'Playfair Display', serif; font-size: 3rem; font-weight: 900; color: #fff; line-height: 1.1; margin-bottom: 1rem; }
.hero p { color: rgba(255,255,255,0.82); font-size: 1.05rem; line-height: 1.7; margin-bottom: 2rem; max-width: 480px; }
.hero-cta { display: inline-flex; align-items: center; gap: 8px; background: var(--gold); color: var(--forest); padding: 14px 28px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; border: none; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 4px 14px rgba(0,0,0,0.2); font-family: 'DM Sans', sans-serif; }
.hero-cta:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.25); }
.section { padding: 4rem 2rem; max-width: 1000px; margin: 0 auto; }
.section-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--leaf); margin-bottom: 0.5rem; }
.section h2 { font-family: 'Playfair Display', serif; font-size: 2rem; font-weight: 700; color: var(--forest); margin-bottom: 1.5rem; }
.about-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center; }
.about-img { background: linear-gradient(135deg, #e8f5ee 0%, #c8e6d4 100%); border-radius: 1.5rem; height: 280px; display: flex; align-items: center; justify-content: center; font-size: 5rem; }
.about-text p { color: #4a5568; line-height: 1.8; margin-bottom: 1rem; font-size: 0.95rem; }
.stats { background: var(--forest); color: #fff; padding: 3rem 2rem; }
.stats-inner { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(3,1fr); gap: 2rem; text-align: center; }
.stat-num { font-family: 'Playfair Display', serif; font-size: 2.5rem; font-weight: 900; color: var(--sage); }
.stat-label { font-size: 0.85rem; color: rgba(255,255,255,0.7); margin-top: 4px; }
.menu-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }
.menu-card { background: #fff; border-radius: 1rem; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e8e8e0; }
.menu-img { height: 140px; display: flex; align-items: center; justify-content: center; font-size: 3.5rem; }
.menu-body { padding: 1rem; }
.menu-body h4 { font-family: 'Playfair Display', serif; font-size: 1rem; color: var(--forest); margin-bottom: 4px; }
.menu-body p { font-size: 0.8rem; color: var(--muted); line-height: 1.5; }
.menu-price { font-weight: 700; color: var(--leaf); font-size: 0.9rem; margin-top: 6px; }
.hours-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 2rem; }
.hours-card { background: #fff; border-radius: 1rem; padding: 1.5rem; border: 1px solid #e8e8e0; }
.hours-card h4 { font-family: 'Playfair Display', serif; font-size: 1.1rem; color: var(--forest); margin-bottom: 1rem; }
.hours-row { display: flex; justify-content: space-between; font-size: 0.88rem; color: #4a5568; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
.hours-row:last-child { border-bottom: none; }
.map-placeholder { background: linear-gradient(135deg,#e8f5ee,#d1ece0); border-radius: 1rem; height: 200px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px; color: var(--leaf); font-weight: 600; font-size: 0.9rem; border: 1px solid #c8e6d4; }
.events-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.5rem; }
.event-card { background: #fff; border-radius: 1rem; padding: 1.5rem; border: 1px solid #e8e8e0; }
.event-icon { font-size: 2rem; margin-bottom: 0.75rem; }
.event-card h4 { font-family: 'Playfair Display', serif; font-size: 1rem; color: var(--forest); margin-bottom: 0.5rem; }
.event-card p { font-size: 0.82rem; color: var(--muted); line-height: 1.6; }
.jobs-banner { background: var(--warm); border: 2px dashed var(--gold); border-radius: 1.5rem; padding: 2.5rem; text-align: center; margin-top: 2rem; }
.jobs-banner h3 { font-family: 'Playfair Display', serif; font-size: 1.5rem; color: var(--forest); margin-bottom: 0.75rem; }
.jobs-banner p { color: #4a5568; margin-bottom: 1.5rem; font-size: 0.95rem; }
.apply-btn-big { display: inline-flex; align-items: center; gap: 8px; background: var(--leaf); color: #fff; padding: 14px 32px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; border: none; font-family: 'DM Sans', sans-serif; transition: background 0.2s, transform 0.15s; }
.apply-btn-big:hover { background: var(--forest); transform: translateY(-1px); }
.footer { background: var(--forest); color: rgba(255,255,255,0.6); padding: 2rem; text-align: center; font-size: 0.82rem; }
.footer strong { color: rgba(255,255,255,0.9); }
/* APP */
#app-view { min-height: 100vh; background: #f0f4f8; }
.app-nav { background: var(--forest); padding: 0 2rem; height: 56px; display: flex; align-items: center; justify-content: space-between; }
.app-nav-brand { font-family: 'Playfair Display', serif; color: #fff; font-size: 1rem; }
.app-nav-back { color: rgba(255,255,255,0.75); font-size: 0.82rem; cursor: pointer; background: none; border: none; display: flex; align-items: center; gap: 6px; font-family: 'DM Sans', sans-serif; }
.app-nav-back:hover { color: #fff; }
.app-inner { max-width: 680px; margin: 0 auto; padding: 2rem 1rem 4rem; }
.app-header { background: var(--leaf); color: #fff; border-radius: 1.25rem 1.25rem 0 0; padding: 1.5rem 2rem; }
.app-header h2 { font-family: 'Playfair Display', serif; font-size: 1.4rem; font-weight: 700; margin-bottom: 4px; }
.app-header p { font-size: 0.85rem; color: rgba(255,255,255,0.8); }
.app-body { background: #fff; border-radius: 0 0 1.25rem 1.25rem; padding: 2rem; border: 1px solid #e2e8f0; border-top: none; }
.prog-bar { height: 4px; background: #e2e8f0; border-radius: 99px; margin-bottom: 2rem; }
.prog-fill { height: 4px; background: var(--leaf); border-radius: 99px; transition: width 0.4s; }
.sec-head { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--leaf); margin: 1.5rem 0 0.75rem; padding-bottom: 6px; border-bottom: 1px solid #e8f5ee; }
.field-wrap { margin-bottom: 1rem; }
.field-label { font-size: 0.8rem; color: #4a5568; margin-bottom: 5px; display: flex; align-items: center; gap: 4px; }
.req { color: #e53e3e; font-size: 0.7rem; }
input[type=text], input[type=email], input[type=tel], select, textarea { width: 100%; padding: 10px 13px; font-size: 0.88rem; font-family: 'DM Sans', sans-serif; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; color: var(--text); outline: none; transition: border-color 0.15s; }
input:focus, select:focus, textarea:focus { border-color: var(--leaf); box-shadow: 0 0 0 3px rgba(45,106,79,0.1); }
textarea { resize: vertical; min-height: 80px; line-height: 1.6; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.tip { display: none; padding: 8px 12px; margin-top: 6px; font-size: 0.8rem; line-height: 1.6; border-radius: 0; }
.tip.show { display: block; }
.tip.good { background: #ecfdf5; border-left: 3px solid #10b981; color: #065f46; }
.tip.warn { background: #fffbeb; border-left: 3px solid #f59e0b; color: #78350f; }
.tip.bad { background: #fef2f2; border-left: 3px solid #ef4444; color: #991b1b; }
.check-group { display: flex; flex-direction: column; gap: 7px; }
.check-item { display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer; }
.check-item input { width: 16px; height: 16px; accent-color: var(--leaf); flex-shrink: 0; }
.period-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 1.25rem; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 10px 14px; }
.period-label { font-size: 0.82rem; color: #15803d; font-weight: 700; white-space: nowrap; }
.hr-d { border: none; border-top: 1px solid #f0f0e8; margin: 1.25rem 0; }
.submit-btn { width: 100%; background: var(--leaf); color: #fff; border: none; border-radius: 8px; padding: 14px; font-size: 1rem; font-family: 'DM Sans', sans-serif; font-weight: 700; cursor: pointer; margin-top: 0.5rem; transition: background 0.2s; }
.submit-btn:hover { background: var(--forest); }
.submit-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
/* Results */
.result-wrap { max-width: 680px; margin: 0 auto; padding: 2rem 1rem 4rem; }
.result-card { background: #fff; border-radius: 1.25rem; border: 1px solid #e2e8f0; overflow: hidden; }
.result-header { background: var(--leaf); color: #fff; padding: 1.75rem 2rem; text-align: center; }
.result-header h2 { font-family: 'Playfair Display', serif; font-size: 1.5rem; margin-bottom: 4px; }
.r-score { font-size: 3rem; font-weight: 800; line-height: 1; }
.r-score-sub { font-size: 0.85rem; color: rgba(255,255,255,0.8); margin-top: 4px; }
.result-body { padding: 1.75rem 2rem; }
.r-msg { font-size: 0.95rem; color: #334155; line-height: 1.7; background: #f0fdf4; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; }
.feedback-row { display: flex; align-items: flex-start; gap: 10px; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.feedback-row:last-child { border-bottom: none; }
.rdot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.rdot-green { background: #10b981; }
.rdot-yellow { background: #f59e0b; }
.rdot-red { background: #ef4444; }
.rfname { font-size: 0.78rem; font-weight: 600; color: #64748b; min-width: 150px; }
.rfmsg { font-size: 0.83rem; color: #334155; line-height: 1.5; }
.email-section { margin-top: 1.5rem; background: #f8fafc; border-radius: 10px; padding: 1.5rem; border: 1px solid #e2e8f0; }
.email-section h4 { font-size: 0.82rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin-bottom: 0.5rem; }
.email-section p { font-size: 0.85rem; color: #64748b; margin-bottom: 1rem; line-height: 1.6; }
.step-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 0.75rem; display: flex; align-items: flex-start; gap: 10px; }
.step-num { display: inline-flex; align-items: center; justify-content: center; background: var(--leaf); color: #fff; width: 22px; height: 22px; border-radius: 50%; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; margin-top: 1px; }
.step-text { font-size: 0.85rem; color: #334155; line-height: 1.5; }
.copy-btn { display: flex; align-items: center; gap: 8px; background: var(--leaf); color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; width: 100%; justify-content: center; margin-top: 0.75rem; }
.copy-btn:hover { background: var(--forest); }
.copy-success { display: none; background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 8px; padding: 10px 16px; font-size: 0.85rem; color: #065f46; font-weight: 600; text-align: center; margin-top: 0.75rem; }
.email-link-btn { display: flex; align-items: center; justify-content: center; gap: 8px; background: #1d4ed8; color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background 0.15s; width: 100%; margin-top: 0.6rem; text-decoration: none; }
.email-link-btn:hover { background: #1e40af; }
.done-note { margin-top: 1.25rem; background: #fef9c3; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 0.83rem; color: #78350f; line-height: 1.6; text-align: center; }
</style>
</head>
<body>

<!-- ══════════ COMPANY WEBSITE ══════════ -->
<div id="website">
  <nav class="nav">
    <div class="nav-logo">
      <div class="nav-logo-icon">🌿</div>
      <span class="nav-brand">Maple Ridge Diner</span>
    </div>
    <div class="nav-links">
      <a onclick="jumpTo('section-menu')">Menu</a>
      <a onclick="jumpTo('section-about')">About Us</a>
      <a onclick="jumpTo('section-hours')">Hours &amp; Location</a>
      <a onclick="jumpTo('section-events')">Private Events</a>
      <a class="nav-apply" id="nav-apply-btn" href="#">Now Hiring ›</a>
    </div>
  </nav>

  <div class="hero">
    <div class="hero-inner">
      <div class="hero-badge">Est. 2009 · Greece, New York</div>
      <h1>Home-Cooked Comfort, Every Single Day</h1>
      <p>Maple Ridge Diner has been feeding families in the Greece community for over 15 years. From our famous sunrise stack to Sunday pot roast, everything is made with care.</p>
      <button class="hero-cta" id="hero-apply-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 5H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
        View Open Positions &amp; Apply
      </button>
    </div>
  </div>

  <div class="stats">
    <div class="stats-inner">
      <div><div class="stat-num">15+</div><div class="stat-label">Years serving Greece, NY</div></div>
      <div><div class="stat-num">4.7★</div><div class="stat-label">Google rating · 840 reviews</div></div>
      <div><div class="stat-num">38</div><div class="stat-label">Team members &amp; growing</div></div>
    </div>
  </div>

  <div id="section-about" style="background:#fff; padding: 4rem 2rem;">
    <div style="max-width:1000px;margin:0 auto;">
      <div class="about-grid">
        <div class="about-img">🍳</div>
        <div class="about-text">
          <div class="section-label">Our Story</div>
          <h2>A Community Table</h2>
          <p>What started as a small breakfast counter on Latta Road has grown into a full-service diner that feels like your grandmother's kitchen — if she could make 14 different omelets and still remember your name.</p>
          <p>We're proud to be a team of neighbors, students, retirees, and everyone in between. Many of our longest-serving staff started as high school students looking for their first job.</p>
          <p>We believe in flexible scheduling, fair pay, and teaching real-world skills that go way beyond the diner floor.</p>
        </div>
      </div>
    </div>
  </div>

  <div id="section-menu" class="section">
    <div class="section-label">What We Serve</div>
    <h2>A Little Taste of Everything</h2>
    <p style="color:#4a5568;margin-bottom:1.5rem;font-size:0.95rem;max-width:580px;">Everything is made fresh daily. We source produce from local farms and bake our own bread every morning.</p>
    <div class="menu-grid">
      <div class="menu-card"><div class="menu-img" style="background:#fef9c3;">🥞</div><div class="menu-body"><h4>Sunrise Stack</h4><p>Three buttermilk pancakes with real maple syrup. Our most ordered item since 2010.</p><div class="menu-price">$8.99</div></div></div>
      <div class="menu-card"><div class="menu-img" style="background:#e8f5ee;">🥗</div><div class="menu-body"><h4>Garden Harvest Bowl</h4><p>Seasonal greens, roasted veggies, house vinaigrette. Changes every week.</p><div class="menu-price">$11.49</div></div></div>
      <div class="menu-card"><div class="menu-img" style="background:#fff7ed;">🥩</div><div class="menu-body"><h4>Sunday Pot Roast</h4><p>Slow-cooked 6 hours. Sundays only — get here early, it sells out fast.</p><div class="menu-price">$14.99</div></div></div>
      <div class="menu-card"><div class="menu-img" style="background:#fef2f2;">🍳</div><div class="menu-body"><h4>Classic Diner Plate</h4><p>Two eggs any style, home fries, toast, bacon or sausage.</p><div class="menu-price">$9.49</div></div></div>
      <div class="menu-card"><div class="menu-img" style="background:#eff6ff;">🥪</div><div class="menu-body"><h4>The Ridge Club</h4><p>Triple-decker turkey club on house-baked sourdough with kettle chips.</p><div class="menu-price">$12.49</div></div></div>
      <div class="menu-card"><div class="menu-img" style="background:#fdf4ff;">🍰</div><div class="menu-body"><h4>Grandma's Pie Slice</h4><p>Rotating daily — apple, cherry, and lemon are regulars. Ask your server.</p><div class="menu-price">$4.99</div></div></div>
    </div>
  </div>

  <div id="section-hours" style="background:#fff; padding: 4rem 2rem;">
    <div style="max-width:1000px;margin:0 auto;">
      <div class="section-label">Find Us</div>
      <h2>Hours &amp; Location</h2>
      <div class="hours-grid">
        <div>
          <div class="hours-card" style="margin-bottom:1.5rem;">
            <h4>📅 Diner Hours</h4>
            <div class="hours-row"><span>Monday – Friday</span><span>6:00 AM – 3:00 PM</span></div>
            <div class="hours-row"><span>Saturday</span><span>7:00 AM – 2:00 PM</span></div>
            <div class="hours-row"><span>Sunday</span><span>7:00 AM – 2:00 PM</span></div>
            <div class="hours-row"><span>Holidays</span><span>Varies — check social media</span></div>
          </div>
          <div class="hours-card">
            <h4>📍 Address &amp; Contact</h4>
            <div class="hours-row"><span>Address</span><span>4205 Latta Road, Greece, NY</span></div>
            <div class="hours-row"><span>Phone</span><span>(585) 555-0194</span></div>
            <div class="hours-row"><span>Email</span><span>hello@mapleridgediner.com</span></div>
            <div class="hours-row"><span>Parking</span><span>Free lot, 40 spaces</span></div>
          </div>
        </div>
        <div class="map-placeholder">
          <span style="font-size:2.5rem;">🗺️</span>
          <span>4205 Latta Road</span>
          <span>Greece, NY 14612</span>
          <span style="font-size:0.78rem;color:#6b9e83;margin-top:4px;">Across from Greece Ridge Center</span>
        </div>
      </div>
    </div>
  </div>

  <div id="section-events" class="section">
    <div class="section-label">Celebrations &amp; Gatherings</div>
    <h2>Private Events at Maple Ridge</h2>
    <p style="color:#4a5568;margin-bottom:1.5rem;font-size:0.95rem;max-width:580px;">Whether it's a birthday breakfast, baby shower brunch, or team lunch — our private dining room seats up to 30.</p>
    <div class="events-grid">
      <div class="event-card"><div class="event-icon">🎂</div><h4>Birthday Celebrations</h4><p>Reserved seating, custom menu selections, and a complimentary dessert for the guest of honor.</p></div>
      <div class="event-card"><div class="event-icon">☕</div><h4>Business Brunches</h4><p>Private room with A/V setup. Ideal for team meetings, client breakfasts, or board gatherings.</p></div>
      <div class="event-card"><div class="event-icon">🌸</div><h4>Showers &amp; Milestones</h4><p>Baby showers, graduations, retirements — we create a warm, personal setting for your milestone moments.</p></div>
    </div>
    <p style="font-size:0.88rem;color:#4a5568;margin-top:1.5rem;">To book: call (585) 555-0194 or email events@mapleridgediner.com</p>
  </div>

  <div class="section" style="padding-top:0;">
    <div class="section-label">Join the Team</div>
    <h2>We're Growing — Come Grow With Us</h2>
    <p style="color:#4a5568;line-height:1.8;margin-bottom:1rem;max-width:600px;">We're always looking for reliable, friendly people to join the Maple Ridge family. No experience required — we train everyone. Perfect for students ages 14 and up.</p>
    <p style="color:#4a5568;line-height:1.8;margin-bottom:2rem;max-width:600px;"><strong>Open roles:</strong> Host/Hostess · Busser · Dishwasher · Counter Staff · Weekend Prep Cook</p>
    <div class="jobs-banner">
      <h3>Ready to Apply?</h3>
      <p>Our online application takes about 10 minutes. Fill it out carefully — we read every one.</p>
      <button class="apply-btn-big" id="banner-apply-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        Start Your Application
      </button>
    </div>
  </div>

  <div class="footer">
    <strong>Maple Ridge Diner</strong> · 4205 Latta Road, Greece, NY 14612 · (585) 555-0194<br>
    <span style="margin-top:6px;display:block;">Mon–Fri 6am–3pm · Sat–Sun 7am–2pm</span>
    <span style="display:block;margin-top:8px;font-size:0.75rem;opacity:0.5;">This is a simulated business created for educational purposes · Greece Central School District FACS</span>
  </div>
</div>

<!-- ══════════ APPLICATION FORM ══════════ -->
<div id="app-view">
  <div class="app-nav">
    <button class="app-nav-back" id="back-btn">← Back to website</button>
    <span class="app-nav-brand">Maple Ridge Diner · Employment Application</span>
  </div>

  <div class="app-inner" id="form-wrap">
    <div class="app-header">
      <h2>Employment Application</h2>
      <p>Maple Ridge Diner · Greece, NY · Fields marked * are required</p>
    </div>
    <div class="app-body">
      <div class="prog-bar"><div class="prog-fill" id="prog" style="width:0%"></div></div>

      <div class="period-wrap">
        <span class="period-label">Class Period:</span>
        <select id="period" onchange="checkProg()">
          <option value="">-- Select your period --</option>
          <option>Green</option>
          <option>Blue</option>
          <option>Yellow</option>
          <option>Purple</option>
          <option>Orange</option>
        </select>
      </div>

      <div class="sec-head">Personal Information</div>
      <div class="two-col">
        <div class="field-wrap"><div class="field-label">First Name <span class="req">*</span></div><input type="text" id="fname" placeholder="First name" oninput="checkProg()"></div>
        <div class="field-wrap"><div class="field-label">Last Name <span class="req">*</span></div><input type="text" id="lname" placeholder="Last name" oninput="checkProg()"></div>
      </div>
      <div class="field-wrap">
        <div class="field-label">Email Address <span class="req">*</span></div>
        <input type="email" id="email" placeholder="e.g. firstname.lastname@gmail.com" oninput="tipEmail()" onblur="tipEmail()">
        <div class="tip" id="tip-email"></div>
      </div>
      <div class="field-wrap"><div class="field-label">Phone Number</div><input type="tel" id="phone" placeholder="(585) 000-0000" oninput="checkProg()"></div>
      <div class="field-wrap">
        <div class="field-label">Position Applying For <span class="req">*</span></div>
        <select id="position" onchange="checkProg()">
          <option value="">-- Select a position --</option>
          <option>Host / Hostess</option><option>Busser</option><option>Dishwasher</option><option>Counter Staff</option><option>Weekend Prep Cook</option>
        </select>
      </div>

      <hr class="hr-d">
      <div class="sec-head">Education</div>
      <div class="field-wrap">
        <div class="field-label">Current School <span class="req">*</span></div>
        <input type="text" id="school" placeholder="e.g. Olympia High School" oninput="tipSchool()" onblur="tipSchool()">
        <div class="tip" id="tip-school"></div>
      </div>
      <div class="two-col">
        <div class="field-wrap">
          <div class="field-label">Current Grade <span class="req">*</span></div>
          <select id="grade" onchange="checkProg()">
            <option value="">-- Select --</option>
            <option>6th Grade</option><option>7th Grade</option><option>8th Grade</option>
            <option>9th Grade</option><option>10th Grade</option><option>11th Grade</option><option>12th Grade</option>
          </select>
        </div>
        <div class="field-wrap"><div class="field-label">Expected Graduation Year</div><input type="text" id="gradyear" placeholder="e.g. 2027" oninput="checkProg()"></div>
      </div>
      <div class="field-wrap">
        <div class="field-label">Relevant Courses or School Activities</div>
        <input type="text" id="activities" placeholder="e.g. FACS, Student Council, soccer team, art club" oninput="tipActivities()" onblur="tipActivities()">
        <div class="tip" id="tip-activities"></div>
      </div>

      <hr class="hr-d">
      <div class="sec-head">Availability</div>
      <div class="field-wrap">
        <div class="field-label">Days Available to Work <span class="req">*</span></div>
        <div class="check-group">
          <label class="check-item"><input type="checkbox" class="avail" onchange="checkProg()"> Monday</label>
          <label class="check-item"><input type="checkbox" class="avail" onchange="checkProg()"> Tuesday</label>
          <label class="check-item"><input type="checkbox" class="avail" onchange="checkProg()"> Wednesday</label>
          <label class="check-item"><input type="checkbox" class="avail" onchange="checkProg()"> Thursday</label>
          <label class="check-item"><input type="checkbox" class="avail" onchange="checkProg()"> Friday</label>
          <label class="check-item"><input type="checkbox" class="avail" onchange="checkProg()"> Saturday</label>
          <label class="check-item"><input type="checkbox" class="avail" onchange="checkProg()"> Sunday</label>
        </div>
      </div>
      <div class="field-wrap"><div class="field-label">Earliest Start Date</div><input type="text" id="startdate" placeholder="e.g. June 2" oninput="checkProg()"></div>

      <hr class="hr-d">
      <div class="sec-head">Work Experience</div>
      <div class="field-wrap">
        <div class="field-label">Have you worked before?</div>
        <select id="haswork" onchange="togglePrev()">
          <option value="">-- Select --</option>
          <option value="yes">Yes</option>
          <option value="no">No — this is my first job</option>
        </select>
      </div>
      <div id="prev-job" style="display:none">
        <div class="field-wrap"><div class="field-label">Describe your previous work or volunteer experience</div><input type="text" id="prevjob" placeholder="e.g. Babysat for neighbors, helped at church events, mowed lawns" oninput="checkProg()"></div>
      </div>

      <hr class="hr-d">
      <div class="sec-head">About You</div>
      <div class="field-wrap">
        <div class="field-label">Why do you want to work at Maple Ridge Diner? <span class="req">*</span></div>
        <textarea id="whyjob" placeholder="Tell us why you're interested in this specific position..." oninput="tipWhy()" onblur="tipWhy()"></textarea>
        <div class="tip" id="tip-why"></div>
      </div>
      <div class="field-wrap">
        <div class="field-label">Tell us about a time you solved a problem or worked well with others.</div>
        <textarea id="star" placeholder="Describe the situation, what you did, and the result..." oninput="tipStar()" onblur="tipStar()"></textarea>
        <div class="tip" id="tip-star"></div>
      </div>
      <div class="field-wrap"><div class="field-label">Is there anything else you'd like us to know?</div><textarea id="extra" placeholder="Skills, strengths, activities..." oninput="checkProg()"></textarea></div>

      <hr class="hr-d">
      <div class="sec-head">Reference</div>
      <div class="field-wrap">
        <div class="field-label">Reference Name <span class="req">*</span></div>
        <input type="text" id="refname" placeholder="A teacher, coach, or neighbor — not a family member" oninput="tipRef()" onblur="tipRef()">
        <div class="tip" id="tip-ref"></div>
      </div>
      <div class="field-wrap"><div class="field-label">Their Relationship to You</div><input type="text" id="refrel" placeholder="e.g. Science teacher, soccer coach, neighbor" oninput="checkProg()"></div>

      <button class="submit-btn" id="submit-btn" disabled onclick="submitApp()">Submit Application →</button>
    </div>
  </div>

  <div class="result-wrap" id="result-wrap" style="display:none;">
    <div class="result-card">
      <div class="result-header">
        <h2>Application Submitted!</h2>
        <div class="r-score" id="r-score"></div>
        <div class="r-score-sub">out of 16 points</div>
      </div>
      <div class="result-body">
        <div class="r-msg" id="r-msg"></div>
        <div id="r-rows"></div>
        <div class="email-section">
          <h4>Send Your Results to Mr. McCann</h4>
          <p>Follow these three steps to submit your application for grading.</p>
          <div class="step-box">
            <span class="step-num">1</span>
            <span class="step-text">Click <strong>Copy My Data</strong> — all your application information copies to your clipboard automatically.</span>
          </div>
          <div class="step-box">
            <span class="step-num">2</span>
            <span class="step-text">Click <strong>Open Email to Mr. McCann</strong> — a new email will open pre-addressed with the subject line already filled in.</span>
          </div>
          <div class="step-box">
            <span class="step-num">3</span>
            <span class="step-text"><strong>Paste</strong> your data into the body of the email (Ctrl+V on PC · Cmd+V on Mac) and click Send.</span>
          </div>
          <button class="copy-btn" onclick="copyData()">📋 Step 1 — Copy My Data</button>
          <div class="copy-success" id="copy-success">✓ Copied! Now click Step 2 below to open your email.</div>
          <a class="email-link-btn" id="email-link" href="#">✉ Step 2 — Open Email to Mr. McCann</a>
        </div>
        <div class="done-note">
          This is your one submission. Your application has been recorded — there is no restart. Make sure you send the email to complete your assignment.
        </div>
      </div>
    </div>
  </div>
</div>

<script>
const TEACHER_EMAIL = 'kevin.mccann@greececsd.org';

function jumpTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

['nav-apply-btn','hero-apply-btn','banner-apply-btn'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('website').style.display = 'none';
    document.getElementById('app-view').style.display = 'block';
    window.scrollTo(0, 0);
  });
});

document.getElementById('back-btn').addEventListener('click', () => {
  document.getElementById('app-view').style.display = 'none';
  document.getElementById('website').style.display = 'block';
  window.scrollTo(0, 0);
});

function checkProg() {
  const req = [
    document.getElementById('fname').value.trim(),
    document.getElementById('lname').value.trim(),
    document.getElementById('email').value.trim(),
    document.getElementById('position').value,
    document.getElementById('school').value.trim(),
    document.getElementById('grade').value,
    document.querySelectorAll('.avail:checked').length > 0 ? 'x' : '',
    document.getElementById('whyjob').value.trim(),
    document.getElementById('refname').value.trim(),
    document.getElementById('period').value
  ];
  const pct = Math.round(req.filter(Boolean).length / req.length * 100);
  document.getElementById('prog').style.width = pct + '%';
  document.getElementById('submit-btn').disabled = pct < 100;
}

function togglePrev() {
  document.getElementById('prev-job').style.display =
    document.getElementById('haswork').value === 'yes' ? 'block' : 'none';
  checkProg();
}

function tipEmail() {
  const v = document.getElementById('email').value.trim();
  const b = document.getElementById('tip-email');
  if (!v) { b.className='tip'; return; }
  const funny = /gamer|killer|swag|cool69|sexy|420|xX/i.test(v);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  if (funny) { b.className='tip warn show'; b.textContent='Employers notice email addresses. Use something like firstname.lastname@gmail.com for a professional impression.'; }
  else if (!valid) { b.className='tip bad show'; b.textContent="This doesn't look like a valid email. Check the format — e.g. alexjones@gmail.com"; }
  else { b.className='tip good show'; b.textContent='Looks professional!'; }
  checkProg();
}

function tipSchool() {
  const v = document.getElementById('school').value.trim();
  const b = document.getElementById('tip-school');
  if (!v) { b.className='tip'; return; }
  if (v.length < 5) { b.className='tip warn show'; b.textContent='Please write the full name of your school.'; }
  else { b.className='tip good show'; b.textContent='Good — listing your school shows the employer you are an active student.'; }
  checkProg();
}

function tipActivities() {
  const v = document.getElementById('activities').value.trim();
  const b = document.getElementById('tip-activities');
  if (!v) { b.className='tip'; return; }
  if (/FACS|cooking|food|home|career|family/i.test(v)) {
    b.className='tip good show'; b.textContent='Great — courses like FACS are directly relevant to food service. Mentioning them shows initiative!';
  } else {
    b.className='tip good show'; b.textContent='Good! Including school activities helps employers understand who you are beyond your grades.';
  }
}

function tipWhy() {
  const v = document.getElementById('whyjob').value.trim();
  const b = document.getElementById('tip-why');
  if (!v) { b.className='tip'; return; }
  if (/money|cash|bored|nothing else|my mom|my dad|friend made/i.test(v)) {
    b.className='tip bad show'; b.textContent='Focus on the role and what you can contribute — not the paycheck or outside pressure.';
  } else if (v.split(' ').length < 10) {
    b.className='tip warn show'; b.textContent='Add 1–2 more sentences about what specifically draws you to Maple Ridge or this position.';
  } else {
    b.className='tip good show'; b.textContent='Good answer! Make sure it mentions something specific about this job, not just any job.';
  }
  checkProg();
}

function tipStar() {
  const v = document.getElementById('star').value.trim();
  const b = document.getElementById('tip-star');
  if (!v) { b.className='tip'; return; }
  const short = v.split(' ').length < 15;
  const hasI = /\bI\b/.test(v);
  const hasResult = /grade|won|finished|helped|solved|learned|result|outcome|success|improved/i.test(v);
  if (short) { b.className='tip warn show'; b.textContent='Try the STAR method: Situation → Action → Result. More detail makes your answer much stronger.'; }
  else if (!hasI) { b.className='tip warn show'; b.textContent='Describe what YOU specifically did — not just "we."'; }
  else if (!hasResult) { b.className='tip warn show'; b.textContent='Great start — add what the outcome was. What happened because of what you did?'; }
  else { b.className='tip good show'; b.textContent='Strong answer! Situation, personal action, and result are all present.'; }
  checkProg();
}

function tipRef() {
  const v = document.getElementById('refname').value.trim();
  const b = document.getElementById('tip-ref');
  if (!v) { b.className='tip'; return; }
  if (/mom|dad|mother|father|grandma|grandpa|aunt|uncle|parent|brother|sister/i.test(v)) {
    b.className='tip bad show'; b.textContent='References must be non-family adults — a teacher, coach, or neighbor who can speak to your character.';
  } else {
    b.className='tip good show'; b.textContent='Good choice! Make sure you ask their permission before listing them.';
  }
  checkProg();
}

let csvData = '';

function submitApp() {
  const g = id => document.getElementById(id).value.trim();
  const fname=g('fname'), lname=g('lname'), email=g('email'), phone=g('phone');
  const position=document.getElementById('position').value;
  const school=g('school'), grade=document.getElementById('grade').value;
  const gradyear=g('gradyear'), activities=g('activities');
  const availDays=[...document.querySelectorAll('.avail:checked')].map(c=>c.parentElement.textContent.trim()).join(', ');
  const availCount=document.querySelectorAll('.avail:checked').length;
  const startdate=g('startdate'), haswork=document.getElementById('haswork').value, prevjob=g('prevjob');
  const why=g('whyjob'), star=g('star'), extra=g('extra'), refname=g('refname'), refrel=g('refrel');
  const period=document.getElementById('period').value;

  let score=0; const rows=[];

  const funnyEmail=/gamer|killer|swag|cool69|sexy|420|xX/i.test(email);
  const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  let eS=(!funnyEmail&&validEmail)?2:0, eR=(!funnyEmail&&validEmail)?'green':'red';
  let eM=(!funnyEmail&&validEmail)?'Professional, valid email address.':funnyEmail?'Unprofessional email — employers notice these.':'Email address does not appear valid.';
  score+=eS; rows.push({f:'Email address',rating:eR,msg:eM,pts:eS,max:2});

  const edS=(school.length>4&&grade)?2:(school.length>4||grade)?1:0;
  const edR=edS===2?'green':edS===1?'yellow':'red';
  const edM=edS===2?'School and grade both filled in — shows you are an active student.':edS===1?'Make sure both school name and grade are completed.':'Education section incomplete.';
  score+=edS; rows.push({f:'Education',rating:edR,msg:edM,pts:edS,max:2});

  const aS=availCount>=4?2:availCount>=2?1:0, aR=availCount>=4?'green':availCount>=2?'yellow':'red';
  const aM=availCount>=4?'Great availability — more days = more scheduling opportunities.':availCount>=2?'Reasonable. More flexibility would strengthen your application.':'Very limited availability listed.';
  score+=aS; rows.push({f:'Availability',rating:aR,msg:aM,pts:aS,max:2});

  const whyLow=/money|cash|bored|nothing else|my mom|my dad|friend made/i.test(why);
  const whyShort=why.split(' ').length<10;
  let wS=(!whyLow&&!whyShort)?3:whyLow?0:1, wR=(!whyLow&&!whyShort)?'green':whyLow?'red':'yellow';
  let wM=(!whyLow&&!whyShort)?'Strong answer — focused on the role.':whyLow?'Mentioning money or pressure hurts your application.':'Too brief — add specific reasons tied to this job.';
  score+=wS; rows.push({f:'"Why this job?"',rating:wR,msg:wM,pts:wS,max:3});

  const sw=star.split(' ').length, sI=/\bI\b/.test(star), sR=/grade|won|finished|helped|solved|learned|result|outcome|success|improved/i.test(star);
  let stS=(!star)?0:(sw>=15&&sI&&sR)?3:sw>=10?1:0;
  let stR=stS===3?'green':stS===1?'yellow':'red';
  let stM=(!star)?'Left blank — a missed opportunity.':stS===3?'Excellent STAR method — situation, action, and result all present.':stS===1?'Good start — add more detail and the outcome.':'Too brief. Use STAR: Situation → Action → Result.';
  score+=stS; rows.push({f:'Problem-solving example',rating:stR,msg:stM,pts:stS,max:3});

  const isFamily=/mom|dad|mother|father|grandma|grandpa|aunt|uncle|parent|brother|sister/i.test(refname);
  let rS=(!isFamily&&refname)?2:0, rR=(!isFamily&&refname)?'green':'red';
  let rM=(!isFamily&&refname)?'Appropriate non-family reference. Did you ask their permission?':isFamily?'Family members cannot be references. Use a teacher, coach, or neighbor.':'Reference was left blank.';
  score+=rS; rows.push({f:'Reference',rating:rR,msg:rM,pts:rS,max:2});

  const comp=phone&&startdate&&position;
  const cS=comp?2:(phone||startdate)?1:0, cR=comp?'green':cS?'yellow':'red';
  const cM=comp?'All key fields filled in — shows thoroughness.':'Some fields were left blank. Complete applications show attention to detail.';
  score+=cS; rows.push({f:'Completeness',rating:cR,msg:cM,pts:cS,max:2});

  const pct=Math.round((score/16)*100);
  let msg=pct>=85?'Excellent work! Your application is thorough and professional. An employer would likely invite you to interview.'
    :pct>=60?'Solid effort! You covered the basics well. Stronger answers in the key sections would make this stand out more.'
    :'Good first attempt! Review each feedback point below and think about what a stronger answer would look like.';

  document.getElementById('form-wrap').style.display='none';
  document.getElementById('result-wrap').style.display='block';
  window.scrollTo(0,0);
  document.getElementById('r-score').textContent=score+' / 16';
  document.getElementById('r-msg').textContent=msg;

  const dc=r=>r==='green'?'rdot-green':r==='yellow'?'rdot-yellow':'rdot-red';
  document.getElementById('r-rows').innerHTML=rows.map(r=>`
    <div class="feedback-row">
      <div class="rdot ${dc(r.rating)}"></div>
      <div class="rfname">${r.f} <span style="color:#94a3b8;font-weight:400">(${r.pts}/${r.max})</span></div>
      <div class="rfmsg">${r.msg}</div>
    </div>`).join('');

  const ts=new Date().toLocaleString();
  const headers=['Timestamp','Period','Last Name','First Name','Email','Phone','Position','School','Grade','Grad Year','Activities','Availability','Avail Days Count','Start Date','Prior Work?','Prior Work Desc','Why This Job','Problem-Solving','Extra Info','Ref Name','Ref Relationship','Email /2','Education /2','Availability /2','Why Job /3','STAR /3','Reference /2','Completeness /2','Total /16','Percent'];
  const vals=[ts,period,lname,fname,email,phone,position,school,grade,gradyear,activities,availDays,availCount,startdate,haswork,prevjob,why.replace(/\n/g,' '),star.replace(/\n/g,' '),extra.replace(/\n/g,' '),refname,refrel,eS,edS,aS,wS,stS,rS,cS,score,pct+'%'];
  csvData=headers.join('\t')+'\n'+vals.map(v=>String(v).replace(/\t/g,' ')).join('\t');

  const subj=encodeURIComponent(`Job Application — ${lname}, ${fname} — ${period} Period — Score: ${score}/16`);
  const body=encodeURIComponent(`Hi Mr. McCann,\n\nPlease find my Maple Ridge Diner application data below.\nPaste the data line into Google Sheets to record my submission.\n\n--- PASTE DATA BELOW THIS LINE ---\n\n\n--- END DATA ---\n\nStudent: ${fname} ${lname}\nPeriod: ${period}\nScore: ${score}/16 (${pct}%)\nSubmitted: ${ts}`);
  document.getElementById('email-link').href=`mailto:${TEACHER_EMAIL}?subject=${subj}&body=${body}`;
}

function copyData() {
  const tryFallback = () => {
    const ta=document.createElement('textarea');
    ta.value=csvData; ta.style.cssText='position:fixed;opacity:0;top:0;left:0;';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch(e){}
    document.body.removeChild(ta);
    document.getElementById('copy-success').style.display='block';
  };
  if (navigator.clipboard) {
    navigator.clipboard.writeText(csvData).then(()=>{
      document.getElementById('copy-success').style.display='block';
    }).catch(tryFallback);
  } else { tryFallback(); }
}
</script>
</body>
</html>
```
