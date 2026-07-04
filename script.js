const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

// latest.json controls the current broadcast information.
const broadcastElements = {
  title: document.querySelector("#current-broadcast-title"),
  status: document.querySelector("#broadcast-status-value"),
  series: document.querySelector("#broadcast-series-value"),
  meta: document.querySelector("#broadcast-meta"),
  description: document.querySelector("#broadcast-description"),
  episode: document.querySelector("#broadcast-episode"),
  nextTransmission: document.querySelector("#broadcast-next-transmission"),
  button: document.querySelector("#broadcast-button"),
  buttonText: document.querySelector("#broadcast-button-text")
};

function updateBroadcastTitle(title, episode) {
  const episodePattern = new RegExp(`\s*#${episode}\s*$`, "i");
  const titleWithoutEpisode = title.replace(episodePattern, "").trim();
  const words = titleWithoutEpisode.split(/\s+/);
  const firstWord = words.shift();

  broadcastElements.title.replaceChildren(document.createTextNode(firstWord));

  if (words.length) {
    broadcastElements.title.append(
      document.createElement("br"),
      document.createTextNode(`${words.join(" ")} `)
    );
  } else {
    broadcastElements.title.append(document.createTextNode(" "));
  }

  const episodeNumber = document.createElement("span");
  episodeNumber.className = "episode-number";
  episodeNumber.textContent = `#${episode}`;
  broadcastElements.title.append(episodeNumber);
}

async function loadLatestBroadcast() {
  try {
    const response = await fetch("latest.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Unable to load latest.json (${response.status})`);
    }

    const latest = await response.json();

    if (latest.title && latest.episode) updateBroadcastTitle(latest.title, latest.episode);
    if (latest.status) broadcastElements.status.textContent = latest.status;
    if (latest.series) broadcastElements.series.textContent = latest.series;
    if (latest.meta) broadcastElements.meta.textContent = latest.meta;
    if (latest.description) broadcastElements.description.textContent = latest.description;
    if (latest.episode) broadcastElements.episode.textContent = latest.episode;
    if (latest.nextTransmission) broadcastElements.nextTransmission.textContent = latest.nextTransmission;
    if (latest.buttonText) broadcastElements.buttonText.textContent = latest.buttonText;
    if (latest.url) broadcastElements.button.href = latest.url;
  } catch (error) {
    console.warn("Using the built-in broadcast information.", error);
  }
}

if (broadcastElements.title) loadLatestBroadcast();

const seriesData = window.DNR_SERIES || [];

function renderSeriesArchive() {
  const archiveGrid = document.querySelector("#series-archive");

  if (!archiveGrid || !seriesData.length) return;

  archiveGrid.innerHTML = seriesData.map((item) => `
    <article class="archive-card${item.status === "ON AIR" ? " active" : ""}">
      <a class="archive-image-link" href="${item.detailPage}">
        <img src="${item.thumbnail}" alt="${item.title} series artwork" loading="lazy">
      </a>
      <div class="archive-card-content">
        <div class="archive-card-meta">
          <span class="archive-status">${item.status}</span>
          <span>Episodes / ${item.episodeCount}</span>
        </div>
        <h2><a href="${item.detailPage}">${item.title}</a></h2>
        <p>${item.description}</p>
        <div class="archive-actions">
          <a href="${item.detailPage}">Open file</a>
          <a href="${item.playlistUrl}" target="_blank" rel="noopener noreferrer">Open playlist ↗</a>
        </div>
      </div>
    </article>
  `).join("");
}

function syncSeriesPlaylistButtons() {
  document.querySelectorAll("[data-series-id]").forEach((button) => {
    const series = seriesData.find((item) => item.id === button.dataset.seriesId);

    if (series) button.href = series.playlistUrl;
  });
}

renderSeriesArchive();
syncSeriesPlaylistButtons();

const animatedElements = document.querySelectorAll(
  ".broadcast-panel, .section-heading, .series-card, .about-grid, .archive-intro, .archive-card"
);

animatedElements.forEach((element) => element.classList.add("reveal"));

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

animatedElements.forEach((element) => observer.observe(element));
