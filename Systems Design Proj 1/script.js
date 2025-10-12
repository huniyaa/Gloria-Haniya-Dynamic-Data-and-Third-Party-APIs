let currentArtworks = [];
let userMatches = {};
let selectedArtwork = null;
let canvas, ctx;

window.addEventListener("DOMContentLoaded", () => {
  console.log("Page loaded, starting game...");
  setupCanvas();
  fetchRandomArtworks();
});

function setupCanvas() {
  canvas = document.getElementById("lineCanvas");
  if (!canvas) {
    console.error("Canvas element not found!");
    return;
  }
  ctx = canvas.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
}

function resizeCanvas() {
  const gameContainer = document.getElementById("gameContainer");
  if (!gameContainer || !canvas) return;
  
  
  const containerRect = gameContainer.getBoundingClientRect();
  canvas.style.position = 'absolute';
  canvas.style.top = `${containerRect.top}px`;
  canvas.style.left = `${containerRect.left}px`;
  canvas.width = containerRect.width;
  canvas.height = containerRect.height;
  
  drawLines();
}

function drawLines() {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#4CAF50";
  ctx.lineWidth = 3;

  Object.entries(userMatches).forEach(([artworkIndex, artistIndex]) => {
    const artworkImg = document.querySelector(`[data-index="${artworkIndex}"]`);
    const artistButton = document.querySelector(
      `[data-artist-index="${artistIndex}"]`
    );

    if (artworkImg && artistButton) {
      const artRect = artworkImg.getBoundingClientRect();
      const artistRect = artistButton.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      
      const startX = artRect.left + artRect.width / 2 - canvasRect.left;
      const startY = artRect.top + artRect.height / 2 - canvasRect.top;
      
      const endX = artistRect.left + artistRect.width / 2 - canvasRect.left;
      const endY = artistRect.top + artistRect.height / 2 - canvasRect.top;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  });
}
async function fetchRandomArtworks() {
  console.log("Fetching artworks...");
  try {
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const url = `https://api.artic.edu/api/v1/artworks?page=${randomPage}&limit=100&fields=id,title,artist_title,image_id,date_display,place_of_origin,dimensions,description`;

    console.log("Fetching from:", url);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("API Response:", data);

    const artworks = data.data;
    const imageBase = data.config.iiif_url;

    console.log("Image base URL:", imageBase);
    console.log("Total artworks received:", artworks.length);

    const selected = [];
const positions = createPositions(5);
const usedArtists = new Set(); 

let tries = 0;
for (let i = 0; i < 5 && tries < 100; i++) {
  const random = artworks[Math.floor(Math.random() * artworks.length)];

  
  if (!random.image_id || !random.artist_title || usedArtists.has(random.artist_title)) {
    console.log("Skipping artwork - missing image_id, artist_title, or duplicate artist");
    i--;
    tries++;
    continue;
  }

  usedArtists.add(random.artist_title); 
  selected.push({
    ...random,
    imageUrl: `${imageBase}/${random.image_id}/full/400,/0/default.jpg`,
    largeImageUrl: `${imageBase}/${random.image_id}/full/843,/0/default.jpg`,
    position: positions[i],
  });
}

    console.log("Selected artworks:", selected);

    if (selected.length === 0) {
      console.error("No valid artworks found!");
      return;
    }

    currentArtworks = selected;
    userMatches = {};
    displayArtworks(selected);
    displayArtists(selected);

    console.log("Artworks displayed successfully");
  } catch (error) {
    console.error("Error fetching artworks:", error);
    alert("Error loading artworks. Please check the console for details.");
  }
}

function createPositions(count) {
  
  const grid = [
    { top: 15, left: 9 },   
    { top: 15, left: 50 },   
    { top: 15, left: 75 },   
    { top: 40, left: 15 },   
    { top: 40, left: 75 },   
    { top: 65, left: 15 },   
    { top: 65, left: 50 },   
    { top: 65, left: 75 }    
  ];

  const shuffled = grid.sort(() => Math.random() - 0.5);
  const positions = [];

  for (let i = 0; i < count; i++) {
    const cell = shuffled[i];
    positions.push({
      top: cell.top,
      left: cell.left,
      rotation: Math.random() * 6 - 3
    });
  }

  return positions;
}

function displayArtworks(artworks) {
  console.log("Displaying artworks...");
  const section = document.getElementById("artworksSection");

  if (!section) {
    console.error("Artworks section not found!");
    return;
  }

  
  section.innerHTML = ''; 

  artworks.forEach((art, index) => {
    const img = document.createElement("img");
    img.src = art.imageUrl;
    img.alt = art.title;
    img.className = "artwork-img";
    img.dataset.index = index;
    img.style.top = `${art.position.top}%`;
    img.style.left = `${art.position.left}%`;
    img.style.transform = `rotate(${art.position.rotation}deg)`;

    img.addEventListener("click", (e) => {
      e.stopPropagation();
      selectArtwork(index);
    });

    img.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      showModal(art);
    });

    img.onerror = () => {
      console.error("Failed to load image:", art.imageUrl);
    };

    section.appendChild(img);
  });

  console.log("Images added to DOM");
}


function displayArtists(artworks) {
  console.log("Displaying artists...");
  const section = document.getElementById("artistsSection");

  if (!section) {
    console.error("Artists section not found!");
    return;
  }

  section.innerHTML = "";

  
  const artists = artworks.map((art, index) => ({
    name: art.artist_title,
    originalIndex: index,
    artworkId: art.id 
  }));

 
  const shuffledArtists = [...artists].sort(() => Math.random() - 0.5);

  shuffledArtists.forEach((artist) => {
    const button = document.createElement("button");
    button.className = "artist-button";
    button.textContent = artist.name;
    button.dataset.artistIndex = artist.originalIndex;
    button.dataset.artworkId = artist.artworkId;
    button.addEventListener("click", () =>
      selectArtist(artist.originalIndex, button)
    );
    section.appendChild(button);
  });

  console.log("Artist buttons created with proper mapping");
}

function selectArtwork(index) {
  document.querySelectorAll(".artwork-img").forEach((img) => {
    img.classList.remove("selected");
  });

  const img = document.querySelector(`[data-index="${index}"]`);
  img.classList.add("selected");
  selectedArtwork = index;
}

function selectArtist(artistIndex, button) {
  if (selectedArtwork === null) {
    showPopup("Please select an artwork first!");
    return;
  }

 
  userMatches[selectedArtwork] = {
    artistIndex: artistIndex,
    artworkId: parseInt(button.dataset.artworkId)
  };

  document.querySelectorAll(".artwork-img").forEach((img) => {
    img.classList.remove("selected");
  });

  selectedArtwork = null;
  drawLines();
}
function drawLines() {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#4CAF50";
  ctx.lineWidth = 2; 

  Object.entries(userMatches).forEach(([artworkIndex, matchData]) => {
    const artworkImg = document.querySelector(`[data-index="${artworkIndex}"]`);
    const artistButton = document.querySelector(
      `[data-artist-index="${matchData.artistIndex}"]`
    );

    if (artworkImg && artistButton) {
      const artRect = artworkImg.getBoundingClientRect();
      const artistRect = artistButton.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

     
      const startX = artRect.right - canvasRect.left;
      const startY = artRect.top + artRect.height / 2 - canvasRect.top;
      
      
      const endX = artistRect.left - canvasRect.left - 5; 
      const endY = artistRect.top + artistRect.height / 2 - canvasRect.top;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  });
}

function checkAnswers() {
  if (Object.keys(userMatches).length !== currentArtworks.length) {
    showPopup("Please match all artworks before checking!");
    return;
  }

  let allCorrect = true;
  let correctCount = 0;
  
  Object.entries(userMatches).forEach(([artworkIndex, matchData]) => {
    const artwork = currentArtworks[artworkIndex];
    
    if (artwork.id === matchData.artworkId) {
      correctCount++;
    } else {
      allCorrect = false;
    }
  });

  if (allCorrect) {
    showPopup(`Perfect! All ${correctCount} matches are correct! 🎉`);
    document.querySelectorAll(".artist-button").forEach((btn) => {
      btn.classList.add("matched");
    });
  } else {
    showPopup(`${correctCount} out of ${currentArtworks.length} correct. Try again!`);
  }
}


function playNextRound() {
  
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  
  
  userMatches = {};
  selectedArtwork = null;
  
  
  fetchRandomArtworks();
}

function showModal(artwork) {
  document.getElementById("modalTitle").textContent = artwork.title;
  document.getElementById("modalImage").src = artwork.largeImageUrl;

  const desc = artwork.description
    ? artwork.description.replace(/<[^>]*>/g, "")
    : "No description available";

 
  document.getElementById("modalDetails").innerHTML = `
        <div class="info-section">
            <strong>Artist:</strong>
            <span>${artwork.artist_title || "Unknown"}</span>
        </div>
        <div class="info-section">
            <strong>Description:</strong>
            <span>${desc}</span>
        </div>
        <div class="info-section">
            <strong>Date Displayed:</strong>
            <span>${artwork.date_display || "n.d."}</span>
        </div>
        <div class="info-section">
            <strong>Place of Origin:</strong>
            <span>${artwork.place_of_origin || "Unknown"}</span>
        </div>
        <div class="info-section">
            <strong>Dimensions:</strong>
            <span>${artwork.dimensions || "Not available"}</span>
        </div>
    `;

  document.getElementById("modal").classList.add("show");
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
}

function showPopup(message) {
  document.getElementById("popupMessage").textContent = message;
  document.getElementById("popup").classList.add("show");
}

function closePopup() {
  document.getElementById("popup").classList.remove("show");
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") closeModal();
  });

  document.getElementById("popup").addEventListener("click", (e) => {
    if (e.target.id === "popup") closePopup();
  });
});