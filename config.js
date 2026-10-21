const API_URL =
  "https://script.google.com/macros/s/AKfycbxUYyBFR8Mn861MStRfj8ouC_Jz9u43pTdrw9jIx7kd16zOj22cWhEFayJhfmV2ODzHEw/exec";

const PAYMENT_LINKS = {
  paket1: "https://pay.doku.com/p-link/p/5zfdkQK68Y",
  paket2: "https://pay.doku.com/p-link/p/zLYfCKkGNY"
};

  let posts = [];

function getVoterId() {
  let voterId = localStorage.getItem("voter_id");

  if (!voterId) {
    voterId = crypto.randomUUID();
    localStorage.setItem("voter_id", voterId);
  }

  return voterId;
}

async function apiRequest(data = null) {
  const url = `${API_URL}?t=${Date.now()}`;

  if (!data) {
    const response = await fetch(url);
    return response.json();
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(data)
  });

  return response.json();
}

async function loadPosts() {
  const result = await apiRequest();

  if (!result.success) {
    console.error(result.message);
    return;
  }

  posts = result.posts;
  renderPosts(posts);
}

async function createPost() {
  const username =
    document.getElementById("username").value.trim();

  const title =
    document.getElementById("title").value.trim();

  const content =
    document.getElementById("content").value.trim();

  const songUrl =
    document.getElementById("song-url")?.value.trim() || "";

  if (!username || !title || !content) {
    alert("Please complete all required fields.");
    return;
  }

  const result = await apiRequest({
    action: "create_post",
    username,
    title,
    content,
    song_url: songUrl
  });

  if (!result.success) {
    alert(result.message);
    return;
  }

  document.getElementById("username").value = "";
  document.getElementById("title").value = "";
  document.getElementById("content").value = "";

  if (document.getElementById("song-url")) {
    document.getElementById("song-url").value = "";
  }

  await loadPosts();
}

async function toggleVote(postId) {
  const result = await apiRequest({
    action: "toggle_vote",
    post_id: postId,
    voter_id: getVoterId()
  });

  if (!result.success) {
    alert(result.message);
    return;
  }

  await loadPosts();
}

function renderPosts(postsToRender) {
  const postsDiv = document.getElementById("posts");
  postsDiv.innerHTML = "";

  if (postsToRender.length === 0) {
    postsDiv.innerHTML = "<p>No recommendations yet.</p>";
    return;
  }

  postsToRender.forEach(post => {
    const postElement = document.createElement("article");
    postElement.className = "post";

    const title = document.createElement("h2");
    title.textContent = post.title;

    const author = document.createElement("small");
    author.textContent = `Recommended by ${post.username}`;

    const content = document.createElement("p");
    content.textContent = post.content;

    const voteButton = document.createElement("button");
    voteButton.className = "vote-button";
    voteButton.textContent = "▲ Upvote";
    voteButton.onclick = () => toggleVote(post.id);

    const voteCount = document.createElement("span");
    voteCount.textContent =
      `${post.upvotes} upvote${post.upvotes === 1 ? "" : "s"}`;

    const actions = document.createElement("div");
    actions.className = "post-actions";
    actions.append(voteButton, voteCount);

    if (post.song_url) {
      const link = document.createElement("a");
      link.href = post.song_url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Listen";
      link.className = "song-link";

      actions.appendChild(link);
    }

    postElement.append(
      title,
      author,
      content,
      actions
    );

    postsDiv.appendChild(postElement);
  });
}

document
  .getElementById("sort-select")
  ?.addEventListener("change", event => {
    if (event.target.value === "newest") {
      const newestFirst = [...posts].sort(
        (a, b) =>
          new Date(b.created_at) -
          new Date(a.created_at)
      );

      renderPosts(newestFirst);
    } else {
      renderPosts(posts);
    }
  });

loadPosts();

setInterval(loadPosts, 30000);