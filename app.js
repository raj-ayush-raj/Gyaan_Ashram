/* ===== Gyaan Ashram Career Institute - App.js ===== */

var STORAGE_KEY = "gyaan_ashram_v1_data";
var FILE_KEY = "gyaan_ashram_v1_files";
var THEME_KEY = "gyaan_ashram_theme";

var initialData = {
  classes: [
    {id:"c8", name:"Class 8"},
    {id:"c9", name:"Class 9"},
    {id:"c10", name:"Class 10"}
  ],
  subjects: [
    {id:"s-maths", classId:"c8", name:"Mathematics"},
    {id:"s-science8", classId:"c8", name:"Science"},
    {id:"s-maths9", classId:"c9", name:"Mathematics"},
    {id:"s-science9", classId:"c9", name:"Science"},
    {id:"s-maths10", classId:"c10", name:"Mathematics"},
    {id:"s-science10", classId:"c10", name:"Science"},
    {id:"s-english10", classId:"c10", name:"English"}
  ],
  materials: [
    {
      id:"m-demo",
      classId:"c9",
      subjectId:"s-science9",
      title:"Tissues in Action",
      description:"Class 9 Science notes covering plant and animal tissues.",
      uploadedAt:"2026-08-15T08:00:00",
      files:[{id:"f-demo", name:"Complete Notes", filename:"tissues-in-action.pdf", demoPath:"assets/tissues-in-action.pdf", sizeLabel:"13 pages"}]
    }
  ],
  schedule: [
    {batch:"Class 8 - Morning", days:"Mon - Sat", time:"7:00 AM - 9:00 AM"},
    {batch:"Class 9 - Morning", days:"Mon - Sat", time:"9:15 AM - 11:15 AM"},
    {batch:"Class 10 - Afternoon", days:"Mon - Sat", time:"2:00 PM - 4:00 PM"},
    {batch:"Doubt Session (All)", days:"Saturday", time:"4:30 PM - 6:00 PM"}
  ]
};

var data = loadData();
var fileStore = loadFiles();
var currentBrowse = {classId: null, subjectId: null};


/* ===== Utilities ===== */
function $(s){ return document.querySelector(s); }
function $$(s){ return Array.from(document.querySelectorAll(s)); }

function loadData(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || JSON.parse(JSON.stringify(initialData)); }
  catch(e){ return JSON.parse(JSON.stringify(initialData)); }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function loadFiles(){
  try { return JSON.parse(localStorage.getItem(FILE_KEY) || "{}"); } catch(e){ return {}; }
}
function saveFiles(){ localStorage.setItem(FILE_KEY, JSON.stringify(fileStore)); }
function uid(prefix){ return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

function esc(v){
  var s = String(v == null ? "" : v);
  return s.replace(/[&<>"']/g, function(c){
    var map = {"&":"&amp;","<":"&lt;",">":"&gt;"};
    map['"'] = "&quot;";
    map["'"] = "&#39;";
    return map[c];
  });
}

function dateLabel(v){ return new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function className(id){ var c = data.classes.find(function(x){return x.id===id;}); return c ? c.name : "Unknown Class"; }
function subjectName(id){ var s = data.subjects.find(function(x){return x.id===id;}); return s ? s.name : "Unknown Subject"; }
function materialCountForClass(classId){
  return data.materials.filter(function(m){return m.classId===classId;}).reduce(function(n,m){return n+m.files.length;},0);
}
function toast(msg){
  var t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(window._toastT); window._toastT = setTimeout(function(){ t.classList.remove("show"); }, 2500);
}

/* ===== Dark Mode ===== */
function initTheme(){
  var saved = localStorage.getItem(THEME_KEY);
  if(saved === "dark"){ document.documentElement.setAttribute("data-theme","dark"); }
}
function toggleTheme(){
  var isDark = document.documentElement.getAttribute("data-theme") === "dark";
  if(isDark){
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem(THEME_KEY, "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem(THEME_KEY, "dark");
  }
}

/* ===== Modals ===== */
function openModal(id){ $(id).classList.remove("hidden"); document.body.style.overflow = "hidden"; }
function closeModal(id){ $(id).classList.add("hidden"); if($$(".modal:not(.hidden)").length === 0) document.body.style.overflow = ""; }
function openLogin(){ openModal("#loginModal"); }

/* ===== Recently Added Section ===== */
function renderRecent(){
  var el = $("#recentGrid");
  if(!el) return;
  var allFiles = [];
  data.materials.forEach(function(m){
    m.files.forEach(function(f){
      allFiles.push({material: m, file: f, date: m.uploadedAt});
    });
  });
  allFiles.sort(function(a,b){ return new Date(b.date) - new Date(a.date); });
  var recent = allFiles.slice(0, 3);
  if(recent.length === 0){
    el.innerHTML = "<div class=\"empty\"><strong>No materials yet</strong>Check back after the admin uploads study notes.</div>";
    return;
  }
  var html = "";
  recent.forEach(function(item){
    var m = item.material, f = item.file;
    html += "<div class=\"recent-card\">" +
      "<span class=\"rc-badge\">" + esc(className(m.classId)) + " &bull; " + esc(subjectName(m.subjectId)) + "</span>" +
      "<h4>" + esc(m.title) + "</h4>" +
      "<p class=\"rc-meta\">" + esc(f.name) + " &bull; " + dateLabel(item.date) + "</p>" +
      "<div class=\"rc-actions\">" +
        "<button class=\"small\" data-action=\"view\" data-mid=\"" + m.id + "\" data-fid=\"" + f.id + "\">View</button>" +
        "<button class=\"small dark\" data-action=\"download\" data-mid=\"" + m.id + "\" data-fid=\"" + f.id + "\">Download</button>" +
        "<button class=\"small whatsapp\" data-action=\"whatsapp\" data-title=\"" + esc(m.title) + "\" data-fname=\"" + esc(f.name) + "\">WhatsApp</button>" +
      "</div></div>";
  });
  el.innerHTML = html;
}

/* ===== Class Grid ===== */
function renderClasses(){
  var el = $("#classGrid");
  if(!el) return;
  var html = "";
  data.classes.forEach(function(c, i){
    var count = materialCountForClass(c.id);
    var subjects = data.subjects.filter(function(s){return s.classId===c.id;}).length;
    html += "<article class=\"class-card\" data-action=\"browseclass\" data-id=\"" + c.id + "\">" +
      "<span class=\"class-number\">CLASS " + String(i+1).padStart(2,"0") + "</span>" +
      "<h3>" + esc(c.name) + "</h3>" +
      "<p>" + subjects + " subject" + (subjects!==1?"s":"") + "</p>" +
      "<span class=\"material-count\">" + count + " PDF" + (count!==1?"s":"") + " available</span>" +
      "<div class=\"explore\">Explore <span>&rarr;</span></div>" +
    "</article>";
  });
  el.innerHTML = html;
}

/* ===== Browse (Subjects + Materials) ===== */
function renderBrowse(){
  var panel = $("#browsePanel");
  if(!panel) return;
  if(!currentBrowse.classId){
    panel.innerHTML = "";
    return;
  }
  var cls = className(currentBrowse.classId);

  if(!currentBrowse.subjectId){
    var subjects = data.subjects.filter(function(s){return s.classId===currentBrowse.classId;});
    var html = "<div class=\"breadcrumb\"><button data-action=\"browseall\">Study Material</button> <span>&rsaquo;</span> " + esc(cls) + "</div>";
    if(subjects.length){
      html += "<div class=\"subject-grid\">";
      subjects.forEach(function(s){
        html += "<article class=\"subject-card\" data-action=\"browsesubject\" data-id=\"" + s.id + "\">" +
          "<h3>" + esc(s.name) + "</h3><span class=\"explore\">&rarr;</span></article>";
      });
      html += "</div>";
    } else {
      html += "<div class=\"empty\"><strong>No subjects yet</strong>Admin can add subjects from the dashboard.</div>";
    }
    panel.innerHTML = html;
    return;
  }

  var subj = subjectName(currentBrowse.subjectId);
  var mats = data.materials.filter(function(m){
    return m.classId===currentBrowse.classId && m.subjectId===currentBrowse.subjectId;
  }).sort(function(a,b){ return new Date(b.uploadedAt) - new Date(a.uploadedAt); });

  var html = "<div class=\"breadcrumb\">" +
    "<button data-action=\"browseall\">Study Material</button> <span>&rsaquo;</span> " +
    "<button data-action=\"browseclass\" data-id=\"" + currentBrowse.classId + "\">" + esc(cls) + "</button> <span>&rsaquo;</span> " +
    esc(subj) + "</div>";

  if(!mats.length){
    html += "<div class=\"empty\"><strong>No material uploaded yet</strong>New notes will appear here as soon as the admin publishes them.</div>";
    panel.innerHTML = html;
    return;
  }

  html += "<div class=\"notes\">";
  mats.forEach(function(m){
    html += "<div class=\"note-group\"><div class=\"note-group-head\"><h3>" + esc(m.title) + "</h3><p>Uploaded " + dateLabel(m.uploadedAt) + (m.description ? " &bull; " + esc(m.description) : "") + "</p></div>";
    m.files.forEach(function(f){
      html += "<div class=\"note-item\"><div class=\"note-main\"><div class=\"pdf\">PDF</div><div><strong>" + esc(f.name) + "</strong><div class=\"meta\">" + esc(f.sizeLabel || "PDF document") + "</div></div></div>" +
        "<div class=\"note-actions\">" +
          "<button class=\"small\" data-action=\"view\" data-mid=\"" + m.id + "\" data-fid=\"" + f.id + "\">View</button>" +
          "<button class=\"small dark\" data-action=\"download\" data-mid=\"" + m.id + "\" data-fid=\"" + f.id + "\">Download</button>" +
          "<button class=\"small whatsapp\" data-action=\"whatsapp\" data-title=\"" + esc(m.title) + "\" data-fname=\"" + esc(f.name) + "\">WhatsApp</button>" +
        "</div></div>";
    });
    html += "</div>";
  });
  html += "</div>";
  panel.innerHTML = html;
}

function doBrowseAll(){ currentBrowse = {classId:null, subjectId:null}; $("#classGrid").classList.remove("hidden"); $("#searchResults").classList.add("hidden"); renderBrowse(); }
function doBrowseClass(id){ currentBrowse = {classId:id, subjectId:null}; $("#classGrid").classList.add("hidden"); renderBrowse(); }
function doBrowseSubject(id){
  var s = data.subjects.find(function(x){return x.id===id;});
  currentBrowse = {classId: s ? s.classId : null, subjectId: id};
  $("#classGrid").classList.add("hidden");
  renderBrowse();
}

/* ===== File Operations ===== */
function getFileContent(material, file){
  if(file.demoPath) return {url: file.demoPath, revoke: false};
  var b64 = fileStore[file.id]; if(!b64) return null;
  var raw = atob(b64.split(",")[1] || "");
  var bytes = new Uint8Array(raw.length);
  for(var i=0; i<raw.length; i++) bytes[i] = raw.charCodeAt(i);
  var blob = new Blob([bytes], {type:"application/pdf"});
  return {url: URL.createObjectURL(blob), revoke: true};
}

function doViewFile(mid, fid){
  var m = data.materials.find(function(x){return x.id===mid;});
  var f = m ? m.files.find(function(x){return x.id===fid;}) : null;
  if(!f) return;
  var got = getFileContent(m, f);
  if(!got){ toast("This PDF is unavailable in this browser."); return; }
  window.open(got.url, "_blank", "noopener");
  if(got.revoke) setTimeout(function(){ URL.revokeObjectURL(got.url); }, 60000);
}

function doDownloadFile(mid, fid){
  var m = data.materials.find(function(x){return x.id===mid;});
  var f = m ? m.files.find(function(x){return x.id===fid;}) : null;
  if(!f) return;
  var got = getFileContent(m, f);
  if(!got){ toast("This PDF is unavailable in this browser."); return; }
  var a = document.createElement("a"); a.href = got.url; a.download = f.filename || "study-material.pdf";
  document.body.appendChild(a); a.click(); a.remove();
  if(got.revoke) setTimeout(function(){ URL.revokeObjectURL(got.url); }, 1000);
}

function doShareWhatsApp(title, fname){
  var text = "Check out this study material from Gyaan Ashram Career Institute:\n" +
    String.fromCodePoint(128214) + " " + title + " - " + fname + "\n" +
    String.fromCodePoint(128279) + " " + window.location.href;
  var url = "https://wa.me/?text=" + encodeURIComponent(text);
  window.open(url, "_blank", "noopener");
}

/* ===== Search ===== */
function initSearch(){
  var input = $("#searchInput");
  var clear = $("#searchClear");
  var results = $("#searchResults");
  if(!input) return;

  input.addEventListener("input", function(){
    var q = input.value.trim().toLowerCase();
    if(q.length === 0){
      clear.classList.add("hidden");
      results.classList.add("hidden");
      results.innerHTML = "";
      $("#classGrid").classList.remove("hidden");
      $("#browsePanel").innerHTML = "";
      currentBrowse = {classId:null, subjectId:null};
      return;
    }
    clear.classList.remove("hidden");
    var matches = [];
    data.materials.forEach(function(m){
      var clsName = className(m.classId).toLowerCase();
      var subjName = subjectName(m.subjectId).toLowerCase();
      var titleLow = m.title.toLowerCase();
      var descLow = (m.description || "").toLowerCase();
      m.files.forEach(function(f){
        var nameLow = f.name.toLowerCase();
        if(titleLow.indexOf(q) >= 0 || nameLow.indexOf(q) >= 0 || clsName.indexOf(q) >= 0 || subjName.indexOf(q) >= 0 || descLow.indexOf(q) >= 0){
          matches.push({material: m, file: f});
        }
      });
    });

    $("#classGrid").classList.add("hidden");
    $("#browsePanel").innerHTML = "";
    if(matches.length === 0){
      results.classList.remove("hidden");
      results.innerHTML = "<div class=\"empty\"><strong>No results found</strong>Try a different keyword.</div>";
      return;
    }
    results.classList.remove("hidden");
    var html = "<p style=\"font-size:13px;color:var(--muted);margin:0 0 14px\">" + matches.length + " result" + (matches.length!==1?"s":"") + " found</p><div class=\"notes\">";
    matches.forEach(function(item){
      var m = item.material, f = item.file;
      html += "<div class=\"note-group\"><div class=\"note-group-head\"><h3>" + esc(m.title) + "</h3><p>" + esc(className(m.classId)) + " &bull; " + esc(subjectName(m.subjectId)) + " &bull; " + dateLabel(m.uploadedAt) + "</p></div>" +
        "<div class=\"note-item\"><div class=\"note-main\"><div class=\"pdf\">PDF</div><div><strong>" + esc(f.name) + "</strong><div class=\"meta\">" + esc(f.sizeLabel || "PDF document") + "</div></div></div>" +
        "<div class=\"note-actions\"><button class=\"small\" data-action=\"view\" data-mid=\"" + m.id + "\" data-fid=\"" + f.id + "\">View</button><button class=\"small dark\" data-action=\"download\" data-mid=\"" + m.id + "\" data-fid=\"" + f.id + "\">Download</button><button class=\"small whatsapp\" data-action=\"whatsapp\" data-title=\"" + esc(m.title) + "\" data-fname=\"" + esc(f.name) + "\">WhatsApp</button></div></div></div>";
    });
    html += "</div>";
    results.innerHTML = html;
  });

  clear.addEventListener("click", function(){
    input.value = "";
    clear.classList.add("hidden");
    results.classList.add("hidden");
    results.innerHTML = "";
    $("#classGrid").classList.remove("hidden");
    currentBrowse = {classId:null, subjectId:null};
    renderBrowse();
  });
}

/* ===== Schedule ===== */
function renderSchedule(){
  var el = $("#scheduleList");
  if(!el) return;
  var schedule = data.schedule || initialData.schedule;
  var html = "";
  schedule.forEach(function(row){
    html += "<div class=\"schedule-row\"><strong>" + esc(row.batch) + "</strong><span class=\"sch-days\">" + esc(row.days) + "</span><span class=\"sch-time\">" + esc(row.time) + "</span></div>";
  });
  el.innerHTML = html;
}

/* ===== Admin ===== */
function populateSelects(){
  var opts = "";
  data.classes.forEach(function(c){ opts += "<option value=\""+c.id+"\">"+esc(c.name)+"</option>"; });
  ["#uploadClass","#editClass","#subjectClass"].forEach(function(sel){
    var el = $(sel); if(el) el.innerHTML = opts;
  });
  updateSubjectSelect("#uploadClass","#uploadSubject");
  updateSubjectSelect("#editClass","#editSubject");
}

function updateSubjectSelect(classSel, subjectSel){
  var classEl = $(classSel); var subEl = $(subjectSel);
  if(!classEl || !subEl) return;
  var cid = classEl.value;
  var subs = data.subjects.filter(function(s){ return s.classId === cid; });
  var html = "";
  subs.forEach(function(s){ html += "<option value=\""+s.id+"\">"+esc(s.name)+"</option>"; });
  subEl.innerHTML = html;
}

function renderAdminMaterials(){
  var el = $("#adminMaterials");
  if(!el) return;
  var mats = data.materials.slice().sort(function(a,b){ return new Date(b.uploadedAt) - new Date(a.uploadedAt); });
  if(!mats.length){
    el.innerHTML = "<div class=\"empty\"><strong>No materials yet</strong>Upload your first PDF from the Upload Material tab.</div>";
    return;
  }
  var html = "";
  mats.forEach(function(m){
    html += "<div class=\"admin-row\"><div><strong>" + esc(m.title) + "</strong><small>" + esc(className(m.classId)) + " &bull; " + esc(subjectName(m.subjectId)) + " &bull; " + dateLabel(m.uploadedAt) + " &bull; " + m.files.length + " PDF" + (m.files.length!==1?"s":"") + "</small></div>" +
      "<div class=\"row-actions\"><button class=\"small\" data-action=\"edit\" data-id=\"" + m.id + "\">Edit</button><button class=\"small danger\" data-action=\"deletemat\" data-id=\"" + m.id + "\">Delete</button></div></div>";
  });
  el.innerHTML = html;
}

function renderStructure(){
  var classEl = $("#classManage"); var subEl = $("#subjectManage");
  if(!classEl || !subEl) return;
  var html = "";
  data.classes.forEach(function(c){
    html += "<div class=\"manage-item\"><span>" + esc(c.name) + "</span><button class=\"small danger\" data-action=\"deleteclass\" data-id=\"" + c.id + "\">Delete</button></div>";
  });
  classEl.innerHTML = html || "<p style=\"padding:12px;color:var(--muted)\">No classes.</p>";
  html = "";
  data.subjects.forEach(function(s){
    html += "<div class=\"manage-item\"><span>" + esc(className(s.classId)) + " &bull; " + esc(s.name) + "</span><button class=\"small danger\" data-action=\"deletesubject\" data-id=\"" + s.id + "\">Delete</button></div>";
  });
  subEl.innerHTML = html || "<p style=\"padding:12px;color:var(--muted)\">No subjects.</p>";
}

/* ===== Delegated Event Listener ===== */
document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn) return;
  var action = btn.getAttribute("data-action");

  if(action === "view") doViewFile(btn.getAttribute("data-mid"), btn.getAttribute("data-fid"));
  else if(action === "download") doDownloadFile(btn.getAttribute("data-mid"), btn.getAttribute("data-fid"));
  else if(action === "whatsapp") doShareWhatsApp(btn.getAttribute("data-title"), btn.getAttribute("data-fname"));
  else if(action === "browseclass") doBrowseClass(btn.getAttribute("data-id"));
  else if(action === "browsesubject") doBrowseSubject(btn.getAttribute("data-id"));
  else if(action === "browseall") doBrowseAll();
  else if(action === "edit"){
    var m = data.materials.find(function(x){return x.id===btn.getAttribute("data-id");});
    if(!m) return;
    $("#editId").value = m.id;
    $("#editClass").value = m.classId;
    updateSubjectSelect("#editClass","#editSubject");
    $("#editSubject").value = m.subjectId;
    $("#editTopic").value = m.title;
    $("#editName").value = m.files[0] ? m.files[0].name : "";
    $("#editDescription").value = m.description || "";
    openModal("#editModal");
  }
  else if(action === "deletemat"){
    var m = data.materials.find(function(x){return x.id===btn.getAttribute("data-id");});
    if(!m) return;
    if(!confirm("Delete \"" + m.title + "\"? This removes it from the student portal.")) return;
    m.files.forEach(function(f){ if(!f.demoPath) delete fileStore[f.id]; });
    data.materials = data.materials.filter(function(x){return x.id!==m.id;});
    saveData(); saveFiles(); renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent(); toast("Material deleted.");
  }
  else if(action === "deleteclass"){
    var c = data.classes.find(function(x){return x.id===btn.getAttribute("data-id");});
    if(!c) return;
    if(!confirm("Delete \"" + c.name + "\"? All subjects and materials for this class will also be removed.")) return;
    data.materials = data.materials.filter(function(m){return m.classId!==c.id;});
    data.subjects = data.subjects.filter(function(s){return s.classId!==c.id;});
    data.classes = data.classes.filter(function(x){return x.id!==c.id;});
    saveData(); populateSelects(); renderStructure(); renderAdminMaterials(); renderClasses(); renderRecent(); toast("Class deleted.");
  }
  else if(action === "deletesubject"){
    var s = data.subjects.find(function(x){return x.id===btn.getAttribute("data-id");});
    if(!s) return;
    if(!confirm("Delete \"" + s.name + "\"? All materials for this subject will also be removed.")) return;
    data.materials = data.materials.filter(function(m){return m.subjectId!==s.id;});
    data.subjects = data.subjects.filter(function(x){return x.id!==s.id;});
    saveData(); populateSelects(); renderStructure(); renderAdminMaterials(); renderClasses(); renderRecent(); toast("Subject deleted.");
  }
});

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", function(){
  initTheme();

  // Year in footer
  var yearEl = $("#year"); if(yearEl) yearEl.textContent = new Date().getFullYear();

  // Dark mode toggle
  var darkBtn = $("#darkToggle"); if(darkBtn) darkBtn.addEventListener("click", toggleTheme);

  // Mobile menu
  var menuBtn = $("#menuBtn");
  var navLinks = $("#navLinks");
  if(menuBtn && navLinks){
    menuBtn.addEventListener("click", function(){
      navLinks.classList.toggle("open");
      menuBtn.innerHTML = navLinks.classList.contains("open") ? "&times;" : "&#9776;";
    });
    navLinks.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){ navLinks.classList.remove("open"); menuBtn.innerHTML = "&#9776;"; });
    });
  }

  // Admin login buttons
  var adminBtn = $("#adminBtn"); if(adminBtn) adminBtn.addEventListener("click", openLogin);
  var footerAdmin = $("#footerAdmin"); if(footerAdmin) footerAdmin.addEventListener("click", openLogin);

  // Login form
  var loginForm = $("#loginForm");
  if(loginForm){
    loginForm.addEventListener("submit", function(e){
      e.preventDefault();
      var user = $("#loginUser").value.trim();
      var pass = $("#loginPass").value;
      if(user === "admin" && pass === "admin123"){
        closeModal("#loginModal");
        populateSelects();
        renderAdminMaterials();
        renderStructure();
        openModal("#adminModal");
        toast("Welcome, Admin!");
      } else {
        toast("Invalid credentials.");
      }
    });
  }

  // Close modals via backdrop and close buttons
  $$("[data-close]").forEach(function(el){
    el.addEventListener("click", function(){
      var target = el.getAttribute("data-close");
      closeModal("#" + target + "Modal");
    });
  });

  // Admin tabs
  $$(".tab").forEach(function(tab){
    tab.addEventListener("click", function(){
      $$(".tab").forEach(function(t){t.classList.remove("active");});
      tab.classList.add("active");
      var target = tab.getAttribute("data-tab");
      ["upload","manage","structure"].forEach(function(t){
        var el = $("#tab-"+t); if(el) el.classList.toggle("hidden", t !== target);
      });
    });
  });

  // Upload form
  var uploadForm = $("#uploadForm");
  if(uploadForm){
    $("#uploadClass").addEventListener("change", function(){ updateSubjectSelect("#uploadClass","#uploadSubject"); });
    uploadForm.addEventListener("submit", function(e){
      e.preventDefault();
      var file = $("#uploadFile").files[0];
      if(!file){ toast("Please select a PDF."); return; }
      var reader = new FileReader();
      reader.onload = function(ev){
        var fileId = uid("f");
        var matId = uid("m");
        fileStore[fileId] = ev.target.result;
        saveFiles();
        data.materials.push({
          id: matId,
          classId: $("#uploadClass").value,
          subjectId: $("#uploadSubject").value,
          title: $("#uploadTopic").value.trim(),
          description: $("#uploadDescription").value.trim(),
          uploadedAt: new Date().toISOString(),
          files: [{id: fileId, name: $("#uploadName").value.trim(), filename: file.name, sizeLabel: Math.ceil(file.size/1024) + " KB"}]
        });
        saveData();
        uploadForm.reset();
        renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent();
        toast("Material uploaded successfully!");
      };
      reader.readAsDataURL(file);
    });
  }

  // Edit form
  var editForm = $("#editForm");
  if(editForm){
    $("#editClass").addEventListener("change", function(){ updateSubjectSelect("#editClass","#editSubject"); });
    editForm.addEventListener("submit", function(e){
      e.preventDefault();
      var id = $("#editId").value;
      var m = data.materials.find(function(x){return x.id===id;});
      if(!m) return;
      m.classId = $("#editClass").value;
      m.subjectId = $("#editSubject").value;
      m.title = $("#editTopic").value.trim();
      m.description = $("#editDescription").value.trim();
      if(m.files[0]) m.files[0].name = $("#editName").value.trim();
      var newFile = $("#editFile").files[0];
      if(newFile){
        var reader = new FileReader();
        reader.onload = function(ev){
          var fid = m.files[0] ? m.files[0].id : uid("f");
          if(m.files[0] && !m.files[0].demoPath) delete fileStore[m.files[0].id];
          fileStore[fid] = ev.target.result;
          saveFiles();
          m.files[0] = {id: fid, name: m.files[0] ? m.files[0].name : "Notes", filename: newFile.name, sizeLabel: Math.ceil(newFile.size/1024) + " KB"};
          saveData(); closeModal("#editModal"); renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent(); toast("Material updated.");
        };
        reader.readAsDataURL(newFile);
      } else {
        saveData(); closeModal("#editModal"); renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent(); toast("Material updated.");
      }
    });
  }

  // Add class
  var addClassBtn = $("#addClass");
  if(addClassBtn) addClassBtn.addEventListener("click", function(){ openModal("#classModal"); });
  var classForm = $("#classForm");
  if(classForm){
    classForm.addEventListener("submit", function(e){
      e.preventDefault();
      var name = $("#className").value.trim();
      if(!name){ toast("Enter a class name."); return; }
      data.classes.push({id: uid("c"), name: name});
      saveData(); closeModal("#classModal"); classForm.reset();
      populateSelects(); renderStructure(); renderClasses(); toast("Class added.");
    });
  }

  // Add subject
  var addSubjectBtn = $("#addSubject");
  if(addSubjectBtn) addSubjectBtn.addEventListener("click", function(){
    populateSelects();
    var subClassSel = $("#subjectClass");
    if(subClassSel){
      var opts = "";
      data.classes.forEach(function(c){ opts += "<option value=\""+c.id+"\">"+esc(c.name)+"</option>"; });
      subClassSel.innerHTML = opts;
    }
    openModal("#subjectModal");
  });
  var subjectForm = $("#subjectForm");
  if(subjectForm){
    subjectForm.addEventListener("submit", function(e){
      e.preventDefault();
      var classId = $("#subjectClass").value;
      var name = $("#subjectName").value.trim();
      if(!name){ toast("Enter a subject name."); return; }
      data.subjects.push({id: uid("s"), classId: classId, name: name});
      saveData(); closeModal("#subjectModal"); subjectForm.reset();
      populateSelects(); renderStructure(); renderClasses(); toast("Subject added.");
    });
  }

  // Logout
  var logoutBtn = $("#logout");
  if(logoutBtn) logoutBtn.addEventListener("click", function(){ closeModal("#adminModal"); toast("Logged out."); });

  // Initial renders
  renderClasses();
  renderBrowse();
  renderRecent();
  renderSchedule();
  initSearch();
});

/* ===== PWA Service Worker Registration ===== */
if("serviceWorker" in navigator){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(){});
  });
}
