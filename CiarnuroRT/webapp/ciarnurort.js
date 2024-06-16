/*---PWA STUFF---*/
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}
if(location.protocol=="http:"){
    location.href="https"+location.href.substring(4);
}
if (window.matchMedia('(display-mode: standalone)').matches) { //PWAs in standalone mode don't have the are you sure you want to leave the page dialog, so we prevent accidental back button presses on android from killing the app
    history.pushState({},null,document.URL);
    window.addEventListener('popstate', () => {
        history.pushState({},null,document.URL);
    });
}

/*---BASIC FUNCTIONS---*/
function I(id){return document.getElementById(id);}
window.requestAnimationFrame=window.requestAnimationFrame||(function(callback,element){setTimeout(callback,1000/60);});
var leaveConfirmRequired=false;
window.onbeforeunload=function(){
    return leaveConfirmRequired?"":undefined;
}
String.prototype.isBlank=function(){
	return !this || /^\s*$/.test(this);
}
Date.prototype.toISODate=function(){
    return this.toISOString().split("T")[0];
}
/*---SLIDES SYSTEM---*/
function toSlide(id){
    id=I(id);
    if(!id){console.error("Slide not found"); return;}
    if(id.className.indexOf("slide")===-1){console.error("Not a slide"); return;}
    var slides=document.getElementsByClassName("slide");
    for(var i=0;i<slides.length;i++){
        slides[i].className="slide invisible";
    }
    id.className="slide visible";
    I("modalContainer").innerHTML="";
}
function getCurrentSlide(){
    var s=document.getElementsByClassName("slide visible");
    if(s.length===0) return null; else return s[0];
}
/*---FLASHES---*/
var flashing=false;
function flash(color){
	if(flashing) return; else flashing=true;
	var f=document.createElement("div");
	f.className="flashFx";
	f.style.backgroundColor=color;
	f.onanimationend=function(){
        f.parentElement.removeChild(f);
        flashing=false;
    }.bind(this);
	document.body.appendChild(f);
}
/*---MODALS---*/
function showModal(message,buttons){
    try{
        var m=document.createElement("div");
        m.className="modal visible";
        var w=document.createElement("div");
        w.className="window";
        var d=document.createElement("div");
        d.className="message";
        d.textContent=message;
        w.appendChild(d);
        d=document.createElement("div");
        d.className="buttons";
        for(var i=0;i<buttons.length;i++){
            var b=document.createElement("input");
            b.type="button";
            b.value=buttons[i].text;
            b.onclick=function(modal,action){
                return function(){
                    if(modal.className==="modal invisible") return;
                    try{
                        if(!action()) return;
                    }catch(t){
                        console.error("Button action exception: "+t);
                        return;
                    }
                    modal.className="modal invisible";
                    modal.onanimationend=function(thisModal){return function(){I("modalContainer").removeChild(thisModal);}}(modal);
                    
                }
            }(m,buttons[i].action);
            d.appendChild(b);
        }
        w.appendChild(d);
        m.appendChild(w);
        I("modalContainer").appendChild(m);
        d.childNodes[0].focus();
    }catch(t){
        console.error("Failed to generate modal: "+x);
    }
}
/*---FOCUS TRAP---*/
var focusTrapEnabled=true, FOCUS_TRAP_MODE=1; //0=no trapping, 1=unfocus if not current slide/modal, 2=always force focus on an element inside current slide/modal if possible
window.onblur=function(){focusTrapEnabled=false;}
window.onfocus=function(){focusTrapEnabled=true;}
function trapF(){
    window.requestAnimationFrame(trapF);
    if(FOCUS_TRAP_MODE===0||!focusTrapEnabled) return;
    var modals=I("modalContainer");
    if(modals===null) return;
    var trapInside=null;
    if(modals.childNodes.length===0){
        if(document.activeElement===document.body) return;
        trapInside=getCurrentSlide();
        if(trapInside===null) return;
    }else{
        trapInside=modals.childNodes[modals.childNodes.length-1];
    }
    if(!trapInside.contains(document.activeElement)){
        document.activeElement.blur();
        if(FOCUS_TRAP_MODE===2){
            try{trapInside.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="button"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), div.clickOverlay[tabIndex="0"]')[0].focus();}catch(e){trapInside.focus();}
        }
    }
}
window.requestAnimationFrame(trapF);
/*---SOUND FX SYSTEM---*/
var playSoundFx=null;
var soundSystemStarted=false;
var SOUND_FORMAT=null;
var audioContext=null;
function initSoundSystem(){
    if(soundSystemStarted) return;
    if(window.AudioContext){
        try{
            if(document.createElement('audio').canPlayType('audio/ogg; codecs="opus"'))
                SOUND_FORMAT="opus";
        }catch(e){
            console.error("Browser doesn't support opus sound. Sound system disabled");
            SOUND_FORMAT=null;
            soundSystemStarted=true;
            return;
        }
        audioContext=new AudioContext();
        var master=audioContext.createGain();
        master.connect(audioContext.destination);
        master.gain.value=1;
        setInterval(function(){
            if(playSoundFx!==null){
                var audio=document.createElement("audio");
                audio.src="sfx/"+playSoundFx+"."+SOUND_FORMAT;
                audio.play();
                playSoundFx=null;
                audio=audioContext.createMediaElementSource(audio);
                audio.connect(master);
            }
        },100);
    }else{
        console.error("Browser doesn't support Web Audio API. Sound system disabled");
    }
    soundSystemStarted=true;
}
/*---BASIC GAME STUFF---*/
var currentGameDate=null,roundDuration=ROUNDDURATION_DEFAULT,maxRounds=MAXROUNDS_DEFAULT;
var RACES={
    "umani":{
        name:"Umani",
        ages:[4,13,26,50,80,136]
    },
    "krentoriani":{
        name:"Krentoriani",
        ages:[6,15,22,56,72,102]
    },
    "sauniArcaici":{
        name:"Sauni arcaici",
        ages:[14,20,39,68,94,123]
    },
    "sauniEletti":{
        name:"Sauni eletti",
        ages:[15,22,41,76,105,140]
    },
    "quark":{
        name:"Qüark",
        ages:[18,73,138,259,302,352]
    },
    "pravosianiGuerrieri":{
        name:"Pravosiani guerrieri",
        ages:[3,7,12,37,53,69]
    },
    "pravosianiGuidespirituali":{
        name:"Pravosiani guide spirituali",
        ages:[11,22,59,169,197,242]
    },
    "veriSyviar":{
        name:"Veri Syviar",
        ages:[12,25,73,189,220,252]
    },
    "ivosiani":{
        name:"Ivosiani",
        ages:[6,15,22,56,72,102]
    }
};
var AGE_NAMES=["Genesi/Infanzia","Tenera età","Giovinezza","Matura","Avanzata","Tarda età","Esegue test di senilità"];
var players=[], removedPlayers=[];
var playerIdCtr=1;
function Player(playerName,characterName,race,dob,team,firstPlayer){
    this.playerId=playerIdCtr++;
    this.playerName=playerName;
    this.characterName=characterName;
    this.race=race;
    this.dob=dob;
    this.team=team;
    this.firstPlayer=firstPlayer;
    this.alwaysPlayedSolo=true;
    this.timePlayed=0;
    this.deathAge=-1;
}
Player.prototype={
    constructor:Player,
    getAge:function(){
        return this.deathAge===-1?(new Date(currentGameDate-this.dob).getFullYear()-1970):this.deathAge;
    },
    isOldEnoughToPlay:function(){
        return this.getAge()>=RACES[this.race].ages[0];
    },
    isSenile:function(){
        return this.getAge()>=RACES[this.race].ages[RACES[this.race].ages.length-1];
    },
    getAgeTier:function(){
        var ages=RACES[this.race].ages, a=this.getAge();
        var i;
        for(i=0;i<ages.length;i++){
            if(a<ages[i]) return i;
        }
        return i;
    },
    getAgeTierName:function(){
        var t=this.getAgeTier();
        return t===-1?null:AGE_NAMES[t];
    },
    die:function(){
        this.deathAge=this.getAge();
    },
    reset:function(){
        this.alwaysPlayedSolo=true;
        this.timePlayed=0;
        this.deathAge=-1;
    }
}
function getPlayersByTeamId(id){
    var ret=[];
    for(var i=0;i<players.length;i++) if(players[i].team===id) ret.push(players[i]);
    return ret;
}
var teams=[];
var teamIdCtr=1;
function Team(teamName){
    this.teamId=teamIdCtr++;
    this.teamName=teamName;
}
function getTeamById(id){
    for(var i=0;i<teams.length;i++) if(teams[i].teamId===id) return teams[i];
    return null;
}
/*---MAIN IMPLEMENTATION---*/
function saveConfigToLocalStorage(){
    try{
        var state={
            currentGameDate:currentGameDate.toISODate(),
            roundDuration:roundDuration,
            maxRounds:maxRounds,
            teams:[],
            teamIdCtr:teamIdCtr,
            players:[],
            playerIdCtr:playerIdCtr
        };
        for(var i=0;i<teams.length;i++){
            state.teams[i]={
                teamId:teams[i].teamId,
                teamName:teams[i].teamName
            };
        }
        for(var i=0;i<players.length;i++){
            state.players[i]={
                playerId:players[i].playerId,
                playerName:players[i].playerName,
                characterName:players[i].characterName,
                race:players[i].race,
                dob:players[i].dob.toISODate(),
                team:players[i].team,
                firstPlayer:players[i].firstPlayer
            }
        }
        localStorage.ciarnuro=JSON.stringify(state);
        localStorage.ciarnuroRTVer="1";
    }catch(t){console.error("Config not saved: "+t);}
}
function loadConfigFromLocalStorage(){
    try{
        if(!localStorage.ciarnuro) return;
        if(localStorage.ciarnuroRTVer!=="1") return;
        var state=JSON.parse(localStorage.ciarnuro);
        currentGameDate=new Date(state.currentGameDate);
        roundDuration=Number(state.roundDuration);
        maxRounds=Number(state.maxRounds);
        teams=[];
        for(var i=0;i<state.teams.length;i++){
            var t=state.teams[i];
            var n=new Team(t.teamName);
            n.teamId=Number(t.teamId);
            teams.push(n);
        }
        teamIdCtr=Number(state.teamIdCtr);
        players=[];
        for(var i=0;i<state.players.length;i++){
            var p=state.players[i];
            var n=new Player(p.playerName,p.characterName,p.race,new Date(p.dob),Number(p.team),p.firstPlayer);
            n.playerId=Number(p.playerId);
            players.push(n);
        }
        playerIdCtr=Number(state.playerIdCtr);
    }catch(t){console.error("Config not loaded: "+t);}
}
function newGame(){
    if(getCurrentSlide().id!=="welcome") return;
    initSoundSystem();
    leaveConfirmRequired=true;
    I("report").innerHTML="";
    loadConfigFromLocalStorage();
    I("maxRounds").value=maxRounds;
    I("roundDuration").value=roundDuration;
    if(currentGameDate!=null) I("startDate").value=currentGameDate.toISODate();
    checkMaxRounds();
    checkRoundDuration();
    checkStartDate(false);
    toSlide("gameOptions");
}
function welcomeToPreviousGames(){
    if(getCurrentSlide().id!=="welcome") return;
    populatePreviousGamesList();
    toSlide("previousGames");
}
function populatePreviousGamesList(){
    var list=I("previousGamesList");
    list.innerHTML="";
    try{
        if(!localStorage.previousGamesList) return;
        if(localStorage.ciarnuroRTVer!=="1") return;
        var games=JSON.parse(localStorage.previousGamesList);
        for(var i=games.length-1;i>=0;i--){
            try{
                var e=document.createElement("div");
                e.className="entry";
                var c=document.createElement("div");
                c.className="content";
                var g=JSON.parse(localStorage[games[i]]);
                c.textContent="Rapporto #"+(i+1);
                var s=document.createElement("div");
                s.className="small";
                s.textContent=g.name;
                c.appendChild(s);
                e.appendChild(c);
                c=document.createElement("div"),
                c.className="clickOverlay";
                c.tabIndex="0";
                c.onclick=function(g,id){
                    return function(){
                        I("reportName").textContent=g.name;
                        I("reportBody").innerHTML=g.body;
                        I("deleteReport").onclick=function(){
                            showModal("Cancellare questa partita?",[
                                {text:"Si",action:function(){
                                    deleteReport(id);
                                    populatePreviousGamesList();
                                    toSlide("previousGames");
                                    return true;
                                }},
                                {text:"No",action:function(){return true;}}
                            ]);
                        };
                        toSlide("gameReport");
                    }
                }(g,games[i]);
                e.appendChild(c);
                list.appendChild(e);
            }catch(t){console.error("Entry not generated for "+games[i]+": "+t);}
        }
    }catch(t){console.error("Previous games list not loaded: "+t);}
}
function previousGamesToWelcome(){
    if(getCurrentSlide().id!=="previousGames") return;
    toSlide("welcome");
}
function gameReportToPreviousGames(){
    if(getCurrentSlide().id!=="gameReport") return;
    toSlide("previousGames");
}
function saveReportToLocalStorage(name,body){
    try{
        var games=[];
        if(localStorage.previousGamesList){
            try{
                games=JSON.parse(localStorage.previousGamesList);
            }catch(e){}
        }
        var id="g"+Date.now()+~~(Math.random()*Number.MAX_SAFE_INTEGER);
        var report=JSON.stringify({
            name:name,
            body:body
        });
        localStorage[id]=report;
        games.push(id);
        localStorage.previousGamesList=JSON.stringify(games);
    }catch(t){console.error("Report not saved: "+t)}
}
function deleteReport(id){
    try{
        var games=JSON.parse(localStorage.previousGamesList);
        games.splice(games.indexOf(id),1);
        localStorage.previousGamesList=JSON.stringify(games);
        delete(localStorage[id]);
    }catch(t){console.error("Report "+id+" not deleted: "+t)}
}
var MAXROUNDS_MIN=10, MAXROUNDS_MAX=96, MAXROUNDS_STEP=1, MAXROUNDS_DEFAULT=10;
var ROUNDDURATION_MIN=10, ROUNDDURATION_MAX=1000, ROUNDDURATION_STEP=5, ROUNDDURATION_DEFAULT=10;
function checkMaxRounds(){
    var v;
    try{
        v=Number(I("maxRounds").value);
        if(isNaN(v)) throw "";
        if(v%MAXROUNDS_STEP!=0) v-=v%MAXROUNDS_STEP;
        if(v<MAXROUNDS_MIN) v=MAXROUNDS_MIN; else if(v>MAXROUNDS_MAX) v=MAXROUNDS_MAX;
    }catch(t){
        v=MAXROUNDS_DEFAULT;
    }
    I("maxRounds").value=v;
    return true;
}
function decMaxRounds(){
    if(getCurrentSlide().id!=="gameOptions") return;
    try{
        var v=Number(I("maxRounds").value);
        if(isNaN(v)) throw "";
        v-=MAXROUNDS_STEP;
        I("maxRounds").value=v;
    }catch(t){}
    checkMaxRounds();
}
function incMaxRounds(){
    if(getCurrentSlide().id!=="gameOptions") return;
    try{
        var v=Number(I("maxRounds").value);
        if(isNaN(v)) throw "";
        v+=MAXROUNDS_STEP;
        I("maxRounds").value=v;
    }catch(t){}
    checkMaxRounds();
}
function resetMaxRounds(){
    if(getCurrentSlide().id!=="gameOptions") return;
    I("maxRounds").value=MAXROUNDS_DEFAULT;
}
function checkRoundDuration(){
    var v;
    try{
        v=Number(I("roundDuration").value);
        if(isNaN(v)) throw "";
        if(v%ROUNDDURATION_STEP!=0) v-=v%ROUNDDURATION_STEP;
        if(v<ROUNDDURATION_MIN) v=ROUNDDURATION_MIN; else if(v>ROUNDDURATION_MAX) v=ROUNDDURATION_MAX;
    }catch(t){
        v=ROUNDDURATION_DEFAULT;
    }
    I("roundDuration").value=v;
    return true;
}
function decRoundDuration(){
    if(getCurrentSlide().id!=="gameOptions") return;
    try{
        var v=Number(I("roundDuration").value);
        if(isNaN(v)) throw "";
        v-=ROUNDDURATION_STEP;
        I("roundDuration").value=v;
    }catch(t){}
    checkRoundDuration();
}
function incRoundDuration(){
    if(getCurrentSlide().id!=="gameOptions") return;
    try{
        var v=Number(I("roundDuration").value);
        if(isNaN(v)) throw "";
        v+=ROUNDDURATION_STEP;
        I("roundDuration").value=v;
    }catch(t){}
    checkRoundDuration();
}
function resetRoundDuration(){
    if(getCurrentSlide().id!=="gameOptions") return;
    I("roundDuration").value=ROUNDDURATION_DEFAULT;
}
function checkStartDate(showError){
    if(getCurrentSlide().id!=="gameOptions") return false;
    try{
        var d=new Date(I("startDate").value);
        if(!(d instanceof Date)||isNaN(d)) throw "";
        return true;
    }catch(e){
        if(showError){
            showModal("La data di inizio non è valida",[{text:"Ok",action:function(){I("startDate").focus();return true;}}]);
        }else{
            I("startDate").value=new Date();
        }
        return false;
    }
}
function gameOptionsToWelcomeScreen(){
    if(getCurrentSlide().id!=="gameOptions") return;
    leaveConfirmRequired=false;
    toSlide("welcome");
}
function gameOptionsToPlayerManagement(){
    if(getCurrentSlide().id!=="gameOptions") return;
    if(checkRoundDuration()&&checkMaxRounds()&&checkStartDate(true)){
        roundDuration=Number(I("roundDuration").value);
        maxRounds=Number(I("maxRounds").value);
        currentGameDate=new Date(I("startDate").value);
        populatePlayersAndTeamsList();
        ingamePlayerManagement=false;
        I("playerManagementToGameOptions").style.display="";
        toSlide("playerManagement");
    }
}
function populatePlayersAndTeamsList(){
    var list=I("players");
    list.innerHTML="";
    for(var i=0;i<players.length;i++){
        var p=players[i];
        var d=document.createElement("div");
        d.className="entry";
        var x=document.createElement("img");
        x.className="icon"+(p.firstPlayer?" important":"");
        x.src="pics/races/"+p.race+".png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=p.playerName;
        var s=document.createElement("div");
        s.className="small";
        s.textContent=p.characterName+" ("+RACES[p.race].name+", "+p.getAge()+" anni)";
        x.appendChild(s);
        var s=document.createElement("div");
        s.className="small";
        s.textContent=p.team===0?"Solo":getTeamById(p.team).teamName;
        x.appendChild(s);
        d.appendChild(x);
        x=document.createElement("div");
        x.className="rightButtons";
        s=document.createElement("a");
        s.className="button edit";
        s.tabIndex=0;
        s.onclick=function(p){
            return function(){
                if(getCurrentSlide().id!=="playerManagement") return;
                preparePlayerEditForm(p);
                toSlide("editPlayer");     
            }
        }(p);
        x.appendChild(s);
        s=document.createElement("a");
        s.className="button remove";
        s.tabIndex=0;
        s.onclick=function(p){
            return function(){
                if(getCurrentSlide().id!=="playerManagement") return;
                showModal("Sei sicuro di voler rimuovere "+p.playerName+"?",[
                {text:"Si",action:function(){
                    players.splice(players.indexOf(p),1);
                    p.die();
                    if(ingamePlayerManagement) removedPlayers.push(p);
                    populatePlayersAndTeamsList();
                    return true;
                }},
                {text:"No",action:function(){
                    return true;
                }}]);
            }
        }(p);
        x.appendChild(s);
        d.appendChild(x);
        list.appendChild(d);
    }
    var d=document.createElement("div");
    d.className="entry";
    var x=document.createElement("img");
    x.className="icon";
    x.src="pics/addPlayer.png";
    d.appendChild(x);
    x=document.createElement("div");
    x.className="content";
    x.textContent="Nuovo giocatore";
    d.appendChild(x);
    x=document.createElement("div");
    x.className="clickOverlay";
    x.tabIndex="0";
    x.onclick=function(){
        if(getCurrentSlide().id!=="playerManagement") return;
        preparePlayerEditForm(null);
        toSlide("editPlayer");
    };
    x.onkeypress=function(e){
        if(e.keyCode===13) x.onclick(); //pressed enter
    }
    d.appendChild(x);
    list.appendChild(d);
    list=I("teams");
    list.innerHTML="";
    for(var i=0;i<teams.length;i++){
        var t=teams[i];
        var d=document.createElement("div");
        d.className="entry";
        var x=document.createElement("img");
        x.className="icon";
        x.src="pics/addTeam.png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=t.teamName;
        var s=document.createElement("div");
        s.className="small";
        s.textContent=getPlayersByTeamId(t.teamId).length+" giocatori";
        x.appendChild(s);
        d.appendChild(x);
        x=document.createElement("div");
        x.className="rightButtons";
        s=document.createElement("a");
        s.className="button edit";
        s.tabIndex=0;
        s.onclick=function(t){
            return function(){
                if(getCurrentSlide().id!=="playerManagement") return;
                prepareTeamEditForm(t);
                toSlide("editTeam");    
            }
        }(t);
        x.appendChild(s);
        s=document.createElement("a");
        s.className="button remove";
        s.tabIndex=0;
        s.onclick=function(t){
            return function(){
                if(getCurrentSlide().id!=="playerManagement") return;
                showModal("Sei sicuro di voler rimuovere "+t.teamName+"?",[
                {text:"Si",action:function(){
                    var p=getPlayersByTeamId(t.teamId);
                    for(var i=0;i<p.length;i++){
                        p[i].team=0;
                    }
                    teams.splice(teams.indexOf(t),1);
                    populatePlayersAndTeamsList();
                    return true;
                }},
                {text:"No",action:function(){
                    return true;
                }}]);
            }
        }(t);
        x.appendChild(s);
        d.appendChild(x);
        list.appendChild(d);
    }
    var d=document.createElement("div");
    d.className="entry";
    var x=document.createElement("img");
    x.className="icon";
    x.src="pics/addTeam.png";
    d.appendChild(x);
    x=document.createElement("div");
    x.className="content";
    x.textContent="Nuova squadra";
    d.appendChild(x);
    x=document.createElement("div");
    x.className="clickOverlay";
    x.tabIndex="0";
    x.onclick=function(){
        if(getCurrentSlide().id!=="playerManagement") return;
        prepareTeamEditForm(null);
        toSlide("editTeam");
    };
    x.onkeypress=function(e){
        if(e.keyCode===13) x.onclick(); //pressed enter
    }
    d.appendChild(x);
    list.appendChild(d);
}
var ingamePlayerManagement=false;
var teamBeingEdited=null;
function prepareTeamEditForm(team){
    teamBeingEdited=team;
    if(team===null){
        I("teamName").value="";
    }else{
        I("teamName").value=team.teamName;
    }
    I("teamName").focus();
}
function checkAndSaveTeam(){
    if(getCurrentSlide().id!=="editTeam") return;
    var n=I("teamName").value.trim();
    if(n.isBlank()){
        showModal("Il nome della squadra non può essere vuoto",[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    if(teamBeingEdited===null){
        var team=new Team(n);
        teams.push(team);
    }else{
        teamBeingEdited.teamName=n;
    }
    populatePlayersAndTeamsList();
    toSlide("playerManagement");
}
function cancelTeamEdit(){
    if(getCurrentSlide().id!=="editTeam") return;
    toSlide("playerManagement");
}
var playerBeingEdited=null;
function preparePlayerEditForm(player){
    playerBeingEdited=player;
    var t=I("team");
    t.innerHTML="";
    var x=document.createElement("option");
    x.textContent="Solo";
    x.value="solo";
    t.appendChild(x);
    for(var i=0;i<teams.length;i++){
        x=document.createElement("option");
        x.textContent=teams[i].teamName;
        x.value=teams[i].teamId;
        t.appendChild(x);
    }
    if(player===null){
        I("playerName").value="";
        I("characterName").value="";
        I("dob").value="";
        I("team").value="solo";
        I("race").value=I("race").childNodes[0].value;
        I("firstPlayer").value="n";
        I("dob").disabled=undefined;
        I("race").disabled=undefined;
        I("firstPlayer").value="n";
    }else{
        I("playerName").value=player.playerName;
        I("characterName").value=player.characterName;
        I("dob").value=player.dob.toISODate();
        I("team").value=player.team===0?"solo":player.team;
        I("race").value=player.race;
        I("firstPlayer").value=player.firstPlayer;
        if(ingamePlayerManagement){
            I("dob").disabled="true";
            I("race").disabled="true";
        }else{
            I("dob").disabled=undefined;
            I("race").disabled=undefined;
        }
        I("firstPlayer").value=player.firstPlayer?"y":"n";
    }
}
function checkAndSavePlayer(){
    if(getCurrentSlide().id!=="editPlayer") return;
    var pn=I("playerName").value.trim(),cn=I("characterName").value.trim(),dob=I("dob").value,team=I("team").value,race=I("race").value,fp=I("firstPlayer").value==="y";
    if(pn.isBlank()){
        showModal("Il nome del giocatore non può essere vuoto",[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    if(cn.isBlank()){
        showModal("Il nome del personaggio non può essere vuoto",[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    if(dob.isBlank()){
        showModal("La data di nascita non può essere vuota",[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    try{
        var d=new Date(dob);
        if(!(d instanceof Date)||isNaN(d)) throw "";
        if(new Date(currentGameDate-d).getFullYear()-1970>=RACES[race].ages[RACES[race].ages.length-1]){
            showModal("La data di nascita non è valida, il personaggio è già morto",[{text:"Ok",action:function(){return true;}}]);
            return;
        }
        if(currentGameDate-d<0){
            showModal("La data di nascita non è valida, il personaggio non è ancora nato",[{text:"Ok",action:function(){return true;}}]);
            return;
        }
        if(currentGameDate.getFullYear()-d.getFullYear()<= RACES[race].ages[0]){
            showModal("La data di nascita non è valida, il personaggio non può giocare prima della tenera età",[{text:"Ok",action:function(){return true;}}]);
            return;
        } 
        dob=d;
    }catch(t){
        showModal("La data di nascita non è valida, usa il formato YYYY-MM-DD",[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    if(fp){
        for(var i=0;i<players.length;i++) players[i].firstPlayer=false;
    }
    if(playerBeingEdited===null){
        var p=new Player(pn,cn,race,new Date(dob),team==="solo"?0:Number(team),fp);
        players.push(p);
    }else{
        playerBeingEdited.playerName=pn;
        playerBeingEdited.characterName=cn;
        if(!ingamePlayerManagement){
            playerBeingEdited.dob=dob;
            playerBeingEdited.race=race;
        }
        playerBeingEdited.team=team==="solo"?0:Number(team);
        playerBeingEdited.firstPlayer=fp;
    }
    populatePlayersAndTeamsList();
    toSlide("playerManagement");
}
function cancelPlayerEdit(){
    if(getCurrentSlide().id!=="editPlayer") return;
    toSlide("playerManagement");
}
function playerManagementToGameOptions(){
    if(getCurrentSlide().id!=="playerManagement") return;
    toSlide("gameOptions");
}
function checkPlayerAges(){
    if(!ingamePlayerManagement){
        for(var i=0;i<players.length;i++){
            if(players[i].getAge()<0){
                showModal(players[i].playerName+": il personaggio "+players[i].characterName+" ha età negativa in seguito a un cambio di data",[
                    {text:"Modifica",action:function(){
                        preparePlayerEditForm(players[i]);
                        toSlide("editPlayer");
                        return true;
                    }},
                    {text:"Rimuovi",action:function(){
                        players.splice(i,1);
                        populatePlayersAndTeamsList();
                        return true;
                    }},
                    {text:"Annulla",action:function(){return true;}}
                ]);
                return false;
            }
        }
    }
    for(var i=0;i<players.length;i++){
        if(players[i].isOldEnoughToPlay()) return true;
    }
    showModal("Tutti i giocatori sono troppo giovani per giocare",[{text:"Ok",action:function(){return true;}}]);
    return false;
}
function playerManagementToGame(){
    if(getCurrentSlide().id!=="playerManagement") return;
    if(players.length===0){
        showModal("Non ci sono giocatori",ingamePlayerManagement?[
            {text:"Modifica",action:function(){return true;}},
            {text:"Ignora",action:function(){
                toSlide("endRound");
                return true;
            }}
        ]:[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    if(!checkPlayerAges()) return;
    for(var i=0;i<players.length;i++){
        if(players[i].team!==0) players[i].alwaysPlayedSolo=false;
    }
    if(ingamePlayerManagement){
        toSlide("endRound");
    }else{
        saveConfigToLocalStorage();
        initGame();
        toSlide("gameTimer");
    }
}
function prepareDateChangeForm(){
    I("newDate").value=currentGameDate.toISODate();
}
function checkAndChangeDate(){
    if(getCurrentSlide().id!=="dateChange") return;
    try{
        var d=new Date(I("newDate").value);
        if(d-currentGameDate<0){
            showModal("La data inserita è nel passato",[{text:"Ok",action:function(){return true}}]);
            return;
        }else{
            var prevAges=[];
            for(var i=0;i<players.length;i++){
                prevAges[i]=players[i].getAgeTier();
            }
            currentGameDate=d;
            I("ageChanges").innerHTML="";
            var showAgeChangesScreen=false;
            for(var i=0;i<players.length;i++){
                if(players[i].getAgeTier()!=prevAges[i]){
                    showAgeChangesScreen=true;
                    var e=document.createElement("li");
                    var d=document.createElement("span");
                    d.className="bold";
                    d.textContent=players[i].characterName+": ";
                    e.appendChild(d);
                    d=document.createElement("span");
                    d.textContent=players[i].getAgeTierName();
                    e.appendChild(d);
                    I("ageChanges").appendChild(e);
                    showAgeChangesScreen=true;
                }
            }
            if(showAgeChangesScreen){
                toSlide("dateChange2");
            }else{
                toSlide("endRound");
            }
        }
    }catch(e){
        showModal("La data inserita non è valida, usa il formato YYYY-MM-DD",[{text:"Ok",action:function(){return true}}]);
        return;
    }
}
function cancelChangeDate(){
    if(getCurrentSlide().id!=="dateChange") return;
    toSlide("endRound");
}
function dateChangeToEndRound(){
    if((getCurrentSlide().id!=="dateChange")&&(getCurrentSlide().id!=="dateChange2")) return;
    toSlide("endRound");
}
var schedule=[];
var timePerPlayerMs=0;
var scheduleTPtr=0;
function doPlayerSchedule(){
    scheduleTPtr=0;
    var plist=[];
    //put first player at the beginning of plist
    for(var i=0;i<players.length;i++){
        if(players[i].firstPlayer){
            plist.push(players[i]);
            break;
        }
    }
    //add the rest of the players by add order
    for(var i=0;i<players.length;i++){
        if(players[i]!=plist[0]) plist.push(players[i]);
    }
    //group players by team, except solo players
    for(var i=0;i<plist.length;i++){
        if(plist[i].team!=0){ //if player is in a team, put the rest of the team after him, sorted by add order
            for(var j=i+1;j<plist.length;j++){
                if(plist[i].team===plist[j].team){
                    var x=plist[j];
                    plist.splice(j,1);
                    plist.splice(i+1,0,x);
                    i++;
                }
            }
        }
    }
    //remove players that aren't old enough to play
    for(var i=0;i<plist.length;i++){
        if(!plist[i].isOldEnoughToPlay()){
            plist.splice(i,1);
            i--;
        }
    }
    //build schedule
    schedule=[];
    if(plist.length===0) return;
    timePerPlayerMs=(roundDuration*60*1000)/(plist.length!=0?plist.length:1);
    var t=0;
    for(var i=0;i<plist.length;i++){
        schedule[i]={
            start:t,
            end:t+timePerPlayerMs,
            player:plist[i],
            teamTime:plist[i].team===0?timePerPlayerMs:(getPlayersByTeamId(plist[i].team).length*timePerPlayerMs) //this field is only used to speed up calculations later
        };
        t+=timePerPlayerMs;
    }
}
function getCurrentScheduleEntry(){
    for(var i=0;i<schedule.length;i++){
        if(scheduleTPtr>=schedule[i].start&&scheduleTPtr<schedule[i].end) return schedule[i];
    }
    return null;
}
function getNextScheduleEntry(){
    for(var i=0;i<schedule.length-1;i++){
        if(scheduleTPtr>=schedule[i].start&&scheduleTPtr<schedule[i].end) return schedule[i+1];
    }
    return null;
}
function msToMMSS(ms){
    if(ms<0) ms=0;
    var s=~~(ms/1000), m=~~(s/60);
    s%=60;
    return (m<10?("0"+m):m)+":"+(s<10?("0"+s):s);
}
function msToHHMMSS(ms){
    var HOUR=60*60*1000;
    if(ms<HOUR) return msToMMSS(ms);
    var h=ms/HOUR;
    ms%=HOUR;
    return (h<10?("0"+h):h)+":"+msToMMSS(ms);
}
var TICK_MS=100;
var STATE_NOTPLAYING=0,STATE_GAME=1,STATE_GHOSTTIME=2,STATE_COMBAT_INPUT=30,STATE_COMBAT_RUNNING=31,STATE_ENDROUND=4;
var gameState=STATE_NOTPLAYING;
var currentRound=1;
var prevTS=-1;
var ghostTime=0,combatTime=0;
var COMBATTYPE_INPUT=0,COMBATTYPE_NARRATIVE=1,COMBATTYPE_TACTICAL=2,COMBATTYPE_BOTH=3;
var combatType=COMBATTYPE_INPUT;
var totalCombatTime=[0,0,0,0], totalPlayedTime=0;
var lastTickPlayer=null;
setInterval(function(){
    var ts=Date.now(),tsdiff=0;
    if(prevTS===-1){
        prevTS=ts;
        return;
    }else{
        tsdiff=ts-prevTS;
        prevTS=ts;
    }
    if(gameState===STATE_NOTPLAYING){
        return;
    }
    if(gameState===STATE_GAME){
        scheduleTPtr+=tsdiff;
        totalPlayedTime+=tsdiff;
        I("roundNumber").textContent=currentRound;
        I("mainTimer").textContent=msToMMSS(roundDuration*60*1000-scheduleTPtr);
        I("roundTDuration").textContent=msToMMSS(roundDuration*60*1000);
        var e=getCurrentScheduleEntry();
        if(e!=null){
            if(e.player!=lastTickPlayer){
                if(currentRound>1||scheduleTPtr!=tsdiff) playSoundFx="nextPlayer"; //don't play sound effect for first player of the first round because we're already playing gameStarted
                flash();
                I("senilityCheckRequired").style.display=e.player.isSenile()?"":"none";
                if(e.player.team!=0){
                    I("teamTContainer").style.display="";
                    I("teamTDuration").textContent=msToMMSS(e.teamTime);
                }else I("teamTContainer").style.display="none";
                I("playerAndCharacterName").textContent=e.player.playerName+" - "+e.player.characterName;
                I("gtTeamName").textContent=e.player.team===0?"Solo":getTeamById(e.player.team).teamName;
            }
            I("playerTDuration").textContent=msToMMSS(e.end-scheduleTPtr);
            e.player.timePlayed+=tsdiff;
            lastTickPlayer=e.player;
        }else{
            stopRound();
        }
        return;
    }
    if(gameState===STATE_GHOSTTIME){
        I("ghostTimeTimer").textContent=msToMMSS(ghostTime);
        ghostTime+=tsdiff;
        totalPlayedTime+=tsdiff;
        return;
    }
    if(gameState===STATE_COMBAT_INPUT){
        totalPlayedTime+=tsdiff;
        return;
    }
    if(gameState===STATE_COMBAT_RUNNING){
        I("combatTimeTimer").textContent=msToMMSS(combatTime);
        combatTime+=tsdiff;
        totalCombatTime[combatType]+=tsdiff;
        totalCombatTime[0]+=tsdiff;
        totalPlayedTime+=tsdiff;
        return;
    }
    if(gameState===STATE_ENDROUND){
        return;
    }
},TICK_MS);
function initGame(){
    totalPlayedTime=0;
    currentRound=1;
    ghostTime=0;
    combatTime=0;
    totalCombatTime=[0,0,0,0];
    removedPlayers=[];
    playSoundFx="gameStarted";
    doPlayerSchedule();
    randomizeGameTimerBackground();
    I("gtDate").textContent=currentGameDate.toISODate();
    gameState=STATE_GAME;
    toSlide("gameTimer");
}
function randomizeGameTimerBackground(){
    I("gameTimer").style.backgroundImage="url('pics/backgrounds/game"+(~~(Math.random()*7)+1)+".jpg')";
}
function stopRound(){
    if(gameState!=STATE_GAME&&gameState!=STATE_ENDROUND) return;
    lastTickPlayer=null;
    if(currentRound>=maxRounds){        
        gameState=STATE_ENDROUND;
        stopGame();
    }else{
        playSoundFx="nextRound";
        I("endRoundNumber").textContent=currentRound;
        gameState=STATE_ENDROUND;
        toSlide("endRound");
    }
}
function nextPlayer(){
    if(gameState!=STATE_GAME) return;
    var e=getNextScheduleEntry();
    if(e!=null){
        scheduleTPtr=e.start;
    }else stopRound();
}
function nextPlayerWithTime(){
    if(gameState!=STATE_GAME) return;
    var c=getCurrentScheduleEntry(),e=getNextScheduleEntry();
    if(c!=null&&e!=null){
        c.end=e.start=scheduleTPtr;
    } else stopRound();
}
function beginGhostTime(){
    if(gameState!=STATE_GAME) return;
    playSoundFx="ghostTime";
    gameState=STATE_GHOSTTIME;
    toSlide("ghostTime");
}
function endGhostTime(){
    if(gameState!=STATE_GHOSTTIME) return;
    gameState=STATE_GAME;
    playSoundFx="ghostTimeEnd";
    toSlide("gameTimer");
}
function beginCombat(){
    if(gameState!=STATE_GAME) return;
    gameState=STATE_COMBAT_INPUT;
    playSoundFx="combat";
    combatType=0;
    combatTime=0;
    I("combatTypeButtonsContainer").style.display="";
    I("combatTypeTitle").textContent="";
    toSlide("combat");
}
function setCombatType(type){
    if(gameState!=STATE_COMBAT_INPUT) return;
    gameState=STATE_COMBAT_RUNNING;
    combatType=type;
    I("combatTypeButtonsContainer").style.display="none";
    I("combatTypeTitle").textContent=combatType===COMBATTYPE_NARRATIVE?"Narrato":combatType===COMBATTYPE_TACTICAL?"Tattico":"Tattico e Narrato";
}
function endCombat(){
    if(gameState!=STATE_COMBAT_INPUT&&gameState!=STATE_COMBAT_RUNNING) return;
    gameState=STATE_GAME;
    playSoundFx="combatEnd";
    toSlide("gameTimer");
}
function senilityCheckPassed(){
    if(gameState!=STATE_GAME||I("senilityCheckRequired").style.display==="none") return;
    document.activeElement.blur();
    I("senilityCheckRequired").style.display="none";
}
function senilityCheckFailed(){
    if(gameState!=STATE_GAME||I("senilityCheckRequired").style.display==="none") return;
    var e=getCurrentScheduleEntry();
    if(e!=null){
        players.splice(players.indexOf(e.player),1);
        e.player.die();
        removedPlayers.push(e.player);
    }
    nextPlayer();
}
function nextRound(){
    if(gameState!=STATE_GAME&&gameState!=STATE_ENDROUND) return;
    if(players.length===0){
        showModal("Non resta nessun giocatore",[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    if(!checkPlayerAges()) return;
    currentRound++;
    combatTime=0;
    doPlayerSchedule();
    gameState=STATE_GAME;
    I("gtDate").textContent=currentGameDate.toISODate();
    randomizeGameTimerBackground();
    toSlide("gameTimer");
}
function stopGame(askConfirm){
    if(gameState!=STATE_ENDROUND) return;
    if(askConfirm){
        showModal("Vuoi terminare la partita?",[{text:"Si",action:function(){stopGame();return true}},{text:"No",action:function(){return true}}]);
    }else{
        gameState=STATE_NOTPLAYING;
        playSoundFx="endGame";
        generateReport();
        for(var i=0;i<players.length;i++) players[i].reset();
        saveConfigToLocalStorage();
        toSlide("endGame");
    }
}
function endRoundToDateChange(){
    if(gameState!=STATE_ENDROUND) return;
    I("newDate").value=currentGameDate.toISODate();
    toSlide("dateChange");
}
function endRoundToPlayerManagement(){
    if(gameState!=STATE_ENDROUND) return;
    ingamePlayerManagement=true;
    populatePlayersAndTeamsList();
    I("playerManagementToGameOptions").style.display="none";
    toSlide("playerManagement");
}
function endGameToWelcome(){
    if(getCurrentSlide().id!=="endGame") return;
    leaveConfirmRequired=false;
    toSlide("welcome");
}

function generateReport(){
    var report=I("report");
    var LINE=function(parent,name,value){
        var d=document.createElement("span");
        d.className="bold";
        d.textContent=name;
        parent.appendChild(d);
        if(value!=null){
            d=document.createElement("span");
            d.textContent=value;
            parent.appendChild(d);
        }
        parent.appendChild(document.createElement("br"));
    }
    report.innerHTML="";
    LINE(report,"Date di inizio e fine: ",I("startDate").value+"  -  "+currentGameDate.toISODate());
    LINE(report,"Turni giocati: ",currentRound+" / "+maxRounds);
    LINE(report,"Durata partita: ",msToHHMMSS(totalPlayedTime));
    LINE(report,"Tempo fantasma: ",msToHHMMSS(ghostTime));
    LINE(report,"Tempo in combattimento (Narrato, Tattico, Entrambi, Totale): ",msToHHMMSS(totalCombatTime[COMBATTYPE_NARRATIVE])+" + "+msToHHMMSS(totalCombatTime[COMBATTYPE_TACTICAL])+" + "+msToHHMMSS(totalCombatTime[COMBATTYPE_BOTH])+" = "+msToHHMMSS(totalCombatTime[0]));
    report.appendChild(document.createElement("br"));
    LINE(report,"Elenco dei giocatori a fine partita: ",players.length===0?"Nessuno":null);
    var list=document.createElement("div");
    list.className="list";
    for(var i=0;i<players.length;i++){
        var p=players[i];
        var d=document.createElement("div");
        d.className="entry";
        var x=document.createElement("img");
        x.className="icon";
        x.src="pics/races/"+p.race+".png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=p.playerName+" (giocato per "+msToHHMMSS(p.timePlayed)+")";
        var s=document.createElement("div");
        s.className="small";
        s.textContent=p.characterName+" ("+RACES[p.race].name+", "+p.getAge()+" anni)";
        x.appendChild(s);
        var s=document.createElement("div");
        s.className="small";
        s.textContent=(p.team===0?"Solo":getTeamById(p.team).teamName)+(p.alwaysPlayedSolo?" (sempre Solo)":"");
        x.appendChild(s);
        d.appendChild(x);
        list.appendChild(d);
    }
    report.appendChild(list);
    report.appendChild(document.createElement("br"));
    LINE(report,"Elenco dei giocatori che non ce l'hanno fatta: ",removedPlayers.length===0?"Nessuno":null);
    list=document.createElement("div");
    list.className="list";
    for(var i=0;i<removedPlayers.length;i++){
        var p=removedPlayers[i];
        var d=document.createElement("div");
        d.className="entry";
        var x=document.createElement("img");
        x.className="icon";
        x.src="pics/races/"+p.race+".png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=p.playerName+" (giocato per "+msToHHMMSS(p.timePlayed)+")";
        var s=document.createElement("div");
        s.className="small";
        s.textContent=p.characterName+" ("+RACES[p.race].name+", morto a "+p.getAge()+" anni)";
        x.appendChild(s);
        var s=document.createElement("div");
        s.className="small";
        s.textContent=(p.team===0?"Solo":getTeamById(p.team).teamName)+(p.alwaysPlayedSolo?" (sempre Solo)":"");
        x.appendChild(s);
        d.appendChild(x);
        list.appendChild(d);
    }
    report.appendChild(list);
    saveReportToLocalStorage("Partita del "+new Date().toISODate(),I("report").innerHTML);
}
function init(){
    toSlide("welcome");
}

