const $=s=>document.querySelector(s);
const KEY="gladiator_v4_state";
const defaults={name:"Gladiator",theme:"dark",chats:[],xp:0,messagesSent:0};
let state=JSON.parse(localStorage.getItem(KEY)||"null")||defaults;
let currentId=null;
let aborter=null;

function save(){localStorage.setItem(KEY,JSON.stringify(state));updateTop();renderHistory()}
function toast(t){const x=$("#toast");if(!x)return;x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1800)}
function rank(){return state.xp>=1000?"V":state.xp>=600?"IV":state.xp>=350?"III":state.xp>=150?"II":"I"}
function updateTop(){$("#rankTop").textContent=rank();$("#xpTop").textContent=state.xp+" XP"}
function closeMenu(){$("#sidebar").classList.remove("open");$("#shade").classList.remove("show")}
function renderHistory(){
 const h=$("#history");h.innerHTML="";
 [...state.chats].reverse().forEach(c=>{
  const row=document.createElement("div"),b=document.createElement("button"),d=document.createElement("button");
  b.textContent="⚔ "+c.title;b.className=c.id===currentId?"active":"";
  b.onclick=()=>openChat(c.id);d.className="del";d.textContent="×";d.title="Hapus";
  d.onclick=e=>{e.stopPropagation();deleteChat(c.id)};row.append(b,d);h.appendChild(row);
 });
}
function deleteChat(id){state.chats=state.chats.filter(c=>c.id!==id);if(currentId===id){currentId=null;renderArena()}save();toast("Pertarungan dihapus")}
function getCurrent(){return state.chats.find(c=>c.id===currentId)}
function newChat(){currentId=Date.now();state.chats.push({id:currentId,title:"Pertarungan Baru",messages:[]});save();renderArena();closeMenu()}
function openChat(id){currentId=id;renderArena();closeMenu()}
function addMessage(text,role,saveIt=true){
 const box=$("#messages"),row=document.createElement("div");row.className="message "+(role==="user"?"user":"assistant");
 row.innerHTML=`<div class="avatar">${role==="user"?"🛡️":"⚔️"}</div><div class="bubble"></div>`;
 row.querySelector(".bubble").textContent=text;box.append(row);
 if(saveIt){const c=getCurrent();c.messages.push({role,text});if(role==="user"){state.xp+=10;state.messagesSent++;if(c.title==="Pertarungan Baru")c.title=text.slice(0,28)+(text.length>28?"…":"")}save()}
 $("#content").scrollTop=$("#content").scrollHeight;
 return row.querySelector(".bubble");
}
function addStreamingMessage(){
 const box=$("#messages"),row=document.createElement("div");row.className="message assistant";
 row.innerHTML=`<div class="avatar">⚔️</div><div class="bubble"></div>`;
 box.append(row);$("#content").scrollTop=$("#content").scrollHeight;return row.querySelector(".bubble");
}
function renderArena(){
 $("#pageTitle").textContent="COLOSSEUM";$("#status").textContent="ARENA AKTIF";$("#composerWrap").style.display="block";
 const c=getCurrent();
 $("#content").innerHTML=`<div class="hero" id="hero"><div class="crest">⚔</div><div class="eyebrow">FORTITUDO · HONOR · GLORIA</div><h1>Salve, ${escapeHTML(state.name)}.</h1><p>Masukkan tantanganmu. Arena siap menguji pikiranmu.</p><div class="suggestions"><button data-p="Jelaskan sesuatu dengan sederhana">📜 Jelaskan sesuatu</button><button data-p="Bantu saya membuat rencana">🏛️ Susun strategi</button><button data-p="Beri saya ide kreatif">🔥 Tempa ide</button></div></div><div id="messages"></div>`;
 if(c){$("#hero").style.display=c.messages.length?"none":"block";c.messages.forEach(m=>addMessage(m.text,m.role,false))}
 document.querySelectorAll("[data-p]").forEach(b=>b.onclick=()=>{$("#input").value=b.dataset.p;$("#input").focus()});
}
function escapeHTML(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}

async function sendToAI(text){
 if(!currentId)newChat();
 const c=getCurrent();
 const history=c.messages.map(m=>({role:m.role,content:m.text}));
 addMessage(text,"user");
 const bubble=addStreamingMessage();
 const send=$("#composer").querySelector(".send"); send.disabled=true; send.textContent="■";
 aborter=new AbortController();
 try{
   const res=await fetch("/api/chat",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({messages:history,sessionId:String(c.id)}),
     signal:aborter.signal
   });
   if(!res.ok){let msg="Server error ("+res.status+")";try{const j=await res.json();msg=j.error||msg}catch{}throw new Error(msg)}
   const reader=res.body.getReader(),decoder=new TextDecoder();
   let buffer="",answer="";
   while(true){
     const {value,done}=await reader.read(); if(done)break;
     buffer+=decoder.decode(value,{stream:true});
     const parts=buffer.split("\n"); buffer=parts.pop()||"";
     for(const line of parts){
       if(!line.startsWith("data:"))continue;
       const data=line.slice(5).trim();if(!data)continue;
       if(data==="[DONE]")continue;
       try{const obj=JSON.parse(data);if(obj.error)throw new Error(obj.error);if(obj.text){answer+=obj.text;bubble.textContent=answer;$("#content").scrollTop=$("#content").scrollHeight}}catch(err){if(err.message)throw err}
     }
   }
   if(!answer)answer="Arena tidak menerima jawaban.";
   c.messages.push({role:"assistant",text:answer});
   save();
 }catch(err){
   if(err.name==="AbortError")bubble.textContent="Pertarungan dihentikan.";
   else {bubble.textContent="⚠️ "+err.message;toast("Gagal menghubungi AI")}
 }finally{
   send.disabled=false;send.textContent="⚔";aborter=null;
 }
}

$("#composer").onsubmit=e=>{
 e.preventDefault();const t=$("#input").value.trim();if(!t)return;
 $("#input").value="";$("#input").style.height="auto";sendToAI(t);
};
$("#input").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#composer").requestSubmit()}});
$("#input").addEventListener("input",()=>{$("#input").style.height="auto";$("#input").style.height=Math.min($("#input").scrollHeight,150)+"px"});
function page(name){
 closeMenu();$("#composerWrap").style.display="none";let title="",body="";
 if(name==="glory"){title="PAPAN KEMULIAAN";body=`<div class="page"><h1>🏆 Papan Kemuliaan</h1><div class="grid"><div class="card"><h3>Rank</h3><div class="stat">${rank()}</div><p>XP: ${state.xp}</p></div><div class="card"><h3>Pertarungan</h3><div class="stat">${state.chats.length}</div><p>Total percakapan.</p></div><div class="card"><h3>Pesan</h3><div class="stat">${state.messagesSent}</div><p>Pesan ditempa.</p></div></div></div>`}
 if(name==="profile"){title="PROFIL GLADIATOR";body=`<div class="page profile"><div class="card"><div class="crest-big">🛡️</div><h1>${escapeHTML(state.name)}</h1><p>Gladiator Rank ${rank()}</p><div class="grid"><div class="card"><h3>XP</h3><div class="stat">${state.xp}</div></div><div class="card"><h3>Pesan</h3><div class="stat">${state.messagesSent}</div></div></div><br><button id="rename" class="card">✎ Ganti Nama</button></div></div>`}
 if(name==="settings"){title="PENGATURAN";body=`<div class="page"><h1>⚙️ Pengaturan Arena</h1><div class="card"><div class="setting"><span>Nama Gladiator</span><input id="nameSet" value="${escapeHTML(state.name)}"></div><div class="setting"><span>Tema Arena</span><select id="themeSet"><option value="dark">Arena Dark</option><option value="light">Arena Light</option></select></div><div class="setting"><span>Data lokal</span><button id="clearData">Hapus semua data</button></div></div></div>`}
 $("#pageTitle").textContent=title;$("#status").textContent="PANEL ARENA";$("#content").innerHTML=body;
 if(name==="settings"){const ts=$("#themeSet");ts.value=state.theme;$("#nameSet").onchange=e=>{state.name=e.target.value||"Gladiator";save();toast("Nama diperbarui")};ts.onchange=e=>{state.theme=e.target.value;applyTheme();save();toast("Tema diperbarui")};$("#clearData").onclick=()=>{if(confirm("Hapus semua chat, XP, dan profil?")){state={...defaults};currentId=null;save();applyTheme();page("settings");toast("Data arena dihapus")}}}
 if(name==="profile")$("#rename").onclick=()=>page("settings");
}
function applyTheme(){document.body.classList.toggle("light",state.theme==="light")}
$("#newChat").onclick=newChat;$("#openMenu").onclick=()=>{$("#sidebar").classList.add("open");$("#shade").classList.add("show")};$("#shade").onclick=closeMenu;
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>page(b.dataset.page));
applyTheme();updateTop();renderHistory();renderArena();
