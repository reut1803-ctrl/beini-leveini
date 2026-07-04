(function(){
  "use strict";

  var STORAGE_KEY = "beiniLeveini.pages.v1";

  var PROMPTS = [
    "היום אני מרגישה...",
    "משהו שהייתי רוצה שידעו עליי...",
    "הדבר שהכי שימח אותי היום...",
    "אם יכולתי לומר משהו לעצמי של פעם...",
    "רגע קטן שגרם לי לחייך...",
    "מה שהכי מטריד אותי עכשיו...",
    "אני אסירת תודה על...",
    "חלום שיש לי...",
    "משהו שקשה לי להגיד בקול רם...",
    "מכתב קטן לעצמי בעוד שנה...",
    "הדבר שהכי הפחיד אותי, ואיך התמודדתי איתו...",
    "מישהו שאני אוהבת, ולמה...",
    "משהו שלמדתי על עצמי לאחרונה...",
    "הלוואי שיכולתי...",
    "היום הייתי אמיצה כש...",
    "משפט שאני צריכה לשמוע יותר...",
    "מה עושה לי טוב על הנשמה...",
    "משהו שאני סולחת לעצמי עליו...",
    "הרגע הכי טוב השבוע היה...",
    "מה אני רוצה שישתנה מחר...",
    "משהו קטן ששמח אותי בדרך...",
    "מחשבה שחוזרת אליי שוב ושוב...",
    "מה הלב שלי צריך עכשיו...",
    "מילה אחת שמתארת את היום שלי..."
  ];

  var pages = load();
  var index = 0; // 0 = cover, 1..pages.length = entries, pages.length+1 = back cover
  var lastPromptIdx = -1;
  var saveTimer = null;

  function load(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }

  function save(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(pages)); }catch(e){}
  }

  function randomPrompt(){
    if(PROMPTS.length <= 1) return PROMPTS[0];
    var i;
    do{ i = Math.floor(Math.random()*PROMPTS.length); }while(i === lastPromptIdx);
    lastPromptIdx = i;
    return PROMPTS[i];
  }

  function total(){ return pages.length + 2; }

  function addPage(){
    var insertAt = index === 0 ? 0 : index;
    if(insertAt > pages.length) insertAt = pages.length;
    var page = {
      id: Date.now() + "-" + Math.random().toString(36).slice(2,7),
      text: "",
      prompt: randomPrompt(),
      createdAt: new Date().toISOString()
    };
    pages.splice(insertAt, 0, page);
    save();
    index = insertAt + 1;
    render();
    focusActiveTextarea();
  }

  function deletePage(pageId){
    var i = pages.findIndex(function(p){ return p.id === pageId; });
    if(i === -1) return;
    if(!confirm("למחוק את הדף הזה? אי אפשר לשחזר אותו.")) return;
    pages.splice(i,1);
    save();
    if(index > pages.length + 1) index = pages.length + 1;
    render();
  }

  function updateText(pageId, text){
    var p = pages.find(function(p){ return p.id === pageId; });
    if(!p) return;
    p.text = text;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 250);
  }

  function goto(newIndex){
    if(newIndex < 0 || newIndex > total() - 1) return;
    index = newIndex;
    render();
  }

  function openBook(){
    if(pages.length === 0){ addPage(); return; }
    goto(1);
  }

  function focusActiveTextarea(){
    requestAnimationFrame(function(){
      var ta = document.querySelector(".lines");
      if(ta){ ta.focus(); var v = ta.value; ta.value=""; ta.value=v; }
    });
  }

  function escapeHtml(s){
    return (s || "").replace(/[&<>"']/g, function(c){
      return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c];
    });
  }

  function downloadBackup(){
    var lines = ["ביני לביני - גיבוי", ""];
    pages.forEach(function(p, i){
      var d = new Date(p.createdAt);
      lines.push("— דף " + (i+1) + " — " + d.toLocaleDateString("he-IL"));
      lines.push(p.prompt);
      lines.push("");
      lines.push(p.text || "");
      lines.push("");
      lines.push("");
    });
    var blob = new Blob([lines.join("\n")], {type:"text/plain;charset=utf-8"});
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "ביני-לביני-גיבוי.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 2000);
  }

  function render(){
    var app = document.getElementById("app");
    var html = '<div class="book">';

    html += '<div class="page-stack">';

    if(index === 0){
      html += '<div class="page cover-page" id="coverPage">' +
                '<div class="badge"><div class="badge-inner"><h1>ביני לביני</h1></div></div>' +
                '<div class="tap-hint">געי כדי לפתוח</div>' +
                (pages.length ? '<div class="backup-link"><a href="#" data-action="backup">שמירת גיבוי של הכתיבה שלי</a></div>' : '') +
              '</div>';
    } else if(index === total() - 1){
      html += '<div class="page back-page">' +
                '<div class="badge"></div>' +
              '</div>';
    } else {
      var p = pages[index - 1];
      html += '<div class="page entry-page">' +
                '<button class="delete-btn" data-action="delete" data-id="'+p.id+'">✕</button>' +
                '<div class="side-strip"></div>' +
                '<div class="page-content">' +
                  '<div class="prompt">' + escapeHtml(p.prompt) + '</div>' +
                  '<div class="lines-wrap"><textarea class="lines" data-id="'+p.id+'" placeholder="כתבי כאן, בלי לחשוב יותר מדי...">' + escapeHtml(p.text) + '</textarea></div>' +
                  '<div class="page-number">&lt; ' + (index) + ' &gt;</div>' +
                '</div>' +
              '</div>';
    }

    html += '</div>'; // page-stack

    html += '<div class="nav-bar">' +
              '<button class="nav-btn" data-action="forward" '+(index===total()-1?'disabled':'')+'>‹</button>' +
              '<span class="page-indicator">' + (index===0 ? 'שער' : (index===total()-1 ? 'גב המחברת' : ('עמוד ' + index + ' מתוך ' + pages.length))) + '</span>' +
              '<button class="nav-btn" data-action="back" '+(index===0?'disabled':'')+'>›</button>' +
            '</div>' +
            '<button class="add-btn" data-action="add" title="דף חדש">✚</button>';

    html += '</div>'; // book

    app.innerHTML = html;
    wireEvents();
  }

  function wireEvents(){
    var app = document.getElementById("app");

    var cover = document.getElementById("coverPage");
    if(cover) cover.addEventListener("click", openBook);

    app.querySelectorAll('[data-action="backup"]').forEach(function(b){
      b.addEventListener("click", function(e){
        e.preventDefault();
        e.stopPropagation();
        downloadBackup();
      });
    });

    app.querySelectorAll('[data-action="back"]').forEach(function(b){
      b.addEventListener("click", function(){ goto(index - 1); });
    });
    app.querySelectorAll('[data-action="forward"]').forEach(function(b){
      b.addEventListener("click", function(){ goto(index + 1); });
    });
    app.querySelectorAll('[data-action="add"]').forEach(function(b){
      b.addEventListener("click", addPage);
    });
    app.querySelectorAll('[data-action="delete"]').forEach(function(b){
      b.addEventListener("click", function(){ deletePage(b.getAttribute("data-id")); });
    });

    var ta = app.querySelector("textarea.lines");
    if(ta){
      ta.addEventListener("input", function(){ updateText(ta.getAttribute("data-id"), ta.value); });
    }

    wireSwipe(app.querySelector(".page-stack"));
  }

  function wireSwipe(el){
    if(!el) return;
    var startX = null, startY = null;
    el.addEventListener("touchstart", function(e){
      if(e.target.closest("textarea")) { startX = null; return; }
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, {passive:true});
    el.addEventListener("touchend", function(e){
      if(startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;
      if(Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)*1.5){
        if(dx < 0) goto(index + 1); // RTL: swipe left -> next
        else goto(index - 1);
      }
      startX = null;
    }, {passive:true});
  }

  document.addEventListener("DOMContentLoaded", function(){
    render();
  });
})();
