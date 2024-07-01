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
let leaveConfirmRequired=false;
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
    let slides=document.getElementsByClassName("slide");
    Array.from(slides).forEach(slide => {
        slide.className="slide invisible";
    });
    id.className="slide visible";
    I("modalContainer").innerHTML="";
    resizeImages();
}
function getCurrentSlide(){
    let s=document.getElementsByClassName("slide visible");
    if(s.length===0) return null; else return s[0];
}
/*---FLASHES---*/
let flashing=false;
function flash(color){
	if(flashing) return; else flashing=true;
	let f=document.createElement("div");
	f.className="flashFx";
	f.style.backgroundColor=color;
	f.onanimationend=function(){
        f.parentElement.removeChild(f);
        flashing=false;
    }
	document.body.appendChild(f);
}
/*---MODALS---*/
function showModal(message,buttons){
    try{
        let m=document.createElement("div");
        m.className="modal visible";
        let w=document.createElement("div");
        w.className="window";
        let d=document.createElement("div");
        d.className="message";
        d.textContent=message;
        w.appendChild(d);
        d=document.createElement("div");
        d.className="buttons";
        for(let i=0;i<buttons.length;i++){
            let b=document.createElement("input");
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

/*---SOUND FX SYSTEM---*/
let playSoundFx=null;
let soundSystemStarted=false;
let SOUND_FORMAT=null;
let audioContext=null;
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
        let master=audioContext.createGain();
        master.connect(audioContext.destination);
        master.gain.value=1;
        setInterval(function(){
            if(playSoundFx!==null){
                let audio=document.createElement("audio");
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
const MAXROUNDS_MIN=10, MAXROUNDS_MAX=96, MAXROUNDS_STEP=1, MAXROUNDS_DEFAULT=10;
const ROUNDDURATION_MIN=10, ROUNDDURATION_MAX=30, ROUNDDURATION_STEP=5, ROUNDDURATION_DEFAULT=10;
let currentGameDate=null,roundDuration=ROUNDDURATION_DEFAULT,maxRounds=MAXROUNDS_DEFAULT;
const RACES={
    "umani":{
        name:"Umani",
        ages:[5,13,26,50,88,137],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
     "krentoriani":{
        name:"Krentoriani",
        ages:[3,7,15,49,65,88],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
    "sauniArcaici":{
        name:"Sauni arcaici",
        ages:[14,20,39,68,94,123],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
     },
    "sauniEletti":{
        name:"Sauni eletti",
        ages:[15,22,41,76,105,140],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
    "quark":{
        name:"Qüark",
        ages:[18,73,138,259,302,352],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
    "pravosianiGuerrieri":{
        name:"Pravosiani guerrieri",
        ages:[3,9,19,55,72,101],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
    "pravosianiGuidespirituali":{
        name:"Pravosiani guide spirituali",
        ages:[11,22,59,169,197,242],
        sexes:{
            "a":{displayName:"Assessuato"}
        }
    },
    "veriSyviar":{
        name:"Veri Syviar",
        ages:[12,27,79,199,253,302],
        sexes:{
            "a":{displayName:"Assessuato"}
        }
    },
    "ivosiani":{
        name:"Ivosiani",
        ages:[10,25,71,162,211,253],
        sexes:{
            "a":{displayName:"Assessuato"}
        }
    },
    "draudzart":{
        name:"Draudzart",
        ages:[2,5,12,42,71,94],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
    "skity":{
        name:"Skity",
        ages:[6,9,13,37,49,66],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
    "nakkiri":{
        name:"Nàkkiri",
        ages:[18,32,46,70,87,116],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    },
    "makriani":{
        name:"Makriani",
        ages:[3,6,16,36,51,77],
        sexes:{
            "m":{displayName:"Maschio"},
            "f":{displayName:"Femmina"}
        }
    }
};
const AGE_NAMES=["Genesi/Infanzia","Tenera età","Giovinezza","Matura","Avanzata","Tarda età","Esegue test di senilità"];
let players=[], removedPlayers=[];
let playerIdCtr=1;
function Player(playerName,characterName,race,dob,team,firstPlayer,sex,exsex,explanationExSex){
    this.playerId=playerIdCtr++;
    this.playerName=playerName;
    this.characterName=characterName;
    this.race=race;
    this.dob=dob;
    this.team=team;
    this.firstPlayer=firstPlayer;
    this.sex=sex;
    this.exsex=exsex; //expressive sex
    this.explanationExSex=explanationExSex; //explanationExSex= explanation of expressive sex
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
        const ages=RACES[this.race].ages
        let a=this.getAge();
        let i;
        Array.from(ages).forEach(age => {
            if (a < age) return i;
        });
        return i;
    },
    getAgeTierName:function(){
        let t=this.getAgeTier();
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
function updateSex(){
    let currentSex=I("sex").value;
   
    while(I("sex").firstChild){
        I("sex").removeChild(I("sex").firstChild);
    }
    for(let key in RACES[raceSelect.value].sexes){
        let newOption=document.createElement("option");
        newOption.value=key;
        newOption.text=RACES[raceSelect.value].sexes[key].displayName;
        I("sex").appendChild(newOption);
    }
    if([I("sex").options].some(option => option.value===currentSex)){
        I("sex").value=currentSex;
    }else{
        I("sex").value=I("sex").options[0].value;
    }
}
function getPlayersByTeamId(id){
    let ret=[];
    for(let i=0;i<players.length;i++) if(players[i].team===id) ret.push(players[i]);
    return ret;
}
let teams=[];
let teamIdCtr=1;
function Team(teamName){
    this.teamId=teamIdCtr++;
    this.teamName=teamName;
}
function getTeamById(id){
    for(let i=0;i<teams.length;i++) if(teams[i].teamId===id) return teams[i];
    return -1;
}
/*---MAIN IMPLEMENTATION---*/
function saveConfigToLocalStorage(){
    try{
        const state={
            currentGameDate:currentGameDate.toISODate(),
            roundDuration:roundDuration,
            maxRounds:maxRounds,
            teams:[],
            teamIdCtr:teamIdCtr,
            players:[],
            playerIdCtr:playerIdCtr
        };
        for(let i=0;i<teams.length;i++){
            state.teams[i]={
                teamId:teams[i].teamId,
                teamName:teams[i].teamName
            };
        }
        for(let i=0;i<players.length;i++){
            state.players[i]={
                playerId:players[i].playerId,
                playerName:players[i].playerName,
                characterName:players[i].characterName,
                race:players[i].race,
                dob:players[i].dob.toISODate(),
                team:players[i].team,
                firstPlayer:players[i].firstPlayer,
                sex:players[i].sex,
                exsex:players[i].exsex,
                explanationExSex:players[i].explanationExSex
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
        let state=JSON.parse(localStorage.ciarnuro);
        currentGameDate=new Date(state.currentGameDate);
        roundDuration=Number(state.roundDuration);
        maxRounds=Number(state.maxRounds);
        teams=[];
        for(let i=0;i<state.teams.length;i++){
            let t=state.teams[i];
            let n=new Team(t.teamName);
            n.teamId=Number(t.teamId);
            teams.push(n);
        }
        teamIdCtr=Number(state.teamIdCtr);
        players=[];
        for(let i=0;i<state.players.length;i++){
            let p=state.players[i];
            let n=new Player(p.playerName,p.characterName,p.race,new Date(p.dob),Number(p.team),p.firstPlayer,p.sex,p.exsex,p.explanationExSex);
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
    let list=I("previousGamesList");
    list.innerHTML="";
    try{
        if(!localStorage.previousGamesList) return;
        if(localStorage.ciarnuroRTVer!=="1") return;
        let games=JSON.parse(localStorage.previousGamesList);
        let i=0;
        Array.from(games).forEach(game => {
            try {
                let e=document.createElement("div");
                e.className="entry";
                let c=document.createElement("div");
                c.className="content";
                let g=JSON.parse(localStorage[game]);
                c.textContent="Rapporto #"+(++i);
                let s=document.createElement("div");
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
                }(g,game);
                e.appendChild(c);
                list.appendChild(e);
            }catch(t){console.error("Entry not generated for "+game+": "+t);}
        });
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
        let games=[];
        if(localStorage.previousGamesList){
            try{
                games=JSON.parse(localStorage.previousGamesList);
            }catch(e){}
        }
        let id="g"+Date.now()+~~(Math.random()*Number.MAX_SAFE_INTEGER);
        let report=JSON.stringify({
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
        let games=JSON.parse(localStorage.previousGamesList);
        games.splice(games.indexOf(id),1);
        localStorage.previousGamesList=JSON.stringify(games);
        delete(localStorage[id]);
    }catch(t){console.error("Report "+id+" not deleted: "+t)}
}

function checkMaxRounds(){
    let v;
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
        let v=Number(I("maxRounds").value);
        if(isNaN(v)) throw "";
        v-=MAXROUNDS_STEP;
        I("maxRounds").value=v;
    }catch(t){}
    checkMaxRounds();
}
function incMaxRounds(){
    if(getCurrentSlide().id!=="gameOptions") return;
    try{
        let v=Number(I("maxRounds").value);
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
    let v;
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
        let v=Number(I("roundDuration").value);
        if(isNaN(v)) throw "";
        v-=ROUNDDURATION_STEP;
        I("roundDuration").value=v;
    }catch(t){}
    checkRoundDuration();
}
function incRoundDuration(){
    if(getCurrentSlide().id!=="gameOptions") return;
    try{
        let v=Number(I("roundDuration").value);
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
        let d=new Date(I("startDate").value);
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
    let list=I("players");
    list.innerHTML="";
    Array.from(players).forEach(p => {
        let d=document.createElement("div");
        d.className="entry";
        d.id = "playerEven";
        let x=document.createElement("img");
        x.className="icon"+(p.firstPlayer?" important":"");
        x.src="pics/races/" + p.race +""+p.sex+ ".png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=p.playerName;
        let s=document.createElement("div");
        s.className="small";
        s.textContent=p.characterName+" ("+RACES[p.race].name+", "+p.getAge()+" anni)";
        x.appendChild(s);
        s=document.createElement("div");
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
    });
    d=document.createElement("div");
    d.className="entry";
    x=document.createElement("img");
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
    Array.from(teams).forEach(t => {
        let d=document.createElement("div");
        d.className="entry";
        let x=document.createElement("img");
        x.className="icon";
        x.src="pics/addTeam.png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=t.teamName;
        let s=document.createElement("div");
        s.className="small";
        s.textContent=getPlayersByTeamId(t.teamId).length + " giocatori";
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
                    let p=getPlayersByTeamId(t.teamId);
                            p.array.forEach(e => {
                                e.team=0
                            });
                            teams.splice(teams.indexOf(t), 1);
                            populatePlayersAndTeamsList();
                            return true;
                        }
                    },
                    {
                        text: "No", action: function () {
                            return true;
                        }
                    }]);
            }
        }(t);
        x.appendChild(s);
        d.appendChild(x);
        list.appendChild(d);
    });
    d=document.createElement("div");
    d.className="entry";
    x=document.createElement("img");
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

let ingamePlayerManagement=false;
let teamBeingEdited=null;
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
    let n=I("teamName").value.trim();
    if(n.isBlank()){
        showModal("Il nome della squadra non può essere vuoto",[{text:"Ok",action:function(){return true;}}]);
        return;
    }
    if(teamBeingEdited===null){
        let team=new Team(n);
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
let playerBeingEdited=null;
function preparePlayerEditForm(player){
    playerBeingEdited=player;
    let t=I("team");
    t.innerHTML="";
    let x=document.createElement("option");
    x.textContent="Solo";
    x.value="solo";
    t.appendChild(x);
    Array.from(teams).forEach(team => {
        x=document.createElement("option");
        x.textContent=team.teamName;
        x.value=team.teamId;
        t.appendChild(x);
    });
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
        updateSex();
        I("sex").disabled=undefined;
        I("exsex").value="";
        I("explanationExSex").value="";
    }else{
        I("playerName").value=player.playerName;
        I("characterName").value=player.characterName;
        I("dob").value=player.dob.toISODate();
        I("team").value=player.team===0?"solo":player.team;
        I("race").value=player.race;
        I("firstPlayer").value=player.firstPlayer;
        I("exsex").value=player.exsex;
        updateSex(player.sex);
        I("sex").value=player.sex;
        I("explanationExSex").value=player.explanationExSex;
        if(ingamePlayerManagement){
            I("dob").disabled="true";
            I("race").disabled="true";
            I("sex").disabled="true";
        }else{
            I("dob").disabled=undefined;
            I("race").disabled=undefined;
            I("sex").disabled=undefined;
        }
        I("firstPlayer").value=player.firstPlayer?"y":"n";
    }
    I("race").addEventListener("change",updateSex);
}
function checkAndSavePlayer(){
    if(getCurrentSlide().id!=="editPlayer") return;
    let pn=I("playerName").value.trim(),cn=I("characterName").value.trim(),dob=I("dob").value,team=I("team").value,race=I("race").value,fp=I("firstPlayer").value==="y",sex=I("sex").value,es=I("exsex").value.trim(),ees=I("explanationExSex").value.trim();
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
    if(!es.isBlank()&&ees.isBlank()){
        showModal("La spiegazione del sesso espressivo non può essere vuota",[{text:"Ok",action:function(){return true;}}]);
        return;    
    }
    try{
        let d=new Date(dob);
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
        Array.from(players).forEach(player => {
            player.firstPlayer=false;
        });
    }
    if (playerBeingEdited === null) {
        let p = new Player(pn, cn, race, new Date(dob), team === "solo" ? 0 : Number(team), fp,sex,es,ees);
        players.push(p);
    }else{
        playerBeingEdited.playerName=pn;
        playerBeingEdited.characterName=cn;
        playerBeingEdited.exsex=es;
        playerBeingEdited.explanationExSex=ees;
        if(!ingamePlayerManagement){
            playerBeingEdited.dob=dob;
            playerBeingEdited.race=race;
            playerBeingEdited.sex=sex;
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
        Array.from(players).forEach((player, i) => {
            if(player.getAge()<0){
                showModal(player.playerName + ": il personaggio " + player.characterName + " ha età negativa in seguito a un cambio di data", [
                    {text:"Modifica",action:function(){
                            preparePlayerEditForm(player);
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
        });
    }
    for(let i=0;i<players.length;i++){
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
    let first=false;
    Array.from(players).forEach(player=> {
        if(player.firstPlayer==true) first=true;
        if(player.firstPlayer==true&&player.team){
            let element = document.getElementById("teamButton");
            element.style.visibility = "visible";
            element = document.getElementById("soloButton");
            element.style.visibility = "hidden";
            element.style.display = "none";
        }
    });
    if(!first){
        showModal("Nessuno è specificato come primo giocatore",[{text:"Ok",action:function(){return true;}}]);
        return;  
    }
if(!checkPlayerAges()) return;
    Array.from(players).forEach(player => {
        if (player.team!== 0) player.alwaysPlayedSolo=false;
    });
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
        let d=new Date(I("newDate").value);
        if(d-currentGameDate<0){
            showModal("La data inserita è nel passato",[{text:"Ok",action:function(){return true}}]);
            return;
        }else{
            let prevAges=[];
            for(let i=0;i<players.length;i++){
                prevAges[i]=players[i].getAgeTier();
            }
            currentGameDate=d;
            I("ageChanges").innerHTML="";
            let showAgeChangesScreen=false;
            for(let i=0;i<players.length;i++){
                if(players[i].getAgeTier()!=prevAges[i]){
                    showAgeChangesScreen=true;
                    let e=document.createElement("li");
                    let d=document.createElement("span");
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
let schedule=[];
let timePerPlayerMs=0;
let scheduleTPtr=0;
function doPlayerSchedule(){
    scheduleTPtr=0;
    let plist=[];
    //put first player at the beginning of plist
    for(let i=0;i<players.length;i++){
        if(players[i].firstPlayer){
            plist.push(players[i]);
            break;
        }
    }
    //add the rest of the players by add order
    Array.from(players).forEach(player => {
        if (player!=plist[0]) plist.push(player);
    });
    //group players by team, except solo players
    for(let i=0;i<plist.length;i++){
        if(plist[i].team!=0){ //if player is in a team, put the rest of the team after him, sorted by add order
            for(let j=i+1;j<plist.length;j++){
                if(plist[i].team===plist[j].team){
                    let x=plist[j];
                    plist.splice(j,1);
                    plist.splice(i+1,0,x);
                    i++;
                }
            }
        }
    }
    //remove players that aren't old enough to play
    for(let i=0;i<plist.length;i++){
        if(!plist[i].isOldEnoughToPlay()){
            plist.splice(i,1);
            i--;
        }
    }
    //build schedule
    schedule=[];
    if(plist.length===0) return;
    timePerPlayerMs=(roundDuration*60*1000)/(plist.length!=0?plist.length:1);
    let t=0;
    for(let i=0;i<plist.length;i++){
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
    let result=null;
    schedule.forEach(e => {
        if (scheduleTPtr>=e.start && scheduleTPtr < e.end && result === null) {
            result=e;
        }
    });
    return result;
}
function getBeforeScheduleEntry(){
    for(let i=1;i<schedule.length;i++){
        if(scheduleTPtr>=schedule[i].start&&scheduleTPtr<schedule[i].end) return schedule[i-1];
    }
    return null;
}
function getNextScheduleEntry(){
    for(let i=0;i<schedule.length-1;i++){
        if(scheduleTPtr>=schedule[i].start&&scheduleTPtr<schedule[i].end) return schedule[i+1];
    }
    return null;
}
function msToMMSS(ms){
    if(ms<0) ms=0;
    let s=~~(ms/1000), m=~~(s/60);
    s%=60;
    return (m<10?("0"+m):m)+":"+(s<10?("0"+s):s);
}
function msToHHMMSS(ms){
    const HOUR=60*60*1000;
    if(ms<HOUR) return msToMMSS(ms);
    let h=ms/HOUR;
    ms%=HOUR;
    return (h<10?("0"+h):h)+":"+msToMMSS(ms);
}

const TICK_MS=100;
const STATE_NOTPLAYING=0,STATE_GAME=1,STATE_GHOSTTIME=2,STATE_COMBAT_INPUT=30,STATE_COMBAT_RUNNING=31,STATE_ENDROUND=4, STATE_PAUSE=5;
let gameState=STATE_NOTPLAYING;
let currentRound=1;
let prevTS=-1;
let ghostTime=0,combatTime=0;
const COMBATTYPE_INPUT=0,COMBATTYPE_NARRATIVE=1,COMBATTYPE_TACTICAL=2,COMBATTYPE_BOTH=3;
let combatType=COMBATTYPE_INPUT;
let totalCombatTime=[0,0,0,0], totalPlayedTime=0;
let lastTickPlayer=null;

setInterval(function(){
    let ts=Date.now(),tsdiff=0;
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
    if(gameState===STATE_PAUSE) {
        return;
    }
    if(gameState===STATE_GAME){
        scheduleTPtr+=tsdiff;
        totalPlayedTime+=tsdiff;
        I("roundNumber").textContent=currentRound;
        I("mainTimer").textContent=msToMMSS(roundDuration*60*1000-scheduleTPtr);
        I("roundTDuration").textContent=msToMMSS(roundDuration*60*1000);
        let e=getCurrentScheduleEntry();
        let c=getBeforeScheduleEntry();
	if(e!=null){
            if(e.player!=lastTickPlayer){
                if(currentRound>1||scheduleTPtr!=tsdiff) playSoundFx="nextPlayer"; //don't play sound effect for first player of the first round because we're already playing gameStarted
                flash();
                I("senilityCheckRequired").style.display=e.player.isSenile()?"":"none";
                if(e.player.team!=0){
                    I("teamTContainer").style.display="";
                    if(c!=null&&getTeamById(e.player.team).teamName===getTeamById(c.player.team).teamName){
                        e.teamTime=c.teamTime; // for the same team 
                    }else{
                        e.teamTime=getPlayersByTeamId(e.player.team).length*timePerPlayerMs; //for new team
                    }
                }else I("teamTContainer").style.display="none";
                I("playerAndCharacterName").textContent=e.player.playerName+" - "+e.player.characterName;
                I("gtTeamName").textContent=e.player.team===0?"Solo":getTeamById(e.player.team).teamName;
            }
            I("playerTDuration").textContent=msToMMSS(e.end-scheduleTPtr);
            if(e.player.team!=0){
                e.teamTime-=tsdiff;
                I("teamTDuration").textContent=msToMMSS(e.teamTime);
            }
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
    I("gtDate").textContent=currentGameDate.toISODate();
    gameState=STATE_GAME;
    toSlide("gameTimer");
    randomizeGameTimerBackground();
    resizeBackground();
}
let random;
function randomizeGameTimerBackground(){
    random=(~~(Math.random()*7)+1);
}
function resizeBackground(){ //Resize the background of the timer screen
    let backgroundImage;
    if(getCurrentSlide().id==='gameTimer'){
        if(window.innerWidth>900&&window.innerWidth<=1800){
            backgroundImage="url('pics/midspec/game" + random + ".webp')";
        }else{ 
            if(window.innerWidth<=900){
            backgroundImage="url('pics/lowspec/game" + random + ".webp')";
            }else{
                if(window.innerWidth > 1800){
                    backgroundImage="url('pics/ultraspec/game"+random+".webp')";
                }
            }
        }
    I("gameTimer").style.backgroundImage=backgroundImage;    
    }
}
function resizeImages(){
        let identifier=getCurrentSlide().id;
        if(window.innerWidth<=900){
            if(identifier==='welcome'){
                I(identifier).style.backgroundImage="url('pics/lowspec/welcome.webp')";
            }else if(['gameOptions','playerManagement','editTeam','editPlayer','dateChange','dateChange2'].includes(identifier)){ //if one of these slide is the id
                I(identifier).style.backgroundImage="url('pics/lowspec/gameOptions.webp')";
            }else if(identifier==='ghostTime'){
                I(identifier).style.backgroundImage="url('pics/lowspec/ghostTime.webp')";
            }else if(identifier==='combat'){
                I(identifier).style.backgroundImage="url('pics/lowspec/combat.webp')";
            }else if(identifier==='endRound'){
                I(identifier).style.backgroundImage="url('pics/lowspec/endRound.webp')";
            }else if(identifier==='endGame'){
                I(identifier).style.backgroundImage="url('pics/lowspec/endGame.webp')";
            }else if(['previousGames','gameReport'].includes(identifier)){
                I(identifier).style.backgroundImage="url('pics/lowspec/previousGames.webp')";
            }
        }else if(window.innerWidth>900&&window.innerWidth<=1800){
            if (identifier==='welcome'){
                I(identifier).style.backgroundImage="url('pics/midspec/welcome.webp')";
            }else if (['gameOptions', 'playerManagement', 'editTeam', 'editPlayer', 'dateChange', 'dateChange2'].includes(identifier)){
                I(identifier).style.backgroundImage ="url('pics/midspec/gameOptions.webp')";
            }else if (identifier==='ghostTime'){
                I(identifier).style.backgroundImage="url('pics/midspec/ghostTime.webp')";
            }else if (identifier==='combat'){
                I(identifier).style.backgroundImage="url('pics/midspec/combat.webp')";
            }else if(identifier==='endRound'){
                I(identifier).style.backgroundImage="url('pics/midspec/endRound.webp')";
            }else if(identifier==='endGame'){
                I(identifier).style.backgroundImage="url('pics/midspec/endGame.webp')";
            }else if(['previousGames','gameReport'].includes(identifier)){
                I(identifier).style.backgroundImage="url('pics/midspec/previousGames.webp')";
            }
        }else if(window.innerWidth>1800){
            if(identifier==='welcome'){
                I(identifier).style.backgroundImage="url('pics/ultraspec/welcome.webp')";
            }else if(['gameOptions','playerManagement','editTeam','editPlayer','dateChange','dateChange2'].includes(identifier)){
                I(identifier).style.backgroundImage="url('pics/ultraspec/gameOptions.webp')";
            }else if(identifier==='ghostTime'){
                I(identifier).style.backgroundImage="url('pics/ultraspec/ghostTime.webp')";
            }else if(identifier==='combat'){
                I(identifier).style.backgroundImage="url('pics/ultraspec/combat.webp')";
            }else if(identifier==='endRound'){
                I(identifier).style.backgroundImage="url('pics/ultraspec/endRound.webp')";
            }else if(identifier==='endGame'){
                I(identifier).style.backgroundImage="url('pics/ultraspec/endGame.webp')";
            }else if(['previousGames','gameReport'].includes(identifier)){
                I(identifier).style.backgroundImage="url('pics/ultraspec/previousGames.webp')";
            }
        }
}
window.addEventListener('resize',resizeImages);
window.addEventListener('resize',resizeBackground);
function stopRound(){
    if(gameState!=STATE_GAME&&gameState!=STATE_ENDROUND&&gameState!=STATE_PAUSE) return;
    lastTickPlayer=null;
    if(currentRound>=maxRounds){        
        gameState=STATE_ENDROUND;
        stopGame();
    }else{
        playSoundFx="nextRound";
        I("endRoundNumber").textContent=currentRound;
        resumeTimer();
        gameState=STATE_ENDROUND;
        toSlide("endRound");
        
    }
}
function nextPlayer(){
    if(gameState!=STATE_GAME&&gameState!=STATE_PAUSE) return;
    var e=getNextScheduleEntry();
    var c=getCurrentScheduleEntry();
    if(e===null){
        stopRound();
        return;
    }
    if (gameState == STATE_PAUSE) resumeTimer();
    if(c.player.team!=0&&getTeamById(c.player.team).teamName===getTeamById(e.player.team).teamName) return;
    scheduleTPtr=e.start;
}
function pauseTimer() {
    if(gameState!=STATE_GAME) return;
    gameState=STATE_PAUSE;
    I("pauseBtn").value="Riprendi";
    I("pauseBtn").onclick=resumeTimer;
}
function resumeTimer() {
    if(gameState!=STATE_PAUSE&&gameState!=STATE_GHOSTTIME&&gameState!=STATE_COMBAT_INPUT&&gameState!=STATE_COMBAT_RUNNING) return;
    gameState=STATE_GAME;
    I("pauseBtn").value="Pausa";
    I("pauseBtn").onclick=pauseTimer;
}
function nextPlayerWithTime(){
    if(!(getNextScheduleEntry.team)){
        let element = document.getElementById("soloButton");
        element.style.visibility = "visible";
        element.style.display = "block";
        element = document.getElementById("teamButton");
        element.style.visibility = "hidden";
        element.style.display = "none";
    }
    if(gameState!=STATE_GAME&&gameState!=STATE_PAUSE) return;
    var c=getCurrentScheduleEntry(),e=getNextScheduleEntry();
    if(c!=null&&e!=null){
        c.end=e.start=scheduleTPtr;
        if (gameState == STATE_PAUSE) resumeTimer();
    } else stopRound();
}
function beginGhostTime(){
    if(gameState!=STATE_GAME&&gameState!=STATE_PAUSE) return;
    playSoundFx="ghostTime";
    gameState=STATE_GHOSTTIME;
    toSlide("ghostTime");
}
function endGhostTime(){
    if(gameState!=STATE_GHOSTTIME&&gameState!=STATE_PAUSE) return;
    resumeTimer();
    playSoundFx="ghostTimeEnd";
    toSlide("gameTimer");
}
function beginCombat(){
    if(gameState!=STATE_GAME&&gameState!=STATE_PAUSE) return;
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
    playSoundFx="combatEnd";
    resumeTimer();
    toSlide("gameTimer");
}
function senilityCheckPassed(){
    if(gameState!=STATE_GAME||I("senilityCheckRequired").style.display==="none") return;
    document.activeElement.blur();
    I("senilityCheckRequired").style.display="none";
}
function senilityCheckFailed(){
    if(gameState!=STATE_GAME||I("senilityCheckRequired").style.display==="none") return;
    let e=getCurrentScheduleEntry();
    if(e!=null){
        players.splice(players.indexOf(e.player),1);
        e.player.die();
        removedPlayers.push(e.player);
    }
    nextPlayer();
}
function nextRound(){
    if(gameState!=STATE_GAME&&gameState!=STATE_ENDROUND&&gameState!=STATE_PAUSE) return;
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
    toSlide("gameTimer");
    randomizeGameTimerBackground();
    resizeBackground();
}
function stopGame(askConfirm){
    if(gameState!=STATE_ENDROUND&&gameState!=STATE_PAUSE) return;
    if(askConfirm){
        showModal("Vuoi terminare la partita?",[{text:"Si",action:function(){stopGame();return true}},{text:"No",action:function(){return true}}]);
    }else{
        gameState=STATE_NOTPLAYING;
        playSoundFx="endGame";
        generateReport();
        Array.from(players).forEach(player => {
            player.reset();
        });
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
    let report=I("report");
    let LINE=function(parent,name,value){
        let d=document.createElement("span");
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
    let list=document.createElement("div");
    list.className="list";
    Array.from(players).forEach(p => {
        let d=document.createElement("div");
        d.className="entry";
        let x=document.createElement("img");
        x.className="icon";
        x.src ="pics/races/" + p.race +""+p.sex+ ".png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=p.playerName + " (giocato per " + msToHHMMSS(p.timePlayed) + ")";
        let s=document.createElement("div");
        s.className="small";
        let sesso;
        if(p.sex==="a"){
            sesso="Assessuato";
        }else{
            if(p.sex==="m"){
                sesso="Maschio";
            }else{
                sesso="Femmina";
            }
        }
        s.textContent=p.characterName + " (" + RACES[p.race].name +" "+sesso+" "+p.exsex+", "+ p.getAge() + " anni)";
        x.appendChild(s);
        s=document.createElement("div");
        s.className="small";
        s.textContent=(p.team === 0 ? "Solo" : getTeamById(p.team).teamName) + (p.alwaysPlayedSolo ? " (sempre Solo)" : "");
        x.appendChild(s);
        d.appendChild(x);
        list.appendChild(d);
    });
    report.appendChild(list);
    report.appendChild(document.createElement("br"));
    LINE(report,"Elenco dei giocatori che non ce l'hanno fatta: ",removedPlayers.length===0?"Nessuno":null);
    list=document.createElement("div");
    list.className="list";
    Array.from(removedPlayers).forEach(p => {
        let d=document.createElement("div");
        d.className="entry";
        let x=document.createElement("img");
        x.className="icon";
        x.src="pics/races/" + p.race +""+p.sex+ ".png";
        d.appendChild(x);
        x=document.createElement("div");
        x.className="content";
        x.textContent=p.playerName + " (giocato per " + msToHHMMSS(p.timePlayed) + ")";
        let s=document.createElement("div");
        s.className="small";
        let sesso;
        if(p.sex==="a"){
            sesso="Assessuato";
        }else{
            if(p.sex==="m"){
                sesso="Maschio";
            }else{
                sesso="Femmina";
            }
        }
        s.textContent=p.characterName + " (" + RACES[p.race].name +" "+sesso+" "+p.exsex+ ", morto a " + p.getAge() + " anni)";
        x.appendChild(s);
        s = document.createElement("div");
        s.className="small";
        s.textContent=(p.team===0 ? "Solo" : getTeamById(p.team).teamName) + (p.alwaysPlayedSolo ? " (sempre Solo)" : "");
        x.appendChild(s);
        d.appendChild(x);
        list.appendChild(d);
    });
    report.appendChild(list);
    saveReportToLocalStorage("Partita del "+new Date().toISODate(),I("report").innerHTML);
}
function init(){
    toSlide("welcome");
}
