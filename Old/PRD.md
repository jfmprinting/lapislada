<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ABAT — Penawaran Aplikasi | aidukasi.net</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lora:ital,wght@0,500;0,600;1,400&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green-deep:  #1A3C2E;
    --green-mid:   #2D6A4F;
    --green-light: #52B788;
    --green-pale:  #D8F3DC;
    --gold:        #E9C46A;
    --gold-dark:   #C9A227;
    --cream:       #FAF8F2;
    --ink:         #1C1C1E;
    --muted:       #5A6472;
    --border:      #DDE3DC;
    --white:       #FFFFFF;

    --font-display: 'Lora', Georgia, serif;
    --font-body:    'Plus Jakarta Sans', sans-serif;

    --r-sm: 10px;
    --r-md: 16px;
    --r-lg: 24px;

    --max-w: 1080px;
    --px: clamp(1rem, 5vw, 3rem);
  }

  html { scroll-behavior: smooth; }
  body  { font-family: var(--font-body); background: var(--cream); color: var(--ink); line-height: 1.65; -webkit-font-smoothing: antialiased; }

  /* ── NAV ── */
  nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(26,60,46,0.96);
    backdrop-filter: blur(12px);
    padding: 0.75rem var(--px);
    display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  }
  .nav-brand { display: flex; align-items: center; gap: 0.5rem; }
  .nav-logo {
    width: 32px; height: 32px; border-radius: 8px;
    background: var(--gold); display: grid; place-items: center;
    font-weight: 800; font-size: 0.8rem; color: var(--green-deep); letter-spacing: -0.5px;
  }
  .nav-name { color: var(--white); font-weight: 700; font-size: 0.95rem; }
  .nav-links { display: flex; gap: 1.5rem; }
  .nav-links a { color: rgba(255,255,255,0.75); font-size: 0.85rem; text-decoration: none; transition: color .2s; }
  .nav-links a:hover { color: var(--gold); }
  .nav-cta {
    background: var(--gold); color: var(--green-deep); border: none;
    padding: 0.45rem 1.1rem; border-radius: 8px;
    font-family: var(--font-body); font-weight: 700; font-size: 0.85rem;
    cursor: pointer; text-decoration: none; white-space: nowrap;
    transition: background .2s, transform .15s;
  }
  .nav-cta:hover { background: #f5d17e; transform: translateY(-1px); }
  @media (max-width: 640px) { .nav-links { display: none; } }

  /* ── HERO ── */
  .hero {
    background: var(--green-deep);
    padding: clamp(3rem,8vw,6rem) var(--px) clamp(2rem,5vw,4rem);
    text-align: center;
    position: relative; overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 110%, rgba(82,183,136,0.18) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
    color: var(--green-light); font-size: 0.78rem; font-weight: 600; letter-spacing: .04em;
    padding: 0.35rem 0.9rem; border-radius: 100px; margin-bottom: 1.5rem;
    text-transform: uppercase;
  }
  .hero h1 {
    font-family: var(--font-display); font-size: clamp(2.4rem, 6vw, 4.2rem);
    font-weight: 600; color: var(--white); line-height: 1.15;
    margin-bottom: 0.5rem;
  }
  .hero h1 span { color: var(--gold); font-style: italic; }
  .hero-sub {
    font-size: clamp(1rem, 2.5vw, 1.2rem); color: rgba(255,255,255,0.7);
    font-style: italic; font-family: var(--font-display); margin-bottom: 2rem;
  }
  .hero-desc {
    max-width: 600px; margin: 0 auto 2.5rem;
    color: rgba(255,255,255,0.65); font-size: 0.95rem; line-height: 1.75;
  }
  .hero-price-card {
    display: inline-flex; flex-direction: column; align-items: center;
    background: rgba(255,255,255,0.06); border: 1px solid rgba(233,196,106,0.4);
    border-radius: var(--r-lg); padding: 1.5rem 2.5rem; margin-bottom: 2rem;
    gap: 0.25rem;
  }
  .price-label { font-size: 0.78rem; color: var(--green-light); font-weight: 600; letter-spacing: .05em; text-transform: uppercase; }
  .price-amount { font-size: clamp(2rem,5vw,3rem); font-weight: 800; color: var(--gold); letter-spacing: -1px; }
  .price-meta { font-size: 0.8rem; color: rgba(255,255,255,0.5); }
  .hero-tags { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.6rem; }
  .tag {
    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.7); font-size: 0.78rem; padding: 0.3rem 0.75rem;
    border-radius: 100px;
  }

  /* ── SECTION WRAPPER ── */
  .section { padding: clamp(3rem,7vw,5rem) var(--px); max-width: var(--max-w); margin: 0 auto; }
  .section-alt { background: var(--white); }
  .section-alt .section { /* nothing extra */ }

  .section-label {
    display: inline-flex; align-items: center; gap: 0.4rem;
    font-size: 0.72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: var(--green-mid); background: var(--green-pale);
    padding: 0.3rem 0.8rem; border-radius: 100px; margin-bottom: 1rem;
  }
  .section-title {
    font-family: var(--font-display); font-size: clamp(1.6rem,4vw,2.4rem);
    font-weight: 600; color: var(--green-deep); line-height: 1.25; margin-bottom: 0.75rem;
  }
  .section-lead { color: var(--muted); max-width: 600px; margin-bottom: 2.5rem; line-height: 1.75; }

  /* ── PAIN POINTS ── */
  .pain-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 1rem; margin-top: 2rem; }
  .pain-card {
    background: #FFF8F0; border: 1px solid #FFE5C8;
    border-radius: var(--r-md); padding: 1.25rem;
    display: flex; align-items: flex-start; gap: 0.75rem;
  }
  .pain-icon { font-size: 1.4rem; flex-shrink: 0; }
  .pain-text { font-size: 0.875rem; color: var(--ink); line-height: 1.5; }
  .solution-box {
    margin-top: 2rem; background: var(--green-pale);
    border: 1px solid var(--green-light); border-radius: var(--r-md);
    padding: 1.5rem 2rem;
  }
  .solution-box strong { color: var(--green-deep); font-size: 1.05rem; display: block; margin-bottom: 0.5rem; }
  .solution-box p { color: #2D4A3A; font-size: 0.9rem; line-height: 1.7; }

  /* ── 7 KAIH TABLE ── */
  .kaih-grid { display: grid; gap: 0.75rem; margin-top: 1.5rem; }
  .kaih-row {
    display: grid; grid-template-columns: 2.5rem 1fr 2fr;
    align-items: center; gap: 1rem;
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 0.9rem 1.1rem;
    transition: border-color .2s, box-shadow .2s;
  }
  .kaih-row:hover { border-color: var(--green-light); box-shadow: 0 2px 12px rgba(45,106,79,0.08); }
  .kaih-num {
    width: 2rem; height: 2rem; border-radius: 50%;
    background: var(--green-pale); color: var(--green-deep);
    font-weight: 800; font-size: 0.8rem;
    display: grid; place-items: center; flex-shrink: 0;
  }
  .kaih-name { font-weight: 700; font-size: 0.9rem; color: var(--green-deep); }
  .kaih-detail { font-size: 0.82rem; color: var(--muted); line-height: 1.4; }
  @media (max-width: 500px) {
    .kaih-row { grid-template-columns: 2rem 1fr; }
    .kaih-detail { grid-column: 2; margin-top: -0.25rem; }
  }

  /* ── FEATURES ── */
  .role-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .role-tab {
    padding: 0.5rem 1.1rem; border-radius: 100px;
    border: 2px solid var(--border); background: transparent;
    font-family: var(--font-body); font-size: 0.85rem; font-weight: 600;
    cursor: pointer; transition: all .2s; color: var(--muted);
  }
  .role-tab.active, .role-tab:hover {
    background: var(--green-deep); border-color: var(--green-deep);
    color: var(--white);
  }
  .role-panel { display: none; animation: fadeIn .3s ease; }
  .role-panel.active { display: block; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
  .feature-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 0.75rem; }
  .feature-item {
    display: flex; align-items: flex-start; gap: 0.75rem;
    background: var(--cream); border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 0.9rem 1rem;
  }
  .feature-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--green-light); flex-shrink: 0; margin-top: 0.45rem;
  }
  .feature-text { font-size: 0.875rem; line-height: 1.5; }

  /* ── PWA ── */
  .pwa-grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); gap: 1rem; margin-top: 1.5rem; }
  .pwa-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 1.25rem;
  }
  .pwa-card-top { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem; }
  .pwa-icon-wrap {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--green-pale); display: grid; place-items: center; font-size: 1.1rem;
  }
  .pwa-card-title { font-weight: 700; font-size: 0.9rem; color: var(--green-deep); }
  .pwa-card-desc { font-size: 0.82rem; color: var(--muted); line-height: 1.5; }

  /* ── DELIVERABLES ── */
  .deliverable-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 0.75rem; margin-top: 1.5rem; }
  .deliverable-item {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 1rem; text-align: center;
    transition: border-color .2s, transform .2s;
  }
  .deliverable-item:hover { border-color: var(--green-light); transform: translateY(-2px); }
  .d-num {
    display: inline-flex; width: 28px; height: 28px; border-radius: 50%;
    background: var(--green-deep); color: var(--white);
    font-size: 0.7rem; font-weight: 800; align-items: center; justify-content: center;
    margin-bottom: 0.5rem;
  }
  .d-title { font-weight: 700; font-size: 0.85rem; color: var(--green-deep); margin-bottom: 0.25rem; }
  .d-desc { font-size: 0.75rem; color: var(--muted); line-height: 1.4; }
  .price-hero {
    background: linear-gradient(135deg, var(--green-deep) 0%, var(--green-mid) 100%);
    border-radius: var(--r-lg); padding: 2rem; text-align: center;
    margin-bottom: 2rem;
  }
  .price-hero .ph-label { color: var(--green-light); font-size: 0.8rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 0.25rem; }
  .price-hero .ph-amount { font-size: clamp(2.2rem,6vw,3.5rem); font-weight: 800; color: var(--gold); letter-spacing: -1.5px; }
  .price-hero .ph-note { color: rgba(255,255,255,0.55); font-size: 0.8rem; margin-top: 0.25rem; }

  /* ── TIMELINE ── */
  .timeline { position: relative; padding-left: 2.5rem; margin-top: 1.5rem; }
  .timeline::before {
    content: ''; position: absolute; left: 0.7rem; top: 0; bottom: 0;
    width: 2px; background: var(--green-pale);
  }
  .tl-item { position: relative; margin-bottom: 1.75rem; }
  .tl-dot {
    position: absolute; left: -2.5rem;
    width: 1.4rem; height: 1.4rem; border-radius: 50%;
    background: var(--green-mid); border: 3px solid var(--white);
    box-shadow: 0 0 0 2px var(--green-mid);
    display: grid; place-items: center;
    font-size: 0.6rem; font-weight: 800; color: var(--white);
  }
  .tl-week { font-size: 0.72rem; font-weight: 700; letter-spacing: .06em; color: var(--green-mid); text-transform: uppercase; margin-bottom: 0.2rem; }
  .tl-focus { font-weight: 700; font-size: 0.95rem; color: var(--ink); margin-bottom: 0.2rem; }
  .tl-output { font-size: 0.82rem; color: var(--muted); }

  /* ── PROCESS ── */
  .process-steps { display: grid; grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); gap: 1rem; margin-top: 1.5rem; }
  .ps-item {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-md); padding: 1.25rem; text-align: center;
    position: relative; overflow: hidden;
  }
  .ps-num {
    font-size: 3rem; font-weight: 800; color: var(--green-pale);
    line-height: 1; margin-bottom: 0.5rem; font-family: var(--font-display);
  }
  .ps-icon { font-size: 1.5rem; margin-bottom: 0.4rem; }
  .ps-title { font-weight: 700; font-size: 0.9rem; color: var(--green-deep); margin-bottom: 0.3rem; }
  .ps-desc { font-size: 0.78rem; color: var(--muted); line-height: 1.45; }

  /* ── TECH ── */
  .tech-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 0.75rem; margin-top: 1.5rem; }
  .tech-item {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-sm); padding: 1rem;
  }
  .tech-component { font-size: 0.72rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.2rem; }
  .tech-name { font-weight: 700; font-size: 0.9rem; color: var(--green-deep); margin-bottom: 0.2rem; }
  .tech-why { font-size: 0.78rem; color: var(--muted); line-height: 1.4; }
  .security-note {
    margin-top: 1rem; display: flex; align-items: center; gap: 0.5rem;
    background: var(--green-pale); border-radius: var(--r-sm);
    padding: 0.75rem 1rem; font-size: 0.82rem; color: var(--green-deep);
  }

  /* ── REAL UI MOCKUPS ── */
  .ui-mockup-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 1.5rem;
    align-items: start;
  }
  .ui-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .ui-card-label {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: var(--green-mid);
    background: var(--green-pale);
    padding: 0.3rem 0.9rem;
    border-radius: 100px;
  }
  /* Phone shell */
  .phone-shell {
    width: 260px;
    background: #1A1A1E;
    border-radius: 36px;
    padding: 10px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.06);
    position: relative;
  }
  .phone-shell::before {
    content: '';
    display: block;
    width: 80px; height: 20px;
    background: #1A1A1E;
    border-radius: 0 0 14px 14px;
    margin: 0 auto 6px;
    position: relative; z-index: 2;
  }
  .phone-screen {
    background: #F5F7F5;
    border-radius: 26px;
    overflow: hidden;
    font-family: var(--font-body);
    font-size: 11px;
    min-height: 480px;
    display: flex;
    flex-direction: column;
  }
  /* Status bar */
  .ps-statusbar {
    background: var(--green-deep);
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 14px 4px;
    font-size: 9px; color: rgba(255,255,255,0.7); font-weight: 600;
  }
  /* App topbar */
  .ps-topbar {
    background: var(--green-deep);
    padding: 8px 14px 12px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ps-topbar-title { color: #fff; font-weight: 700; font-size: 13px; }
  .ps-topbar-sub { color: rgba(255,255,255,0.6); font-size: 9px; margin-top: 1px; }
  .ps-topbar-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--gold); display: grid; place-items: center;
    font-size: 11px; font-weight: 800; color: var(--green-deep);
  }
  .ps-notif-badge {
    background: #EF4444; color: #fff;
    font-size: 8px; font-weight: 800;
    padding: 1px 5px; border-radius: 100px;
    margin-left: 6px;
  }
  /* Scroll area */
  .ps-body {
    flex: 1; overflow: hidden;
    padding: 10px 12px;
    display: flex; flex-direction: column; gap: 8px;
    background: #F5F7F5;
  }
  /* Card inside phone */
  .ps-inner-card {
    background: #fff;
    border-radius: 12px;
    padding: 10px 12px;
    border: 1px solid #E8EDE8;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  }
  .ps-inner-card-title {
    font-weight: 700; font-size: 10px;
    color: var(--green-deep); margin-bottom: 6px;
    display: flex; align-items: center; justify-content: space-between;
  }
  /* Progress bar */
  .ps-progress-wrap { background: #E8EDE8; border-radius: 100px; height: 6px; margin: 4px 0; }
  .ps-progress-bar { height: 6px; border-radius: 100px; background: linear-gradient(90deg, var(--green-mid), var(--green-light)); }
  .ps-progress-label { display: flex; justify-content: space-between; font-size: 8px; color: var(--muted); margin-top: 2px; }
  /* 7 KAIH list in phone */
  .ps-kaih-list { display: flex; flex-direction: column; gap: 3px; }
  .ps-kaih-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 3px 0; border-bottom: 1px solid #F0F4F0;
    font-size: 9.5px;
  }
  .ps-kaih-row:last-child { border-bottom: none; }
  .ps-kaih-name { color: var(--ink); font-weight: 500; }
  .ps-badge-ok { background: #DCFCE7; color: #16A34A; font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 100px; }
  .ps-badge-warn { background: #FEF9C3; color: #CA8A04; font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 100px; }
  .ps-badge-flag { background: #FEE2E2; color: #DC2626; font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 100px; }
  /* Note/quote in phone */
  .ps-note {
    background: var(--green-pale); border-left: 3px solid var(--green-light);
    border-radius: 0 8px 8px 0; padding: 6px 8px;
    font-size: 9px; color: #2D4A3A; line-height: 1.5;
  }
  .ps-note-meta { font-size: 8px; color: var(--muted); margin-top: 3px; }
  /* Action buttons in phone */
  .ps-actions { display: flex; gap: 6px; margin-top: 4px; }
  .ps-btn {
    flex: 1; padding: 5px 0; border-radius: 8px;
    font-size: 9px; font-weight: 700; text-align: center;
    cursor: pointer;
  }
  .ps-btn-primary { background: var(--green-mid); color: #fff; }
  .ps-btn-wa { background: #25D366; color: #fff; display: flex; align-items: center; justify-content: center; gap: 3px; }
  .ps-btn-ghost { background: transparent; color: var(--green-mid); border: 1px solid var(--green-light); }
  /* Bottom nav */
  .ps-bottomnav {
    background: #fff;
    border-top: 1px solid #E8EDE8;
    display: flex;
    padding: 6px 0 10px;
  }
  .ps-nav-item {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 2px;
    font-size: 7.5px; color: var(--muted); cursor: pointer;
  }
  .ps-nav-item.active { color: var(--green-mid); }
  .ps-nav-icon { font-size: 14px; }
  /* Section label in phone */
  .ps-section-label {
    font-size: 8.5px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 4px;
  }
  /* Input row for guru */
  .ps-input-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 4px 0; border-bottom: 1px solid #F0F4F0;
    font-size: 9.5px;
  }
  .ps-input-row:last-child { border-bottom: none; }
  .ps-toggle-group { display: flex; gap: 4px; }
  .ps-toggle-yes {
    width: 22px; height: 18px; border-radius: 4px;
    background: #DCFCE7; border: 1.5px solid #16A34A;
    display: grid; place-items: center;
    font-size: 9px; color: #16A34A; font-weight: 800; cursor: pointer;
  }
  .ps-toggle-no {
    width: 22px; height: 18px; border-radius: 4px;
    background: #FEE2E2; border: 1.5px solid #DC2626;
    display: grid; place-items: center;
    font-size: 9px; color: #DC2626; font-weight: 800; cursor: pointer;
  }
  .ps-toggle-empty {
    width: 22px; height: 18px; border-radius: 4px;
    background: #F5F7F5; border: 1.5px solid #DDE3DC;
    display: grid; place-items: center;
    font-size: 9px; color: var(--muted); font-weight: 800; cursor: pointer;
  }
  /* Table in phone for admin */
  .ps-table { width: 100%; border-collapse: collapse; font-size: 8.5px; }
  .ps-table th { background: var(--green-pale); color: var(--green-deep); padding: 3px 5px; text-align: left; font-weight: 700; }
  .ps-table td { padding: 4px 5px; border-bottom: 1px solid #F0F4F0; color: var(--ink); }
  .ps-table tr:last-child td { border-bottom: none; }
  /* Stat pills row */
  .ps-stats-row { display: flex; gap: 6px; }
  .ps-stat-pill {
    flex: 1; background: #fff; border: 1px solid #E8EDE8;
    border-radius: 10px; padding: 6px 8px; text-align: center;
  }
  .ps-stat-num { font-size: 16px; font-weight: 800; color: var(--green-deep); line-height: 1; }
  .ps-stat-label { font-size: 7.5px; color: var(--muted); margin-top: 2px; }
  /* Desktop mockup */
  .desktop-shell {
    width: 100%;
    background: #2A2A2E;
    border-radius: 12px 12px 8px 8px;
    padding: 8px 8px 6px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.22);
  }
  .desktop-titlebar {
    background: #3A3A3E; border-radius: 6px 6px 0 0;
    padding: 6px 12px;
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 0;
  }
  .dt-dot { width: 10px; height: 10px; border-radius: 50%; }
  .desktop-screen {
    background: #F5F7F5; border-radius: 0 0 4px 4px;
    overflow: hidden; font-family: var(--font-body); font-size: 11px;
    min-height: 320px;
  }
  .dt-topbar {
    background: var(--green-deep);
    display: flex; align-items: center; gap: 0;
    padding: 0;
  }
  .dt-logo-area {
    background: rgba(0,0,0,0.2);
    padding: 10px 16px;
    display: flex; align-items: center; gap: 8px;
    border-right: 1px solid rgba(255,255,255,0.08);
  }
  .dt-logo-badge {
    width: 24px; height: 24px; border-radius: 6px;
    background: var(--gold); display: grid; place-items: center;
    font-weight: 800; font-size: 9px; color: var(--green-deep);
  }
  .dt-logo-name { color: #fff; font-weight: 700; font-size: 12px; }
  .dt-nav {
    display: flex; flex: 1; padding: 0 8px;
  }
  .dt-nav-item {
    padding: 10px 12px; font-size: 10px; font-weight: 600;
    color: rgba(255,255,255,0.6); cursor: pointer; border-bottom: 2px solid transparent;
    white-space: nowrap;
  }
  .dt-nav-item.active { color: #fff; border-bottom-color: var(--gold); }
  .dt-user-area {
    padding: 8px 14px; display: flex; align-items: center; gap: 8px;
    border-left: 1px solid rgba(255,255,255,0.08);
    font-size: 10px; color: rgba(255,255,255,0.8);
  }
  .dt-user-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--gold); display: grid; place-items: center;
    font-size: 10px; font-weight: 800; color: var(--green-deep);
  }
  /* Desktop content area */
  .dt-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    padding: 12px;
  }
  .dt-body-full {
    padding: 12px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .dt-panel {
    background: #fff; border-radius: 8px;
    border: 1px solid #E8EDE8;
    overflow: hidden;
  }
  .dt-panel-head {
    background: var(--green-pale); padding: 7px 12px;
    font-size: 9px; font-weight: 700; color: var(--green-deep);
    letter-spacing: .04em; text-transform: uppercase;
    display: flex; align-items: center; justify-content: space-between;
  }
  .dt-panel-body { padding: 10px 12px; }
  .dt-stat-row { display: flex; gap: 8px; }
  .dt-stat {
    flex: 1; background: var(--cream); border-radius: 6px;
    padding: 8px 10px; text-align: center;
  }
  .dt-stat-num { font-size: 18px; font-weight: 800; color: var(--green-deep); line-height: 1; }
  .dt-stat-label { font-size: 8px; color: var(--muted); margin-top: 2px; }
  /* Tren bars chart */
  .dt-chart { display: flex; align-items: flex-end; gap: 4px; height: 60px; margin-top: 6px; }
  .dt-bar-group { flex: 1; display: flex; align-items: flex-end; gap: 1px; }
  .dt-bar { border-radius: 3px 3px 0 0; min-width: 6px; }
  .dt-chart-label { display: flex; justify-content: space-around; font-size: 7.5px; color: var(--muted); margin-top: 3px; }
  /* Table desktop */
  .dt-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
  .dt-table th { background: #F5F7F5; color: var(--muted); padding: 5px 8px; text-align: left; font-weight: 700; font-size: 8.5px; letter-spacing: .03em; text-transform: uppercase; border-bottom: 1px solid #E8EDE8; }
  .dt-table td { padding: 6px 8px; border-bottom: 1px solid #F0F4F0; color: var(--ink); vertical-align: middle; }
  .dt-table tr:last-child td { border-bottom: none; }
  .dt-table tr:hover td { background: #F8FBF8; }
  .dt-score-bar { display: flex; align-items: center; gap: 6px; }
  .dt-score-track { background: #E8EDE8; border-radius: 100px; height: 5px; width: 50px; }
  .dt-score-fill { height: 5px; border-radius: 100px; background: linear-gradient(90deg, var(--green-mid), var(--green-light)); }
  .dt-badge-ok { background: #DCFCE7; color: #16A34A; font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 100px; white-space: nowrap; }
  .dt-badge-warn { background: #FEF9C3; color: #CA8A04; font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 100px; white-space: nowrap; }
  .dt-badge-flag { background: #FEE2E2; color: #DC2626; font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 100px; white-space: nowrap; }
  .dt-action-btn {
    background: var(--green-pale); color: var(--green-deep);
    border: none; border-radius: 6px; padding: 4px 10px;
    font-size: 9px; font-weight: 700; cursor: pointer;
  }
  .ui-desktop-card { display: flex; flex-direction: column; gap: 0.75rem; }
  .ui-desktop-label {
    font-size: 0.78rem; font-weight: 700; letter-spacing: .06em;
    text-transform: uppercase; color: var(--green-mid);
    background: var(--green-pale); padding: 0.3rem 0.9rem;
    border-radius: 100px; align-self: flex-start;
  }

  /* ── FAQ ── */
  .faq-list { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
  .faq-item {
    background: var(--white); border: 1px solid var(--border);
    border-radius: var(--r-md); overflow: hidden;
  }
  .faq-q {
    display: flex; align-items: center; justify-content: space-between;
    padding: 1rem 1.25rem; cursor: pointer; font-weight: 600; font-size: 0.9rem;
    gap: 1rem; user-select: none;
  }
  .faq-q:hover { background: #f6faf7; }
  .faq-arrow { font-size: 0.75rem; color: var(--green-mid); transition: transform .25s; flex-shrink: 0; }
  .faq-item.open .faq-arrow { transform: rotate(180deg); }
  .faq-a {
    max-height: 0; overflow: hidden; transition: max-height .35s ease, padding .2s;
    font-size: 0.875rem; color: var(--muted); line-height: 1.7;
    padding: 0 1.25rem;
  }
  .faq-item.open .faq-a { max-height: 200px; padding: 0 1.25rem 1rem; }

  /* ── CTA ── */
  .cta-section {
    background: linear-gradient(135deg, var(--green-deep) 0%, #0F2419 100%);
    padding: clamp(3rem,7vw,5rem) var(--px); text-align: center; position: relative; overflow: hidden;
  }
  .cta-section::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 100%, rgba(82,183,136,0.2) 0%, transparent 70%);
    pointer-events: none;
  }
  .cta-section h2 {
    font-family: var(--font-display); font-size: clamp(1.8rem,4vw,2.8rem);
    color: var(--white); margin-bottom: 1rem; line-height: 1.2;
  }
  .cta-section h2 em { color: var(--gold); font-style: italic; }
  .cta-section p { color: rgba(255,255,255,0.65); max-width: 540px; margin: 0 auto 2rem; font-size: 0.95rem; line-height: 1.7; }
  .cta-buttons { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.75rem; }
  .btn-gold {
    background: var(--gold); color: var(--green-deep);
    padding: 0.8rem 2rem; border-radius: 10px;
    font-family: var(--font-body); font-weight: 800; font-size: 1rem;
    cursor: pointer; text-decoration: none; border: none;
    transition: background .2s, transform .15s;
  }
  .btn-gold:hover { background: #f5d17e; transform: translateY(-2px); }
  .btn-outline {
    background: transparent; color: rgba(255,255,255,0.8);
    border: 2px solid rgba(255,255,255,0.25);
    padding: 0.8rem 2rem; border-radius: 10px;
    font-family: var(--font-body); font-weight: 600; font-size: 1rem;
    cursor: pointer; text-decoration: none;
    transition: border-color .2s, color .2s;
  }
  .btn-outline:hover { border-color: rgba(255,255,255,0.6); color: var(--white); }
  .cta-free { margin-top: 1rem; font-size: 0.78rem; color: rgba(255,255,255,0.4); }

  /* ── FOOTER ── */
  footer {
    background: var(--green-deep); border-top: 1px solid rgba(255,255,255,0.08);
    padding: 1.5rem var(--px); display: flex; flex-wrap: wrap;
    align-items: center; justify-content: space-between; gap: 0.5rem;
  }
  footer p { color: rgba(255,255,255,0.4); font-size: 0.78rem; }
  footer a { color: var(--green-light); text-decoration: none; }
  footer a:hover { color: var(--gold); }

  /* ── DIVIDER ── */
  .divider { border: none; border-top: 1px solid var(--border); margin: 0; }

  /* ── WIREFRAME ── */
  .wf-mobile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    align-items: start;
  }
  .wf-card { display: flex; flex-direction: column; gap: 0.6rem; }
  .wf-card-wide { width: 100%; }
  .wf-card-label {
    font-size: 0.75rem; font-weight: 700; letter-spacing: .05em;
    text-transform: uppercase; color: var(--green-mid);
    border-left: 3px solid var(--green-light); padding-left: 0.6rem;
  }
  .wf-phone {
    background: var(--green-deep); border-radius: 16px;
    padding: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    max-width: 300px; margin: 0 auto;
  }
  .wf-phone-inner {
    background: #F0FBF4; border-radius: 10px;
    overflow: hidden;
  }
  .wf-pre {
    font-family: 'Courier New', Courier, monospace;
    font-size: clamp(0.5rem, 1.5vw, 0.72rem);
    line-height: 1.5;
    color: var(--green-deep);
    white-space: pre;
    overflow-x: auto;
    padding: 0.75rem;
    background: transparent;
  }
  .wf-desktop-grid { display: flex; flex-direction: column; gap: 1.5rem; }
  .wf-desktop-box {
    background: #F0FBF4; border: 1px solid var(--border);
    border-radius: var(--r-md); overflow-x: auto;
    padding: 0.75rem;
  }
  .wf-pre-desktop {
    font-size: clamp(0.45rem, 1.2vw, 0.68rem);
    color: var(--green-deep);
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 400px) {
    .hero-price-card { padding: 1.25rem 1.5rem; }
    .kaih-row { grid-template-columns: 2rem auto; row-gap: 0.2rem; }
    .kaih-detail { grid-column: 1 / -1; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-brand">
    <div class="nav-logo">AB</div>
    <span class="nav-name">ABAT · aidukasi.net</span>
  </div>
  <div class="nav-links">
    <a href="#fitur">Fitur</a>
    <a href="#investasi">Investasi</a>
    <a href="#timeline">Timeline</a>
    <a href="#faq">FAQ</a>
  </div>
  <a href="https://wa.me/6288228511309" class="nav-cta" target="_blank">Konsultasi Gratis</a>
</nav>

<!-- HERO -->
<header class="hero">
  <div class="hero-badge">📋 Penawaran Resmi · 2025 · Versi 1.0</div>
  <h1><span>ABAT</span></h1>
  <p class="hero-sub">Aku Bisa, Aku Terbiasa</p>
  <p class="hero-desc">Sistem Digital Monitoring 7 Kebiasaan Anak Indonesia Hebat (7 KAIH) — menghubungkan Kepala Sekolah, Guru, dan Wali Murid dalam satu platform terintegrasi.</p>
  <div class="hero-price-card">
    <span class="price-label">💰 Total Investasi</span>
    <span class="price-amount">Rp 2.500.000</span>
    <span class="price-meta">Termasuk domain .web.id · Estimasi 4 pekan</span>
  </div>
  <div class="hero-tags">
    <span class="tag">📱 PWA — seperti aplikasi di HP</span>
    <span class="tag">🌐 Custom Domain .web.id</span>
    <span class="tag">📊 Dashboard Real-time</span>
    <span class="tag">📄 Laporan PDF & Excel</span>
  </div>
</header>

<!-- SECTION 1: MENGAPA ABAT -->
<div id="mengapa">
  <div class="section">
    <div class="section-label">1 · Latar Belakang</div>
    <h2 class="section-title">Mengapa Sekolah Anda Butuh ABAT?</h2>
    <p class="section-lead">Berdasarkan Permendikdasmen No. 8 Tahun 2025, seluruh Sekolah Dasar wajib mengimplementasikan Program 7 KAIH. Namun di lapangan, tantangan nyata masih dihadapi.</p>

    <div class="pain-grid">
      <div class="pain-card">
        <span class="pain-icon">📋</span>
        <span class="pain-text">Monitoring masih manual — catatan di kertas, rentan hilang atau tidak terupdate</span>
      </div>
      <div class="pain-card">
        <span class="pain-icon">🔗</span>
        <span class="pain-text">Tidak ada koneksi real-time antara sekolah dan orang tua</span>
      </div>
      <div class="pain-card">
        <span class="pain-icon">📊</span>
        <span class="pain-text">Sulit menghasilkan laporan yang siap disetor ke Dinas Pendidikan</span>
      </div>
      <div class="pain-card">
        <span class="pain-icon">⏳</span>
        <span class="pain-text">Guru kelebihan beban administrasi di luar jam mengajar</span>
      </div>
    </div>

    <div class="solution-box">
      <strong>✅ Solusinya: Aplikasi ABAT</strong>
      <p>ABAT adalah platform web berbasis data yang menghubungkan Kepala Sekolah, Guru, dan Wali Murid dalam satu sistem terintegrasi — memudahkan monitoring 7 KAIH secara digital, real-time, dan terstruktur.</p>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 2: 7 KAIH -->
<div>
  <div class="section">
    <div class="section-label">2 · Cakupan Monitoring</div>
    <h2 class="section-title">7 Kebiasaan yang Dipantau</h2>
    <p class="section-lead">Seluruh fitur ABAT dirancang mengelilingi 7 kebiasaan inti berikut ini.</p>

    <div class="kaih-grid">
      <div class="kaih-row">
        <div class="kaih-num">1</div>
        <div><div class="kaih-name">🕐 Disiplin</div></div>
        <div class="kaih-detail">Kehadiran, keterlambatan, kelengkapan tugas</div>
      </div>
      <div class="kaih-row">
        <div class="kaih-num">2</div>
        <div><div class="kaih-name">✅ Tanggung Jawab</div></div>
        <div class="kaih-detail">Pengumpulan tugas tepat waktu</div>
      </div>
      <div class="kaih-row">
        <div class="kaih-num">3</div>
        <div><div class="kaih-name">💬 Jujur</div></div>
        <div class="kaih-detail">Penilaian guru & laporan insiden</div>
      </div>
      <div class="kaih-row">
        <div class="kaih-num">4</div>
        <div><div class="kaih-name">🤝 Peduli</div></div>
        <div class="kaih-detail">Laporan observasi guru terhadap interaksi sosial</div>
      </div>
      <div class="kaih-row">
        <div class="kaih-num">5</div>
        <div><div class="kaih-name">🌟 Percaya Diri</div></div>
        <div class="kaih-detail">Partisipasi kelas & presentasi</div>
      </div>
      <div class="kaih-row">
        <div class="kaih-num">6</div>
        <div><div class="kaih-name">💪 Kerja Keras</div></div>
        <div class="kaih-detail">Progres belajar & perkembangan nilai</div>
      </div>
      <div class="kaih-row">
        <div class="kaih-num">7</div>
        <div><div class="kaih-name">🎯 Mandiri</div></div>
        <div class="kaih-detail">Kemandirian tugas & catatan refleksi diri</div>
      </div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 3: FITUR -->
<div class="section-alt" id="fitur">
  <div class="section">
    <div class="section-label">3 · Fitur Utama</div>
    <h2 class="section-title">Apa yang Bisa Dilakukan Setiap Pengguna</h2>
    <p class="section-lead">Tiga peran dengan dashboard dan akses masing-masing — semuanya dalam satu platform.</p>

    <div class="role-tabs">
      <button class="role-tab active" onclick="switchTab('admin',this)">👨‍💼 Kepala Sekolah</button>
      <button class="role-tab" onclick="switchTab('guru',this)">👩‍🏫 Guru</button>
      <button class="role-tab" onclick="switchTab('wali',this)">👨‍👩‍👧 Wali Murid</button>
    </div>

    <div id="tab-admin" class="role-panel active">
      <div class="feature-list">
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Dashboard komprehensif seluruh sekolah — lihat kondisi 7 KAIH secara agregat</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Kelola akun guru dan wali murid (tambah, edit, nonaktifkan)</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Atur struktur kelas dan data siswa per tahun ajaran</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Jadwalkan sesi ABAT otomatis (Senin, Rabu, Jumat) + notifikasi ke guru</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Export laporan PDF & Excel siap setor ke Dinas Pendidikan</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Lihat riwayat seluruh aktivitas sistem (audit log)</div></div>
      </div>
    </div>

    <div id="tab-guru" class="role-panel">
      <div class="feature-list">
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Input kebiasaan harian siswa dengan cepat — checklist satu halaman untuk satu kelas</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Dashboard kelas: lihat ringkasan 7 KAIH seluruh siswa dalam satu tampilan</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Tandai siswa yang butuh perhatian khusus (flag alert)</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Tulis catatan observasi kualitatif per siswa</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Kirim pesan/notifikasi langsung ke wali murid</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Cetak laporan kelas bulanan</div></div>
      </div>
    </div>

    <div id="tab-wali" class="role-panel">
      <div class="feature-list">
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Pantau perkembangan 7 kebiasaan anak secara real-time dari HP</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Grafik tren kebiasaan anak: mingguan, bulanan, per semester</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Baca catatan observasi dari guru</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Isi laporan pembiasaan di rumah (home-school connect)</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Terima notifikasi progres mingguan via WhatsApp / email</div></div>
        <div class="feature-item"><div class="feature-dot"></div><div class="feature-text">Support multi-anak dalam satu akun (untuk orang tua dengan 2 anak di sekolah yang sama)</div></div>
      </div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 4: UI MOCKUP -->
<div>
  <div class="section">
    <div class="section-label">4 · Tampilan Aplikasi</div>
    <h2 class="section-title">Pratinjau Antarmuka</h2>
    <p class="section-lead">Tampilan nyata ABAT untuk tiga peran pengguna — mobile-first, terasa seperti aplikasi native berkat PWA.</p>

    <!-- Mobile/Desktop tab toggle -->
    <div class="role-tabs" style="margin-bottom:1.5rem;">
      <button class="role-tab active" onclick="switchWireframe('mobile',this)">📱 Mobile View</button>
      <button class="role-tab" onclick="switchWireframe('desktop',this)">🖥️ Desktop View</button>
    </div>

    <!-- MOBILE UI MOCKUPS -->
    <div id="wf-mobile" class="wf-panel">
      <p style="font-size:0.85rem;color:var(--muted);margin-bottom:1.5rem;">Karena sebagian besar pengguna mengakses lewat HP, ABAT dirancang <strong>mobile-first</strong>. Bisa diinstal di layar utama HP tanpa App Store — tampil seperti aplikasi native.</p>
      <div class="ui-mockup-grid">

        <!-- Wali Murid Mobile -->
        <div class="ui-card">
          <div class="ui-card-label">👨‍👩‍👧 Dashboard Wali Murid</div>
          <div class="phone-shell">
            <div class="phone-screen">
              <!-- Status bar -->
              <div class="ps-statusbar">
                <span>9:41</span>
                <span>●●● 5G 🔋</span>
              </div>
              <!-- Topbar -->
              <div class="ps-topbar">
                <div>
                  <div class="ps-topbar-title">ABAT <span class="ps-notif-badge">1</span></div>
                  <div class="ps-topbar-sub">SDN Latsari 2 Bancar</div>
                </div>
                <div class="ps-topbar-avatar">BS</div>
              </div>
              <!-- Body -->
              <div class="ps-body">
                <!-- Greeting -->
                <div style="font-size:11px;font-weight:700;color:var(--green-deep);">Halo, Bu Sari 👋</div>

                <!-- Anak card -->
                <div class="ps-inner-card">
                  <div class="ps-inner-card-title">
                    <span>Ahmad Fauzi · Kelas 4A</span>
                    <span class="ps-badge-ok">Aktif</span>
                  </div>
                  <div class="ps-section-label">Skor Minggu Ini</div>
                  <div class="ps-progress-wrap">
                    <div class="ps-progress-bar" style="width:82%"></div>
                  </div>
                  <div class="ps-progress-label"><span>0%</span><span style="color:var(--green-mid);font-weight:700;">82%</span><span>100%</span></div>
                </div>

                <!-- 7 KAIH list -->
                <div class="ps-inner-card">
                  <div class="ps-inner-card-title">7 KAIH Hari Ini</div>
                  <div class="ps-kaih-list">
                    <div class="ps-kaih-row"><span class="ps-kaih-name">🕐 Disiplin</span><span class="ps-badge-ok">✓ Baik</span></div>
                    <div class="ps-kaih-row"><span class="ps-kaih-name">✅ Tanggung Jawab</span><span class="ps-badge-ok">✓ Baik</span></div>
                    <div class="ps-kaih-row"><span class="ps-kaih-name">💬 Jujur</span><span class="ps-badge-ok">✓ Baik</span></div>
                    <div class="ps-kaih-row"><span class="ps-kaih-name">🤝 Peduli</span><span class="ps-badge-ok">✓ Baik</span></div>
                    <div class="ps-kaih-row"><span class="ps-kaih-name">🌟 Percaya Diri</span><span class="ps-badge-warn">⚠ Perhatian</span></div>
                    <div class="ps-kaih-row"><span class="ps-kaih-name">💪 Kerja Keras</span><span class="ps-badge-ok">✓ Baik</span></div>
                    <div class="ps-kaih-row"><span class="ps-kaih-name">🎯 Mandiri</span><span class="ps-badge-ok">✓ Baik</span></div>
                  </div>
                </div>

                <!-- Catatan Guru -->
                <div class="ps-note">
                  📝 <strong>Catatan Bu Rina</strong><br>
                  Ahmad aktif diskusi kelompok. Perlu dorongan saat tampil di depan kelas.
                  <div class="ps-note-meta">27 Januari 2025</div>
                </div>

                <!-- Actions -->
                <div class="ps-actions">
                  <div class="ps-btn ps-btn-ghost">📊 Lihat Tren</div>
                  <div class="ps-btn ps-btn-wa">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.541 5.876L0 24l6.292-1.518A11.957 11.957 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.785 9.785 0 01-5.045-1.397l-.361-.215-3.735.901.936-3.628-.236-.374A9.786 9.786 0 012.182 12c0-5.415 4.403-9.818 9.818-9.818 5.414 0 9.818 4.403 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/></svg>
                    Hubungi Guru
                  </div>
                </div>
              </div>
              <!-- Bottom Nav -->
              <div class="ps-bottomnav">
                <div class="ps-nav-item active"><div class="ps-nav-icon">🏠</div>Beranda</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">📊</div>Tren</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">📝</div>Catatan</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">⚙️</div>Akun</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Guru Mobile -->
        <div class="ui-card">
          <div class="ui-card-label">👩‍🏫 Input Kebiasaan — Guru</div>
          <div class="phone-shell">
            <div class="phone-screen">
              <div class="ps-statusbar">
                <span>9:41</span>
                <span>●●● 4G 🔋</span>
              </div>
              <div class="ps-topbar">
                <div>
                  <div class="ps-topbar-title">← Input ABAT</div>
                  <div class="ps-topbar-sub">Kelas 4A · Senin, 27 Jan</div>
                </div>
                <div class="ps-btn ps-btn-primary" style="padding:4px 10px;border-radius:8px;font-size:9px;font-weight:700;color:#fff;">Simpan</div>
              </div>
              <div class="ps-body">
                <!-- Progress input -->
                <div class="ps-inner-card" style="padding:8px 10px;">
                  <div class="ps-section-label">Progress Input Hari Ini</div>
                  <div class="ps-progress-wrap">
                    <div class="ps-progress-bar" style="width:60%"></div>
                  </div>
                  <div class="ps-progress-label"><span>18 dari 30 siswa</span><span style="color:var(--green-mid);font-weight:700;">60%</span></div>
                </div>

                <!-- Siswa 1 -->
                <div class="ps-inner-card">
                  <div class="ps-inner-card-title">
                    <span>Ahmad Fauzi</span>
                    <span style="font-size:8px;color:var(--muted);font-weight:500;">No. 01</span>
                  </div>
                  <div class="ps-kaih-list">
                    <div class="ps-input-row"><span class="ps-kaih-name">🕐 Disiplin</span><div class="ps-toggle-group"><div class="ps-toggle-yes">✓</div><div class="ps-toggle-empty">✗</div></div></div>
                    <div class="ps-input-row"><span class="ps-kaih-name">✅ Tanggung Jawab</span><div class="ps-toggle-group"><div class="ps-toggle-yes">✓</div><div class="ps-toggle-empty">✗</div></div></div>
                    <div class="ps-input-row"><span class="ps-kaih-name">💬 Jujur</span><div class="ps-toggle-group"><div class="ps-toggle-yes">✓</div><div class="ps-toggle-empty">✗</div></div></div>
                    <div class="ps-input-row"><span class="ps-kaih-name">🤝 Peduli</span><div class="ps-toggle-group"><div class="ps-toggle-yes">✓</div><div class="ps-toggle-empty">✗</div></div></div>
                    <div class="ps-input-row"><span class="ps-kaih-name">🌟 Percaya Diri</span><div class="ps-toggle-group"><div class="ps-toggle-empty">✓</div><div class="ps-toggle-no">✗</div></div></div>
                    <div class="ps-input-row"><span class="ps-kaih-name">💪 Kerja Keras</span><div class="ps-toggle-group"><div class="ps-toggle-yes">✓</div><div class="ps-toggle-empty">✗</div></div></div>
                    <div class="ps-input-row"><span class="ps-kaih-name">🎯 Mandiri</span><div class="ps-toggle-group"><div class="ps-toggle-yes">✓</div><div class="ps-toggle-empty">✗</div></div></div>
                  </div>
                  <div class="ps-actions" style="margin-top:6px;">
                    <div class="ps-btn ps-btn-ghost">+ Catatan</div>
                    <div class="ps-btn" style="background:#FEF9C3;color:#CA8A04;border:1px solid #FDE047;font-size:9px;font-weight:700;text-align:center;padding:5px 0;border-radius:8px;">🚩 Flag</div>
                    <div class="ps-btn ps-btn-wa" style="flex:none;padding:5px 8px;">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.541 5.876L0 24l6.292-1.518A11.957 11.957 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.785 9.785 0 01-5.045-1.397l-.361-.215-3.735.901.936-3.628-.236-.374A9.786 9.786 0 012.182 12c0-5.415 4.403-9.818 9.818-9.818 5.414 0 9.818 4.403 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/></svg>
                      WA
                    </div>
                  </div>
                </div>

                <!-- Siswa 2 preview -->
                <div class="ps-inner-card" style="opacity:0.6;">
                  <div class="ps-inner-card-title">
                    <span>Budi Santoso</span>
                    <span style="font-size:8px;color:var(--muted);">No. 02</span>
                  </div>
                  <div style="font-size:8.5px;color:var(--muted);text-align:center;padding:6px 0;">↓ scroll untuk input</div>
                </div>
              </div>
              <div class="ps-bottomnav">
                <div class="ps-nav-item"><div class="ps-nav-icon">🏠</div>Dashboard</div>
                <div class="ps-nav-item active"><div class="ps-nav-icon">✏️</div>Input</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">📊</div>Laporan</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">💬</div>Pesan</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Admin Mobile -->
        <div class="ui-card">
          <div class="ui-card-label">👨‍💼 Ringkasan Sekolah — Admin</div>
          <div class="phone-shell">
            <div class="phone-screen">
              <div class="ps-statusbar">
                <span>9:41</span>
                <span>●●● 5G 🔋</span>
              </div>
              <div class="ps-topbar">
                <div>
                  <div class="ps-topbar-title">ABAT Admin <span class="ps-notif-badge">3</span></div>
                  <div class="ps-topbar-sub">SDN Latsari 2 · Senin, 27 Jan</div>
                </div>
                <div class="ps-topbar-avatar">KS</div>
              </div>
              <div class="ps-body">
                <!-- Stat pills -->
                <div class="ps-stats-row">
                  <div class="ps-stat-pill"><div class="ps-stat-num">5</div><div class="ps-stat-label">Kelas Aktif</div></div>
                  <div class="ps-stat-pill"><div class="ps-stat-num" style="color:#CA8A04;">5</div><div class="ps-stat-label">🚩 Perhatian</div></div>
                  <div class="ps-stat-pill"><div class="ps-stat-num">76%</div><div class="ps-stat-label">Rata-rata</div></div>
                </div>

                <!-- Rekap kelas -->
                <div class="ps-inner-card">
                  <div class="ps-inner-card-title">📊 Rekapitulasi Hari Ini</div>
                  <table class="ps-table">
                    <thead>
                      <tr><th>Kelas</th><th>KAIH %</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      <tr><td>4A</td><td style="font-weight:700;">88%</td><td><span class="ps-badge-ok">✓ Baik</span></td></tr>
                      <tr><td>4B</td><td style="font-weight:700;">82%</td><td><span class="ps-badge-ok">✓ Baik</span></td></tr>
                      <tr><td>5A</td><td style="font-weight:700;">67%</td><td><span class="ps-badge-warn">⚠ Pantau</span></td></tr>
                      <tr><td>5B</td><td style="font-weight:700;">79%</td><td><span class="ps-badge-ok">✓ Baik</span></td></tr>
                      <tr><td>6A</td><td style="font-weight:700;">55%</td><td><span class="ps-badge-flag">🔴 Kritis</span></td></tr>
                    </tbody>
                  </table>
                </div>

                <!-- Jadwal -->
                <div class="ps-inner-card">
                  <div class="ps-inner-card-title">📅 Jadwal ABAT Berikutnya</div>
                  <div style="font-size:10px;color:var(--ink);font-weight:600;">Rabu, 29 Jan 2025 — 07.30</div>
                  <div class="ps-actions" style="margin-top:6px;">
                    <div class="ps-btn ps-btn-wa">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.541 5.876L0 24l6.292-1.518A11.957 11.957 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.785 9.785 0 01-5.045-1.397l-.361-.215-3.735.901.936-3.628-.236-.374A9.786 9.786 0 012.182 12c0-5.415 4.403-9.818 9.818-9.818 5.414 0 9.818 4.403 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/></svg>
                      Kirim Reminder Guru
                    </div>
                    <div class="ps-btn ps-btn-ghost">📁 Export</div>
                  </div>
                </div>
              </div>
              <div class="ps-bottomnav">
                <div class="ps-nav-item active"><div class="ps-nav-icon">🏠</div>Dashboard</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">👥</div>Pengguna</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">📊</div>Laporan</div>
                <div class="ps-nav-item"><div class="ps-nav-icon">⚙️</div>Pengaturan</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- DESKTOP UI MOCKUPS -->
    <div id="wf-desktop" class="wf-panel" style="display:none;">
      <p style="font-size:0.85rem;color:var(--muted);margin-bottom:1.5rem;">Tampilan desktop memberikan ruang lebih untuk grafik, tabel, dan multi-panel — ideal untuk kepala sekolah dan guru saat di kantor.</p>

      <div style="display:flex;flex-direction:column;gap:2rem;">

        <!-- Guru Desktop -->
        <div class="ui-desktop-card">
          <div class="ui-desktop-label">👩‍🏫 Dashboard Guru — Desktop</div>
          <div class="desktop-shell">
            <div class="desktop-titlebar">
              <div class="dt-dot" style="background:#FF5F57;"></div>
              <div class="dt-dot" style="background:#FFBD2E;"></div>
              <div class="dt-dot" style="background:#28C840;"></div>
              <span style="font-size:9px;color:#888;margin-left:8px;">abat-latsari2.web.id/guru/dashboard</span>
            </div>
            <div class="desktop-screen">
              <!-- Topbar -->
              <div class="dt-topbar">
                <div class="dt-logo-area">
                  <div class="dt-logo-badge">AB</div>
                  <div class="dt-logo-name">ABAT</div>
                </div>
                <div class="dt-nav">
                  <div class="dt-nav-item active">🏠 Dashboard</div>
                  <div class="dt-nav-item">✏️ Input ABAT</div>
                  <div class="dt-nav-item">📊 Laporan</div>
                  <div class="dt-nav-item">💬 Pesan</div>
                  <div class="dt-nav-item">⚙️</div>
                </div>
                <div class="dt-user-area">
                  <span style="font-size:9px;">🔔 <span style="background:#EF4444;color:#fff;padding:1px 5px;border-radius:10px;font-size:8px;font-weight:700;">3</span></span>
                  <div class="dt-user-avatar">BR</div>
                  <span style="font-size:9px;">Bu Rina</span>
                </div>
              </div>
              <!-- Content -->
              <div style="padding:10px 12px;font-size:10px;font-weight:700;color:var(--green-deep);border-bottom:1px solid #E8EDE8;display:flex;justify-content:space-between;align-items:center;">
                <span>📋 Kelas 4A — Senin, 27 Januari 2025</span>
                <button class="dt-action-btn" style="background:var(--green-mid);color:#fff;">+ Input ABAT Hari Ini</button>
              </div>
              <div class="dt-body">
                <!-- Panel kiri: ringkasan + chart -->
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div class="dt-panel">
                    <div class="dt-panel-head">Ringkasan Kelas</div>
                    <div class="dt-panel-body">
                      <div class="dt-stat-row">
                        <div class="dt-stat"><div class="dt-stat-num">30</div><div class="dt-stat-label">Total Siswa</div></div>
                        <div class="dt-stat"><div class="dt-stat-num">24</div><div class="dt-stat-label">Input Hari Ini</div></div>
                        <div class="dt-stat"><div class="dt-stat-num" style="color:#CA8A04;">3</div><div class="dt-stat-label">🚩 Perhatian</div></div>
                      </div>
                      <div style="margin-top:8px;display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:9px;color:var(--muted);">Rata-rata skor kelas</span>
                        <span style="font-size:13px;font-weight:800;color:var(--green-deep);">78%</span>
                      </div>
                      <div class="ps-progress-wrap" style="margin-top:4px;">
                        <div class="ps-progress-bar" style="width:78%"></div>
                      </div>
                    </div>
                  </div>
                  <div class="dt-panel">
                    <div class="dt-panel-head">Tren 7 KAIH — 4 Minggu</div>
                    <div class="dt-panel-body">
                      <div class="dt-chart">
                        <div class="dt-bar-group">
                          <div class="dt-bar" style="height:80%;background:var(--green-light);flex:1;"></div>
                        </div>
                        <div class="dt-bar-group">
                          <div class="dt-bar" style="height:72%;background:var(--green-light);flex:1;opacity:.8;"></div>
                        </div>
                        <div class="dt-bar-group">
                          <div class="dt-bar" style="height:65%;background:var(--green-light);flex:1;opacity:.65;"></div>
                        </div>
                        <div class="dt-bar-group">
                          <div class="dt-bar" style="height:78%;background:var(--green-mid);flex:1;"></div>
                        </div>
                      </div>
                      <div class="dt-chart-label">
                        <span>Jan 6</span><span>Jan 13</span><span>Jan 20</span><span>Jan 27</span>
                      </div>
                    </div>
                  </div>
                </div>
                <!-- Panel kanan: tabel siswa -->
                <div class="dt-panel">
                  <div class="dt-panel-head">
                    <span>Daftar Siswa</span>
                    <button class="dt-action-btn">Export PDF</button>
                  </div>
                  <div class="dt-panel-body" style="padding:0;">
                    <table class="dt-table">
                      <thead>
                        <tr>
                          <th>Nama</th>
                          <th>Skor</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style="font-weight:600;">Ahmad Fauzi</td>
                          <td>
                            <div class="dt-score-bar">
                              <div class="dt-score-track"><div class="dt-score-fill" style="width:86%;"></div></div>
                              <span style="font-weight:700;">86%</span>
                            </div>
                          </td>
                          <td><span class="dt-badge-warn">⚠ PD</span></td>
                          <td><button class="dt-action-btn">Detail</button></td>
                        </tr>
                        <tr>
                          <td style="font-weight:600;">Budi Santoso</td>
                          <td>
                            <div class="dt-score-bar">
                              <div class="dt-score-track"><div class="dt-score-fill" style="width:100%;"></div></div>
                              <span style="font-weight:700;">100%</span>
                            </div>
                          </td>
                          <td><span class="dt-badge-ok">✓ Baik</span></td>
                          <td><button class="dt-action-btn">Detail</button></td>
                        </tr>
                        <tr>
                          <td style="font-weight:600;">Citra Dewi</td>
                          <td>
                            <div class="dt-score-bar">
                              <div class="dt-score-track"><div class="dt-score-fill" style="width:71%;"></div></div>
                              <span style="font-weight:700;">71%</span>
                            </div>
                          </td>
                          <td><span class="dt-badge-flag">🚩 Flag</span></td>
                          <td><button class="dt-action-btn">Detail</button></td>
                        </tr>
                        <tr>
                          <td style="color:var(--muted);font-style:italic;" colspan="4">+ 27 siswa lainnya…</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Wali Murid Desktop -->
        <div class="ui-desktop-card">
          <div class="ui-desktop-label">👨‍👩‍👧 Dashboard Wali Murid — Desktop</div>
          <div class="desktop-shell">
            <div class="desktop-titlebar">
              <div class="dt-dot" style="background:#FF5F57;"></div>
              <div class="dt-dot" style="background:#FFBD2E;"></div>
              <div class="dt-dot" style="background:#28C840;"></div>
              <span style="font-size:9px;color:#888;margin-left:8px;">abat-latsari2.web.id/wali/dashboard</span>
            </div>
            <div class="desktop-screen">
              <div class="dt-topbar">
                <div class="dt-logo-area">
                  <div class="dt-logo-badge">AB</div>
                  <div class="dt-logo-name">ABAT</div>
                </div>
                <div class="dt-nav">
                  <div class="dt-nav-item active">🏠 Beranda</div>
                  <div class="dt-nav-item">📊 Tren</div>
                  <div class="dt-nav-item">📝 Catatan Guru</div>
                  <div class="dt-nav-item">🏠 Lapor Rumah</div>
                  <div class="dt-nav-item">💬 Pesan</div>
                </div>
                <div class="dt-user-area">
                  <span style="font-size:9px;">🔔 <span style="background:#EF4444;color:#fff;padding:1px 5px;border-radius:10px;font-size:8px;font-weight:700;">1</span></span>
                  <div class="dt-user-avatar">BS</div>
                  <span style="font-size:9px;">Bu Sari</span>
                </div>
              </div>
              <div style="padding:8px 12px;border-bottom:1px solid #E8EDE8;font-size:10px;color:var(--ink);">
                Memantau: <strong>Ahmad Fauzi</strong> · Kelas 4A <span style="color:var(--muted);margin-left:4px;">▾ Ganti Anak</span>
              </div>
              <div class="dt-body">
                <!-- Panel kiri: radar (SVG sederhana) -->
                <div class="dt-panel">
                  <div class="dt-panel-head">Radar 7 KAIH · Minggu Ini</div>
                  <div class="dt-panel-body" style="display:flex;flex-direction:column;align-items:center;">
                    <svg viewBox="0 0 180 160" width="180" height="160" style="overflow:visible;">
                      <!-- grid rings -->
                      <polygon points="90,20 148,52 148,108 90,140 32,108 32,52" fill="none" stroke="#E8EDE8" stroke-width="1"/>
                      <polygon points="90,40 133,63 133,97 90,120 47,97 47,63" fill="none" stroke="#E8EDE8" stroke-width="1"/>
                      <polygon points="90,60 118,74 118,86 90,100 62,86 62,74" fill="none" stroke="#E8EDE8" stroke-width="1"/>
                      <!-- axis lines -->
                      <line x1="90" y1="20" x2="90" y2="140" stroke="#E8EDE8" stroke-width="1"/>
                      <line x1="32" y1="52" x2="148" y2="108" stroke="#E8EDE8" stroke-width="1"/>
                      <line x1="148" y1="52" x2="32" y2="108" stroke="#E8EDE8" stroke-width="1"/>
                      <!-- data polygon (82% avg, PD lower) -->
                      <polygon points="90,28 143,57 138,102 90,132 38,103 36,58" fill="rgba(45,106,79,0.15)" stroke="var(--green-mid)" stroke-width="2"/>
                      <!-- data points -->
                      <circle cx="90" cy="28" r="3" fill="var(--green-mid)"/>
                      <circle cx="143" cy="57" r="3" fill="var(--green-mid)"/>
                      <circle cx="138" cy="102" r="3" fill="#CA8A04"/>
                      <circle cx="90" cy="132" r="3" fill="var(--green-mid)"/>
                      <circle cx="38" cy="103" r="3" fill="var(--green-mid)"/>
                      <circle cx="36" cy="58" r="3" fill="var(--green-mid)"/>
                      <!-- labels -->
                      <text x="90" y="13" text-anchor="middle" font-size="8" fill="var(--ink)" font-weight="600">Disiplin</text>
                      <text x="156" y="55" text-anchor="start" font-size="8" fill="var(--ink)" font-weight="600">Tggjwb</text>
                      <text x="156" y="112" text-anchor="start" font-size="8" fill="#CA8A04" font-weight="700">PD ⚠</text>
                      <text x="90" y="152" text-anchor="middle" font-size="8" fill="var(--ink)" font-weight="600">Mandiri</text>
                      <text x="24" y="112" text-anchor="end" font-size="8" fill="var(--ink)" font-weight="600">KK</text>
                      <text x="24" y="55" text-anchor="end" font-size="8" fill="var(--ink)" font-weight="600">Jujur</text>
                    </svg>
                    <div style="font-size:11px;font-weight:800;color:var(--green-deep);margin-top:4px;">Skor: 82% <span style="font-size:9px;color:#16A34A;font-weight:600;">↑ naik dari 76%</span></div>
                  </div>
                </div>
                <!-- Panel kanan: catatan guru -->
                <div class="dt-panel">
                  <div class="dt-panel-head">
                    <span>📝 Catatan Guru Terbaru</span>
                    <button class="dt-action-btn">Isi Laporan Rumah</button>
                  </div>
                  <div class="dt-panel-body" style="display:flex;flex-direction:column;gap:8px;">
                    <div style="border-left:3px solid var(--green-light);padding:6px 10px;background:var(--green-pale);border-radius:0 6px 6px 0;">
                      <div style="font-size:9px;font-weight:700;color:var(--green-deep);margin-bottom:3px;">Bu Rina · 27 Jan 2025 <span class="dt-badge-warn" style="margin-left:4px;">🌟 Percaya Diri</span></div>
                      <div style="font-size:9.5px;color:#2D4A3A;line-height:1.5;">Ahmad aktif dalam diskusi kelompok. Perlu dukungan lebih saat tampil di depan kelas.</div>
                      <div style="display:flex;gap:6px;margin-top:6px;">
                        <button class="dt-action-btn">Balas</button>
                        <button class="dt-action-btn ps-btn-wa" style="background:#25D366;color:#fff;display:flex;align-items:center;gap:3px;">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.14 1.541 5.876L0 24l6.292-1.518A11.957 11.957 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.785 9.785 0 01-5.045-1.397l-.361-.215-3.735.901.936-3.628-.236-.374A9.786 9.786 0 012.182 12c0-5.415 4.403-9.818 9.818-9.818 5.414 0 9.818 4.403 9.818 9.818 0 5.414-4.404 9.818-9.818 9.818z"/></svg>
                          WA Bu Rina
                        </button>
                      </div>
                    </div>
                    <div style="border-left:3px solid #E8EDE8;padding:6px 10px;border-radius:0 6px 6px 0;opacity:0.7;">
                      <div style="font-size:9px;font-weight:700;color:var(--green-deep);margin-bottom:3px;">Bu Rina · 20 Jan 2025</div>
                      <div style="font-size:9.5px;color:var(--ink);line-height:1.5;">Minggu ini Ahmad selalu tepat waktu dan aktif mengerjakan tugas mandiri.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 5: PWA -->
<div>
  <div class="section">
    <div class="section-label">4 · Teknologi Akses</div>
    <h2 class="section-title">Progressive Web App (PWA)</h2>
    <p class="section-lead">ABAT bisa diinstal langsung di layar utama HP — tanpa Play Store, tanpa App Store. Hemat biaya, satu kodebase untuk semua perangkat.</p>

    <div class="pwa-grid">
      <div class="pwa-card">
        <div class="pwa-card-top"><div class="pwa-icon-wrap">📲</div><div class="pwa-card-title">Install ke Layar Utama HP</div></div>
        <p class="pwa-card-desc">Buka ABAT seperti membuka aplikasi — 1 klik dari homescreen, tanpa buka browser.</p>
      </div>
      <div class="pwa-card">
        <div class="pwa-card-top"><div class="pwa-icon-wrap">📡</div><div class="pwa-card-title">Bisa Dipakai Offline</div></div>
        <p class="pwa-card-desc">Data tetap bisa dilihat meskipun internet sedang lemot atau terputus.</p>
      </div>
      <div class="pwa-card">
        <div class="pwa-card-top"><div class="pwa-icon-wrap">🔔</div><div class="pwa-card-title">Notifikasi Push</div></div>
        <p class="pwa-card-desc">Orang tua & guru dapat notifikasi langsung di HP tanpa perlu buka browser.</p>
      </div>
      <div class="pwa-card">
        <div class="pwa-card-top"><div class="pwa-icon-wrap">⚡</div><div class="pwa-card-title">Ringan & Cepat</div></div>
        <p class="pwa-card-desc">Tidak perlu download APK besar — cukup buka browser pertama kali.</p>
      </div>
      <div class="pwa-card">
        <div class="pwa-card-top"><div class="pwa-icon-wrap">📱</div><div class="pwa-card-title">Tampilan Full-screen</div></div>
        <p class="pwa-card-desc">Terasa seperti aplikasi native, tanpa address bar browser yang mengganggu.</p>
      </div>
      <div class="pwa-card">
        <div class="pwa-card-top"><div class="pwa-icon-wrap">🔄</div><div class="pwa-card-title">Auto-update</div></div>
        <p class="pwa-card-desc">Versi terbaru langsung aktif tanpa perlu update manual dari pengguna.</p>
      </div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 6: INVESTASI -->
<div class="section-alt" id="investasi">
  <div class="section">
    <div class="section-label">5 · Investasi</div>
    <h2 class="section-title">Yang Anda Dapatkan</h2>

    <div class="price-hero">
      <div class="ph-label">💰 Total Investasi</div>
      <div class="ph-amount">Rp 2.500.000</div>
      <div class="ph-note">sudah termasuk custom domain .web.id</div>
    </div>

    <div class="deliverable-grid">
      <div class="deliverable-item">
        <div class="d-num">1</div>
        <div class="d-title">Aplikasi ABAT</div>
        <div class="d-desc">Web + PWA, akses dari HP, tablet, dan laptop</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">2</div>
        <div class="d-title">Custom Domain</div>
        <div class="d-desc">abat-namasd.web.id — domain 1 tahun</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">3</div>
        <div class="d-title">Semua Modul</div>
        <div class="d-desc">Admin, Guru, Wali Murid — lengkap sesuai dokumen</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">4</div>
        <div class="d-title">3 Role Pengguna</div>
        <div class="d-desc">Kepala Sekolah, Guru, dan Wali Murid</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">5</div>
        <div class="d-title">Dashboard & Grafik</div>
        <div class="d-desc">Radar chart, tren harian/mingguan/bulanan</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">6</div>
        <div class="d-title">Notifikasi & WA</div>
        <div class="d-desc">In-app + email + tombol kirim WA otomatis (click-to-chat, tanpa biaya API)</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">7</div>
        <div class="d-title">Export Laporan</div>
        <div class="d-desc">PDF & Excel siap setor ke Dinas</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">8</div>
        <div class="d-title">Panduan Penggunaan</div>
        <div class="d-desc">Dokumen panduan dalam format PDF</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">9</div>
        <div class="d-title">Revisi</div>
        <div class="d-desc">Termasuk dalam 4 pekan pengerjaan</div>
      </div>
      <div class="deliverable-item">
        <div class="d-num">10</div>
        <div class="d-title">Handover & Onboarding</div>
        <div class="d-desc">Training singkat admin sekolah (online/video call)</div>
      </div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 7: TIMELINE -->
<div id="timeline">
  <div class="section">
    <div class="section-label">6 · Jadwal Pengerjaan</div>
    <h2 class="section-title">Timeline 4 Pekan</h2>
    <p class="section-lead">Update rutin setiap pekan. Revisi sudah termasuk dalam Pekan 4.</p>

    <div class="timeline">
      <div class="tl-item">
        <div class="tl-dot">1</div>
        <div class="tl-week">Pekan 1</div>
        <div class="tl-focus">Setup sistem, login, manajemen pengguna & kelas</div>
        <div class="tl-output">→ Login berjalan, struktur kelas & siswa bisa diisi</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot">2</div>
        <div class="tl-week">Pekan 2</div>
        <div class="tl-focus">Modul input kebiasaan harian & dashboard guru</div>
        <div class="tl-output">→ Guru bisa input 7 KAIH, muncul di dashboard</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot">3</div>
        <div class="tl-week">Pekan 3</div>
        <div class="tl-focus">Portal wali murid, grafik tren, notifikasi</div>
        <div class="tl-output">→ Orang tua bisa login dan pantau perkembangan anak</div>
      </div>
      <div class="tl-item">
        <div class="tl-dot">4</div>
        <div class="tl-week">Pekan 4</div>
        <div class="tl-focus">Export laporan, revisi, PWA, go-live</div>
        <div class="tl-output">→ Aplikasi siap pakai + domain aktif + panduan selesai</div>
      </div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 8: ALUR -->
<div class="section-alt">
  <div class="section">
    <div class="section-label">7 · Alur Kerja Sama</div>
    <h2 class="section-title">Dari Diskusi ke Go-Live</h2>

    <div class="process-steps">
      <div class="ps-item">
        <div class="ps-num">1</div>
        <div class="ps-icon">📞</div>
        <div class="ps-title">Diskusi Kebutuhan</div>
        <div class="ps-desc">Ngobrol via WA/meet untuk memastikan semua kebutuhan sekolah tercover</div>
      </div>
      <div class="ps-item">
        <div class="ps-num">2</div>
        <div class="ps-icon">📄</div>
        <div class="ps-title">Persetujuan & DP</div>
        <div class="ps-desc">Kirim detail sekolah, tanda tangan MoU sederhana, DP 50% (Rp 1.250.000)</div>
      </div>
      <div class="ps-item">
        <div class="ps-num">3</div>
        <div class="ps-icon">🛠️</div>
        <div class="ps-title">Pengerjaan</div>
        <div class="ps-desc">4 pekan proses development — ada update rutin setiap pekan</div>
      </div>
      <div class="ps-item">
        <div class="ps-num">4</div>
        <div class="ps-icon">👁️</div>
        <div class="ps-title">Review & Revisi</div>
        <div class="ps-desc">Sekolah mencoba, beri feedback, kami perbaiki</div>
      </div>
      <div class="ps-item">
        <div class="ps-num">5</div>
        <div class="ps-icon">🚀</div>
        <div class="ps-title">Go-Live</div>
        <div class="ps-desc">Domain aktif, aplikasi online, pelunasan 50% (Rp 1.250.000)</div>
      </div>
      <div class="ps-item">
        <div class="ps-num">6</div>
        <div class="ps-icon">📚</div>
        <div class="ps-title">Onboarding</div>
        <div class="ps-desc">Training singkat via video call untuk admin & guru</div>
      </div>
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 9: TEKNOLOGI -->
<div>
  <div class="section">
    <div class="section-label">8 · Stack Teknologi</div>
    <h2 class="section-title">Dibangun dengan Teknologi Modern</h2>
    <p class="section-lead">Proven, aman, dan skalabel — tanpa biaya server mahal di awal.</p>

    <div class="tech-grid">
      <div class="tech-item">
        <div class="tech-component">Frontend</div>
        <div class="tech-name">Next.js + React</div>
        <div class="tech-why">Cepat, SEO-friendly, mendukung PWA penuh</div>
      </div>
      <div class="tech-item">
        <div class="tech-component">Database & Backend</div>
        <div class="tech-name">Supabase</div>
        <div class="tech-why">Open-source, gratis di awal, auto-scaling</div>
      </div>
      <div class="tech-item">
        <div class="tech-component">Keamanan Data</div>
        <div class="tech-name">Row Level Security</div>
        <div class="tech-why">Setiap role hanya lihat data yang relevan</div>
      </div>
      <div class="tech-item">
        <div class="tech-component">Login & Akses</div>
        <div class="tech-name">Supabase Auth</div>
        <div class="tech-why">Email/password + Google login</div>
      </div>
      <div class="tech-item">
        <div class="tech-component">Notifikasi WhatsApp</div>
        <div class="tech-name">WhatsApp Click-to-Chat</div>
        <div class="tech-why">Guru/admin klik tombol → pesan WA otomatis terbuka siap kirim. Tanpa WA Business API, tanpa biaya per pesan.</div>
      </div>
      <div class="tech-item">
        <div class="tech-component">Hosting</div>
        <div class="tech-name">Vercel</div>
        <div class="tech-why">Gratis tier, fast, auto-deploy</div>
      </div>
      <div class="tech-item">
        <div class="tech-component">Domain</div>
        <div class="tech-name">Custom .web.id</div>
        <div class="tech-why">Domain lokal Indonesia, terpercaya</div>
      </div>
    </div>

    <div class="security-note">
      🔒 Data siswa dilindungi sesuai UU PDP Indonesia dan enkripsi standar industri (TLS + AES-256).
    </div>
  </div>
</div>

<hr class="divider">

<!-- SECTION 10: FAQ -->
<div class="section-alt" id="faq">
  <div class="section">
    <div class="section-label">9 · Pertanyaan Umum</div>
    <h2 class="section-title">FAQ</h2>

    <div class="faq-list">
      <div class="faq-item">
        <div class="faq-q" onclick="toggleFaq(this)">
          Apakah perlu download di Play Store?
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">Tidak. ABAT adalah web app — cukup buka browser. Tapi dengan fitur PWA, orang tua dan guru bisa "install" ikon ABAT langsung di layar HP mereka, sehingga terasa seperti aplikasi native tanpa perlu ke Play Store atau App Store.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q" onclick="toggleFaq(this)">
          Apakah data siswa aman?
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">Ya. Data tersimpan di server Supabase dengan enkripsi standar industri. Setiap pengguna hanya bisa melihat data yang relevan dengan perannya — wali murid hanya bisa lihat data anaknya sendiri. Kami menerapkan Row Level Security (RLS) secara ketat.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q" onclick="toggleFaq(this)">
          Bagaimana jika internet sekolah lambat?
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">Dengan teknologi PWA, halaman yang sudah dibuka sebelumnya tetap bisa dilihat meskipun internet terputus. Input baru akan tersinkronisasi otomatis ketika koneksi kembali.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q" onclick="toggleFaq(this)">
          Berapa kapasitas pengguna?
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">Bisa menampung hingga 1.000 pengguna aktif bersamaan per sekolah — lebih dari cukup untuk sekolah dasar dengan ratusan siswa dan orang tua.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q" onclick="toggleFaq(this)">
          Apakah setelah 4 pekan ada biaya lagi?
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">Untuk tahun pertama, domain .web.id sudah termasuk dalam harga. Mulai tahun ke-2, biaya perpanjangan domain sekitar Rp 50.000–100.000/tahun. Biaya maintenance aplikasi bisa didiskusikan sesuai kebutuhan sekolah.</div>
      </div>
      <div class="faq-item">
        <div class="faq-q" onclick="toggleFaq(this)">
          Bisa disesuaikan untuk nama sekolah kami?
          <span class="faq-arrow">▼</span>
        </div>
        <div class="faq-a">Tentu! Logo sekolah, nama, dan domain bisa disesuaikan. Ini bukan template generik — ini dibangun khusus untuk sekolah Anda, dengan identitas sekolah yang terintegrasi di seluruh tampilan.</div>
      </div>
    </div>
  </div>
</div>

<!-- CTA -->
<div class="cta-section" id="cta">
  <div style="position:relative;z-index:1;max-width:640px;margin:0 auto;">
    <h2>Siap Membawa 7 KAIH ke <em>Era Digital?</em></h2>
    <p>Program 7 Kebiasaan Anak Indonesia Hebat bukan sekadar kewajiban regulasi — ini adalah fondasi karakter generasi Indonesia. Dengan ABAT, guru bisa fokus mendidik, bukan mengurus kertas.</p>
    <div class="cta-buttons">
      <a href="https://wa.me/6288228511309" class="btn-gold">📱 Hubungi via WhatsApp</a>
      <a href="https://aidukasi.net" class="btn-outline">🌐 Kunjungi aidukasi.net</a>
    </div>
    <p class="cta-free">✨ Konsultasi GRATIS — tanpa kewajiban pesan</p>
  </div>
</div>

<!-- FOOTER -->
<footer>
  <p>© 2025 · <a href="https://aidukasi.net">aidukasi.net</a> · <a href="https://pakhusnul.id">pakhusnul.id</a> · Platform Solusi Digital untuk Pendidikan Indonesia</p>
  <p>Dokumen Penawaran Rahasia · Versi 1.0</p>
</footer>

<script>
  function switchWireframe(id, btn) {
    document.querySelectorAll('.wf-panel').forEach(p => p.style.display = 'none');
    document.querySelectorAll('.role-tabs button[onclick^="switchWireframe"]').forEach(b => b.classList.remove('active'));
    document.getElementById('wf-' + id).style.display = 'block';
    btn.classList.add('active');
  }

  function switchTab(id, btn) {
    document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-' + id).classList.add('active');
    btn.classList.add('active');
  }

  function toggleFaq(el) {
    const item = el.parentElement;
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  }
</script>
</body>
</html>
