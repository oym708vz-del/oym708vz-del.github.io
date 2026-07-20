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

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function updateBroadcastTitle(title, episode) {
  const episodePattern = new RegExp(`\\s*#${episode}\\s*$`, "i");
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
const videoData = window.DNR_VIDEOS || [];

function renderSeriesArchive() {
  const archiveGrid = document.querySelector("#series-archive");

  if (!archiveGrid || !seriesData.length) return;

  archiveGrid.innerHTML = seriesData.map((item) => {
    const detailLink = `series-detail.html?id=${encodeURIComponent(item.seriesDetailId || item.id)}`;

    return `
      <article class="archive-card${item.status === "ON AIR" ? " active" : ""}">
        <a class="archive-image-link" href="${detailLink}" aria-label="Open ${escapeHtml(item.title)} series file">
          <img src="${item.thumbnail}" alt="${item.title} series artwork" loading="lazy">
        </a>
        <div class="archive-card-content">
          <div class="archive-card-meta">
            <span class="archive-status">${item.status}</span>
            <span>Episodes / ${item.episodeCount}</span>
          </div>
          <h2><a href="${detailLink}">${item.title}</a></h2>
          <p>${item.description}</p>
          <div class="archive-actions">
            <a href="${detailLink}">Open series file</a>
            <a href="${item.playlistUrl}" target="_blank" rel="noopener noreferrer">Open playlist</a>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function syncSeriesPlaylistButtons() {
  document.querySelectorAll("[data-series-id]").forEach((button) => {
    const series = seriesData.find((item) => item.id === button.dataset.seriesId);

    if (series) button.href = series.playlistUrl;
  });
}

function renderVideoArchive() {
  const videoGrid = document.querySelector("#video-archive");

  if (!videoGrid || !videoData.length) return;

  videoGrid.innerHTML = videoData.map((video) => `
    <article class="archive-card transmission-card">
      <a class="archive-image-link" href="${video.videoUrl}" target="_blank" rel="noopener noreferrer">
        <img src="${video.thumbnail}" alt="${video.title} thumbnail" loading="lazy">
      </a>
      <div class="archive-card-content">
        <div class="transmission-date">
          <span>Broadcast date</span>
          <strong>${video.broadcastDate}</strong>
        </div>
        <div class="transmission-title">
          <span>Transmission title</span>
          <h2>${video.title}</h2>
        </div>
        <div class="transmission-meta">
          <p><span>Series</span><strong>${video.seriesName}</strong></p>
          <p><span>Episode</span><strong>${video.episode}</strong></p>
          <p><span>Status</span><strong>${video.status}</strong></p>
        </div>
        <p class="transmission-description">${video.description}</p>
        <div class="archive-actions">
          <a href="${video.seriesPage}">Open series</a>
          <a href="${video.videoUrl}" target="_blank" rel="noopener noreferrer">Open video</a>
        </div>
      </div>
    </article>
  `).join("");
}

function renderBroadcastFilters(broadcasts, activeSeries = "ALL") {
  const filterList = document.querySelector("#broadcast-filter-list");

  if (!filterList) return;

  const seriesNames = ["ALL", ...new Set(broadcasts.map((broadcast) => broadcast.series).filter(Boolean))];

  filterList.innerHTML = seriesNames.map((series) => {
    const isActive = series === activeSeries;

    return `
      <button class="broadcast-filter${isActive ? " active" : ""}" type="button" data-series="${escapeHtml(series)}" aria-pressed="${isActive}">
        ${escapeHtml(series)}
      </button>
    `;
  }).join("");
}

function renderBroadcastCards(broadcasts, activeSeries = "ALL") {
  const archive = document.querySelector("#broadcast-archive");

  if (!archive) return;

  const filteredBroadcasts = activeSeries === "ALL"
    ? broadcasts
    : broadcasts.filter((broadcast) => broadcast.series === activeSeries);

  archive.innerHTML = filteredBroadcasts.map((broadcast) => `
    <article class="broadcast-log-card">
      <div class="broadcast-log-topline">
        <time datetime="${escapeHtml(broadcast.publishedDate)}">${escapeHtml(broadcast.displayDate || broadcast.publishedDate)}</time>
        <span class="broadcast-log-status">${escapeHtml(broadcast.status)}</span>
      </div>
      <h2>${escapeHtml(broadcast.title)}</h2>
      <div class="broadcast-log-meta">
        <p><span>Series</span><strong>${escapeHtml(broadcast.series)}</strong></p>
        <p><span>Episode</span><strong>${escapeHtml(broadcast.episode)}</strong></p>
      </div>
      <p class="broadcast-log-frequency">${escapeHtml(broadcast.meta)}</p>
      <p class="broadcast-log-description">${escapeHtml(broadcast.description)}</p>
      <a class="youtube-button broadcast-log-button" href="${escapeHtml(broadcast.url)}" target="_blank" rel="noopener noreferrer">WATCH TRANSMISSION</a>
    </article>
  `).join("");
}

async function loadBroadcastArchive() {
  const archive = document.querySelector("#broadcast-archive");
  const filterList = document.querySelector("#broadcast-filter-list");

  if (!archive || !filterList) return;

  try {
    const response = await fetch("broadcasts.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Unable to load broadcasts.json (${response.status})`);
    }

    const broadcasts = await response.json();
    const sortedBroadcasts = broadcasts
      .slice()
      .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));

    let activeSeries = "ALL";

    renderBroadcastFilters(sortedBroadcasts, activeSeries);
    renderBroadcastCards(sortedBroadcasts, activeSeries);

    filterList.addEventListener("click", (event) => {
      const button = event.target.closest(".broadcast-filter");

      if (!button) return;

      activeSeries = button.dataset.series;
      renderBroadcastFilters(sortedBroadcasts, activeSeries);
      renderBroadcastCards(sortedBroadcasts, activeSeries);
    });
  } catch (error) {
    console.warn("The broadcast archive could not be loaded.", error);
    filterList.innerHTML = "";
    archive.innerHTML = `
      <article class="broadcast-log-card broadcast-log-error">
        <h2>SIGNAL LOST</h2>
        <p>The broadcast archive could not be loaded.</p>
      </article>
    `;
  }
}

function renderDetailList(items = []) {
  if (!items.length) {
    return `
      <div class="series-detail-empty">
        <h2>NO TRANSMISSIONS FOUND</h2>
        <p>This frequency has not yet been recorded.</p>
      </div>
    `;
  }

  return `
    <div class="transmission-list">
      ${items.map((episode) => `
        <article class="transmission-list-item">
          <span class="transmission-list-episode">${escapeHtml(episode.episode)}</span>
          <div>
            <h3>${escapeHtml(episode.title)}</h3>
            <p>${escapeHtml(episode.status)}</p>
          </div>
          <span>${escapeHtml(episode.duration)}</span>
          <time>${escapeHtml(episode.publishedDate)}</time>
          <a href="${escapeHtml(episode.url)}" target="_blank" rel="noopener noreferrer">Watch</a>
        </article>
      `).join("")}
    </div>
  `;
}

function renderProfileList(items = []) {
  return `
    <ul class="series-detail-tags">
      ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function renderSeriesNavigation(seriesDetails, currentIndex) {
  const previousSeries = seriesDetails[currentIndex - 1];
  const nextSeries = seriesDetails[currentIndex + 1];

  if (!previousSeries && !nextSeries) return "";

  return `
    <nav class="series-detail-nextprev" aria-label="Previous and next series">
      ${previousSeries ? `
        <a href="series-detail.html?id=${encodeURIComponent(previousSeries.id)}">
          <span>Previous Series</span>
          <strong>${escapeHtml(previousSeries.name)}</strong>
        </a>
      ` : ""}
      ${nextSeries ? `
        <a href="series-detail.html?id=${encodeURIComponent(nextSeries.id)}">
          <span>Next Series</span>
          <strong>${escapeHtml(nextSeries.name)}</strong>
        </a>
      ` : ""}
    </nav>
  `;
}

function renderSeriesDetail(series, seriesDetails, currentIndex) {
  const root = document.querySelector("#series-detail-root");

  if (!root) return;

  const sortedEpisodes = (series.episodes || [])
    .slice()
    .sort((a, b) => Number(a.episode) - Number(b.episode));

  document.title = `${series.name} | DARK NETWORK RADIO`;

  root.innerHTML = `
    <section class="series-detail-hero" aria-labelledby="series-detail-title">
      <img class="series-detail-cover" src="${escapeHtml(series.coverImage)}" alt="${escapeHtml(series.displayName)} series cover artwork" loading="eager">
      <div class="series-detail-hero-overlay" aria-hidden="true"></div>
      <div class="series-detail-hero-content">
        <p class="series-detail-kicker">Series ${escapeHtml(series.seriesNumber)}</p>
        <p class="series-detail-status">${escapeHtml(series.status)}</p>
        <h1 id="series-detail-title">${escapeHtml(series.name)}</h1>
        <p class="series-detail-tagline">${escapeHtml(series.tagline)}</p>
      </div>
    </section>

    <section class="series-detail-main">
      <article class="series-detail-file">
        <p class="section-label">Concept</p>
        <h2>${escapeHtml(series.heading)}</h2>
        <p>${escapeHtml(series.concept)}</p>
        <p>${escapeHtml(series.atmosphere)}</p>
      </article>

      <section class="series-detail-grid" aria-label="Series profile">
        <article>
          <p class="section-label">Sound Profile</p>
          ${renderProfileList(series.soundProfile)}
        </article>
        <article>
          <p class="section-label">Visual Identity</p>
          ${renderProfileList(series.visualIdentity)}
        </article>
      </section>

      <section class="series-detail-transmissions" aria-labelledby="transmission-list-title">
        <div class="series-detail-section-heading">
          <p class="section-label">Transmission List</p>
          <h2 id="transmission-list-title">Recorded Signals</h2>
        </div>
        ${renderDetailList(sortedEpisodes)}
      </section>

      ${renderSeriesNavigation(seriesDetails, currentIndex)}

      <a class="back-link series-detail-return" href="series.html">Return to Series Archive</a>
    </section>
  `;

  const cover = root.querySelector(".series-detail-cover");
  cover.addEventListener("error", () => {
    root.querySelector(".series-detail-hero").classList.add("image-lost");
    cover.remove();
  });
}

function renderSeriesLost() {
  const root = document.querySelector("#series-detail-root");

  if (!root) return;

  document.title = "SIGNAL LOST | DARK NETWORK RADIO";
  root.innerHTML = `
    <section class="series-detail-lost">
      <p class="section-label">Frequency lookup</p>
      <h1>SIGNAL<br><em>LOST</em></h1>
      <p>The requested series frequency could not be located.</p>
      <a class="youtube-button" href="series.html">RETURN TO SERIES ARCHIVE</a>
    </section>
  `;
}

async function loadSeriesDetail() {
  const root = document.querySelector("#series-detail-root");

  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    renderSeriesLost();
    return;
  }

  try {
    const response = await fetch("series-details.json", { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Unable to load series-details.json (${response.status})`);
    }

    const seriesDetails = await response.json();
    const currentIndex = seriesDetails.findIndex((series) => series.id === id);

    if (currentIndex === -1) {
      renderSeriesLost();
      return;
    }

    renderSeriesDetail(seriesDetails[currentIndex], seriesDetails, currentIndex);
  } catch (error) {
    console.warn("The requested series frequency could not be loaded.", error);
    renderSeriesLost();
  }
}

const preferredSearchTags = [
  "focus",
  "drive",
  "night",
  "cyberpunk",
  "ambient",
  "rain",
  "sleep",
  "relax",
  "cinematic",
  "dark"
];

function normalizeSearchValue(value) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeType(value) {
  const type = normalizeSearchValue(value);

  if (type === "broadcasts") return "broadcast";
  if (type === "series") return "series";
  if (type === "broadcast") return "broadcast";
  return "all";
}

function createSearchText(parts) {
  return parts.flat(Infinity).filter(Boolean).join(" ").toLowerCase();
}

function createSeriesLookup(seriesItems) {
  return seriesItems.reduce((lookup, series, index) => {
    lookup[normalizeSearchValue(series.displayName)] = { series, index };
    lookup[normalizeSearchValue(series.name)] = { series, index };
    return lookup;
  }, {});
}

function getSeriesOrderValue(item, seriesLookup) {
  if (item.type === "series") return Number(item.seriesNumber) || 999;

  const seriesMatch = seriesLookup[normalizeSearchValue(item.series)];
  return seriesMatch ? Number(seriesMatch.series.seriesNumber) || 999 : 999;
}

function getEpisodeOrderValue(item) {
  return Number(item.episode) || 999;
}

function buildSearchRecords(broadcasts, seriesItems) {
  const seriesLookup = createSeriesLookup(seriesItems);

  const broadcastRecords = broadcasts.map((broadcast) => {
    const seriesMatch = seriesLookup[normalizeSearchValue(broadcast.series)];

    return {
      ...broadcast,
      type: "broadcast",
      typeLabel: "BROADCAST",
      sortTitle: broadcast.title,
      seriesOrder: seriesMatch ? Number(seriesMatch.series.seriesNumber) || 999 : 999,
      searchText: createSearchText([
        broadcast.title,
        broadcast.series,
        broadcast.meta,
        broadcast.description,
        broadcast.tags
      ])
    };
  });

  const seriesRecords = seriesItems.map((series, index) => ({
    ...series,
    type: "series",
    typeLabel: "SERIES FILE",
    title: series.name,
    series: series.displayName,
    sortTitle: series.name,
    seriesOrder: Number(series.seriesNumber) || index + 1,
    searchText: createSearchText([
      series.name,
      series.displayName,
      series.tagline,
      series.heading,
      series.concept,
      series.atmosphere,
      series.soundProfile,
      series.visualIdentity,
      series.tags
    ])
  }));

  return [...broadcastRecords, ...seriesRecords];
}

function getSearchTags(records) {
  const uniqueTags = [...new Set(records.flatMap((record) => record.tags || []).map(normalizeSearchValue).filter(Boolean))];
  const preferred = preferredSearchTags.filter((tag) => uniqueTags.includes(tag));
  const remaining = uniqueTags.filter((tag) => !preferred.includes(tag)).sort();

  return ["all", ...preferred, ...remaining];
}

function getSearchSeriesOptions(broadcasts, seriesItems) {
  const names = [];
  const seen = new Set();

  seriesItems.forEach((series) => {
    const key = normalizeSearchValue(series.displayName);
    if (!seen.has(key)) {
      seen.add(key);
      names.push(series.displayName);
    }
  });

  broadcasts.forEach((broadcast) => {
    const key = normalizeSearchValue(broadcast.series);
    if (!seen.has(key)) {
      seen.add(key);
      names.push(broadcast.series);
    }
  });

  return names;
}

function readSearchState() {
  const params = new URLSearchParams(window.location.search);
  const sort = normalizeSearchValue(params.get("sort"));

  return {
    query: params.get("q") || "",
    type: normalizeType(params.get("type")),
    tag: normalizeSearchValue(params.get("tag")) || "all",
    series: params.get("series") || "all",
    sort: ["newest", "oldest", "series", "title"].includes(sort) ? sort : "newest",
    visibleCount: 24
  };
}

function updateSearchUrl(state) {
  const params = new URLSearchParams();

  if (state.query.trim()) params.set("q", state.query.trim());
  if (state.type !== "all") params.set("type", state.type);
  if (state.tag !== "all") params.set("tag", state.tag);
  if (state.series !== "all") params.set("series", state.series);
  if (state.sort !== "newest") params.set("sort", state.sort);

  const query = params.toString();
  const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
  history.replaceState(null, "", nextUrl);
}

function matchesSearchQuery(record, query) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);

  return terms.every((term) => record.searchText.includes(term));
}

function matchesSearchState(record, state) {
  const matchesType = state.type === "all" || record.type === state.type;
  const matchesTag = state.tag === "all" || (record.tags || []).map(normalizeSearchValue).includes(state.tag);
  const matchesSeries = state.series === "all" || normalizeSearchValue(record.series) === normalizeSearchValue(state.series);
  const matchesQuery = !state.query.trim() || matchesSearchQuery(record, state.query);

  return matchesType && matchesTag && matchesSeries && matchesQuery;
}

function sortSearchRecords(records, sortMode, seriesLookup) {
  return records.slice().sort((a, b) => {
    if (sortMode === "oldest") {
      if (a.type !== b.type) return a.type === "series" ? -1 : 1;
      if (a.type === "broadcast") return new Date(a.publishedDate) - new Date(b.publishedDate);
      return Number(a.seriesNumber) - Number(b.seriesNumber);
    }

    if (sortMode === "series") {
      const seriesDiff = getSeriesOrderValue(a, seriesLookup) - getSeriesOrderValue(b, seriesLookup);
      if (seriesDiff) return seriesDiff;
      if (a.type !== b.type) return a.type === "series" ? -1 : 1;
      return getEpisodeOrderValue(a) - getEpisodeOrderValue(b);
    }

    if (sortMode === "title") {
      return a.sortTitle.localeCompare(b.sortTitle);
    }

    if (a.type !== b.type) return a.type === "broadcast" ? -1 : 1;
    if (a.type === "broadcast") return new Date(b.publishedDate) - new Date(a.publishedDate);
    return Number(b.seriesNumber) - Number(a.seriesNumber);
  });
}

function renderSearchTags(tags, activeTag) {
  const container = document.querySelector("#search-tag-filters");

  if (!container) return;

  container.innerHTML = tags.map((tag) => {
    const label = tag === "all" ? "ALL FREQUENCIES" : tag.toUpperCase();
    const isActive = tag === activeTag;

    return `
      <button class="search-pill${isActive ? " active" : ""}" type="button" data-tag="${escapeHtml(tag)}" aria-pressed="${isActive}">
        ${escapeHtml(label)}
      </button>
    `;
  }).join("");
}

function renderSearchSeriesOptions(seriesNames, activeSeries) {
  const select = document.querySelector("#search-series");

  if (!select) return;

  select.innerHTML = `
    <option value="all">ALL SERIES</option>
    ${seriesNames.map((series) => `<option value="${escapeHtml(series)}">${escapeHtml(series)}</option>`).join("")}
  `;

  select.value = seriesNames.includes(activeSeries) ? activeSeries : "all";
}

function renderSearchTypeButtons(activeType) {
  document.querySelectorAll("#search-type-filters [data-type]").forEach((button) => {
    const isActive = button.dataset.type === activeType;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderSearchCard(record) {
  const tags = (record.tags || []).map((tag) => `<span>${escapeHtml(tag.toUpperCase())}</span>`).join("");

  if (record.type === "broadcast") {
    return `
      <article class="search-result-card">
        <div class="search-result-topline">
          <span>${record.typeLabel}</span>
          <time datetime="${escapeHtml(record.publishedDate)}">${escapeHtml(record.displayDate || record.publishedDate)}</time>
        </div>
        <h2>${escapeHtml(record.title)}</h2>
        <div class="search-result-meta">
          <p><span>Series</span><strong>${escapeHtml(record.series)}</strong></p>
          <p><span>Status</span><strong>${escapeHtml(record.status)}</strong></p>
        </div>
        <p class="search-result-frequency">${escapeHtml(record.meta)}</p>
        <p class="search-result-description">${escapeHtml(record.description)}</p>
        <div class="search-result-tags">${tags}</div>
        <a class="youtube-button search-result-action" href="${escapeHtml(record.url)}" target="_blank" rel="noopener noreferrer">WATCH TRANSMISSION</a>
      </article>
    `;
  }

  return `
    <article class="search-result-card">
      <div class="search-result-topline">
        <span>${record.typeLabel}</span>
        <span>Series ${escapeHtml(record.seriesNumber)}</span>
      </div>
      <h2>${escapeHtml(record.name)}</h2>
      <div class="search-result-meta">
        <p><span>Series</span><strong>${escapeHtml(record.displayName)}</strong></p>
        <p><span>Status</span><strong>${escapeHtml(record.status)}</strong></p>
      </div>
      <p class="search-result-frequency">${escapeHtml(record.tagline)}</p>
      <p class="search-result-description">${escapeHtml(record.atmosphere)}</p>
      <div class="search-result-tags">${tags}</div>
      <div class="search-result-actions">
        <a class="youtube-button search-result-action" href="series-detail.html?id=${encodeURIComponent(record.id)}">OPEN SERIES FILE</a>
        ${record.playlistUrl ? `<a class="search-secondary-action" href="${escapeHtml(record.playlistUrl)}" target="_blank" rel="noopener noreferrer">OPEN PLAYLIST</a>` : ""}
      </div>
    </article>
  `;
}

function renderNoSearchResults() {
  return `
    <article class="search-message-card">
      <h2>NO SIGNALS FOUND</h2>
      <p>No transmissions match the selected frequency.</p>
      <button class="search-reset" type="button" data-reset-search>RESET FILTERS</button>
    </article>
  `;
}

function renderSearchLoadError() {
  const results = document.querySelector("#search-results");
  const count = document.querySelector("#search-count");
  const loadMore = document.querySelector("#search-load-more");

  if (count) count.textContent = "SIGNAL LOST";
  if (loadMore) loadMore.hidden = true;
  if (results) {
    results.innerHTML = `
      <article class="search-message-card">
        <h2>SIGNAL LOST</h2>
        <p>The signal database could not be loaded.</p>
        <button class="search-reset" type="button" data-retry-search>RETRY CONNECTION</button>
      </article>
    `;
    results.querySelector("[data-retry-search]").addEventListener("click", loadSignalSearch);
  }
}

function updateSearchCount(count) {
  const countElement = document.querySelector("#search-count");

  if (!countElement) return;

  countElement.textContent = `${count} ${count === 1 ? "SIGNAL" : "SIGNALS"} FOUND`;
}

function initializeSearchControls(state, tags, seriesNames, applySearch, resetSearch, retrySearch) {
  const queryInput = document.querySelector("#signal-query");
  const typeFilters = document.querySelector("#search-type-filters");
  const tagFilters = document.querySelector("#search-tag-filters");
  const seriesSelect = document.querySelector("#search-series");
  const sortSelect = document.querySelector("#search-sort");
  const resetButton = document.querySelector("#search-reset");
  const results = document.querySelector("#search-results");
  let debounceTimer;

  queryInput.value = state.query;
  sortSelect.value = state.sort;
  renderSearchTypeButtons(state.type);
  renderSearchTags(tags, state.tag);
  renderSearchSeriesOptions(seriesNames, state.series);

  queryInput.addEventListener("input", () => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => {
      state.query = queryInput.value;
      state.visibleCount = 24;
      applySearch();
    }, 160);
  });

  typeFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-type]");
    if (!button) return;

    state.type = button.dataset.type;
    state.visibleCount = 24;
    applySearch();
  });

  tagFilters.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tag]");
    if (!button) return;

    state.tag = button.dataset.tag;
    state.visibleCount = 24;
    applySearch();
  });

  seriesSelect.addEventListener("change", () => {
    state.series = seriesSelect.value;
    state.visibleCount = 24;
    applySearch();
  });

  sortSelect.addEventListener("change", () => {
    state.sort = sortSelect.value;
    state.visibleCount = 24;
    applySearch();
  });

  resetButton.addEventListener("click", resetSearch);
  results.addEventListener("click", (event) => {
    if (event.target.closest("[data-reset-search]")) resetSearch();
    if (event.target.closest("[data-retry-search]")) retrySearch();
  });
}

async function loadSignalSearch() {
  const searchRoot = document.querySelector("#search-results");

  if (!searchRoot) return;

  try {
    const [broadcastResponse, seriesResponse] = await Promise.all([
      fetch("broadcasts.json", { cache: "no-cache" }),
      fetch("series-details.json", { cache: "no-cache" })
    ]);

    if (!broadcastResponse.ok || !seriesResponse.ok) {
      throw new Error("Unable to load the signal database.");
    }

    const [broadcasts, seriesItems] = await Promise.all([
      broadcastResponse.json(),
      seriesResponse.json()
    ]);

    const state = readSearchState();
    const records = buildSearchRecords(broadcasts, seriesItems);
    const seriesLookup = createSeriesLookup(seriesItems);
    const tags = getSearchTags(records);
    const seriesNames = getSearchSeriesOptions(broadcasts, seriesItems);
    const loadMore = document.querySelector("#search-load-more");

    if (!tags.includes(state.tag)) state.tag = "all";
    if (!seriesNames.includes(state.series)) state.series = "all";

    const applySearch = () => {
      const filtered = sortSearchRecords(
        records.filter((record) => matchesSearchState(record, state)),
        state.sort,
        seriesLookup
      );
      const visible = filtered.slice(0, state.visibleCount);

      renderSearchTypeButtons(state.type);
      renderSearchTags(tags, state.tag);
      renderSearchSeriesOptions(seriesNames, state.series);
      updateSearchCount(filtered.length);
      updateSearchUrl(state);

      searchRoot.innerHTML = filtered.length ? visible.map(renderSearchCard).join("") : renderNoSearchResults();
      loadMore.hidden = filtered.length <= state.visibleCount;
    };

    const resetSearch = () => {
      state.query = "";
      state.type = "all";
      state.tag = "all";
      state.series = "all";
      state.sort = "newest";
      state.visibleCount = 24;
      document.querySelector("#signal-query").value = "";
      document.querySelector("#search-sort").value = "newest";
      applySearch();
    };

    const retrySearch = () => loadSignalSearch();

    initializeSearchControls(state, tags, seriesNames, applySearch, resetSearch, retrySearch);
    loadMore.addEventListener("click", () => {
      state.visibleCount += 24;
      applySearch();
    });
    applySearch();
  } catch (error) {
    console.warn("The signal database could not be loaded.", error);
    renderSearchLoadError();
  }
}

renderSeriesArchive();
syncSeriesPlaylistButtons();
renderVideoArchive();
loadBroadcastArchive();
loadSeriesDetail();
loadSignalSearch();

const animatedElements = document.querySelectorAll(
  ".broadcast-panel, .section-heading, .series-card, .about-grid, .archive-intro, .archive-card, .broadcast-archive-controls, .series-detail-loading, .search-console"
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
