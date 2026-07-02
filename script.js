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

document.addEventListener("DOMContentLoaded", () => {

    loadRobloxIcon(116495829188952, "deadrails");
    loadRobloxIcon(126884695634066, "gag");
    loadRobloxIcon(102054284786904, "STA");
    loadRobloxIcon(78724049937437, "PAS");
    loadRobloxIcon(101275764323516, "jetpack");
    loadRobloxIcon(9897400758, "charlie");
    loadRobloxIcon(9339135643, "cactus");
    // Active nav links
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll("nav a");

    function updateActiveNav() {
        let current = "";

        sections.forEach(section => {
            const top = section.offsetTop - 120;

            if (window.scrollY >= top) {
                current = section.id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");

            if (link.getAttribute("href") === "#" + current) {
                link.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", updateActiveNav);
    updateActiveNav();

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {

        entries.forEach(entry => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

            }

        });

    }, {

        threshold: 0.15

    });

    document.querySelectorAll(".card, .project, .social").forEach(item => {

        observer.observe(item);

    });

    // Portfolio tilt
    document.querySelectorAll(".project").forEach(card => {

        card.addEventListener("mousemove", e => {

            const rect = card.getBoundingClientRect();

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const rotateY = ((x / rect.width) - 0.5) * 8;
            const rotateX = ((rect.height / 2 - y) / rect.height) * 8;

            card.style.transform =
                `perspective(900px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-8px)`;

        });

        card.addEventListener("mouseleave", () => {

            card.style.transform = "";

        });

    });

    // Footer year
    const footer = document.querySelector("footer");

    if (footer) {

        footer.innerHTML = `© ${new Date().getFullYear()} Leviron`;

    }

});