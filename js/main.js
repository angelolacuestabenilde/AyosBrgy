/* AyosBrgy — shared layout and local demonstration data.
   This prototype uses browser localStorage only. It has no server or authentication. */
(() => {
  'use strict';
  const STORAGE_KEY = 'ayosbrgy-demo-reports-v1';
  const STATUS_STEPS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
  const CATEGORY_NAMES = {
    pothole: 'Pothole', obstruction: 'Road Obstruction', facility: 'Damaged Public Facility'
  };
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const daysAgo = (n) => {
    const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const atDaysAgo = (n) => `${daysAgo(n)}T09:30:00`;
  const seed = () => [
    {
      id:'BRGY-2026-0001', title:'Large pothole near the covered court', category:'pothole', severity:'High',
      location:'Covered Court Access Road', landmark:'Near the covered court',
      description:'A large pothole has formed along the road near the covered court. Motorcycles and tricycles are swerving to avoid it.',
      observedOn:daysAgo(4), createdAt:atDaysAgo(3), photoCount:1, status:'Under Review', demo:true,
      staffNote:'Barangay staff are verifying the location and severity of this issue.',
      history:[{status:'Submitted', date:atDaysAgo(3), note:'Report received and reference number issued.'},{status:'Under Review',date:atDaysAgo(2),note:'Barangay staff are verifying the report.'}]
    },
    {
      id:'BRGY-2026-0002', title:'Road obstruction along the main road', category:'obstruction', severity:'Medium',
      location:'Main Road', landmark:'Beside the market entrance',
      description:'Construction materials are partly blocking the road and making it difficult for pedestrians to pass safely.',
      observedOn:daysAgo(2), createdAt:atDaysAgo(1), photoCount:0, status:'Submitted', demo:true,
      staffNote:'Awaiting initial review by barangay personnel.',
      history:[{status:'Submitted',date:atDaysAgo(1),note:'Report received and reference number issued.'}]
    },
    {
      id:'BRGY-2026-0003', title:'Damaged waiting shed roof', category:'facility', severity:'Medium',
      location:'Barangay Transport Stop', landmark:'Waiting shed near the intersection',
      description:'A portion of the waiting shed roof is loose and may fall during strong winds or heavy rain.',
      observedOn:daysAgo(7), createdAt:atDaysAgo(6), photoCount:2, status:'Assigned', demo:true,
      staffNote:'Assigned to the barangay maintenance team for inspection.',
      history:[{status:'Submitted',date:atDaysAgo(6),note:'Report submitted.'},{status:'Under Review',date:atDaysAgo(5),note:'Report verified.'},{status:'Assigned',date:atDaysAgo(3),note:'Assigned to maintenance team.'}]
    },
    {
      id:'BRGY-2026-0004', title:'Fallen tree blocking the side street', category:'obstruction', severity:'High',
      location:'Side Street', landmark:'Near the basketball court',
      description:'A fallen tree is partially blocking vehicle access after heavy rainfall. Residents need a safe passage.',
      observedOn:daysAgo(6), createdAt:atDaysAgo(5), photoCount:1, status:'In Progress', demo:true,
      staffNote:'Clearing work is in progress. Please avoid the affected section.',
      history:[{status:'Submitted',date:atDaysAgo(5),note:'Report submitted.'},{status:'Under Review',date:atDaysAgo(4),note:'Report confirmed.'},{status:'Assigned',date:atDaysAgo(3),note:'Clearing team assigned.'},{status:'In Progress',date:atDaysAgo(2),note:'Clearing team is on site.'}]
    }
  ];
  let fallbackReports = null;
  const getReports = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const records = JSON.parse(raw);
        if (Array.isArray(records)) return records;
      }
    } catch (error) { /* Private mode or disabled storage; use in-memory fallback. */ }
    if (!fallbackReports) fallbackReports = seed();
    return fallbackReports;
  };
  const saveReports = (reports) => {
    fallbackReports = reports;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(reports)); return true; }
    catch (error) { return false; }
  };
  const findReport = (id) => getReports().find(r => r.id.toUpperCase() === String(id || '').trim().toUpperCase());
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const readableDate = (value) => {
    if (!value) return 'Not available';
    const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(d.getTime()) ? 'Not available' : d.toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'});
  };
  const badgeClass = (status) => ({
    'Submitted':'status-new', 'Under Review':'status-review','Assigned':'status-assigned',
    'In Progress':'status-progress', 'Resolved':'status-resolved','Closed':'status-resolved',
    'Rejected':'status-danger','Duplicate':'status-muted','Requires More Information':'status-warning'
  }[status] || 'status-muted');
  const reportCounts = () => {
    const reports = getReports();
    return {
      total:reports.length,
      active:reports.filter(r=>['Assigned','In Progress'].includes(r.status)).length,
      resolved:reports.filter(r=>['Resolved','Closed'].includes(r.status)).length
    };
  };
  const icon = `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
  function renderSharedLayout() {
    const path = location.pathname.split('/').pop() || 'index.html';
    const links = [
      ['index.html','Home'], ['report.html','Report an Issue'], ['track.html','Track a Report'], ['admin.html','Admin Demo']
    ];
    const current = (href) => href === path ? ' aria-current="page"' : '';
    const navbar = document.getElementById('site-header');
    if (navbar) navbar.innerHTML = `
      <div class="top-strip"><div class="container top-strip-inner"><span><span class="dot"></span> Community issue reporting prototype</span><span>AyosBrgy · Group Harlem</span></div></div>
      <header class="site-header"><div class="container header-inner">
        <a class="brand" href="index.html" aria-label="AyosBrgy homepage">
          <img src="assets/logo.svg" alt="" width="42" height="42"><span>Ayos<span class="brand-accent">Brgy</span><small>Safer streets together</small></span>
        </a>
        <button class="menu-toggle" type="button" id="menu-toggle" aria-expanded="false" aria-controls="primary-nav" aria-label="Open navigation menu">${icon}</button>
        <nav id="primary-nav" class="primary-nav" aria-label="Primary navigation">
          ${links.map(([href,label])=>`<a href="${href}"${current(href)}>${label}</a>`).join('')}
          <a class="btn btn-primary nav-cta" href="report.html">Submit Report <span aria-hidden="true">↗</span></a>
        </nav>
      </div></header>`;
    const footer = document.getElementById('site-footer');
    if (footer) footer.innerHTML = `<footer class="site-footer"><div class="container">
      <div class="footer-grid">
        <div><a class="brand footer-brand" href="index.html"><img src="assets/logo.svg" width="40" height="40" alt=""><span>Ayos<span class="brand-accent">Brgy</span></span></a>
          <p>A front-end concept for reporting potholes, road obstructions, and damaged public facilities at the barangay level.</p>
          <span class="footer-demo">Academic demonstration only · Not a live government service</span>
        </div>
        <div><h3>Explore</h3><a href="index.html">Home</a><a href="report.html">Submit a report</a><a href="track.html">Track a report</a><a href="admin.html">Admin demo</a></div>
        <div><h3>Information</h3><a href="index.html#how-it-works">How it works</a><a href="index.html#about">About AyosBrgy</a><a href="index.html#faq">FAQ</a><a href="index.html#privacy">Privacy & demo notice</a></div>
        <div><h3>Project team</h3><p>Group Harlem</p><p>Angelo Lacuesta · Adityakumar Dash · Ethan Nery</p><p>Web Development prototype · 2026</p></div>
      </div>
      <div class="footer-bottom"><span>© <span id="copyright-year"></span> AyosBrgy. Student prototype.</span><span>Report. Follow up. Improve.</span></div>
    </div></footer>`;
    const cy = document.getElementById('copyright-year'); if (cy) cy.textContent = String(new Date().getFullYear());
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('primary-nav');
    if (toggle && nav) {
      const setOpen = (open) => {
        nav.classList.toggle('is-open',open);
        toggle.setAttribute('aria-expanded',String(open));
        toggle.setAttribute('aria-label', open?'Close navigation menu':'Open navigation menu');
      };
      toggle.addEventListener('click',()=>setOpen(!nav.classList.contains('is-open')));
      nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setOpen(false)));
      document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false);});
      document.addEventListener('click',e=>{if (!nav.contains(e.target)&&!toggle.contains(e.target))setOpen(false);});
    }
  }
  const app = { STORAGE_KEY, STATUS_STEPS, CATEGORY_NAMES, today, daysAgo, getReports, saveReports,
    findReport, escapeHTML, readableDate, badgeClass, reportCounts };
  window.AyosBrgy = app;
  renderSharedLayout();
  document.querySelectorAll('[data-demo-count]').forEach(el => {
    const counts = reportCounts(); el.textContent = counts[el.dataset.demoCount] ?? '0';
  });
  const homeSearch = document.getElementById('home-track-form');
  if (homeSearch) homeSearch.addEventListener('submit',e=>{
    e.preventDefault();
    const ref = homeSearch.querySelector('input').value.trim();
    if (ref) location.href = `track.html?id=${encodeURIComponent(ref)}`;
  });
})();
