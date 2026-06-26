// script.js
// Lightweight interactions for the Leviron portfolio

async function loadRobloxIcon(placeId, imgId) {
    const cacheKey = `rbx-icon-${placeId}`;
    const cacheTimeKey = `${cacheKey}-time`;

    const DAY = 24 * 60 * 60 * 1000;

    const cachedUrl = localStorage.getItem(cacheKey);
    const cachedTime = Number(localStorage.getItem(cacheTimeKey));

    // Use cached image if it's less than 24 hours old
    if (cachedUrl && Date.now() - cachedTime < DAY) {
        document.getElementById(imgId).src = cachedUrl;
        return;
    }

    try {
        const universeRes = await fetch(
            `https://apis.roproxy.com/universes/v1/places/${placeId}/universe`
        );
        const { universeId } = await universeRes.json();

        const iconRes = await fetch(
            `https://thumbnails.roproxy.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`
        );
        const data = await iconRes.json();

        const imageUrl = data.data[0].imageUrl;

        document.getElementById(imgId).src = imageUrl;

        // Save to cache
        localStorage.setItem(cacheKey, imageUrl);
        localStorage.setItem(cacheTimeKey, Date.now());
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener("DOMContentLoaded", () => {

    loadRobloxIcon(116495829188952, "deadrails-icon");
    loadRobloxIcon(126884695634066  , "gag-icon");
    loadRobloxIcon(101275764323516  , "jetpack-icon");
    loadRobloxIcon(71074948113192  , "1vsall-icon");
    loadRobloxIcon(125416149347004  , "tlr-icon");
    loadRobloxIcon(9897400758  , "charlie-icon");
    loadRobloxIcon(9339135643  , "cactus-icon");
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
