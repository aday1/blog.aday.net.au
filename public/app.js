(() => {
  const body = document.body;
  const cursor = document.getElementById("retroCursor");

  const finishBoot = () => body.classList.remove("boot-seq");
  window.addEventListener("load", () => setTimeout(finishBoot, 820));
  setTimeout(finishBoot, 1200);

  if (cursor) {
    window.addEventListener("mousemove", (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  const scramble = (el, target) => {
    let frame = 0;
    const max = target.length + 10;
    const tick = () => {
      let out = "";
      for (let i = 0; i < target.length; i++) {
        out += i < frame - 5 ? target[i] : chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      frame += 1;
      if (frame <= max) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    tick();
  };

  document.querySelectorAll(".decrypt").forEach((node, i) => {
    const text = node.textContent || "";
    setTimeout(() => scramble(node, text), 220 + i * 140);
  });
})();
