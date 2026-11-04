/* Team ownership area: illustrative admin queue, assignment, and local-only status controls.
   This is NOT authenticated. Never connect it to real citizen records as-is. */
(() => {
  'use strict';
  const app=window.AyosBrgy;
  if (!app) return;
  const queue=document.getElementById('report-queue');
  const selectedPanel=document.getElementById('admin-selected');
  const filter=document.getElementById('status-filter');
  const $=id=>document.getElementById(id);
  let selectedID=app.getReports()[0]?.id || '';
  const options=['Submitted','Under Review','Assigned','In Progress','Resolved','Closed','Requires More Information','Rejected','Duplicate'];
  function counters() {
    const reports=app.getReports();
    $('admin-total').textContent=reports.length;
    $('admin-review').textContent=reports.filter(r=>['Submitted','Under Review'].includes(r.status)).length;
    $('admin-active').textContent=reports.filter(r=>['Assigned','In Progress'].includes(r.status)).length;
  }
  function showQueue(){
    const current=filter.value;
    const reports=app.getReports().filter(r=>current==='all'||r.status===current);
    queue.innerHTML=reports.length?reports.map(r=>`<button class="queue-item ${selectedID===r.id?'is-selected':''}" type="button" data-report-id="${app.escapeHTML(r.id)}" aria-pressed="${selectedID===r.id}">
      <div class="queue-top"><span class="queue-id">${app.escapeHTML(r.id)}</span><span class="status-badge ${app.badgeClass(r.status)}">${app.escapeHTML(r.status)}</span></div>
      <h3>${app.escapeHTML(r.title)}</h3><p>${app.escapeHTML(app.CATEGORY_NAMES[r.category]||r.category)} · ${app.readableDate(r.createdAt)}</p></button>`).join(''):
      '<div class="empty-state">No demo reports match this filter.</div>';
    queue.querySelectorAll('[data-report-id]').forEach(button=>button.addEventListener('click',()=>{
      selectedID=button.dataset.reportId;showQueue();showSelected();
    }));
  }
  function showSelected() {
    const r=app.findReport(selectedID);
    if (!r){selectedPanel.innerHTML='<div class="admin-selection-intro">Select a report to review.</div>';return;}
    selectedPanel.innerHTML=`<div class="detail-heading"><div><div class="report-id">${app.escapeHTML(r.id)} · DEMO RECORD</div><h3 style="margin:6px 0 12px">${app.escapeHTML(r.title)}</h3></div><span class="status-badge ${app.badgeClass(r.status)}">${app.escapeHTML(r.status)}</span></div>
      <dl class="detail-list"><div><dt>Category</dt><dd>${app.escapeHTML(app.CATEGORY_NAMES[r.category]||r.category)}</dd></div><div><dt>Severity</dt><dd>${app.escapeHTML(r.severity)}</dd></div><div><dt>Location</dt><dd>${app.escapeHTML(r.location)}</dd></div><div><dt>Submitted</dt><dd>${app.readableDate(r.createdAt)}</dd></div></dl>
      <p class="info-message">${app.escapeHTML(r.description)}</p><div class="notice"><strong>Current note:</strong> ${app.escapeHTML(r.staffNote||'No note yet.')}</div>
      <form id="admin-update-form" class="admin-controls">
        <div class="field"><label for="update-status">Set demonstration status</label><select id="update-status">${options.map(status=>`<option value="${app.escapeHTML(status)}" ${r.status===status?'selected':''}>${app.escapeHTML(status)}</option>`).join('')}</select></div>
        <div class="field"><label for="assigned-team">Assigned team <span class="optional">(demo only)</span></label><select id="assigned-team"><option value="">Not assigned</option>${['Infrastructure Kagawad','Barangay Maintenance Crew','Barangay Tanod','City Engineering / DPWH referral (proposed)'].map(t=>`<option value="${app.escapeHTML(t)}" ${r.assignedTeam===t?'selected':''}>${app.escapeHTML(t)}</option>`).join('')}</select></div>
        <div class="field"><label for="staff-note">Status update / staff remark</label><textarea id="staff-note" maxlength="350" placeholder="Explain the action or reason for this update">${app.escapeHTML(r.staffNote||'')}</textarea><span class="helper">Up to 350 characters. This note is visible on the demo Track page.</span></div>
        <button type="submit" class="btn btn-primary">Save Local Demo Update</button>
        <p id="admin-message" class="helper" role="status" aria-live="polite"></p>
      </form>`;
    $('admin-update-form').addEventListener('submit',event=>{
      event.preventDefault();
      const status=$('update-status').value;
      const team=$('assigned-team').value;
      const note=$('staff-note').value.trim();
      if (!options.includes(status))return;
      if (['Rejected','Duplicate','Requires More Information'].includes(status)&&!note) {
        $('admin-message').textContent='Please explain the special status before saving.';$('staff-note').focus();return;
      }
      const now=new Date().toISOString();
      const reports=app.getReports().map(item=>item.id===selectedID?{
        ...item,status,assignedTeam:team,staffNote:note||`Status updated to ${status} (demo).`,
        history:[...(item.history||[]),{status,date:now,note:note||`Status updated to ${status}${team?' · '+team:''} (demo).`}]
      }:item);
      const saved=app.saveReports(reports);
      counters();showQueue();showSelected();
      $('admin-message').textContent=saved?'Saved locally. Open Track a Report to see the update.':'Storage unavailable; changes may not persist across pages.';
    });
  }
  filter.addEventListener('change',showQueue);
  counters();showQueue();showSelected();
})();
