const STORAGE_KEY = "gyaan_ashram_v1_data";
const FILE_KEY = "gyaan_ashram_v1_files";

const initialData = {
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
  ]
};

let data = loadData();
let fileStore = loadFiles();
let currentBrowse = {classId:null, subjectId:null};

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function loadData(){
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || structuredClone(initialData); }
  catch { return structuredClone(initialData); }
}
function saveData(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function loadFiles(){
  try { return JSON.parse(localStorage.getItem(FILE_KEY) || "{}"); } catch { return {}; }
}
function saveFiles(){ localStorage.setItem(FILE_KEY, JSON.stringify(fileStore)); }
function uid(prefix){ return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
function esc(v){ return String(v ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function dateLabel(v){ return new Date(v).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}); }
function className(id){ return data.classes.find(x=>x.id===id)?.name || "Unknown Class"; }
function subjectName(id){ return data.subjects.find(x=>x.id===id)?.name || "Unknown Subject"; }

function toast(msg){
  const t=$("#toast"); t.textContent=msg; t.classList.add("show");
  clearTimeout(window.__toast); window.__toast=setTimeout(()=>t.classList.remove("show"),2500);
}

function openModal(id){ $(id).classList.remove("hidden"); document.body.style.overflow="hidden"; }
function closeModal(id){ $(id).classList.add("hidden"); if($$(".modal:not(.hidden)").length===0) document.body.style.overflow=""; }

function renderBrowse(){
  const el=$("#browseView");
  const reset=$("#resetBrowse");
  const crumb=$("#breadcrumb");
  $("#materialCount").textContent = data.materials.reduce((n,m)=>n+m.files.length,0);

  if(!currentBrowse.classId){
    reset.classList.add("hidden"); crumb.classList.add("hidden");
    el.innerHTML = `<div class="class-grid">${data.classes.map((c,i)=>`
      <article class="class-card" onclick="browseClass('${c.id}')">
        <span class="number">CLASS ${String(i+1).padStart(2,"0")}</span>
        <h3>${esc(c.name)}</h3>
        <span class="muted">${data.subjects.filter(s=>s.classId===c.id).length} subjects</span>
        <div class="card-arrow">→</div>
      </article>`).join("")}</div>`;
    return;
  }

  const cls=className(currentBrowse.classId);
  if(!currentBrowse.subjectId){
    reset.classList.remove("hidden");
    crumb.classList.remove("hidden");
    crumb.innerHTML=`<button onclick="browseAll()">Study Material</button> <span>›</span> ${esc(cls)}`;
    const subjects=data.subjects.filter(s=>s.classId===currentBrowse.classId);
    el.innerHTML=subjects.length ? `<div class="subject-grid">${subjects.map(s=>`
      <article class="subject-card" onclick="browseSubject('${s.id}')"><h3>${esc(s.name)}</h3><span class="card-arrow">→</span></article>`).join("")}</div>` :
      `<div class="empty"><strong>No subjects yet</strong>Admin can add subjects from the dashboard.</div>`;
    return;
  }

  const subj=subjectName(currentBrowse.subjectId);
  reset.classList.remove("hidden"); crumb.classList.remove("hidden");
  crumb.innerHTML=`<button onclick="browseAll()">Study Material</button> <span>›</span> <button onclick="browseClass('${currentBrowse.classId}')">${esc(cls)}</button> <span>›</span> ${esc(subj)}`;

  const mats=data.materials.filter(m=>m.classId===currentBrowse.classId && m.subjectId===currentBrowse.subjectId)
    .sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
  if(!mats.length){ el.innerHTML=`<div class="empty"><strong>No material uploaded yet</strong>New notes will appear here as soon as the admin publishes them.</div>`; return; }

  el.innerHTML=mats.map(m=>`
    <div class="note-group">
      <div class="note-group-head">
        <h3>${esc(m.title)}</h3>
        <p>Uploaded ${dateLabel(m.uploadedAt)}${m.description ? " • "+esc(m.description) : ""}</p>
      </div>
      ${m.files.map(f=>`
        <div class="note-item">
          <div class="note-info"><div class="pdf-icon">PDF</div><div><strong>${esc(f.name)}</strong><div class="note-meta">${esc(f.sizeLabel || "PDF document")}</div></div></div>
          <div class="note-actions">
            <button class="small-btn" onclick="viewFile('${m.id}','${f.id}')">View</button>
            <button class="small-btn download" onclick="downloadFile('${m.id}','${f.id}')">Download</button>
          </div>
        </div>`).join("")}
    </div>`).join("");
}

window.browseAll=()=>{currentBrowse={classId:null,subjectId:null};renderBrowse();};
window.browseClass=id=>{currentBrowse={classId:id,subjectId:null};renderBrowse();};
window.browseSubject=id=>{const s=data.subjects.find(x=>x.id===id);currentBrowse={classId:s?.classId||null,subjectId:id};renderBrowse();};

function getFileContent(material,file){
  if(file.demoPath) return {url:file.demoPath, revoke:false};
  const b64=fileStore[file.id]; if(!b64) return null;
  const raw=atob(b64.split(",")[1]||"");
  const bytes=new Uint8Array(raw.length); for(let i=0;i<raw.length;i++) bytes[i]=raw.charCodeAt(i);
  const blob=new Blob([bytes],{type:"application/pdf"});
  return {url:URL.createObjectURL(blob),revoke:true};
}
window.viewFile=(mid,fid)=>{
  const m=data.materials.find(x=>x.id===mid), f=m?.files.find(x=>x.id===fid); if(!f)return;
  const got=getFileContent(m,f);
  if(!got){toast("This PDF is unavailable in this browser.");return;}
  window.open(got.url,"_blank","noopener");
  if(got.revoke)setTimeout(()=>URL.revokeObjectURL(got.url),60000);
};
window.downloadFile=(mid,fid)=>{
  const m=data.materials.find(x=>x.id===mid), f=m?.files.find(x=>x.id===fid); if(!f)return;
  const got=getFileContent(m,f); if(!got){toast("This PDF is unavailable in this browser.");return;}
  const a=document.createElement("a"); a.href=got.url; a.download=f.filename||"study-material.pdf"; document.body.appendChild(a); a.click(); a.remove();
  if(got.revoke)setTimeout(()=>URL.revokeObjectURL(got.url),1000);
};

function populateSelects(){
  const classOptions=data.classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("");
  ["#uploadClass","#editClass"].forEach(sel=>$(sel).innerHTML=classOptions);
  updateSubjectSelect("#uploadClass","#uploadSubject");
  updateSubjectSelect("#editClass","#editSubject");
}
function updateSubjectSelect(classSel,subjectSel){
  const cid=$(classSel).value;
  const subs=data.subjects.filter(s=>s.classId===cid);
  $(subjectSel).innerHTML=subs.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");
}
function renderAdminLists(){
  $("#classList").innerHTML=data.classes.map(c=>`<div class="manage-item"><span>${esc(c.name)}</span><button class="small-btn danger" onclick="deleteClass('${c.id}')">Delete</button></div>`).join("");
  $("#subjectList").innerHTML=data.subjects.map(s=>`<div class="manage-item"><span>${esc(className(s.classId))} · ${esc(s.name)}</span><button class="small-btn danger" onclick="deleteSubject('${s.id}')">Delete</button></div>`).join("");
  const mats=[...data.materials].sort((a,b)=>new Date(b.uploadedAt)-new Date(a.uploadedAt));
  $("#adminMaterialsList").innerHTML=mats.length ? mats.map(m=>`
    <div class="admin-material-row">
      <div><strong>${esc(m.title)}</strong><small>${esc(className(m.classId))} · ${esc(subjectName(m.subjectId))} · ${dateLabel(m.uploadedAt)} · ${m.files.length} PDF${m.files.length!==1?"s":""}</small></div>
      <div class="row-actions"><button class="small-btn" onclick="editMaterial('${m.id}')">Edit</button><button class="small-btn danger" onclick="deleteMaterial('${m.id}')">Delete</button></div>
    </div>`).join("") : `<div class="empty"><strong>No materials yet</strong>Upload your first PDF from the Upload Material tab.</div>`;
}
window.deleteMaterial=id=>{
  const m=data.materials.find(x=>x.id===id); if(!m)return;
  if(!confirm(`Delete "${m.title}"? This removes it from the student portal.`))return;
  m.files.forEach(f=>{if(!f.demoPath)delete fileStore[f.id]});
  data.materials=data.materials.filter(x=>x.id!==id); saveData();saveFiles();renderAdminLists();renderBrowse();toast("Material deleted.");
};
window.editMaterial=id=>{
  const m=data.materials.find(x=>x.id===id);if(!m)return;
  $("#editId").value=id;$("#editClass").value=m.classId;updateSubjectSelect("#editClass","#editSubject");$("#editSubject").value=m.subjectId;
  $("#editTitle").value=m.title;$("#editFileTitle").value=m.files[0]?.name||"PDF";$("#editDescription").value=m.description||"";
  openModal("#editModal");
};
window.deleteClass=id=>{
  const c=data.classes.find(x=>x.id===id);if(!c)return;
  if(data.materials.some(m=>m.classId===id)){toast("Delete the class materials first.");return;}
  if(!confirm(`Delete ${c.name}?`))return;
  data.classes=data.classes.filter(x=>x.id!==id);data.subjects=data.subjects.filter(s=>s.classId!==id);saveData();populateSelects();renderAdminLists();renderBrowse();toast("Class deleted.");
};
window.deleteSubject=id=>{
  const s=data.subjects.find(x=>x.id===id);if(!s)return;
  if(data.materials.some(m=>m.subjectId===id)){toast("Delete the subject's materials first.");return;}
  if(!confirm(`Delete ${s.name}?`))return;
  data.subjects=data.subjects.filter(x=>x.id!==id);saveData();populateSelects();renderAdminLists();renderBrowse();toast("Subject deleted.");
};

function openAdmin(){populateSelects();renderAdminLists();openModal("#adminModal");}
function closeAll(){["#loginModal","#adminModal","#editModal"].forEach(id=>{if(!$(id).classList.contains("hidden"))closeModal(id)})}

$("#adminNavBtn").onclick=openLogin;
$("#footerAdminBtn").onclick=openLogin;
function openLogin(){openModal("#loginModal");$("#loginUser").focus();}
$("#loginForm").onsubmit=e=>{
  e.preventDefault();
  if($("#loginUser").value.trim()==="admin" && $("#loginPass").value==="admin123"){
    closeModal("#loginModal");openAdmin();toast("Welcome to the admin dashboard.");
  }else toast("Invalid demo credentials.");
};
$("#logoutBtn").onclick=()=>{closeModal("#adminModal");toast("Logged out.");};
$$("[data-close]").forEach(x=>x.onclick=()=>closeModal(x.dataset.close==="login"?"#loginModal":x.dataset.close==="admin"?"#adminModal":"#editModal"));
$("#resetBrowse").onclick=window.browseAll;
$("#uploadClass").onchange=()=>updateSubjectSelect("#uploadClass","#uploadSubject");
$("#editClass").onchange=()=>updateSubjectSelect("#editClass","#editSubject");

$("#uploadForm").onsubmit=async e=>{
  e.preventDefault();
  const file=$("#uploadFile").files[0]; if(!file||file.type!=="application/pdf"){toast("Please select a PDF file.");return;}
  if(file.size>3.5*1024*1024){toast("Demo mode limit: keep PDFs below 3.5 MB. Production will use Supabase Storage.");return;}
  const reader=new FileReader();
  reader.onload=()=>{
    const fid=uid("file");
    fileStore[fid]=reader.result;saveFiles();
    const mid=uid("mat");
    data.materials.push({
      id:mid,classId:$("#uploadClass").value,subjectId:$("#uploadSubject").value,
      title:$("#uploadTitle").value.trim(),description:$("#uploadDescription").value.trim(),
      uploadedAt:new Date().toISOString(),
      files:[{id:fid,name:$("#uploadFileTitle").value.trim(),filename:file.name,sizeLabel:(file.size/1024/1024).toFixed(2)+" MB"}]
    });
    saveData();e.target.reset();populateSelects();renderAdminLists();renderBrowse();toast("Material uploaded and published.");
    switchTab("materialsAdmin");
  };
  reader.readAsDataURL(file);
};

$("#editForm").onsubmit=async e=>{
  e.preventDefault();const m=data.materials.find(x=>x.id===$("#editId").value);if(!m)return;
  m.classId=$("#editClass").value;m.subjectId=$("#editSubject").value;m.title=$("#editTitle").value.trim();m.description=$("#editDescription").value.trim();
  const file=$("#editFile").files[0];
  if(file){
    if(file.type!=="application/pdf"){toast("Replacement file must be a PDF.");return;}
    if(file.size>3.5*1024*1024){toast("Demo mode limit: keep PDFs below 3.5 MB.");return;}
    const reader=new FileReader();reader.onload=()=>{
      const old=m.files[0];if(old&&!old.demoPath)delete fileStore[old.id];
      const fid=uid("file");fileStore[fid]=reader.result;
      m.files=[{id:fid,name:$("#editFileTitle").value.trim(),filename:file.name,sizeLabel:(file.size/1024/1024).toFixed(2)+" MB"}];
      saveFiles();saveData();closeModal("#editModal");renderAdminLists();renderBrowse();toast("Material updated.");
    };reader.readAsDataURL(file);
  }else{
    if(m.files[0])m.files[0].name=$("#editFileTitle").value.trim();
    saveData();closeModal("#editModal");renderAdminLists();renderBrowse();toast("Material updated.");
  }
};

$("#addClassBtn").onclick=()=>{
  const name=prompt("Enter class name, e.g. Class 11");if(!name?.trim())return;
  if(data.classes.some(c=>c.name.toLowerCase()===name.trim().toLowerCase())){toast("That class already exists.");return;}
  data.classes.push({id:uid("class"),name:name.trim()});saveData();populateSelects();renderAdminLists();renderBrowse();toast("Class added.");
};
$("#addSubjectBtn").onclick=()=>{
  const cls=data.classes.find(c=>c.id===prompt("Enter the class ID from the admin list (e.g. c9). This will be improved in the Supabase version."));
  if(!cls){toast("For this demo, use the class ID shown in the browser data only. Production will use a proper selector.");return;}
  const name=prompt(`Subject name for ${cls.name}`);if(!name?.trim())return;
  data.subjects.push({id:uid("sub"),classId:cls.id,name:name.trim()});saveData();populateSelects();renderAdminLists();renderBrowse();toast("Subject added.");
};

function switchTab(name){
  $$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.tab===name));
  $$(".admin-tab-content").forEach(c=>c.classList.add("hidden"));
  $("#tab-"+name).classList.remove("hidden");
}
$$(".tab").forEach(t=>t.onclick=()=>switchTab(t.dataset.tab));

$("#menuBtn").onclick=()=>$(".top-nav").classList.toggle("open");
$$(".top-nav a").forEach(a=>a.onclick=()=>$(".top-nav").classList.remove("open"));

$("#year").textContent=new Date().getFullYear();
renderBrowse();
