const year = document.querySelector("#year");
year.textContent = new Date().getFullYear();

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

loadLatestBroadcast();

const animatedElements = document.querySelectorAll(
  ".broadcast-panel, .section-heading, .series-card, .about-grid"
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
