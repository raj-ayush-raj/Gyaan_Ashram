/* ===== Gyaan Ashram Career Institute - App.js (Supabase Edition) ===== */

/* ===== Supabase Configuration ===== */
var SUPABASE_URL = "https://vernnftdgswmnfihsvnr.supabase.co";
var SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlcm5uZnRkZ3N3bW5maWhzdm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NjUzMDEsImV4cCI6MjEwMjM0MTMwMX0.kxWxEmABd7iwUKyJuHKUHrqGp8Z0c-paLp7Rxba3dNs";
var THEME_KEY = "gyaan_ashram_theme";

var supabase;
var currentUser = null;
var currentBrowse = {classId: null, subjectId: null};

/* Data cache */
var data = {classes: [], subjects: [], materials: [], schedule: []};
var defaultSchedule = [
  {batch: "Class 8 - Morning", days: "Mon - Sat", time: "7:00 AM - 9:00 AM"},
  {batch: "Class 9 - Morning", days: "Mon - Sat", time: "9:15 AM - 11:15 AM"},
  {batch: "Class 10 - Afternoon", days: "Mon - Sat", time: "2:00 PM - 4:00 PM"},
  {batch: "Doubt Session (All)", days: "Saturday", time: "4:30 PM - 6:00 PM"}
];

/* ===== Utilities ===== */
function $(s){ return document.querySelector(s); }
function $$(s){ return Array.from(document.querySelectorAll(s)); }
function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

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

function toast(msg){
  var t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(window._toastT); window._toastT = setTimeout(function(){ t.classList.remove("show"); }, 2500);
}

/* ===== Supabase Init ===== */
function initSupabase(){
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

/* ===== Data Fetching (from Supabase) ===== */
async function fetchAllData(){
  try {
    var classRes = await supabase.from("classes").select("*").order("sort_order");
    var subjectRes = await supabase.from("subjects").select("*");
    var materialRes = await supabase.from("materials").select("*, material_files(*)").order("uploaded_at", {ascending: false});

    if(classRes.data) data.classes = classRes.data;
    if(subjectRes.data) data.subjects = subjectRes.data;
    if(materialRes.data) data.materials = materialRes.data;
    data.schedule = defaultSchedule;
  } catch(err){
    console.error("Error fetching data:", err);
    toast("Error loading data. Please refresh.");
  }
}

function className(id){ var c = data.classes.find(function(x){return x.id===id;}); return c ? c.name : "Unknown Class"; }
function subjectName(id){ var s = data.subjects.find(function(x){return x.id===id;}); return s ? s.name : "Unknown Subject"; }
function materialCountForClass(classId){
  return data.materials.filter(function(m){return m.class_id===classId;}).reduce(function(n,m){
    return n + (m.material_files ? m.material_files.length : 0);
  }, 0);
}

function getPublicUrl(storagePath){
  var res = supabase.storage.from("study-materials").getPublicUrl(storagePath);
  return res.data.publicUrl;
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
    var files = m.material_files || [];
    files.forEach(function(f){
      allFiles.push({material: m, file: f, date: m.uploaded_at});
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
      "<span class=\"rc-badge\">" + esc(className(m.class_id)) + " &bull; " + esc(subjectName(m.subject_id)) + "</span>" +
      "<h4>" + esc(m.title) + "</h4>" +
      "<p class=\"rc-meta\">" + esc(f.name) + " &bull; " + dateLabel(item.date) + "</p>" +
      "<div class=\"rc-actions\">" +
        "<button class=\"small\" data-action=\"view\" data-path=\"" + esc(f.storage_path) + "\">View</button>" +
        "<button class=\"small dark\" data-action=\"download\" data-path=\"" + esc(f.storage_path) + "\" data-fname=\"" + esc(f.filename) + "\">Download</button>" +
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
    var subjects = data.subjects.filter(function(s){return s.class_id===c.id;}).length;
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
    var subjects = data.subjects.filter(function(s){return s.class_id===currentBrowse.classId;});
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
    return m.class_id===currentBrowse.classId && m.subject_id===currentBrowse.subjectId;
  });

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
    var files = m.material_files || [];
    html += "<div class=\"note-group\"><div class=\"note-group-head\"><h3>" + esc(m.title) + "</h3><p>Uploaded " + dateLabel(m.uploaded_at) + (m.description ? " &bull; " + esc(m.description) : "") + "</p></div>";
    files.forEach(function(f){
      html += "<div class=\"note-item\"><div class=\"note-main\"><div class=\"pdf\">PDF</div><div><strong>" + esc(f.name) + "</strong><div class=\"meta\">" + esc(f.size_label || "PDF document") + "</div></div></div>" +
        "<div class=\"note-actions\">" +
          "<button class=\"small\" data-action=\"view\" data-path=\"" + esc(f.storage_path) + "\">View</button>" +
          "<button class=\"small dark\" data-action=\"download\" data-path=\"" + esc(f.storage_path) + "\" data-fname=\"" + esc(f.filename) + "\">Download</button>" +
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
  currentBrowse = {classId: s ? s.class_id : null, subjectId: id};
  $("#classGrid").classList.add("hidden");
  renderBrowse();
}

/* ===== File Operations ===== */
function doViewFile(storagePath){
  var url = getPublicUrl(storagePath);
  window.open(url, "_blank", "noopener");
}

function doDownloadFile(storagePath, filename){
  var url = getPublicUrl(storagePath);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename || "study-material.pdf";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  a.remove();
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
      var clsName = className(m.class_id).toLowerCase();
      var subjName = subjectName(m.subject_id).toLowerCase();
      var titleLow = m.title.toLowerCase();
      var descLow = (m.description || "").toLowerCase();
      var files = m.material_files || [];
      files.forEach(function(f){
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
      html += "<div class=\"note-group\"><div class=\"note-group-head\"><h3>" + esc(m.title) + "</h3><p>" + esc(className(m.class_id)) + " &bull; " + esc(subjectName(m.subject_id)) + " &bull; " + dateLabel(m.uploaded_at) + "</p></div>" +
        "<div class=\"note-item\"><div class=\"note-main\"><div class=\"pdf\">PDF</div><div><strong>" + esc(f.name) + "</strong><div class=\"meta\">" + esc(f.size_label || "PDF document") + "</div></div></div>" +
        "<div class=\"note-actions\"><button class=\"small\" data-action=\"view\" data-path=\"" + esc(f.storage_path) + "\">View</button><button class=\"small dark\" data-action=\"download\" data-path=\"" + esc(f.storage_path) + "\" data-fname=\"" + esc(f.filename) + "\">Download</button><button class=\"small whatsapp\" data-action=\"whatsapp\" data-title=\"" + esc(m.title) + "\" data-fname=\"" + esc(f.name) + "\">WhatsApp</button></div></div></div>";
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
  var schedule = data.schedule || defaultSchedule;
  var html = "";
  schedule.forEach(function(row){
    html += "<div class=\"schedule-row\"><strong>" + esc(row.batch) + "</strong><span class=\"sch-days\">" + esc(row.days) + "</span><span class=\"sch-time\">" + esc(row.time) + "</span></div>";
  });
  el.innerHTML = html;
}

/* ===== Admin: Populate Selects ===== */
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
  var subs = data.subjects.filter(function(s){ return s.class_id === cid; });
  var html = "";
  subs.forEach(function(s){ html += "<option value=\""+s.id+"\">"+esc(s.name)+"</option>"; });
  subEl.innerHTML = html;
}

/* ===== Admin: Render Materials List ===== */
function renderAdminMaterials(){
  var el = $("#adminMaterials");
  if(!el) return;
  var mats = data.materials.slice();
  if(!mats.length){
    el.innerHTML = "<div class=\"empty\"><strong>No materials yet</strong>Upload your first PDF from the Upload Material tab.</div>";
    return;
  }
  var html = "";
  mats.forEach(function(m){
    var fileCount = m.material_files ? m.material_files.length : 0;
    html += "<div class=\"admin-row\"><div><strong>" + esc(m.title) + "</strong><small>" + esc(className(m.class_id)) + " &bull; " + esc(subjectName(m.subject_id)) + " &bull; " + dateLabel(m.uploaded_at) + " &bull; " + fileCount + " PDF" + (fileCount!==1?"s":"") + "</small></div>" +
      "<div class=\"row-actions\"><button class=\"small\" data-action=\"edit\" data-id=\"" + m.id + "\">Edit</button><button class=\"small danger\" data-action=\"deletemat\" data-id=\"" + m.id + "\">Delete</button></div></div>";
  });
  el.innerHTML = html;
}

/* ===== Admin: Render Structure ===== */
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
    html += "<div class=\"manage-item\"><span>" + esc(className(s.class_id)) + " &bull; " + esc(s.name) + "</span><button class=\"small danger\" data-action=\"deletesubject\" data-id=\"" + s.id + "\">Delete</button></div>";
  });
  subEl.innerHTML = html || "<p style=\"padding:12px;color:var(--muted)\">No subjects.</p>";
}

/* ===== Admin: Upload PDF to Supabase Storage ===== */
async function uploadPdfToStorage(file){
  var filePath = uid() + "_" + file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  var result = await supabase.storage.from("study-materials").upload(filePath, file, {
    cacheControl: "3600",
    upsert: false
  });
  if(result.error){ throw result.error; }
  return filePath;
}

/* ===== Delegated Event Listener ===== */
document.addEventListener("click", function(e){
  var btn = e.target.closest("[data-action]");
  if(!btn) return;
  var action = btn.getAttribute("data-action");

  if(action === "view") doViewFile(btn.getAttribute("data-path"));
  else if(action === "download") doDownloadFile(btn.getAttribute("data-path"), btn.getAttribute("data-fname"));
  else if(action === "whatsapp") doShareWhatsApp(btn.getAttribute("data-title"), btn.getAttribute("data-fname"));
  else if(action === "browseclass") doBrowseClass(btn.getAttribute("data-id"));
  else if(action === "browsesubject") doBrowseSubject(btn.getAttribute("data-id"));
  else if(action === "browseall") doBrowseAll();
  else if(action === "edit"){
    var m = data.materials.find(function(x){return x.id===btn.getAttribute("data-id");});
    if(!m) return;
    $("#editId").value = m.id;
    $("#editClass").value = m.class_id;
    updateSubjectSelect("#editClass","#editSubject");
    $("#editSubject").value = m.subject_id;
    $("#editTopic").value = m.title;
    var firstFile = m.material_files && m.material_files[0];
    $("#editName").value = firstFile ? firstFile.name : "";
    $("#editDescription").value = m.description || "";
    openModal("#editModal");
  }
  else if(action === "deletemat"){
    handleDeleteMaterial(btn.getAttribute("data-id"));
  }
  else if(action === "deleteclass"){
    handleDeleteClass(btn.getAttribute("data-id"));
  }
  else if(action === "deletesubject"){
    handleDeleteSubject(btn.getAttribute("data-id"));
  }
});

/* ===== Admin: Delete Handlers ===== */
async function handleDeleteMaterial(id){
  var m = data.materials.find(function(x){return x.id===id;});
  if(!m) return;
  if(!confirm("Delete \"" + m.title + "\"? This removes it from the student portal.")) return;
  try {
    // Delete files from storage
    var files = m.material_files || [];
    var paths = files.map(function(f){ return f.storage_path; });
    if(paths.length > 0){
      await supabase.storage.from("study-materials").remove(paths);
    }
    // Delete material (cascades to material_files)
    await supabase.from("materials").delete().eq("id", id);
    await fetchAllData();
    renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent();
    toast("Material deleted.");
  } catch(err){
    toast("Error deleting: " + err.message);
  }
}

async function handleDeleteClass(id){
  var c = data.classes.find(function(x){return x.id===id;});
  if(!c) return;
  if(!confirm("Delete \"" + c.name + "\"? All subjects and materials for this class will also be removed.")) return;
  try {
    // Delete storage files for materials in this class
    var mats = data.materials.filter(function(m){return m.class_id===id;});
    var paths = [];
    mats.forEach(function(m){ (m.material_files||[]).forEach(function(f){ paths.push(f.storage_path); }); });
    if(paths.length > 0) await supabase.storage.from("study-materials").remove(paths);
    // Delete class (cascades to subjects, materials, files)
    await supabase.from("classes").delete().eq("id", id);
    await fetchAllData();
    populateSelects(); renderStructure(); renderAdminMaterials(); renderClasses(); renderRecent();
    toast("Class deleted.");
  } catch(err){
    toast("Error deleting: " + err.message);
  }
}

async function handleDeleteSubject(id){
  var s = data.subjects.find(function(x){return x.id===id;});
  if(!s) return;
  if(!confirm("Delete \"" + s.name + "\"? All materials for this subject will also be removed.")) return;
  try {
    var mats = data.materials.filter(function(m){return m.subject_id===id;});
    var paths = [];
    mats.forEach(function(m){ (m.material_files||[]).forEach(function(f){ paths.push(f.storage_path); }); });
    if(paths.length > 0) await supabase.storage.from("study-materials").remove(paths);
    await supabase.from("subjects").delete().eq("id", id);
    await fetchAllData();
    populateSelects(); renderStructure(); renderAdminMaterials(); renderClasses(); renderRecent();
    toast("Subject deleted.");
  } catch(err){
    toast("Error deleting: " + err.message);
  }
}

/* ===== Init ===== */
document.addEventListener("DOMContentLoaded", async function(){
  initSupabase();
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

  // Login form — Supabase Auth
  var loginForm = $("#loginForm");
  if(loginForm){
    loginForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var email = $("#loginUser").value.trim();
      var pass = $("#loginPass").value;
      try {
        var result = await supabase.auth.signInWithPassword({email: email, password: pass});
        if(result.error) throw result.error;
        currentUser = result.data.user;
        closeModal("#loginModal");
        populateSelects();
        renderAdminMaterials();
        renderStructure();
        openModal("#adminModal");
        toast("Welcome, Admin!");
      } catch(err){
        toast("Login failed: " + (err.message || "Invalid credentials"));
      }
    });
  }

  // Close modals
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
    uploadForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var file = $("#uploadFile").files[0];
      if(!file){ toast("Please select a PDF."); return; }
      try {
        toast("Uploading...");
        // Upload file to storage
        var storagePath = await uploadPdfToStorage(file);
        // Insert material record
        var matResult = await supabase.from("materials").insert({
          class_id: $("#uploadClass").value,
          subject_id: $("#uploadSubject").value,
          title: $("#uploadTopic").value.trim(),
          description: $("#uploadDescription").value.trim()
        }).select().single();
        if(matResult.error) throw matResult.error;
        // Insert file record
        var fileResult = await supabase.from("material_files").insert({
          material_id: matResult.data.id,
          name: $("#uploadName").value.trim(),
          filename: file.name,
          storage_path: storagePath,
          size_label: Math.ceil(file.size/1024) + " KB"
        });
        if(fileResult.error) throw fileResult.error;
        uploadForm.reset();
        await fetchAllData();
        renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent();
        toast("Material uploaded successfully!");
      } catch(err){
        toast("Upload error: " + (err.message || "Something went wrong"));
      }
    });
  }

  // Edit form
  var editForm = $("#editForm");
  if(editForm){
    $("#editClass").addEventListener("change", function(){ updateSubjectSelect("#editClass","#editSubject"); });
    editForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var id = $("#editId").value;
      try {
        // Update material metadata
        await supabase.from("materials").update({
          class_id: $("#editClass").value,
          subject_id: $("#editSubject").value,
          title: $("#editTopic").value.trim(),
          description: $("#editDescription").value.trim()
        }).eq("id", id);

        // Update file name
        var m = data.materials.find(function(x){return x.id===id;});
        var firstFile = m && m.material_files && m.material_files[0];
        if(firstFile){
          await supabase.from("material_files").update({
            name: $("#editName").value.trim()
          }).eq("id", firstFile.id);
        }

        // If new PDF uploaded, replace in storage
        var newFile = $("#editFile").files[0];
        if(newFile && firstFile){
          // Delete old file from storage
          await supabase.storage.from("study-materials").remove([firstFile.storage_path]);
          // Upload new
          var newPath = await uploadPdfToStorage(newFile);
          await supabase.from("material_files").update({
            storage_path: newPath,
            filename: newFile.name,
            size_label: Math.ceil(newFile.size/1024) + " KB"
          }).eq("id", firstFile.id);
        }

        await fetchAllData();
        closeModal("#editModal");
        renderAdminMaterials(); renderClasses(); renderBrowse(); renderRecent();
        toast("Material updated.");
      } catch(err){
        toast("Error updating: " + (err.message || "Something went wrong"));
      }
    });
  }

  // Add class
  var addClassBtn = $("#addClass");
  if(addClassBtn) addClassBtn.addEventListener("click", function(){ openModal("#classModal"); });
  var classForm = $("#classForm");
  if(classForm){
    classForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var name = $("#className").value.trim();
      if(!name){ toast("Enter a class name."); return; }
      try {
        var maxOrder = data.classes.reduce(function(max, c){ return c.sort_order > max ? c.sort_order : max; }, 0);
        await supabase.from("classes").insert({name: name, sort_order: maxOrder + 1});
        await fetchAllData();
        closeModal("#classModal"); classForm.reset();
        populateSelects(); renderStructure(); renderClasses();
        toast("Class added.");
      } catch(err){
        toast("Error: " + err.message);
      }
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
    subjectForm.addEventListener("submit", async function(e){
      e.preventDefault();
      var classId = $("#subjectClass").value;
      var name = $("#subjectName").value.trim();
      if(!name){ toast("Enter a subject name."); return; }
      try {
        await supabase.from("subjects").insert({class_id: classId, name: name});
        await fetchAllData();
        closeModal("#subjectModal"); subjectForm.reset();
        populateSelects(); renderStructure(); renderClasses();
        toast("Subject added.");
      } catch(err){
        toast("Error: " + err.message);
      }
    });
  }

  // Logout
  var logoutBtn = $("#logout");
  if(logoutBtn) logoutBtn.addEventListener("click", async function(){
    await supabase.auth.signOut();
    currentUser = null;
    closeModal("#adminModal");
    toast("Logged out.");
  });

  // Fetch data and render
  await fetchAllData();
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
