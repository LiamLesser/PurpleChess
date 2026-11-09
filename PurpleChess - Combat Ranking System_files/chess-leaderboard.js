(() => {
  const clubMembersUrl = "https://api.chess.com/pub/club/purplechess/members";
  const ratingModes = {
    rapid: { label: "Rapid", statsKey: "chess_rapid" },
    blitz: { label: "Blitz", statsKey: "chess_blitz" },
    bullet: { label: "Bullet", statsKey: "chess_bullet" },
    daily: { label: "Daily", statsKey: "chess_daily" },
  };
  const ratingTiers = [
    { minimum: 2400, name: "HT1", style: "t1" },
    { minimum: 2200, name: "LT1", style: "t1" },
    { minimum: 2000, name: "HT2", style: "t2" },
    { minimum: 1800, name: "LT2", style: "t2" },
    { minimum: 1600, name: "HT3", style: "t3" },
    { minimum: 1400, name: "LT3", style: "t3" },
    { minimum: 1200, name: "HT4", style: "t4" },
    { minimum: 1000, name: "LT4", style: "t4" },
    { minimum: 800, name: "HT5", style: "t5" },
    { minimum: 0, name: "LT5", style: "t5" },
  ];
  const rows = document.getElementById("leaderboard-rows");
  const status = document.getElementById("leaderboard-status");
  const modeSelect = document.getElementById("rating-mode");
  const ratingHeading = document.getElementById("leaderboard-rating-heading");
  const refreshButton = document.getElementById("refresh-leaderboard");
  let members = [];
  let loading = false;
  let lastUpdatedAt = null;
  let lastRefreshError = null;

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Chess.com API returned HTTP ${response.status}`);
    }

    return response.json();
  }

  function getTier(rating) {
    return ratingTiers.find((tier) => rating >= tier.minimum) ?? null;
  }

  function getInitials(username) {
    return username.slice(0, 2).toUpperCase();
  }

  function createPlayerCell(member) {
    const link = document.createElement("a");
    link.className = "leaderboard-player";
    link.href = `https://www.chess.com/member/${encodeURIComponent(member.username)}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const fallback = document.createElement("span");
    fallback.className = "leaderboard-avatar-fallback";
    fallback.textContent = getInitials(member.username);
    fallback.setAttribute("aria-hidden", "true");
    link.append(fallback);

    if (member.avatar) {
      const avatar = document.createElement("img");
      avatar.className = "leaderboard-avatar";
      avatar.src = member.avatar;
      avatar.alt = "";
      avatar.addEventListener("error", () => avatar.remove(), { once: true });
      avatar.addEventListener("load", () => fallback.remove(), { once: true });
      link.insertBefore(avatar, fallback);
    }

    const name = document.createElement("span");
    name.textContent = member.username;
    link.append(name);
    return link;
  }

  function renderLeaderboard() {
    const mode = ratingModes[modeSelect.value];
    if (!mode) {
      status.dataset.state = "error";
      status.textContent = "Choose a valid rating type to view the leaderboard.";
      return;
    }
    ratingHeading.textContent = `${mode.label} Rating`;

    const sortedMembers = [...members].sort((a, b) => {
      if (a.ratings[modeSelect.value] == null) return b.ratings[modeSelect.value] == null ? a.username.localeCompare(b.username) : 1;
      if (b.ratings[modeSelect.value] == null) return -1;
      return b.ratings[modeSelect.value] - a.ratings[modeSelect.value] || a.username.localeCompare(b.username);
    });

    rows.replaceChildren();

    for (const [index, member] of sortedMembers.entries()) {
      const rating = member.ratings[modeSelect.value];
      const tier = rating == null ? null : getTier(rating);
      const row = document.createElement("tr");
      const positionCell = document.createElement("td");
      positionCell.className = "leaderboard-position";
      positionCell.textContent = String(index + 1);

      const playerCell = document.createElement("td");
      playerCell.append(createPlayerCell(member));

      const ratingCell = document.createElement("td");
      ratingCell.className = rating == null ? "leaderboard-unrated" : "leaderboard-rating";
      ratingCell.textContent = rating == null ? "Unrated" : rating.toLocaleString();
      ratingCell.setAttribute("aria-label", rating == null ? `${mode.label} rating unavailable` : `${mode.label} rating ${rating}`);

      const tierCell = document.createElement("td");
      if (tier) {
        const badge = document.createElement("span");
        badge.className = `tier-badge ${tier.style} leaderboard-tier`;
        badge.textContent = tier.name;
        tierCell.append(badge);
      } else {
        tierCell.className = "leaderboard-unrated";
        tierCell.textContent = "—";
      }

      row.append(positionCell, playerCell, ratingCell, tierCell);
      rows.append(row);
    }

    if (members.length && lastUpdatedAt && !loading) {
      const failures = members.reduce((total, member) => total + member.failedRequests, 0);
      const unratedCount = members.filter((member) => member.ratings[modeSelect.value] == null).length;
      const updatedAt = lastUpdatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
      const failureMessage = failures ? ` ${failures} player-data request${failures === 1 ? "" : "s"} failed.` : "";
      const unratedMessage = unratedCount ? ` ${unratedCount} member${unratedCount === 1 ? " has" : "s have"} no ${mode.label} rating.` : "";
      const refreshMessage = lastRefreshError
        ? ` Refresh failed (${lastRefreshError.message}); showing the last successful data from ${updatedAt}.`
        : ` Updated ${updatedAt}.`;
      setStatus(`Loaded ${members.length} club members.${refreshMessage}${failureMessage}${unratedMessage}`, failures || lastRefreshError ? "error" : "success");
    }
  }

  async function loadMember(username) {
    const encodedUsername = encodeURIComponent(username);
    const profileUrl = `https://api.chess.com/pub/player/${encodedUsername}`;
    const statsUrl = `${profileUrl}/stats`;
    const [profileResult, statsResult] = await Promise.allSettled([
      fetchJson(profileUrl),
      fetchJson(statsUrl),
    ]);

    const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
    const stats = statsResult.status === "fulfilled" ? statsResult.value : null;
    const ratings = {};
    for (const [key, mode] of Object.entries(ratingModes)) {
      const value = stats?.[mode.statsKey]?.last?.rating;
      ratings[key] = Number.isFinite(value) ? value : null;
    }

    return {
      username,
      avatar: typeof profile?.avatar === "string" ? profile.avatar : null,
      ratings,
      failedRequests: Number(profileResult.status === "rejected") + Number(statsResult.status === "rejected"),
    };
  }

  async function mapWithConcurrency(items, concurrency, callback) {
    const results = new Array(items.length);
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < items.length) {
        const index = nextIndex++;
        results[index] = await callback(items[index]);
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
    return results;
  }

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  async function refreshLeaderboard() {
    if (loading) return;

    loading = true;
    refreshButton.disabled = true;
    refreshButton.textContent = "Refreshing…";
    setStatus("Fetching the PurpleChess club roster and Chess.com ratings…", "loading");

    try {
      const roster = await fetchJson(clubMembersUrl);
      const membershipPeriods = ["weekly", "monthly", "all_time"];
      if (!membershipPeriods.some((period) => Array.isArray(roster[period]))) {
        throw new Error("Chess.com returned an unexpected club member list.");
      }

      const usernamesByNormalizedName = new Map();
      for (const period of membershipPeriods) {
        for (const member of Array.isArray(roster[period]) ? roster[period] : []) {
          const username = typeof member?.username === "string" ? member.username.trim() : "";
          if (username && !usernamesByNormalizedName.has(username.toLowerCase())) {
            usernamesByNormalizedName.set(username.toLowerCase(), username);
          }
        }
      }
      const usernames = [...usernamesByNormalizedName.values()];
      if (usernames.length === 0) {
        throw new Error("The club roster is empty or unavailable.");
      }

      members = await mapWithConcurrency(usernames, 6, loadMember);
      lastUpdatedAt = new Date();
      lastRefreshError = null;
      renderLeaderboard();
    } catch (error) {
      console.error("Unable to load the Chess.com club leaderboard.", error);
      lastRefreshError = error;
      if (!members.length || !lastUpdatedAt) {
        setStatus(
          `Could not load the Chess.com club roster or ratings. Confirm the PurpleChess club is public, then try Refresh. (${error.message})`,
          "error",
        );
      }
    } finally {
      loading = false;
      if (members.length && lastUpdatedAt) renderLeaderboard();
      refreshButton.disabled = false;
      refreshButton.textContent = "Refresh";
    }
  }

  modeSelect.addEventListener("change", renderLeaderboard);
  refreshButton.addEventListener("click", refreshLeaderboard);
  window.setInterval(() => {
    if (document.visibilityState === "visible") refreshLeaderboard();
  }, 15 * 60 * 1000);
  refreshLeaderboard();
})();
