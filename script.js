// ================= Portfolio Settings =================
const GAMES_PER_PAGE = 4;

// Your Cloudflare Worker - the ONLY source of game data
const GAMES_API = "https://muddy-sky-974d.ianchanelph.workers.dev/games";

// Cache settings
const CACHE_KEY = "leviron-games-cache-v2";
const CACHE_TTL = 24 * 60 * 60 * 1000;   // 24 hours
const RETRY_COOLDOWN = 5 * 60 * 1000;     // if cached data is incomplete, don't re-ping more than once per 5 min

// Every card gets the Tester badge, nothing else
const ROLES = ["Tester"];

// Silly error messages (one is picked at random)
const ERROR_MESSAGES = [
    { emoji: "💥", title: "I think it broke...", sub: "Mind refreshing the site?" },
    { emoji: "🔌", title: "Something got unplugged.", sub: "The games went on a coffee break. Try again?" },
    { emoji: "🦆", title: "The API walked away.", sub: "Failed to fetch. Maybe it'll come back if you ask nicely." },
    { emoji: "🛠️", title: "Oops, failed to fetch.", sub: "Refresh the site or hit retry!" }
];

// ================= Number formatting (like Roblox) =================
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

// ================= Games data (single API + 24h cache) =================

// A game is usable only if it has everything a card needs
function isValidGame(g) {
    return !!g &&
        g.placeId !== undefined && g.placeId !== null &&
        typeof g.name === "string" && g.name.length > 0 &&
        typeof g.imageUrl === "string" && g.imageUrl.length > 0 &&
        typeof g.visits === "number";
}

function sortGames(list) {
    return [...list].sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999));
}

function readCache() {
    try {
        const raw = JSON.parse(localStorage.getItem(CACHE_KEY));

        if (raw && Array.isArray(raw.games) && typeof raw.time === "number") {
            return raw;
        }
    } catch {
        // corrupted cache, drop it below
    }

    try {
        localStorage.removeItem(CACHE_KEY);
    } catch {}

    return null;
}

function writeCache(games) {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            time: Date.now(),
            games
        }));
    } catch (err) {
        // storage full / blocked - the site still works, just without caching
        console.warn("Could not save cache:", err);
    }
}

async function fetchFromApi() {
    const res = await fetch(GAMES_API);

    if (!res.ok) {
        throw new Error(`API responded with ${res.status}`);
    }

    const json = await res.json();

    if (!json || !Array.isArray(json.games)) {
        throw new Error("Unexpected API response");
    }

    return json.games;
}

// Returns an array of usable games (empty array = nothing to show)
// force = true skips the cache (used by the Retry button)
async function loadGames(force = false) {
    const cache = readCache();
    const cachedGames = cache ? cache.games : [];
    const usableCached = cachedGames.filter(isValidGame);
    const cacheComplete = usableCached.length > 0 &&
        usableCached.length === cachedGames.length;
    const age = cache ? Date.now() - cache.time : Infinity;

    if (!force) {
        // 1) Fresh (<24h) and nothing missing -> don't touch the API at all
        if (cache && age < CACHE_TTL && cacheComplete) {
            return sortGames(usableCached);
        }

        // 2) Cache is recent but has broken/missing parts -> don't hammer the API on every reload
        if (cache && age < RETRY_COOLDOWN && usableCached.length > 0) {
            return sortGames(usableCached);
        }
    }

    // 3) Expired, missing, incomplete, or forced -> ask the API once
    try {
        const fresh = await fetchFromApi();
        const usable = fresh.filter(isValidGame);

        if (usable.length === 0) {
            throw new Error("API returned no usable games");
        }

        writeCache(fresh);

        return sortGames(usable);
    } catch (err) {
        console.error("Failed to fetch games:", err);

        // Fall back to old cached data (even if expired) rather than showing nothing
        return sortGames(usableCached);
    }
}

// ================= Title slide on hover =================
function enableTitleSlide(card) {
    const titleBox = card.querySelector(".game-title");
    const title = titleBox.querySelector("h3");
    let distance = 0;

    card.addEventListener("mouseenter", () => {
        title.style.transition = "none";
        title.style.transform = "translateX(0px)";

        requestAnimationFrame(() => {
            const overflow = title.scrollWidth - titleBox.clientWidth;

            if (overflow <= 0) return;

            distance = overflow + 12;
            title.style.transition =
                `transform ${Math.max(distance * 20, 1500)}ms linear`;
            title.style.transform =
                `translateX(-${distance}px)`;
        });
    });

    card.addEventListener("mouseleave", () => {
        title.style.transition = "transform .35s ease";
        title.style.transform = "translateX(0)";
    });
}

// ================= Timezone badge (UTC+8) =================
(function() {
    const badge = document.getElementById("tzBadge");
    if (!badge) return;

    const label = document.getElementById("tzLabel");
    let clockInterval = null;

    function getUTC8Time() {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        const target = new Date(utcMs + 8 * 60 * 60 * 1000);

        return target.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        });
    }

    function showTime() {
        label.textContent = getUTC8Time();

        clearInterval(clockInterval);

        clockInterval = setInterval(() => {
            label.textContent = getUTC8Time();
        }, 1000);
    }

    function showLabel() {
        clearInterval(clockInterval);
        label.textContent = "🕒 UTC+8";
    }

    badge.addEventListener("mouseenter", showTime);
    badge.addEventListener("focus", showTime);

    badge.addEventListener("mouseleave", () => {
        if (!badge.classList.contains("active")) showLabel();
    });

    badge.addEventListener("blur", () => {
        if (!badge.classList.contains("active")) showLabel();
    });

    badge.addEventListener("click", () => {
        badge.classList.toggle("active");

        if (badge.classList.contains("active")) {
            showTime();
        } else {
            showLabel();
        }
    });

    badge.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            badge.click();
        }
    });
})();

// ================= Portfolio rendering =================
const grid = document.getElementById("portfolio-grid");
const btn = document.getElementById("loadMore");

// Status area (spinner / error) sits between the title and the grid
const status = document.createElement("div");
status.className = "portfolio-status";
grid.parentNode.insertBefore(status, grid);

let allGames = [];
let index = 0;

function card(g) {
    const d = document.createElement("div");
    d.className = "portfolio-card";

    // Built with DOM methods (not innerHTML) so game names can never inject HTML
    const img = document.createElement("img");
    img.className = "portfolio-image";
    img.src = g.imageUrl;
    img.alt = g.name;
    img.loading = "lazy";
    img.onerror = () => {
        img.onerror = null;
        img.src = "placeholder.png";
    };

    const content = document.createElement("div");
    content.className = "portfolio-content";

    const titleBox = document.createElement("div");
    titleBox.className = "game-title";

    const h3 = document.createElement("h3");
    h3.textContent = g.name.trim();
    titleBox.appendChild(h3);
    content.appendChild(titleBox);

    for (const r of ROLES) {
        const span = document.createElement("span");
        span.className = "role";
        span.textContent = r;
        content.appendChild(span);
    }

    const label = document.createElement("p");
    label.textContent = "Total Visits";

    const visits = document.createElement("strong");
    visits.textContent = formatVisits(g.visits);

    content.append(label, visits);
    d.append(img, content);

    return d;
}

function loadMore() {
    const end = Math.min(index + GAMES_PER_PAGE, allGames.length);

    for (let i = index; i < end; i++) {
        const c = card(allGames[i]);

        grid.appendChild(c);
        enableTitleSlide(c);
    }

    index = end;

    btn.style.display = index >= allGames.length ? "none" : "";
}

// ---------- Loading UI ----------
function showLoading() {
    btn.style.display = "none";
    grid.innerHTML = "";

    status.innerHTML = `
        <div class="spinner"></div>
        <span>Loading games...</span>
    `;

    for (let i = 0; i < GAMES_PER_PAGE; i++) {
        const sk = document.createElement("div");
        sk.className = "skeleton-card";
        sk.innerHTML = `
            <div class="sk-img"></div>
            <div class="sk-body">
                <div class="sk-line w80"></div>
                <div class="sk-line w35"></div>
                <div class="sk-line w50"></div>
            </div>
        `;
        grid.appendChild(sk);
    }
}

// ---------- Error UI ----------
function showError() {
    btn.style.display = "none";
    grid.innerHTML = "";

    const msg = ERROR_MESSAGES[Math.floor(Math.random() * ERROR_MESSAGES.length)];

    status.innerHTML = `
        <div class="error-box">
            <span class="error-emoji">${msg.emoji}</span>
            <div class="error-title">${msg.title}</div>
            <div class="error-sub">${msg.sub}</div>
            <button id="retryBtn">Retry</button>
        </div>
    `;

    document.getElementById("retryBtn").addEventListener("click", () => init(true));
}

// ---------- Start ----------
async function init(force = false) {
    showLoading();

    const games = await loadGames(force);

    status.innerHTML = "";
    grid.innerHTML = "";

    if (games.length === 0) {
        showError();
        return;
    }

    allGames = games;
    index = 0;
    loadMore();
}

btn.addEventListener("click", loadMore);
init();


// ================= Roblox Plus popup ad =================
(function() {
    const AD_LINK = "https://www.roblox.com/plus-referral?v=v2&code=1bb6fe0c-c172-4aed-894f-e6b6768f2e51";
    const AD_KEY = "leviron-plus-ad-dismissed";
    const AD_HIDE_FOR = 24 * 60 * 60 * 1000;   // stays hidden for 24h after pressing X
    const AD_DELAY = 2500;                      // slides in after 2.5s

    // Don't show it if the visitor closed it recently
    try {
        const closedAt = Number(localStorage.getItem(AD_KEY));

        if (closedAt && Date.now() - closedAt < AD_HIDE_FOR) return;
    } catch {}

    const ad = document.createElement("aside");
    ad.className = "plus-ad";
    ad.setAttribute("aria-label", "Roblox Plus offer");

    ad.innerHTML = `
        <span class="plus-ad-tag">Ad · Referral link</span>
        <button class="plus-ad-close" type="button" aria-label="Close ad">✕</button>

        <h4>Unlock More with Roblox Plus! 🚀</h4>
        <p>Get the ultimate upgrade for just $4.99/mo:</p>

        <ul>
            <li>📉 10% OFF items instantly (up to 20% by month 3!)</li>
            <li>🔒 FREE Private Servers for you and your friends</li>
            <li>💸 Fee-Free Robux Transfers to swap with friends</li>
            <li>🔄 Unlimited Trading &amp; exclusive profile gear</li>
        </ul>

        <a class="plus-ad-btn" href="${AD_LINK}" target="_blank" rel="noopener noreferrer sponsored">
            Upgrade Now 🚀
        </a>
    `;

    document.body.appendChild(ad);

    ad.querySelector(".plus-ad-close").addEventListener("click", () => {
        ad.classList.remove("show");

        try {
            localStorage.setItem(AD_KEY, Date.now());
        } catch {}

        setTimeout(() => ad.remove(), 400);
    });

    setTimeout(() => ad.classList.add("show"), AD_DELAY);
})();
