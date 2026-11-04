/* Adi's ownership area: report form and browser-only demonstration submission.
   A teammate should review/test and implement their own improvements before committing. */
(() => {
  'use strict';
  const app = window.AyosBrgy;
  const form = document.getElementById('report-form');
  if (!form || !app) return;
  const $ = (id) => document.getElementById(id);
  const count = $('description-count');
  const files = $('photos');
  const observed = $('observed-on');
  const result = $('submission-result');

  const dateInLocalTime = (string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(string)) return null;
    const [y,m,d] = string.split('-').map(Number);
    const date = new Date(y,m-1,d,12);
    return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d ? date : null;
  };
  function setDateBounds() {
    const now = new Date();
    const past = new Date(now.getFullYear(),now.getMonth(),now.getDate()-30,12);
    const two = v => String(v).padStart(2,'0');
    observed.min = `${past.getFullYear()}-${two(past.getMonth()+1)}-${two(past.getDate())}`;
    observed.max = app.today();
    observed.value = app.today();
  }
  function error(id, message) {
    const field = $(id);
    const messageEl = document.querySelector(`[data-error-for="${id}"]`);
    if (field) field.setAttribute('aria-invalid',String(Boolean(message)));
    if (messageEl) messageEl.textContent = message || '';
  }
  const val = id => ($(id)?.value || '').trim();
  function validate() {
    const problems = {};
    const name = val('name');
    const email = val('email');
    const phone = val('phone');
    const text = val('description');
    const address = val('location');
    const landmark = val('landmark');
    const date = dateInLocalTime(val('observed-on'));
    const min = dateInLocalTime(observed.min);
    const max = dateInLocalTime(observed.max);
    if (!Object.keys(app.CATEGORY_NAMES).includes(val('category'))) problems.category = 'Choose one of the three report categories.';
    if (!['Low','Medium','High'].includes(val('severity'))) problems.severity = 'Choose the severity level.';
    if (address.length < 5 || address.length > 150) problems.location = 'Enter a street or address containing 5–150 characters.';
    if (landmark.length > 100) problems.landmark = 'Use at most 100 characters.';
    if (text.length < 20 || text.length > 500) problems.description = 'The description must contain 20–500 characters.';
    if (!date || date < min || date > max) problems['observed-on'] = 'Choose a valid date within the last 30 days.';
    if (name.length < 2 || name.length > 60 || !/^[\p{L} .-]+$/u.test(name)) problems.name = 'Use 2–60 letters, spaces, periods, or hyphens.';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.email = 'Enter a valid email address.';
    if (phone && !/^(09\d{9}|\+639\d{9})$/.test(phone)) problems.phone = 'Use 09XXXXXXXXX or +639XXXXXXXXX.';
    if (!email && !phone) problems.email = 'Enter an email address or a mobile number.';
    const chosen = [...files.files];
    if (chosen.length > 3) problems.photos = 'Select at most 3 photos.';
    else if (chosen.some(file => !['image/jpeg','image/png'].includes(file.type) || file.size > 5*1024*1024))
      problems.photos = 'Every photo must be JPG/PNG and no larger than 5 MB.';
    if (!$('privacy').checked) problems.privacy = 'You must accept the demonstration notice.';
    if (!$('human').checked) problems.human = 'Confirm that this is a test submission.';
    ['category','severity','location','landmark','description','observed-on','name','email','phone','photos','privacy','human'].forEach(id=>error(id,problems[id]));
    const first = Object.keys(problems)[0];
    if (first) $(first)?.focus();
    return Object.keys(problems).length === 0;
  }
  function nextID() {
    const year = new Date().getFullYear();
    const prefix = `BRGY-${year}-`;
    const numbers = app.getReports().map(r => r.id.startsWith(prefix) ? Number(r.id.slice(prefix.length)) : 0).filter(Number.isFinite);
    return `${prefix}${String(Math.max(0,...numbers)+1).padStart(4,'0')}`;
  }
  $('description').addEventListener('input', () => count.textContent = String($('description').value.length));
  files.addEventListener('change', () => {
    const selected = [...files.files];
    $('photo-summary').textContent = selected.length ? selected.map(f=>f.name).join(', ') : 'No photos selected.';
  });
  setDateBounds();
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return;
    const summary = `Category: ${app.CATEGORY_NAMES[val('category')]}\nLocation: ${val('location')}\nSeverity: ${val('severity')}\n\nSubmit this example report?`;
    if (!window.confirm(summary)) return; // Review the entered information before continuing.
    const id = nextID();
    const category = val('category');
    const description = val('description');
    const record = {
      id, category, title:`${app.CATEGORY_NAMES[category]} — ${val('location')}`,
      severity:val('severity'), location:val('location'), landmark:val('landmark'),
      description, observedOn:val('observed-on'), photoCount:files.files.length,
      createdAt:new Date().toISOString(), status:'Submitted', staffNote:'Awaiting review by demo barangay staff.',
      history:[{status:'Submitted',date:new Date().toISOString(),note:'Demo report received; reference number issued.'}],
      demo:true
      // Deliberately exclude name, email, phone and actual photos from stored record.
    };
    const saved = app.saveReports([record,...app.getReports()]);
    form.classList.add('alert-hidden');
    result.classList.remove('alert-hidden');
    result.innerHTML = `<div class="pill pill-mint">✓ Demo submission complete</div>
      <h2>Your report reference number</h2>
      <p class="success-id">${app.escapeHTML(id)}</p>
      <p>Keep this number to check your report's status on this same browser. No real barangay has been notified.</p>
      ${saved ? '' : '<div class="notice notice-warning" style="margin:12px 0"><strong>Browser storage is unavailable.</strong> This record may not be searchable after you change pages. Enable local storage to test tracking.</div>'}
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px"><a class="btn btn-primary" href="track.html?id=${encodeURIComponent(id)}">Track this demo report →</a><button id="new-report" type="button" class="btn btn-outline">Submit another</button></div>`;
    result.focus();
    window.scrollTo({top:0,behavior:'smooth'});
    $('new-report').addEventListener('click', () => {
      result.classList.add('alert-hidden');form.classList.remove('alert-hidden');
      form.reset();setDateBounds();count.textContent='0';$('photo-summary').textContent='No photos selected.';
      ['category','severity','location','landmark','description','observed-on','name','email','phone','photos','privacy','human'].forEach(id => error(id,''));
      $('category').focus();
    });
  });
})();
