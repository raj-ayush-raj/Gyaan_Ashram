/* ===== Gyaan Ashram Career Institute - App.js (Supabase + Full Features) ===== */
var SUPABASE_URL = "https://vernnftdgswmnfihsvnr.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcm5uZnRkZ3N3bW5maWhzdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NjUzMDEsImV4cCI6MjEwMjM0MTMwMX0.kxWxEmABd7iwUKyJuHKUHrqGp8Z0c-paLp7Rxba3dNs";
var THEME_KEY = "gyaan_ashram_theme";
var MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
var MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var supabase;
var currentUser = null;
var currentBrowse = {classId: null, subjectId: null};
var data = {classes:[], subjects:[], materials:[], feeRecords:[], schedule:[], notices:[]};

function $(s){ return document.querySelector(s); }
function $$(s){ return Array.from(document.querySelectorAll(s)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function esc(v){
  var s = String(v == null ? "" : v);
  return s.replace(/[&<>"']/g, function(c){
    var m = {"&":"&amp;","<":"&lt;",">":"&gt;"};
    m['"'] = "&quot;"; m["'"] = "&#39;";
    return m[c];
  });
}
function dateLabel(v){ return new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function className(id){ var c = data.classes.find(function(x){return x.id===id;}); return c ? c.name : "Unknown"; }
function subjectName(id){ var s = data.subjects.find(function(x){return x.id===id;}); return s ? s.name : "Unknown"; }
function materialCountForClass(cid){
  return data.materials.filter(function(m){return m.class_id===cid;}).reduce(function(n,m){return n+(m.material_files?m.material_files.length:0);},0);
}
function currentMonthIndex(){ return new Date().getMonth(); }
function currentYear(){ return new Date().getFullYear(); }
function getPublicUrl(path){ return supabase.storage.from("study-materials").getPublicUrl(path).data.publicUrl; }
function toast(msg){
  var t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(window._tt); window._tt = setTimeout(function(){ t.classList.remove("show"); }, 2500);
}

/* ===== Supabase Init & Data Fetch ===== */
function initSupabase(){ supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }

async function fetchAllData(){
  try {
    var r1 = await supabase.from("classes").select("*").order("sort_order");
    var r2 = await supabase.from("subjects").select("*");
    var r3 = await supabase.from("materials").select("*, material_files(*)").order("uploaded_at",{ascending:false});
    var r4 = await supabase.from("fee_records").select("*").eq("year", currentYear()).order("student_name");
    var r5 = await supabase.from("schedule").select("*").order("sort_order");
    var r6 = await supabase.from("notices").select("*").eq("is_active", true).order("posted_at",{ascending:false});
    if(r1.data) data.classes = r1.data;
    if(r2.data) data.subjects = r2.data;
    if(r3.data) data.materials = r3.data;
    if(r4.data) data.feeRecords = r4.data;
    if(r5.data) data.schedule = r5.data;
    if(r6.data) data.notices = r6.data;
  } catch(e){ console.error(e); toast("Error loading data."); }
}

/* ===== Theme ===== */
function initTheme(){ if(localStorage.getItem(THEME_KEY)==="dark") document.documentElement.setAttribute("data-theme","dark"); }
function toggleTheme(){
  var d = document.documentElement.getAttribute("data-theme")==="dark";
  if(d){ document.documentElement.removeAttribute("data-theme"); localStorage.setItem(THEME_KEY,"light"); }
  else { document.documentElement.setAttribute("data-theme","dark"); localStorage.setItem(THEME_KEY,"dark"); }
}

/* ===== Modals ===== */
function openModal(id){ $(id).classList.remove("hidden"); document.body.style.overflow="hidden"; }
function closeModal(id){ $(id).classList.add("hidden"); if($$(".modal:not(.hidden)").length===0) document.body.style.overflow=""; }

/* ===== Notice Board ===== */
function renderNotices(){
  var el = $("#noticeList"); if(!el) return;
  if(!data.notices.length){ el.innerHTML = ""; $("#noticeBoard").classList.add("hidden"); return; }
  $("#noticeBoard").classList.remove("hidden");
  var html = "";
  data.notices.forEach(function(n){
    html += "<div class=\"notice-card\"><h4>" + esc(n.title) + "</h4><p>" + esc(n.message) + "</p><span class=\"notice-date\">" + dateLabel(n.posted_at) + "</span></div>";
  });
  el.innerHTML = html;
}

/* ===== Recently Added ===== */
function renderRecent(){
  var el = $("#recentGrid"); if(!el) return;
  var all = [];
  data.materials.forEach(function(m){
    (m.material_files||[]).forEach(function(f){ all.push({m:m,f:f}); });
  });
  var recent = all.slice(0,3);
  if(!recent.length){ el.innerHTML = "<div class=\"empty\"><strong>No materials yet</strong></div>"; return; }
  var html = "";
  recent.forEach(function(item){
    var m=item.m, f=item.f;
    html += "<div class=\"recent-card\"><span class=\"rc-badge\">" + esc(className(m.class_id)) + " &bull; " + esc(subjectName(m.subject_id)) + "</span>" +
      "<h4>" + esc(m.title) + "</h4><p class=\"rc-meta\">" + esc(f.name) + " &bull; " + dateLabel(m.uploaded_at) + "</p>" +
      "<div class=\"rc-actions\"><button class=\"small\" data-action=\"view\" data-path=\""+esc(f.storage_path)+"\">View</button>" +
      "<button class=\"small dark\" data-action=\"download\" data-path=\""+esc(f.storage_path)+"\" data-fname=\""+esc(f.filename)+"\">Download</button>" +
      "<button class=\"small whatsapp\" data-action=\"whatsapp\" data-title=\""+esc(m.title)+"\" data-fname=\""+esc(f.name)+"\">WhatsApp</button></div></div>";
  });
  el.innerHTML = html;
}

/* ===== Classes ===== */
function renderClasses(){
  var el = $("#classGrid"); if(!el) return;
  var html = "";
  data.classes.forEach(function(c,i){
    var count = materialCountForClass(c.id);
    var subs = data.subjects.filter(function(s){return s.class_id===c.id;}).length;
    html += "<article class=\"class-card\" data-action=\"browseclass\" data-id=\""+c.id+"\">" +
      "<span class=\"class-number\">CLASS "+String(i+1).padStart(2,"0")+"</span>" +
      "<h3>"+esc(c.name)+"</h3><p>"+subs+" subject"+(subs!==1?"s":"")+"</p>" +
      "<span class=\"material-count\">"+count+" PDF"+(count!==1?"s":"")+" available</span>" +
      "<div class=\"explore\">Explore <span>&rarr;</span></div></article>";
  });
  el.innerHTML = html;
}

/* ===== Browse ===== */
function renderBrowse(){
  var panel = $("#browsePanel"); if(!panel) return;
  if(!currentBrowse.classId){ panel.innerHTML = ""; return; }
  var cls = className(currentBrowse.classId);
  if(!currentBrowse.subjectId){
    var subs = data.subjects.filter(function(s){return s.class_id===currentBrowse.classId;});
    var h = "<div class=\"breadcrumb\"><button data-action=\"browseall\">Study Material</button> <span>&rsaquo;</span> "+esc(cls)+"</div>";
    if(subs.length){
      h += "<div class=\"subject-grid\">";
      subs.forEach(function(s){ h += "<article class=\"subject-card\" data-action=\"browsesubject\" data-id=\""+s.id+"\"><h3>"+esc(s.name)+"</h3><span class=\"explore\">&rarr;</span></article>"; });
      h += "</div>";
    } else { h += "<div class=\"empty\"><strong>No subjects yet</strong></div>"; }
    panel.innerHTML = h; return;
  }
  var subj = subjectName(currentBrowse.subjectId);
  var mats = data.materials.filter(function(m){return m.class_id===currentBrowse.classId && m.subject_id===currentBrowse.subjectId;});
  var h = "<div class=\"breadcrumb\"><button data-action=\"browseall\">Study Material</button> <span>&rsaquo;</span> <button data-action=\"browseclass\" data-id=\""+currentBrowse.classId+"\">"+esc(cls)+"</button> <span>&rsaquo;</span> "+esc(subj)+"</div>";
  if(!mats.length){ h += "<div class=\"empty\"><strong>No material uploaded yet</strong></div>"; panel.innerHTML=h; return; }
  mats.forEach(function(m){
    var files = m.material_files||[];
    h += "<div class=\"note-group\"><div class=\"note-group-head\"><h3>"+esc(m.title)+"</h3><p>Uploaded "+dateLabel(m.uploaded_at)+(m.description?" &bull; "+esc(m.description):"")+"</p></div>";
    files.forEach(function(f){
      h += "<div class=\"note-item\"><div class=\"note-main\"><div class=\"pdf\">PDF</div><div><strong>"+esc(f.name)+"</strong><div class=\"meta\">"+esc(f.size_label||"PDF")+"</div></div></div>" +
        "<div class=\"note-actions\"><button class=\"small\" data-action=\"view\" data-path=\""+esc(f.storage_path)+"\">View</button>" +
        "<button class=\"small dark\" data-action=\"download\" data-path=\""+esc(f.storage_path)+"\" data-fname=\""+esc(f.filename)+"\">Download</button>" +
        "<button class=\"small whatsapp\" data-action=\"whatsapp\" data-title=\""+esc(m.title)+"\" data-fname=\""+esc(f.name)+"\">WhatsApp</button></div></div>";
    });
    h += "</div>";
  });
  panel.innerHTML = h;
}

/* ===== Fee Table (Public) ===== */
function renderFeeTable(){
  var head = $("#feeHead"), body = $("#feeBody"), yearEl = $("#feeYear");
  if(!head) return;
  var yr = currentYear(); var mi = currentMonthIndex();
  if(yearEl) yearEl.textContent = yr;
  var hRow = "<tr><th>Student Name</th>";
  for(var i=0;i<=mi;i++) hRow += "<th>"+MONTH_LABELS[i]+"</th>";
  hRow += "</tr>";
  head.innerHTML = hRow;
  if(!data.feeRecords.length){ body.innerHTML = "<tr><td colspan=\""+(mi+2)+"\" style=\"text-align:center;padding:30px;color:var(--muted)\">No fee records yet.</td></tr>"; return; }
  var bHtml = "";
  data.feeRecords.forEach(function(r){
    bHtml += "<tr><td>"+esc(r.student_name)+"</td>";
    for(var i=0;i<=mi;i++){
      var val = r[MONTHS[i]] || "-";
      var cls = val==="Paid"?"fee-paid":val==="Unpaid"?"fee-unpaid":"fee-na";
      bHtml += "<td class=\""+cls+"\">"+esc(val)+"</td>";
    }
    bHtml += "</tr>";
  });
  body.innerHTML = bHtml;
}

/* ===== Schedule (Public) ===== */
function renderSchedule(){
  var el = $("#scheduleList"); if(!el) return;
  if(!data.schedule.length){ el.innerHTML = "<div class=\"empty\"><strong>No schedule entries</strong></div>"; return; }
  var h = "";
  data.schedule.forEach(function(s){
    h += "<div class=\"schedule-row\"><strong>"+esc(s.batch)+"</strong><span class=\"sch-days\">"+esc(s.days)+"</span><span class=\"sch-time\">"+esc(s.time)+"</span></div>";
  });
  el.innerHTML = h;
}

/* ===== Search ===== */
function initSearch(){
  var input = $("#searchInput"), clear = $("#searchClear"), results = $("#searchResults");
  if(!input) return;
  input.addEventListener("input", function(){
    var q = input.value.trim().toLowerCase();
    if(!q){ clear.classList.add("hidden"); results.classList.add("hidden"); results.innerHTML=""; $("#classGrid").classList.remove("hidden"); $("#browsePanel").innerHTML=""; currentBrowse={classId:null,subjectId:null}; return; }
    clear.classList.remove("hidden");
    var matches = [];
    data.materials.forEach(function(m){
      var cn=className(m.class_id).toLowerCase(), sn=subjectName(m.subject_id).toLowerCase(), tl=m.title.toLowerCase(), dl=(m.description||"").toLowerCase();
      (m.material_files||[]).forEach(function(f){
        if(tl.indexOf(q)>=0||f.name.toLowerCase().indexOf(q)>=0||cn.indexOf(q)>=0||sn.indexOf(q)>=0||dl.indexOf(q)>=0) matches.push({m:m,f:f});
      });
    });
    $("#classGrid").classList.add("hidden"); $("#browsePanel").innerHTML="";
    if(!matches.length){ results.classList.remove("hidden"); results.innerHTML="<div class=\"empty\"><strong>No results</strong></div>"; return; }
    results.classList.remove("hidden");
    var h = "<p style=\"font-size:13px;color:var(--muted);margin:0 0 14px\">"+matches.length+" result"+(matches.length!==1?"s":"")+"</p>";
    matches.forEach(function(item){
      var m=item.m, f=item.f;
      h += "<div class=\"note-group\"><div class=\"note-group-head\"><h3>"+esc(m.title)+"</h3><p>"+esc(className(m.class_id))+" &bull; "+esc(subjectName(m.subject_id))+"</p></div>" +
        "<div class=\"note-item\"><div class=\"note-main\"><div class=\"pdf\">PDF</div><div><strong>"+esc(f.name)+"</strong></div></div>" +
        "<div class=\"note-actions\"><button class=\"small\" data-action=\"view\" data-path=\""+esc(f.storage_path)+"\">View</button>" +
        "<button class=\"small dark\" data-action=\"download\" data-path=\""+esc(f.storage_path)+"\" data-fname=\""+esc(f.filename)+"\">Download</button></div></div></div>";
    });
    results.innerHTML = h;
  });
  clear.addEventListener("click", function(){ input.value=""; clear.classList.add("hidden"); results.classList.add("hidden"); results.innerHTML=""; $("#classGrid").classList.remove("hidden"); currentBrowse={classId:null,subjectId:null}; renderBrowse(); });
}

/* ===== Admin Selects ===== */
function populateSelects(){
  var opts = "";
  data.classes.forEach(function(c){ opts += "<option value=\""+c.id+"\">"+esc(c.name)+"</option>"; });
  ["#uploadClass","#editClass","#subjectClass"].forEach(function(s){ var el=$(s); if(el) el.innerHTML=opts; });
  updateSubjectSelect("#uploadClass","#uploadSubject");
  updateSubjectSelect("#editClass","#editSubject");
}
function updateSubjectSelect(cs,ss){
  var ce=$(cs), se=$(ss); if(!ce||!se) return;
  var subs=data.subjects.filter(function(s){return s.class_id===ce.value;});
  var h=""; subs.forEach(function(s){h+="<option value=\""+s.id+"\">"+esc(s.name)+"</option>";}); se.innerHTML=h;
}

/* ===== Admin: Materials List ===== */
function renderAdminMaterials(){
  var el=$("#adminMaterials"); if(!el) return;
  if(!data.materials.length){ el.innerHTML="<div class=\"empty\"><strong>No materials yet</strong></div>"; return; }
  var h="";
  data.materials.forEach(function(m){
    var fc=m.material_files?m.material_files.length:0;
    h += "<div class=\"admin-row\"><div><strong>"+esc(m.title)+"</strong><small>"+esc(className(m.class_id))+" &bull; "+esc(subjectName(m.subject_id))+" &bull; "+dateLabel(m.uploaded_at)+" &bull; "+fc+" PDF"+(fc!==1?"s":"")+"</small></div>" +
      "<div class=\"row-actions\"><button class=\"small\" data-action=\"edit\" data-id=\""+m.id+"\">Edit</button><button class=\"small danger\" data-action=\"deletemat\" data-id=\""+m.id+"\">Delete</button></div></div>";
  });
  el.innerHTML=h;
}

/* ===== Admin: Structure ===== */
function renderStructure(){
  var ce=$("#classManage"), se=$("#subjectManage"); if(!ce||!se) return;
  var h="";
  data.classes.forEach(function(c){ h+="<div class=\"manage-item\"><span>"+esc(c.name)+"</span><button class=\"small danger\" data-action=\"deleteclass\" data-id=\""+c.id+"\">Delete</button></div>"; });
  ce.innerHTML=h||"<p style=\"padding:12px;color:var(--muted)\">None</p>";
  h="";
  data.subjects.forEach(function(s){ h+="<div class=\"manage-item\"><span>"+esc(className(s.class_id))+" &bull; "+esc(s.name)+"</span><button class=\"small danger\" data-action=\"deletesubject\" data-id=\""+s.id+"\">Delete</button></div>"; });
  se.innerHTML=h||"<p style=\"padding:12px;color:var(--muted)\">None</p>";
}

/* ===== Admin: Fee Records ===== */
function renderAdminFees(){
  var head=$("#adminFeeHead"), body=$("#adminFeeBody"), yearEl=$("#adminFeeYear");
  if(!head) return;
  var yr=currentYear(), mi=currentMonthIndex();
  if(yearEl) yearEl.textContent=yr;
  var hRow="<tr><th>Student Name</th>";
  for(var i=0;i<=mi;i++) hRow+="<th>"+MONTH_LABELS[i]+"</th>";
  hRow+="<th></th></tr>";
  head.innerHTML=hRow;
  if(!data.feeRecords.length){ body.innerHTML="<tr><td colspan=\""+(mi+3)+"\" style=\"text-align:center;padding:20px;color:var(--muted)\">No students. Click + Add Student.</td></tr>"; return; }
  var h="";
  data.feeRecords.forEach(function(r){
    h+="<tr><td>"+esc(r.student_name)+"</td>";
    for(var i=0;i<=mi;i++){
      var val=r[MONTHS[i]]||"-";
      var cls=val==="Paid"?"fee-paid":val==="Unpaid"?"fee-unpaid":"fee-na";
      h+="<td class=\""+cls+"\" data-action=\"feecell\" data-rid=\""+r.id+"\" data-month=\""+MONTHS[i]+"\" data-val=\""+esc(val)+"\">"+esc(val)+"</td>";
    }
    h+="<td><button class=\"small danger\" data-action=\"deletestudent\" data-id=\""+r.id+"\">X</button></td></tr>";
  });
  body.innerHTML=h;
}

/* ===== Admin: Schedule ===== */
function renderAdminSchedule(){
  var el=$("#adminSchedule"); if(!el) return;
  if(!data.schedule.length){ el.innerHTML="<div class=\"empty\"><strong>No entries</strong></div>"; return; }
  var h="";
  data.schedule.forEach(function(s){
    h+="<div class=\"admin-row\"><div><strong>"+esc(s.batch)+"</strong><small>"+esc(s.days)+" &bull; "+esc(s.time)+"</small></div>" +
      "<div class=\"row-actions\"><button class=\"small\" data-action=\"editsched\" data-id=\""+s.id+"\">Edit</button><button class=\"small danger\" data-action=\"deletesched\" data-id=\""+s.id+"\">Delete</button></div></div>";
  });
  el.innerHTML=h;
}

/* ===== Admin: Notices ===== */
function renderAdminNotices(){
  var el=$("#adminNotices"); if(!el) return;
  var h="";
  data.notices.forEach(function(n){
    h+="<div class=\"admin-row\"><div><strong>"+esc(n.title)+"</strong><small>"+esc(n.message).substring(0,80)+"... &bull; "+dateLabel(n.posted_at)+"</small></div>" +
      "<div class=\"row-actions\"><button class=\"small danger\" data-action=\"deletenotice\" data-id=\""+n.id+"\">Remove</button></div></div>";
  });
  el.innerHTML=h||"<div class=\"empty\"><strong>No notices</strong></div>";
}

/* ===== File Operations ===== */
function doView(path){ window.open(getPublicUrl(path),"_blank","noopener"); }
function doDownload(path,fname){
  var a=document.createElement("a"); a.href=getPublicUrl(path); a.download=fname||"material.pdf"; a.target="_blank";
  document.body.appendChild(a); a.click(); a.remove();
}
function doWhatsApp(title,fname){
  var t="Check out this study material from Gyaan Ashram Career Institute:\n"+title+" - "+fname+"\n"+window.location.href;
  window.open("https://wa.me/?text="+encodeURIComponent(t),"_blank","noopener");
}

async function uploadPdf(file){
  var fp = uid()+"_"+file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
  var res = await supabase.storage.from("study-materials").upload(fp, file, {cacheControl:"3600",upsert:false});
  if(res.error) throw res.error;
  return fp;
}

/* ===== Delegated Click Handler ===== */
document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn) return;
  var action = btn.getAttribute("data-action");

  if(action==="view") doView(btn.getAttribute("data-path"));
  else if(action==="download") doDownload(btn.getAttribute("data-path"),btn.getAttribute("data-fname"));
  else if(action==="whatsapp") doWhatsApp(btn.getAttribute("data-title"),btn.getAttribute("data-fname"));
  else if(action==="browseclass"){ doBrowseClass(btn.getAttribute("data-id")); }
  else if(action==="browsesubject"){ doBrowseSubject(btn.getAttribute("data-id")); }
  else if(action==="browseall"){ doBrowseAll(); }
  else if(action==="edit"){ doEditMaterial(btn.getAttribute("data-id")); }
  else if(action==="deletemat"){ doDeleteMaterial(btn.getAttribute("data-id")); }
  else if(action==="deleteclass"){ doDeleteClass(btn.getAttribute("data-id")); }
  else if(action==="deletesubject"){ doDeleteSubject(btn.getAttribute("data-id")); }
  else if(action==="feecell"){ doFeeCell(btn); }
  else if(action==="deletestudent"){ doDeleteStudent(btn.getAttribute("data-id")); }
  else if(action==="editsched"){ doEditSchedule(btn.getAttribute("data-id")); }
  else if(action==="deletesched"){ doDeleteSchedule(btn.getAttribute("data-id")); }
  else if(action==="deletenotice"){ doDeleteNotice(btn.getAttribute("data-id")); }
});

function doBrowseAll(){ currentBrowse={classId:null,subjectId:null}; $("#classGrid").classList.remove("hidden"); $("#searchResults").classList.add("hidden"); renderBrowse(); }
function doBrowseClass(id){ currentBrowse={classId:id,subjectId:null}; $("#classGrid").classList.add("hidden"); renderBrowse(); }
function doBrowseSubject(id){ var s=data.subjects.find(function(x){return x.id===id;}); currentBrowse={classId:s?s.class_id:null,subjectId:id}; $("#classGrid").classList.add("hidden"); renderBrowse(); }

/* ===== Admin Actions ===== */
function doEditMaterial(id){
  var m=data.materials.find(function(x){return x.id===id;}); if(!m) return;
  $("#editId").value=m.id; $("#editClass").value=m.class_id;
  updateSubjectSelect("#editClass","#editSubject"); $("#editSubject").value=m.subject_id;
  $("#editTopic").value=m.title;
  var ff=m.material_files&&m.material_files[0];
  $("#editName").value=ff?ff.name:""; $("#editDescription").value=m.description||"";
  openModal("#editModal");
}

async function doDeleteMaterial(id){
  var m=data.materials.find(function(x){return x.id===id;}); if(!m) return;
  if(!confirm("Delete \""+m.title+"\"?")) return;
  try {
    var paths=[]; (m.material_files||[]).forEach(function(f){paths.push(f.storage_path);});
    if(paths.length) await supabase.storage.from("study-materials").remove(paths);
    await supabase.from("materials").delete().eq("id",id);
    await fetchAllData(); renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent(); toast("Deleted.");
  } catch(e){ toast("Error: "+e.message); }
}

async function doDeleteClass(id){
  var c=data.classes.find(function(x){return x.id===id;}); if(!c) return;
  if(!confirm("Delete \""+c.name+"\"? All subjects/materials will be removed.")) return;
  try {
    var mats=data.materials.filter(function(m){return m.class_id===id;}), paths=[];
    mats.forEach(function(m){(m.material_files||[]).forEach(function(f){paths.push(f.storage_path);});});
    if(paths.length) await supabase.storage.from("study-materials").remove(paths);
    await supabase.from("classes").delete().eq("id",id);
    await fetchAllData(); populateSelects(); renderStructure(); renderAdminMaterials(); renderClasses(); renderRecent(); toast("Class deleted.");
  } catch(e){ toast("Error: "+e.message); }
}

async function doDeleteSubject(id){
  var s=data.subjects.find(function(x){return x.id===id;}); if(!s) return;
  if(!confirm("Delete \""+s.name+"\"?")) return;
  try {
    var mats=data.materials.filter(function(m){return m.subject_id===id;}), paths=[];
    mats.forEach(function(m){(m.material_files||[]).forEach(function(f){paths.push(f.storage_path);});});
    if(paths.length) await supabase.storage.from("study-materials").remove(paths);
    await supabase.from("subjects").delete().eq("id",id);
    await fetchAllData(); populateSelects(); renderStructure(); renderAdminMaterials(); renderClasses(); renderRecent(); toast("Subject deleted.");
  } catch(e){ toast("Error: "+e.message); }
}

/* ===== Fee Cell Toggle ===== */
async function doFeeCell(btn){
  var rid=btn.getAttribute("data-rid"), month=btn.getAttribute("data-month"), val=btn.getAttribute("data-val");
  var next = val==="Paid"?"Unpaid": val==="Unpaid"?"-": "Paid";
  var update={}; update[month]=next;
  try {
    await supabase.from("fee_records").update(update).eq("id",rid);
    await fetchAllData(); renderAdminFees(); renderFeeTable(); toast(month.toUpperCase()+": "+next);
  } catch(e){ toast("Error: "+e.message); }
}

async function doDeleteStudent(id){
  if(!confirm("Remove this student from fee records?")) return;
  try {
    await supabase.from("fee_records").delete().eq("id",id);
    await fetchAllData(); renderAdminFees(); renderFeeTable(); toast("Student removed.");
  } catch(e){ toast("Error: "+e.message); }
}

/* ===== Schedule Admin ===== */
function doEditSchedule(id){
  var s=data.schedule.find(function(x){return x.id===id;}); if(!s) return;
  $("#schedId").value=s.id; $("#schedBatch").value=s.batch; $("#schedDays").value=s.days; $("#schedTime").value=s.time;
  openModal("#schedModal");
}

async function doDeleteSchedule(id){
  if(!confirm("Delete this schedule entry?")) return;
  try {
    await supabase.from("schedule").delete().eq("id",id);
    await fetchAllData(); renderAdminSchedule(); renderSchedule(); toast("Deleted.");
  } catch(e){ toast("Error: "+e.message); }
}

/* ===== Notice Admin ===== */
async function doDeleteNotice(id){
  if(!confirm("Remove this notice?")) return;
  try {
    await supabase.from("notices").update({is_active:false}).eq("id",id);
    await fetchAllData(); renderAdminNotices(); renderNotices(); toast("Notice removed.");
  } catch(e){ toast("Error: "+e.message); }
}

/* ===== DOM Ready ===== */
document.addEventListener("DOMContentLoaded", async function(){
  initSupabase();
  initTheme();
  var yearEl=$("#year"); if(yearEl) yearEl.textContent=currentYear();
  var darkBtn=$("#darkToggle"); if(darkBtn) darkBtn.addEventListener("click",toggleTheme);

  // Mobile menu
  var menuBtn=$("#menuBtn"), navLinks=$("#navLinks");
  if(menuBtn&&navLinks){
    menuBtn.addEventListener("click",function(){
      navLinks.classList.toggle("open");
      menuBtn.innerHTML=navLinks.classList.contains("open")?"&times;":"&#9776;";
    });
    navLinks.querySelectorAll("a").forEach(function(a){a.addEventListener("click",function(){navLinks.classList.remove("open");menuBtn.innerHTML="&#9776;";});});
  }

  // Admin login
  var adminBtn=$("#adminBtn"); if(adminBtn) adminBtn.addEventListener("click",function(){openModal("#loginModal");});
  var footerAdmin=$("#footerAdmin"); if(footerAdmin) footerAdmin.addEventListener("click",function(){openModal("#loginModal");});

  // Login form
  var loginForm=$("#loginForm");
  if(loginForm) loginForm.addEventListener("submit", async function(e){
    e.preventDefault();
    var email=$("#loginUser").value.trim(), pass=$("#loginPass").value;
    try {
      var res = await supabase.auth.signInWithPassword({email:email, password:pass});
      if(res.error) throw res.error;
      currentUser=res.data.user;
      closeModal("#loginModal");
      populateSelects(); renderAdminMaterials(); renderStructure(); renderAdminFees(); renderAdminSchedule(); renderAdminNotices();
      openModal("#adminModal");
      toast("Welcome, Admin!");
    } catch(e){ toast("Login failed: "+(e.message||"Invalid credentials")); }
  });

  // Close modals
  $$("[data-close]").forEach(function(el){
    el.addEventListener("click",function(){ closeModal("#"+el.getAttribute("data-close")+"Modal"); });
  });

  // Admin tabs
  $$(".tab").forEach(function(tab){
    tab.addEventListener("click",function(){
      $$(".tab").forEach(function(t){t.classList.remove("active");});
      tab.classList.add("active");
      var target=tab.getAttribute("data-tab");
      ["upload","manage","structure","fees","sched","notice"].forEach(function(t){
        var el=$("#tab-"+t); if(el) el.classList.toggle("hidden",t!==target);
      });
    });
  });

  // Upload form
  var uploadForm=$("#uploadForm");
  if(uploadForm){
    $("#uploadClass").addEventListener("change",function(){updateSubjectSelect("#uploadClass","#uploadSubject");});
    uploadForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var file=$("#uploadFile").files[0]; if(!file){toast("Select a PDF.");return;}
      try {
        toast("Uploading...");
        var sp=await uploadPdf(file);
        var mr=await supabase.from("materials").insert({class_id:$("#uploadClass").value,subject_id:$("#uploadSubject").value,title:$("#uploadTopic").value.trim(),description:$("#uploadDescription").value.trim()}).select().single();
        if(mr.error) throw mr.error;
        var fr=await supabase.from("material_files").insert({material_id:mr.data.id,name:$("#uploadName").value.trim(),filename:file.name,storage_path:sp,size_label:Math.ceil(file.size/1024)+" KB"});
        if(fr.error) throw fr.error;
        uploadForm.reset();
        await fetchAllData(); renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent(); toast("Uploaded!");
      } catch(e){ toast("Error: "+(e.message||"Upload failed")); }
    });
  }

  // Edit form
  var editForm=$("#editForm");
  if(editForm){
    $("#editClass").addEventListener("change",function(){updateSubjectSelect("#editClass","#editSubject");});
    editForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var id=$("#editId").value;
      try {
        await supabase.from("materials").update({class_id:$("#editClass").value,subject_id:$("#editSubject").value,title:$("#editTopic").value.trim(),description:$("#editDescription").value.trim()}).eq("id",id);
        var m=data.materials.find(function(x){return x.id===id;}); var ff=m&&m.material_files&&m.material_files[0];
        if(ff) await supabase.from("material_files").update({name:$("#editName").value.trim()}).eq("id",ff.id);
        var nf=$("#editFile").files[0];
        if(nf&&ff){
          await supabase.storage.from("study-materials").remove([ff.storage_path]);
          var np=await uploadPdf(nf);
          await supabase.from("material_files").update({storage_path:np,filename:nf.name,size_label:Math.ceil(nf.size/1024)+" KB"}).eq("id",ff.id);
        }
        await fetchAllData(); closeModal("#editModal"); renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent(); toast("Updated!");
      } catch(e){ toast("Error: "+(e.message||"Update failed")); }
    });
  }

  // Add class
  var addClassBtn=$("#addClass"); if(addClassBtn) addClassBtn.addEventListener("click",function(){openModal("#classModal");});
  var classForm=$("#classForm");
  if(classForm) classForm.addEventListener("submit", async function(e){
    e.preventDefault();
    var name=$("#classNameInput").value.trim(); if(!name){toast("Enter name.");return;}
    try {
      var mx=data.classes.reduce(function(m,c){return c.sort_order>m?c.sort_order:m;},0);
      await supabase.from("classes").insert({name:name,sort_order:mx+1});
      await fetchAllData(); closeModal("#classModal"); classForm.reset(); populateSelects(); renderStructure(); renderClasses(); toast("Class added.");
    } catch(e){ toast("Error: "+e.message); }
  });

  // Add subject
  var addSubjectBtn=$("#addSubject"); if(addSubjectBtn) addSubjectBtn.addEventListener("click",function(){
    var opts=""; data.classes.forEach(function(c){opts+="<option value=\""+c.id+"\">"+esc(c.name)+"</option>";}); var sc=$("#subjectClass"); if(sc) sc.innerHTML=opts;
    openModal("#subjectModal");
  });
  var subjectForm=$("#subjectForm");
  if(subjectForm) subjectForm.addEventListener("submit", async function(e){
    e.preventDefault();
    var cid=$("#subjectClass").value, name=$("#subjectNameInput").value.trim(); if(!name){toast("Enter name.");return;}
    try {
      await supabase.from("subjects").insert({class_id:cid,name:name});
      await fetchAllData(); closeModal("#subjectModal"); subjectForm.reset(); populateSelects(); renderStructure(); renderClasses(); toast("Subject added.");
    } catch(e){ toast("Error: "+e.message); }
  });

  // Add student
  var addStudentBtn=$("#addStudent"); if(addStudentBtn) addStudentBtn.addEventListener("click", async function(){
    var name=prompt("Enter student name:");
    if(!name||!name.trim()) return;
    try {
      await supabase.from("fee_records").insert({student_name:name.trim(),year:currentYear()});
      await fetchAllData(); renderAdminFees(); renderFeeTable(); toast("Student added.");
    } catch(e){ toast("Error: "+e.message); }
  });

  // Add schedule
  var addSchedBtn=$("#addSchedule"); if(addSchedBtn) addSchedBtn.addEventListener("click",function(){
    $("#schedId").value=""; $("#schedBatch").value=""; $("#schedDays").value=""; $("#schedTime").value="";
    openModal("#schedModal");
  });
  var schedForm=$("#schedForm");
  if(schedForm) schedForm.addEventListener("submit", async function(e){
    e.preventDefault();
    var id=$("#schedId").value, batch=$("#schedBatch").value.trim(), days=$("#schedDays").value.trim(), time=$("#schedTime").value.trim();
    try {
      if(id){
        await supabase.from("schedule").update({batch:batch,days:days,time:time}).eq("id",id);
      } else {
        var mx=data.schedule.reduce(function(m,s){return s.sort_order>m?s.sort_order:m;},0);
        await supabase.from("schedule").insert({batch:batch,days:days,time:time,sort_order:mx+1});
      }
      await fetchAllData(); closeModal("#schedModal"); schedForm.reset(); renderAdminSchedule(); renderSchedule(); toast("Saved.");
    } catch(e){ toast("Error: "+e.message); }
  });

  // Add notice
  var addNoticeBtn=$("#addNotice"); if(addNoticeBtn) addNoticeBtn.addEventListener("click",function(){
    $("#noticeId").value=""; $("#noticeTitle").value=""; $("#noticeMessage").value="";
    openModal("#noticeModal");
  });
  var noticeForm=$("#noticeForm");
  if(noticeForm) noticeForm.addEventListener("submit", async function(e){
    e.preventDefault();
    var title=$("#noticeTitle").value.trim(), msg=$("#noticeMessage").value.trim();
    if(!title||!msg){toast("Fill all fields.");return;}
    try {
      await supabase.from("notices").insert({title:title,message:msg});
      await fetchAllData(); closeModal("#noticeModal"); noticeForm.reset(); renderAdminNotices(); renderNotices(); toast("Notice published.");
    } catch(e){ toast("Error: "+e.message); }
  });

  // Logout
  var logoutBtn=$("#logout"); if(logoutBtn) logoutBtn.addEventListener("click", async function(){
    await supabase.auth.signOut(); currentUser=null; closeModal("#adminModal"); toast("Logged out.");
  });

  // Fetch and render
  await fetchAllData();
  renderNotices();
  renderRecent();
  renderClasses();
  renderBrowse();
  renderFeeTable();
  renderSchedule();
  initSearch();
});

/* ===== PWA ===== */
if("serviceWorker" in navigator){
  window.addEventListener("load",function(){ navigator.serviceWorker.register("sw.js").catch(function(){}); });
}
