// Starter dynamic portfolio.
// Replace/add objects in the games array.
// script.js
// Lightweight interactions for the Leviron portfolio
async function loadRobloxIcon(placeId, id) {
    const imgId = `${id}-icon`;
    const visitsId = `${id}-visits`;

    const cacheKey = `rbx-icon-${placeId}`;
    const cacheTimeKey = `${cacheKey}-time`;

    const DAY = 24 * 60 * 60 * 1000;

    // Format numbers like Roblox
    function formatVisits(num) {
        if (num >= 1_000_000_000) {
            return (num / 1_000_000_000).toFixed(1).replace(".0", "") + "B+";
        }

        if (num >= 1_000_000) {
            return (num / 1_000_000).toFixed(1).replace(".0", "") + "M+";
        }

        if (num >= 1_000) {
            return (num / 1_000).toFixed(1).replace(".0", "") + "K+";
        }

        return num.toString();
    }

    let cached = null;

    try {
        cached = JSON.parse(localStorage.getItem(cacheKey));
    } catch {
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(cacheTimeKey);
    }

    const cachedTime = Number(localStorage.getItem(cacheTimeKey));

    // Use cached data if it's less than 24 hours old
    if (cached && Date.now() - cachedTime < DAY) {
        document.getElementById(imgId).src = cached.imageUrl;
        document.getElementById(visitsId).textContent =
            formatVisits(cached.visits);
        return;
    }

    try {

        // Place ID -> Universe ID
        const universeRes = await fetch(
            `https://apis.roproxy.com/universes/v1/places/${placeId}/universe`
        );

        const { universeId } = await universeRes.json();

        // Fetch icon and visits simultaneously
        const [iconRes, gameRes] = await Promise.all([
            fetch(
                `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`
            ),
            fetch(
                `https://games.roproxy.com/v1/games?universeIds=${universeId}`
            )
        ]);

        const iconData = await iconRes.json();
        const gameData = await gameRes.json();

        const imageUrl = iconData.data?.[0]?.imageUrl;
        const visits = gameData.data?.[0]?.visits;

        // Update icon
        document.getElementById(imgId).src =
            imageUrl || "placeholder.png";

        // Update visits
        document.getElementById(visitsId).textContent =
            visits !== undefined
                ? formatVisits(visits)
                : "undefined";

        // Cache only valid data
        if (imageUrl && visits !== undefined) {
            localStorage.setItem(cacheKey, JSON.stringify({
                imageUrl,
                visits
            }));

            localStorage.setItem(cacheTimeKey, Date.now());
        }

    } catch (err) {
        console.error(err);

        document.getElementById(imgId).src = "placeholder.png";
        document.getElementById(visitsId).textContent = "undefined";
    }
}

function enableTitleSlide(card){
    const titleBox=card.querySelector(".game-title");
    const title=titleBox.querySelector("h3");
    let distance=0;
    card.addEventListener("mouseenter",()=>{
        title.style.transition="none";
        title.style.transform="translateX(0px)";
        requestAnimationFrame(()=>{
            const overflow=title.scrollWidth-titleBox.clientWidth;
            if(overflow<=0)return;
            distance=overflow+12;
            title.style.transition=`transform ${Math.max(distance*20,1500)}ms linear`;
            title.style.transform=`translateX(-${distance}px)`;
        });
    });
    card.addEventListener("mouseleave",()=>{
        title.style.transition="transform .35s ease";
        title.style.transform="translateX(0)";
    });
}

const games=[
{id:"gag",name:"Grow A Garden",placeId:126884695634066,roles:["Tester"],visible:true},
{id:"99nitf",name:"99 Nights in the Forest ",placeId:79546208627805,roles:["Tester"],visible:true},
{id:"deadrails",name:"Deadrails",placeId:116495829188952,roles:["Tester","Moderator"],visible:true},
{id:"STA",name:"Secure the Airport",placeId:102054284786904,roles:["Tester"],visible:true},
{id:"DtL",name:"Drain the Lake",placeId:138381251771774,roles:["Tester"],visible:true},
{id:"PAS",name:"Paint And SEEK!",placeId:78724049937437,roles:["Tester"],visible:true},
{id:"Wheelie",name:"Wheelie District",placeId:89490838554710,roles:["Tester"],visible:false},  
{id:"lakesipping",name:"Lake Sipping",placeId:119715129239364,roles:["Tester"],visible:true},  
{id:"MSP",name:"My Soup Pot",placeId:80140153393811,roles:["Tester"],visible:true},
{id:"manga",name:"Clean the Manga Shop!",placeId:85165894169093,roles:["Tester"],visible:true},
{id:"HonKey",name:"Honey Keyboard Escape",placeId:128734226473807,roles:["Tester"],visible:true},
{id:"Grapple",name:"Grapple 100 Stages!",placeId:82648824453490,roles:["Tester"],visible:true},
{id:"mc",name:"Mine & Craft",placeId:82792613389716,roles:["Tester"],visible:false},
{id:"jetpack",name:"Jetpack Shooter",placeId:101275764323516,roles:["Tester"],visible:false},
{id:"killer",name:"🔪 KILLER",placeId:127829441663442,roles:["Tester"],visible:false},
{id:"ASMRPlay",name:"My ASMR Playground!",placeId:134617829197967,roles:["Tester"],visible:false},
{id:"charlie",name:"Charlie Charlie",placeId:9897400758,roles:["Developer"],visible:false},
{id:"cactus",name:"Dancing Cactus",placeId:9339135643,roles:["Developer"],visible:false},
{id:"FTP",name:"Fix The Printer at 3AM",placeId:84381674157425,roles:["Developer"],visible:false},
{id:"CC",name:"Charlie Charlie [Classic]",placeId:122766743049777,roles:["Developer"],visible:false},
{id:"ETO",name:"Espresso Tower Obby",placeId:128841088637534,roles:["Developer"],visible:false},
];

// Only games explicitly marked visible get rendered into the portfolio
const visibleGames=games.filter(g=>g.visible!==false);

// ================= Timezone badge (UTC+8) =================
(function(){
    const badge=document.getElementById("tzBadge");
    if(!badge) return;

    const label=document.getElementById("tzLabel");
    let clockInterval=null;

    function getUTC8Time(){
        const now=new Date();
        const utcMs=now.getTime()+now.getTimezoneOffset()*60000;
        const target=new Date(utcMs+8*60*60*1000);
        return target.toLocaleTimeString("en-US",{
            hour:"2-digit",
            minute:"2-digit",
            second:"2-digit",
            hour12:true
        });
    }

    function showTime(){
        label.textContent=getUTC8Time();
        clearInterval(clockInterval);
        clockInterval=setInterval(()=>{
            label.textContent=getUTC8Time();
        },1000);
    }

    function showLabel(){
        clearInterval(clockInterval);
        label.textContent="🕒 UTC+8";
    }

    badge.addEventListener("mouseenter",showTime);
    badge.addEventListener("focus",showTime);
    badge.addEventListener("mouseleave",()=>{
        if(!badge.classList.contains("active")) showLabel();
    });
    badge.addEventListener("blur",()=>{
        if(!badge.classList.contains("active")) showLabel();
    });

    // Click/tap toggle, mainly for touch devices without hover
    badge.addEventListener("click",()=>{
        badge.classList.toggle("active");
        if(badge.classList.contains("active")) showTime();
        else showLabel();
    });

    badge.addEventListener("keydown",(e)=>{
        if(e.key==="Enter"||e.key===" "){
            e.preventDefault();
            badge.click();
        }
    });
})();

const PER_PAGE=8;
let index=0;
const grid=document.getElementById("portfolio-grid");
const btn=document.getElementById("loadMore");

function card(g){
 const d=document.createElement("div");
 d.className="portfolio-card";
 d.innerHTML=`<img id="${g.id}-icon" class="portfolio-image">
<div class="portfolio-content"><div class="game-title"><h3>${g.name}</h3></div>
${g.roles.map(r=>`<span class="role">${r}</span>`).join("")}
<p>Total Visits</p><strong id="${g.id}-visits">Loading...</strong></div>`;
 return d;
}

function loadMore(){
 const end=Math.min(index+PER_PAGE,visibleGames.length);
 for(let i=index;i<end;i++){
   const c=card(visibleGames[i]);
   grid.appendChild(c);
   enableTitleSlide(c);
   if(typeof loadRobloxIcon==="function"){
      loadRobloxIcon(visibleGames[i].placeId,visibleGames[i].id);
   }
 }
 index=end;
 if(index>=visibleGames.length) btn.style.display="none";
}
btn.addEventListener("click",loadMore);
loadMore();
