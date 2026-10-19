/* ===== Round 27: platform-level user preferences, simple menu, language. =====
   One preference record (PREF, saved per user on this device) drives every app in the ecosystem:
   theme, text size, density, motion, contrast, guidance, menu style and language. ===== */
(function(){
"use strict";
const W=window,D=document;
const G=(f,d)=>{try{const v=f();return v==null?d:v}catch(e){return d}};
const H=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
if(typeof PREF==="undefined")return;
if(!PREF.nav)PREF.nav="simple";if(!PREF.lang)PREF.lang="en";
/* ---------- language ---------- */
const LANGS=[["en","English","ltr"],["es","Español","ltr"],["fr","Français","ltr"],["de","Deutsch","ltr"],["ar","العربية","rtl"]];
const ROWS=[
["Home","Inicio","Accueil","Startseite","الرئيسية"],
["Work","Trabajo","Travail","Arbeit","العمل"],
["Make","Crear","Créer","Erstellen","الإنشاء"],
["Oversee","Supervisar","Superviser","Überwachen","الإشراف"],
["Platform","Plataforma","Plateforme","Plattform","المنصة"],
["Enterprise IT","TI empresarial","SI d'entreprise","Unternehmens-IT","تقنية المعلومات"],
["Collapse","Contraer","Réduire","Einklappen","طيّ"],
["Dashboards","Paneles","Tableaux de bord","Dashboards","لوحات المعلومات"],
["Approve invoices","Aprobar facturas","Approuver les factures","Rechnungen freigeben","اعتماد الفواتير"],
["AI agents","Agentes de IA","Agents IA","KI-Agenten","وكلاء الذكاء الاصطناعي"],
["Favorites","Favoritos","Favoris","Favoriten","المفضلة"],
["My approvals","Mis aprobaciones","Mes approbations","Meine Freigaben","موافقاتي"],
["Budgets","Presupuestos","Budgets","Budgets","الميزانيات"],
["My work","Mi trabajo","Mon travail","Meine Aufgaben","عملي"],
["Money and contracts","Dinero y contratos","Argent et contrats","Geld und Verträge","المال والعقود"],
["Budget requests","Solicitudes de presupuesto","Demandes de budget","Budgetanfragen","طلبات الميزانية"],
["Strategy and value","Estrategia y valor","Stratégie et valeur","Strategie und Wert","الاستراتيجية والقيمة"],
["People and teams","Personas y equipos","Personnes et équipes","Menschen und Teams","الأفراد والفرق"],
["Service and support","Servicio y soporte","Service et assistance","Service und Support","الخدمة والدعم"],
["Knowledge and learning","Conocimiento y aprendizaje","Connaissances et formation","Wissen und Lernen","المعرفة والتعلم"],
["Projects and delivery","Proyectos y entrega","Projets et livraison","Projekte und Lieferung","المشاريع والتسليم"],
["Risk and control","Riesgo y control","Risque et contrôle","Risiko und Kontrolle","المخاطر والرقابة"],
["More areas","Más áreas","Plus de domaines","Weitere Bereiche","مجالات أخرى"],
["Show every area","Mostrar todas las áreas","Afficher tous les domaines","Alle Bereiche anzeigen","عرض كل المجالات"],
["Show only my role's areas","Mostrar solo las áreas de mi rol","Afficher seulement les domaines de mon rôle","Nur Bereiche meiner Rolle anzeigen","عرض مجالات دوري فقط"],
["How to read this menu","Cómo leer este menú","Comment lire ce menu","So lesen Sie dieses Menü","كيفية قراءة هذه القائمة"],
["VibeCheck","VibeCheck","VibeCheck","VibeCheck","VibeCheck"],
["Data volume","Volumen de datos","Volume de données","Datenmenge","حجم البيانات"],
["Demo","Demo","Démo","Demo","تجريبي"],
["Enterprise","Empresa","Entreprise","Unternehmen","المؤسسة"],
["Skip to main content","Saltar al contenido principal","Aller au contenu principal","Zum Hauptinhalt springen","انتقل إلى المحتوى الرئيسي"],
["Search screens, records, people, or ask Oukala","Busca pantallas, registros, personas o pregunta a Oukala","Rechercher écrans, dossiers, personnes, ou demander à Oukala","Bildschirme, Datensätze, Personen suchen oder Oukala fragen","ابحث عن الشاشات والسجلات والأشخاص أو اسأل أوكالا"],
["Ask","Preguntar","Demander","Fragen","اسأل"],
["Lens","Lente","Perspective","Blickwinkel","المنظور"],
["Executive lens","Lente ejecutiva","Perspective de dirigeant","Blick der Führungskraft","منظور تنفيذي"],
["agents working","agentes trabajando","agents au travail","Agenten arbeiten","وكلاء يعملون"],
["13 agents working","13 agentes trabajando","13 agents au travail","13 Agenten arbeiten","13 وكيلًا يعملون"],
["Back to my view","Volver a mi vista","Revenir à ma vue","Zurück zu meiner Ansicht","العودة إلى عرضي"],
["What you care about","Lo que te importa","Ce qui vous importe","Was Ihnen wichtig ist","ما يهمّك"],
["The details behind your numbers.","Los detalles detrás de tus cifras.","Les détails derrière vos chiffres.","Die Details hinter Ihren Zahlen.","التفاصيل وراء أرقامك."],
["Choose what matters to you","Elige lo que te importa","Choisissez ce qui compte pour vous","Wählen Sie, was Ihnen wichtig ist","اختر ما يهمّك"],
["What should I look at first?","¿Qué debería mirar primero?","Que dois-je regarder en premier ?","Worauf sollte ich zuerst schauen?","ما الذي أنظر إليه أولًا؟"],
["Approve","Aprobar","Approuver","Freigeben","اعتماد"],
["Review","Revisar","Examiner","Prüfen","مراجعة"],
["Done","Listo","Terminé","Fertig","تم"],
["Cancel","Cancelar","Annuler","Abbrechen","إلغاء"],
["Save","Guardar","Enregistrer","Speichern","حفظ"],
["Close","Cerrar","Fermer","Schließen","إغلاق"],
["Back","Atrás","Retour","Zurück","رجوع"],
["Next","Siguiente","Suivant","Weiter","التالي"],
["Open","Abrir","Ouvrir","Öffnen","فتح"],
["Search","Buscar","Rechercher","Suchen","بحث"],
["Notifications","Notificaciones","Notifications","Benachrichtigungen","الإشعارات"],
["Profile and preferences","Perfil y preferencias","Profil et préférences","Profil und Einstellungen","الملف الشخصي والتفضيلات"],
["View as","Ver como","Voir en tant que","Ansehen als","العرض بصفة"],
["Theme","Tema","Thème","Design","المظهر"],
["Match device","Igual que el dispositivo","Comme l'appareil","Wie das Gerät","مطابق للجهاز"],
["Light","Claro","Clair","Hell","فاتح"],
["Dark","Oscuro","Sombre","Dunkel","داكن"],
["Text size","Tamaño del texto","Taille du texte","Textgröße","حجم النص"],
["Small","Pequeño","Petit","Klein","صغير"],
["Medium","Mediano","Moyen","Mittel","متوسط"],
["Large","Grande","Grand","Groß","كبير"],
["Density","Densidad","Densité","Dichte","الكثافة"],
["Comfortable","Cómoda","Confortable","Komfortabel","مريحة"],
["Compact","Compacta","Compacte","Kompakt","مدمجة"],
["Guidance","Orientación","Accompagnement","Anleitung","الإرشاد"],
["Guided","Guiado","Guidé","Geführt","موجّه"],
["Standard","Estándar","Standard","Standard","قياسي"],
["Expert","Experto","Expert","Experte","خبير"],
["Motion","Movimiento","Animation","Bewegung","الحركة"],
["Reduce motion","Reducir movimiento","Réduire les animations","Bewegung reduzieren","تقليل الحركة"],
["Contrast","Contraste","Contraste","Kontrast","التباين"],
["Normal","Normal","Normal","Normal","عادي"],
["High","Alto","Élevé","Hoch","عالٍ"],
["Language","Idioma","Langue","Sprache","اللغة"],
["Menu","Menú","Menu","Menü","القائمة"],
["Simple","Simple","Simple","Einfach","مبسّط"],
["Full","Completo","Complet","Vollständig","كامل"],
["For your role","Para tu rol","Pour votre rôle","Für Ihre Rolle","لدورك"],
["Recent","Recientes","Récents","Zuletzt","الأخيرة"],
["All apps and areas","Todas las apps y áreas","Toutes les apps et domaines","Alle Apps und Bereiche","كل التطبيقات والمجالات"],
["Spend","Gasto","Dépenses","Ausgaben","الإنفاق"],
["Vendors","Proveedores","Fournisseurs","Lieferanten","الموردون"],
["Decisions","Decisiones","Décisions","Entscheidungen","القرارات"],
["Meetings","Reuniones","Réunions","Besprechungen","الاجتماعات"],
["Approvals inbox","Bandeja de aprobaciones","Boîte d'approbations","Freigabe-Eingang","صندوق الموافقات"],
["Value and cost","Valor y costo","Valeur et coût","Wert und Kosten","القيمة والتكلفة"],
["Metrics","Métricas","Indicateurs","Kennzahlen","المقاييس"],
["Projects","Proyectos","Projets","Projekte","المشاريع"],
["Incidents","Incidentes","Incidents","Störungen","الحوادث"],
["Changes","Cambios","Changements","Änderungen","التغييرات"],
["Problems and known errors","Problemas y errores conocidos","Problèmes et erreurs connues","Probleme und bekannte Fehler","المشكلات والأخطاء المعروفة"],
["Training and courses","Formación y cursos","Formations et cours","Schulungen und Kurse","التدريب والدورات"],
["Org chart","Organigrama","Organigramme","Organigramm","الهيكل التنظيمي"],
["Permissions","Permisos","Autorisations","Berechtigungen","الصلاحيات"],
["Data","Datos","Données","Daten","البيانات"],
["Process","Proceso","Processus","Prozess","العملية"],
["Processes","Procesos","Processus","Prozesse","العمليات"],
["Your builds","Tus creaciones","Vos créations","Ihre Builds","إنشاءاتك"],
["My builds","Mis creaciones","Mes créations","Meine Builds","إنشاءاتي"],
["Guided stories, live moments, rehearsal and demo data reset","Historias guiadas, momentos en vivo, ensayo y reinicio de datos de demostración","Récits guidés, moments en direct, répétition et réinitialisation des données de démo","Geführte Geschichten, Live-Momente, Probe und Zurücksetzen der Demodaten","قصص موجّهة ولحظات مباشرة وتدريب وإعادة ضبط بيانات العرض"],
["Choose your language","Elige tu idioma","Choisissez votre langue","Sprache wählen","اختر لغتك"],
["Menus, the home page and common buttons are translated. Other screens stay in English until they are translated.","Los menús, la página de inicio y los botones comunes están traducidos. Las demás pantallas siguen en inglés hasta que se traduzcan.","Les menus, l'accueil et les boutons courants sont traduits. Les autres écrans restent en anglais jusqu'à leur traduction.","Menüs, Startseite und gängige Schaltflächen sind übersetzt. Andere Bildschirme bleiben englisch, bis sie übersetzt sind.","القوائم والصفحة الرئيسية والأزرار الشائعة مترجمة. تبقى الشاشات الأخرى بالإنجليزية إلى حين ترجمتها."],
["Simple shows what you need for your role and what you opened lately. Full shows every area.","Simple muestra lo necesario para tu rol y lo que abriste hace poco. Completo muestra todas las áreas.","Simple affiche ce qu'il faut pour votre rôle et ce que vous avez ouvert récemment. Complet affiche tous les domaines.","Einfach zeigt, was Ihre Rolle braucht und was Sie zuletzt geöffnet haben. Vollständig zeigt alle Bereiche.","المبسّط يعرض ما يلزم لدورك وما فتحته مؤخرًا. الكامل يعرض كل المجالات."],
["Reset my preferences","Restablecer mis preferencias","Réinitialiser mes préférences","Meine Einstellungen zurücksetzen","إعادة ضبط تفضيلاتي"]
];
const WELCOME=[["Welcome, ","Te damos la bienvenida, ","Bienvenue, ","Willkommen, ","مرحبًا، "]];
const DICT={};LANGS.forEach((l,i)=>{if(!i)return;DICT[l[0]]=new Map(ROWS.map(r=>[r[0],r[i]]))});
const orig=new WeakMap();let cur="en";let obs=null,busy=false,queued=new Set(),raf=0;
const tr=(s,lang)=>{const m=DICT[lang];if(!m)return null;const t=s.trim();if(!t)return null;let v=m.get(t);if(v==null){const w=/^Welcome, (.+)\.$/.exec(t);if(w){const i=LANGS.findIndex(l=>l[0]===lang);return s.replace(t,WELCOME[0][i]+w[1]+(lang==="ar"?"."  :"."))}const c=/^(\d+) (agents working)$/.exec(t);if(c){const x=m.get(c[2]);if(x)v=c[1]+" "+x}}
 return v==null?null:s.replace(t,v)};
const SKIP=/^(SCRIPT|STYLE|TEXTAREA|CODE|PRE|INPUT)$/;
function walk(root,lang){if(!root)return;const w=D.createTreeWalker(root.nodeType===3?root.parentNode:root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;return(!p||SKIP.test(p.tagName)||p.closest("[data-no-i18n]"))?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}});
 let n;while(n=w.nextNode()){const rec=orig.get(n);
  if(lang==="en"){if(rec&&n.nodeValue===rec.t)n.nodeValue=rec.o;orig.delete(n);continue}
  const base=rec&&n.nodeValue===rec.t?rec.o:n.nodeValue;
  const t=tr(base,lang);if(t!=null&&t!==n.nodeValue){orig.set(n,{o:base,t});n.nodeValue=t}else if(t==null&&rec){orig.delete(n)}}
 if(root.querySelectorAll){root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el=>{["placeholder","aria-label","title"].forEach(a=>{const v=el.getAttribute(a);if(!v)return;const k="data-i18n-"+a;if(lang==="en"){if(el.hasAttribute(k)){el.setAttribute(a,el.getAttribute(k));el.removeAttribute(k)}return}const b=el.hasAttribute(k)?el.getAttribute(k):v;const t=tr(b,lang);if(t!=null&&t!==v){if(!el.hasAttribute(k))el.setAttribute(k,b);el.setAttribute(a,t)}})})}}
function flush(){raf=0;busy=true;try{queued.forEach(n=>{if(n.isConnected)walk(n,cur)})}finally{queued.clear();if(obs)obs.takeRecords();busy=false}}
function enqueue(n){queued.add(n);if(!raf)raf=requestAnimationFrame(flush)}
function setLang(l){if(!LANGS.some(x=>x[0]===l))l="en";const prev=cur;cur=l;PREF.lang=l;const L=LANGS.find(x=>x[0]===l);const r=D.documentElement;r.lang=l;r.dir=L[2];
 /* undo then apply so a switch between two languages never double translates */
 if(prev!=="en"&&l!=="en"){busy=true;walk(D.body,"en");busy=false}
 busy=true;walk(D.body,l);if(obs)obs.takeRecords();busy=false;
 if(l!=="en"&&!obs){obs=new MutationObserver(ms=>{if(busy)return;ms.forEach(m=>{if(m.type==="childList")m.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)enqueue(n)});else if(m.type==="characterData"&&m.target.parentElement)enqueue(m.target.parentElement)})});obs.observe(D.body,{childList:true,subtree:true,characterData:true})}
 if(l==="en"&&obs){obs.disconnect();obs=null}
 try{savePrefs()}catch(e){}}
/* what is still English: a to-do list for translators */
function missing(){const o={};const w=D.createTreeWalker(D.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const s=n.nodeValue.trim();if(s.length>2&&!orig.has(n)&&/[A-Za-z]{3}/.test(s)&&n.parentElement&&!SKIP.test(n.parentElement.tagName)){o[s]=(o[s]||0)+1}}return o}
W.I18N={LANGS,ROWS,set:setLang,get:()=>cur,missing,translate:tr};
/* ---------- simple menu ---------- */
const REC=[];
function track(){const s=G(()=>S.screen,"");if(s&&s!=="home"&&REC[0]!==s){const i=REC.indexOf(s);if(i>=0)REC.splice(i,1);REC.unshift(s);REC.length=Math.min(REC.length,6)}}
function simplify(raw){const root=D.createElement("div");root.innerHTML=raw;
 if(!root.querySelector("details.navgd"))return raw;/* collapsed icon rail stays as is */
 const home=root.querySelector('[data-nx-it="home"]');const pins=root.querySelector("section.r15d-pins");
 const find=id=>{const e=root.querySelector('details.navgd [data-nx-it="'+id+'"]')||root.querySelector('[data-nx-it="'+id+'"]');return e};
 const out=D.createElement("div");out.className="r27-simple";
 if(home)out.appendChild(home.closest(".navit")||home);
 const pinIds=new Set();
 if(pins){const its=[...pins.querySelectorAll("[data-nx-it]")];its.slice(5).forEach(x=>x.remove());its.slice(0,5).forEach(x=>pinIds.add(x.dataset.nxIt));out.appendChild(pins)}
 const rec=REC.filter(id=>!pinIds.has(id)).map(find).filter(Boolean).slice(0,3);
 if(rec.length){const s=D.createElement("section");s.className="r27-rec";s.setAttribute("aria-label","Recent");s.innerHTML='<div class="r27-h">Recent</div>';rec.forEach(x=>{const c=x.cloneNode(true);c.classList.add("r15d-pin");s.appendChild(c)});out.appendChild(s)}
 const cur=root.querySelector('details.navgd [aria-current="page"],.r15d-more [aria-current="page"]');
 const keep=[...out.querySelectorAll('[aria-current="page"]')].length>0;
 const all=D.createElement("details");all.className="r27-all";all.dataset.r27All="1";if(S.r27&&S.r27.open||(cur&&!keep))all.open=true;
 const sm=D.createElement("summary");sm.innerHTML='<span>All apps and areas</span>';all.appendChild(sm);
 [...root.childNodes].forEach(c=>{if(c!==home&&!(home&&c.contains&&c.contains(home))&&c!==pins)all.appendChild(c)});
 out.appendChild(all);return out.innerHTML}
function install(){const base=G(()=>NAVX.html,null);if(!base||base._r27)return;const f=function(){let raw=base.apply(this,arguments);try{track();if(PREF.nav==="simple")raw=simplify(raw)}catch(e){console.error("r27 menu",e)}return raw};f._r27=1;NAVX.html=f}
install();
D.addEventListener("toggle",e=>{if(e.target&&e.target.dataset&&e.target.dataset.r27All){S.r27=S.r27||{};S.r27.open=e.target.open}},true);
/* ---------- preferences panel (extends the profile popover) ---------- */
function panel(){return `<div id="r27Prefs" data-r27><div class="eyebrow" style="margin:16px 0 8px">Language</div><div class="opts" role="radiogroup" aria-label="Language">${LANGS.map(l=>`<label><input type="radio" name="pref-lang" value="${l[0]}" data-r27p="lang" ${PREF.lang===l[0]?"checked":""}><span lang="${l[0]}">${H(l[1])}</span></label>`).join("")}</div><p class="muted small">Menus, the home page and common buttons are translated. Other screens stay in English until they are translated.</p>
<div class="eyebrow" style="margin:16px 0 8px">Menu</div><div class="opts"><label><input type="radio" name="pref-nav" value="simple" data-r27p="nav" ${PREF.nav==="simple"?"checked":""}>Simple</label><label><input type="radio" name="pref-nav" value="full" data-r27p="nav" ${PREF.nav==="full"?"checked":""}>Full</label></div><p class="muted small">Simple shows what you need for your role and what you opened lately. Full shows every area.</p>
<div class="row" style="margin-top:12px"><button type="button" class="btn quiet" data-r27-reset>Reset my preferences</button></div></div>`}
D.addEventListener("toggle",e=>{if(e.target.id!=="profilePop"||e.newState!=="open")return;const p=e.target;let x=p.querySelector("#r27Prefs");if(!x){const row=p.querySelector(".row");const t=D.createElement("div");t.innerHTML=panel();row?row.parentNode.insertBefore(t.firstChild,row):p.appendChild(t.firstChild);if(cur!=="en")walk(p.querySelector("#r27Prefs"),cur)}else{x.querySelectorAll("[data-r27p]").forEach(i=>i.checked=PREF[i.dataset.r27p]===i.value)}},true);
D.addEventListener("change",e=>{const i=e.target.closest&&e.target.closest("[data-r27p]");if(!i)return;const k=i.dataset.r27p;PREF[k]=i.value;if(k==="lang")setLang(i.value);else{try{savePrefs()}catch(x){}try{renderNav()}catch(x){}}try{toast(k==="lang"?"Language saved":"Menu style saved","good")}catch(x){}});
D.addEventListener("click",e=>{if(!(e.target.closest&&e.target.closest("[data-r27-reset]")))return;Object.assign(PREF,{theme:"auto",size:"m",density:"comfortable",motion:"system",skill:"standard",contrast:"normal",nav:"simple"});setLang("en");try{applyPrefs();savePrefs();renderNav()}catch(x){}D.querySelectorAll("[data-r27p]").forEach(i=>i.checked=PREF[i.dataset.r27p]===i.value);D.querySelectorAll("[data-pref]").forEach(i=>i.checked=PREF[i.dataset.pref]===i.value);try{toast("Preferences reset","good")}catch(x){}});
/* start up: apply the saved language once the shell exists */
function boot(){if(PREF.lang&&PREF.lang!=="en")setLang(PREF.lang);else{D.documentElement.lang="en"}}
setTimeout(boot,0);setTimeout(()=>{if(PREF.lang!=="en")walk(D.body,PREF.lang)},1200);
/* ---------- accessibility repairs applied after every render (found by the Round 27 audit) ---------- */
const INTER='button,a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';
function a11y(root){try{const r=root&&root.querySelectorAll?root:D;
 r.querySelectorAll('[role=tab][aria-pressed],[role=radio][aria-pressed]').forEach(e=>e.removeAttribute("aria-pressed"));
 r.querySelectorAll('[role=row]').forEach(e=>{if(!e.closest('table,[role=grid],[role=table],[role=treegrid]'))e.setAttribute("role","group")});
 r.querySelectorAll('div[aria-label]:not([role]),span[aria-label]:not([role]),i[aria-label]:not([role])').forEach(e=>e.setAttribute("role",e.className&&/bar|track|meter/.test(e.className)?"img":"group"));
 r.querySelectorAll('[role=button][tabindex]').forEach(e=>{if(e.querySelector(INTER)){e.setAttribute("role","group")}});
 r.querySelectorAll('.tscroll:not([tabindex]),.vsw:not([tabindex])').forEach(e=>{if(e.scrollWidth>e.clientWidth+1||e.scrollHeight>e.clientHeight+1)e.setAttribute("tabindex","0")});
 r.querySelectorAll('[role=listbox]:not([aria-label]):not([aria-labelledby])').forEach(e=>e.setAttribute("aria-label","Results"))}catch(e){}}
let aq=0;function a11yLater(){if(aq)return;aq=setTimeout(()=>{aq=0;a11y(D.getElementById("main")||D.body)},250)}
{const m=D.querySelector("main")||D.body;new MutationObserver(a11yLater).observe(D.body,{childList:true,subtree:true})}
setTimeout(()=>a11y(D.body),600);
/* the chat can switch language too */
W.R27={setLang,simplify};
})();
