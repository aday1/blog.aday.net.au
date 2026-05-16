(() => {
  const AM5_BASE = "https://cdn.amcharts.com/lib/5";
  const charts = [];

  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });

  const loadAm5 = async () => {
    await loadScript(`${AM5_BASE}/index.js`);
    await loadScript(`${AM5_BASE}/xy.js`);
    await loadScript(`${AM5_BASE}/themes/Animated.js`);
    return window.am5;
  };

  const parseDate = (value) => {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : null;
  };

  const collectDomEvents = (root, itemSelector, dateSelector) => {
    if (!root) return [];
    return [...root.querySelectorAll(itemSelector)]
      .map((el) => {
        const timeEl = el.querySelector(dateSelector);
        const raw =
          el.getAttribute("data-date") ||
          timeEl?.getAttribute("datetime") ||
          timeEl?.textContent?.trim() ||
          "";
        const d = parseDate(raw);
        if (!d) return null;
        const title =
          el.querySelector(".timeline-entry-title a, .devlog-commit-title")?.textContent?.trim() ||
          el.dataset.title ||
          "event";
        return {
          el,
          date: d.toISOString().slice(0, 10),
          timestamp: d.getTime(),
          title
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  const bucketDaily = (events) => {
    const map = new Map();
    events.forEach((ev) => {
      map.set(ev.date, (map.get(ev.date) || 0) + 1);
    });
    return [...map.entries()].map(([date, value]) => ({
      date,
      timestamp: parseDate(date).getTime(),
      value,
      label: String(value)
    }));
  };

  const wireBracketControls = (explorer, events, applyRange) => {
    const startInput = explorer.querySelector('[data-range-start]');
    const endInput = explorer.querySelector('[data-range-end]');
    const focusBtn = explorer.querySelector('[data-range-focus]');
    const clearBtn = explorer.querySelector('[data-range-clear]');
    if (!startInput || !endInput || !events.length) return;

    const minDate = events[0].date;
    const maxDate = events[events.length - 1].date;
    startInput.min = minDate;
    startInput.max = maxDate;
    endInput.min = minDate;
    endInput.max = maxDate;
    startInput.value = minDate;
    endInput.value = maxDate;

    const runFocus = () => {
      const s = parseDate(startInput.value);
      const e = parseDate(endInput.value);
      if (!s || !e) return;
      const lo = Math.min(s.getTime(), e.getTime());
      const hi = Math.max(s.getTime(), e.getTime());
      applyRange(lo, hi, { filter: true });
    };

    focusBtn?.addEventListener("click", runFocus);
    clearBtn?.addEventListener("click", () => {
      startInput.value = minDate;
      endInput.value = maxDate;
      applyRange(-Infinity, Infinity, { filter: false });
    });
  };

  const createRangeExplorer = async ({ container, listRoot, itemSelector, dateSelector, label }) => {
    const chartEl = container.querySelector(".range-chart");
    const explorer = container.closest(".range-explorer");
    if (!chartEl || !listRoot) return;

    const events = collectDomEvents(listRoot, itemSelector, dateSelector);
    if (!events.length) {
      chartEl.textContent = "No dated events in this section.";
      return;
    }

    const data = bucketDaily(events);
    const applyRange = (lo, hi, { filter } = {}) => {
      listRoot.classList.toggle("range-filter-active", !!filter);
      events.forEach((ev) => {
        const inRange = ev.timestamp >= lo && ev.timestamp <= hi;
        ev.el.classList.toggle("range-out", filter && !inRange);
        ev.el.classList.toggle("range-in", filter && inRange);
      });
    };

    wireBracketControls(explorer, events, applyRange);

    const am5 = await loadAm5();
    const root = am5.Root.new(chartEl);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: false,
        wheelX: "panX",
        wheelY: "zoomX",
        pinchZoomX: true,
        paddingTop: 8,
        paddingBottom: 4
      })
    );

    chart.set(
      "scrollbarX",
      am5.Scrollbar.new(root, { orientation: "horizontal" })
    );

    const xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 50,
      minorGridEnabled: true
    });
    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "day", count: 1 },
        renderer: xRenderer,
        tooltip: am5.Tooltip.new(root, {}),
        extraMin: 0.02,
        extraMax: 0.02
      })
    );

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
        min: 0
      })
    );

    const series = chart.series.push(
      am5xy.LineSeries.new(root, {
        name: label,
        xAxis,
        yAxis,
        valueYField: "value",
        valueXField: "timestamp",
        stroke: am5.color(0x76c8ff),
        fill: am5.color(0x76c8ff),
        tooltip: am5.Tooltip.new(root, { labelText: "{date}: {valueY} event(s)" })
      })
    );

    series.strokes.template.setAll({ strokeWidth: 2 });
    series.fills.template.setAll({ fillOpacity: 0.12, visible: true });

    series.bullets.push(() => {
      const circle = am5.Circle.new(root, {
        radius: 5,
        fill: series.get("fill"),
        stroke: root.interfaceColors.get("background"),
        strokeWidth: 2,
        cursorOverStyle: "pointer"
      });
      circle.events.on("click", (ev) => {
        const di = ev.target.dataItem;
        const ts = di?.get("valueX");
        if (!ts) return;
        const day = new Date(ts).toISOString().slice(0, 10);
        const match = events.find((e) => e.date === day);
        const target = match?.el;
        if (!target) return;
        target.classList.add("range-focus-ping");
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => target.classList.remove("range-focus-ping"), 1200);
      });
      return am5.Bullet.new(root, { sprite: circle });
    });

    series.bullets.push(() =>
      am5.Bullet.new(root, {
        locationX: 0,
        sprite: am5.Label.new(root, {
          text: "{label}",
          centerY: am5.p100,
          centerX: am5.p50,
          populateText: true,
          fontSize: 10,
          fill: am5.color(0xc8e0f8),
          dy: -8
        })
      })
    );

    series.data.setAll(data);
    series.appear(600);
    chart.appear(600, 100);

    xAxis.on("start", syncAxisRange);
    xAxis.on("end", syncAxisRange);
    function syncAxisRange() {
      const start = xAxis.get("start");
      const end = xAxis.get("end");
      if (start == null || end == null) return;
      const minTs = xAxis.positionToDate(start).getTime();
      const maxTs = xAxis.positionToDate(end).getTime();
      const startInput = explorer?.querySelector("[data-range-start]");
      const endInput = explorer?.querySelector("[data-range-end]");
      if (startInput) startInput.value = new Date(minTs).toISOString().slice(0, 10);
      if (endInput) endInput.value = new Date(maxTs).toISOString().slice(0, 10);
    }

    charts.push({ root, destroy: () => root.dispose() });
  };

  const rangeExplorerHtml = (chartId, title) => `<div class="range-explorer">
  <div class="range-explorer-head">
    <h3>${title}</h3>
    <span class="range-hint">Pan / zoom the chart (CodePen-style range lane). Set dates and Focus range to filter the list.</span>
  </div>
  <div id="${chartId}" class="range-chart" role="img" aria-label="${title}"></div>
  <div class="range-bracket-controls">
    <label>From <input type="date" data-range-start></label>
    <label>To <input type="date" data-range-end></label>
    <button type="button" data-range-focus>Focus range</button>
    <button type="button" data-range-clear>Clear filter</button>
  </div>
</div>`;

  window.BlogRangeExplorer = { rangeExplorerHtml };

  const boot = async () => {
    const presence = document.getElementById("presenceTimeline");
    if (presence) {
      const list = document.getElementById("presenceTimelineList");
      const container = presence.querySelector(".range-explorer");
      if (container && list) {
        await createRangeExplorer({
          container,
          listRoot: list,
          itemSelector: ".timeline-node",
          dateSelector: "time.date, .date",
          label: "Presence"
        });
      }
    }

    document.querySelectorAll(".devlog-train").forEach(async (train) => {
      const container = train.querySelector(".range-explorer");
      const list = train;
      if (!container) return;
      await createRangeExplorer({
        container,
        listRoot: list,
        itemSelector: ".devlog-entry",
        dateSelector: "time.date",
        label: train.querySelector(".devlog-train-title")?.textContent?.trim() || "Dev log"
      });
    });
  };

  const initWhenVisible = () => {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      boot().catch((err) => console.warn("blog-range:", err));
    };

    window.addEventListener("blog-panel-change", (ev) => {
      const id = ev.detail?.panelId;
      if (id === "presence" || id === "devlog") start();
    });

    if (document.querySelector(".blog-panel.is-active[data-panel='presence'], .blog-panel.is-active[data-panel='devlog']")) {
      start();
    }

    if ("requestIdleCallback" in window) {
      requestIdleCallback(start, { timeout: 2500 });
    } else {
      setTimeout(start, 400);
    }
  };

  initWhenVisible();
})();
