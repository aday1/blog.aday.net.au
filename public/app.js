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
})();
