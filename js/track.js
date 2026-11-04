/* Ethan's ownership area: report lookup and clear status timeline.
   A teammate should review/test and implement their own improvements before committing. */
(() => {
  'use strict';
  const app = window.AyosBrgy;
  if (!app) return;
  const form = document.getElementById('track-form');
  const input = document.getElementById('reference-id');
  const result = document.getElementById('report-result');
  const feedback = document.getElementById('track-feedback');
  const placeholder = document.getElementById('track-placeholder');
  const STEPS = app.STATUS_STEPS;

  function timeline(report) {
    const progressIndex = STEPS.indexOf(report.status);
    const history = Array.isArray(report.history) ? report.history : [];
    return `<ol class="timeline">${STEPS.map((step,i) => {
      const event = history.filter(item=>item.status===step).at(-1);
      const completed = progressIndex>=0 && i<=progressIndex || Boolean(event);
      const current = step===report.status;
      return `<li class="${completed?'is-done':''} ${current?'is-current':''}">
        <span class="timeline-dot" aria-hidden="true"></span><div><h3>${app.escapeHTML(step)}${current?' · Current':''}</h3>
        <p>${event ? app.escapeHTML(event.note||'Status updated.') : (completed?'Step recorded.':'Upcoming step')}</p>
        ${event?`<small>${app.readableDate(event.date)}</small>`:''}</div></li>`;
    }).join('')}</ol>`;
  }
  function show(id) {
    feedback.classList.add('alert-hidden');
    result.classList.add('alert-hidden');
    placeholder.classList.add('alert-hidden');
    const report = app.findReport(id);
    if (!report) {
      feedback.className = 'notice notice-warning';
      feedback.innerHTML = `<strong>No demo report found.</strong> Check your reference number and try again. For example, use BRGY-2026-0001. Browser-local reports from other devices are not available here.`;
      return;
    }
    const special = !STEPS.includes(report.status);
    const events = report.history || [];
    const last = events[events.length-1];
    const categories = app.CATEGORY_NAMES;
    result.innerHTML = `<div class="result-layout">
      <section class="panel" aria-labelledby="found-title">
        <div class="detail-heading"><div><div class="report-id">${app.escapeHTML(report.id)} · DEMONSTRATION</div><h2 class="report-title" id="found-title">${app.escapeHTML(report.title)}</h2></div>
          <span class="status-badge ${app.badgeClass(report.status)}">${app.escapeHTML(report.status)}</span></div>
        <dl class="detail-list">
          <div><dt>Category</dt><dd>${app.escapeHTML(categories[report.category]||report.category)}</dd></div>
          <div><dt>Severity</dt><dd>${app.escapeHTML(report.severity)}</dd></div>
          <div><dt>Street / location</dt><dd>${app.escapeHTML(report.location)}</dd></div>
          <div><dt>Observed on</dt><dd>${app.readableDate(report.observedOn)}</dd></div>
          ${report.landmark?`<div><dt>Nearby landmark</dt><dd>${app.escapeHTML(report.landmark)}</dd></div>`:''}
          <div><dt>Photos attached (count only)</dt><dd>${Number(report.photoCount||0)}</dd></div>
        </dl>
        <div class="report-desc"><h3>Issue description</h3><p>${app.escapeHTML(report.description)}</p></div>
        <div class="notice"><strong>Latest update${last?' · '+app.readableDate(last.date):''}:</strong> ${app.escapeHTML(report.staffNote||last?.note||'No staff remarks yet.')}</div>
      </section>
      <section class="panel" aria-labelledby="timeline-title"><div class="panel-title"><span>✓</span><h2 id="timeline-title">Status progress</h2></div>
        ${special?`<div class="notice notice-warning" style="margin-bottom:20px"><strong>Special status:</strong> ${app.escapeHTML(report.status)}. Check the latest update for explanation.</div>`:''}
        ${timeline(report)}
      </section>
    </div>`;
    result.classList.remove('alert-hidden');
    const url = new URL(window.location.href);url.searchParams.set('id',report.id);
    history.replaceState(null,'',url.toString());
  }
  form.addEventListener('submit',e=>{e.preventDefault();const id=input.value.trim();if(id)show(id);else input.focus();});
  document.getElementById('fill-sample').addEventListener('click',()=>{input.value='BRGY-2026-0001';show(input.value);});
  const supplied = new URLSearchParams(window.location.search).get('id');
  if (supplied) {input.value=supplied;show(supplied);}
})();
