const overlay = document.getElementById("overlay");
const music = document.getElementById("bgMusic");

overlay.addEventListener("click", () => {

    music.volume = 0;
    music.play();

    let volume = 0;

    const fade = setInterval(() => {

        volume += 0.02;

        if(volume >= 0.35){
            volume = 0.35;
            clearInterval(fade);
        }

        music.volume = volume;

    }, 100);

    overlay.classList.add("overlay-hidden");

});