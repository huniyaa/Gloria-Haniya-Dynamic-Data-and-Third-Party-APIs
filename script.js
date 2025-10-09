let currentArtworks = [];
let artistsList = [];
let subjectsList = [];

// Initialize on page load
window.addEventListener("DOMContentLoaded", () => {
  fetchRandomArt();
  fetchArtists();
  fetchSubjects();
  setupEventListeners();
});

function setupEventListeners() {
  document
    .getElementById("randomButton")
    .addEventListener("click", fetchRandomArt);
  document
    .getElementById("artistButton")
    .addEventListener("click", () => toggleDropdown("artist"));
  document
    .getElementById("subjectButton")
    .addEventListener("click", () => toggleDropdown("subject"));
  document.getElementById("modalClose").addEventListener("click", closeModal);

  // Close modal when clicking outside
  document.getElementById("modal").addEventListener("click", (e) => {
    if (e.target.id === "modal") {
      closeModal();
    }
  });
}

function toggleDropdown(type) {
  const artistDropdown = document.getElementById("artistDropdown");
  const subjectDropdown = document.getElementById("subjectDropdown");

  if (type === "artist") {
    artistDropdown.classList.toggle("hidden");
    subjectDropdown.classList.add("hidden");
  } else if (type === "subject") {
    subjectDropdown.classList.toggle("hidden");
    artistDropdown.classList.add("hidden");
  }
}

async function fetchArtists() {
  try {
    const res = await fetch(
      "https://api.artic.edu/api/v1/artworks?page=1&limit=100&fields=id,title,artist_title,image_id"
    );
    const json = await res.json();

    // Get unique artist names and sort alphabetically
    const uniqueArtists = [
      ...new Set(
        json.data.map((art) => art.artist_title).filter((name) => name)
      ),
    ].sort();

    artistsList = uniqueArtists;
    populateDropdown(uniqueArtists, "artist");
  } catch (error) {
    console.error("Error fetching artists:", error);
  }
}

async function fetchSubjects() {
  try {
    const res = await fetch(
      "https://api.artic.edu/api/v1/artworks?page=1&limit=100&fields=id,title,subject_titles,image_id"
    );
    const json = await res.json();

    // Get unique subjects from all artworks and sort alphabetically
    const allSubjects = json.data
      .flatMap((art) => art.subject_titles || [])
      .filter((subject) => subject);

    const uniqueSubjects = [...new Set(allSubjects)].sort();

    subjectsList = uniqueSubjects;
    populateDropdown(uniqueSubjects, "subject");
  } catch (error) {
    console.error("Error fetching subjects:", error);
  }
}

function populateDropdown(items, type) {
  const dropdownId = type === "artist" ? "artistDropdown" : "subjectDropdown";
  const dropdown = document.getElementById(dropdownId);
  dropdown.innerHTML = "";

  items.forEach((item) => {
    const element = document.createElement("div");
    element.className = "dropdown-item";
    element.textContent = item;
    element.addEventListener("click", () => {
      if (type === "artist") {
        fetchArtworksByArtist(item);
      } else if (type === "subject") {
        fetchArtworksBySubject(item);
      }
    });
    dropdown.appendChild(element);
  });
}

async function fetchRandomArt() {
  try {
    const res = await fetch(
      "https://api.artic.edu/api/v1/artworks?page=1&limit=100"
    );
    const json = await res.json();
    const allArtworks = json.data;
    const iiifBase = json.config.iiif_url;

    const selected = [];
    const positions = generateNonOverlappingPositions(5);

    let attempts = 0;
    for (let i = 0; i < 5 && attempts < 50; i++) {
      const random =
        allArtworks[Math.floor(Math.random() * allArtworks.length)];
      if (!random.image_id) {
        i--;
        attempts++;
        continue;
      }

      selected.push({
        ...random,
        imageUrl: `${iiifBase}/${random.image_id}/full/400,/0/default.jpg`,
        largeImageUrl: `${iiifBase}/${random.image_id}/full/843,/0/default.jpg`,
        style: positions[i],
      });
    }

    currentArtworks = selected;
    displayArtworks(selected);
  } catch (error) {
    console.error("Error fetching artworks:", error);
  }
}

async function fetchArtworksByArtist(artistName) {
  try {
    const res = await fetch(
      `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(
        artistName
      )}&limit=100&fields=id,title,artist_title,image_id,date_display`
    );
    const json = await res.json();
    const iiifBase = "https://www.artic.edu/iiif/2";

    const filtered = json.data.filter(
      (art) => art.artist_title === artistName && art.image_id
    );

    if (filtered.length === 0) {
      alert(`No artworks found for ${artistName}`);
      return;
    }

    const selected = [];
    const numToShow = Math.min(5, filtered.length);
    const positions = generateNonOverlappingPositions(numToShow);

    for (let i = 0; i < numToShow; i++) {
      const artwork = filtered[i];
      selected.push({
        ...artwork,
        imageUrl: `${iiifBase}/${artwork.image_id}/full/400,/0/default.jpg`,
        largeImageUrl: `${iiifBase}/${artwork.image_id}/full/843,/0/default.jpg`,
        style: positions[i],
      });
    }

    currentArtworks = selected;
    displayArtworks(selected);

    // Close dropdown
    document.getElementById("artistDropdown").classList.add("hidden");
  } catch (error) {
    console.error("Error fetching artworks by artist:", error);
  }
}

async function fetchArtworksBySubject(subjectName) {
  try {
    const res = await fetch(
      `https://api.artic.edu/api/v1/artworks/search?q=${encodeURIComponent(
        subjectName
      )}&limit=100&fields=id,title,artist_title,image_id,date_display,subject_titles`
    );
    const json = await res.json();
    const iiifBase = "https://www.artic.edu/iiif/2";

    const filtered = json.data.filter(
      (art) =>
        art.subject_titles &&
        art.subject_titles.includes(subjectName) &&
        art.image_id
    );

    if (filtered.length === 0) {
      alert(`No artworks found for subject: ${subjectName}`);
      return;
    }

    const selected = [];
    const numToShow = Math.min(5, filtered.length);
    const positions = generateNonOverlappingPositions(numToShow);

    for (let i = 0; i < numToShow; i++) {
      const artwork = filtered[i];
      selected.push({
        ...artwork,
        imageUrl: `${iiifBase}/${artwork.image_id}/full/400,/0/default.jpg`,
        largeImageUrl: `${iiifBase}/${artwork.image_id}/full/843,/0/default.jpg`,
        style: positions[i],
      });
    }

    currentArtworks = selected;
    displayArtworks(selected);

    // Close dropdown
    document.getElementById("subjectDropdown").classList.add("hidden");
  } catch (error) {
    console.error("Error fetching artworks by subject:", error);
  }
}

function generateNonOverlappingPositions(count) {
  const positions = [];

  // Define grid cells (3 rows x 3 columns = 9 possible positions)
  const gridCells = [
    { top: 5, left: 5 },
    { top: 5, left: 37 },
    { top: 5, left: 69 },
    { top: 35, left: 5 },
    { top: 35, left: 37 },
    { top: 35, left: 69 },
    { top: 65, left: 5 },
    { top: 65, left: 37 },
    { top: 65, left: 69 },
  ];

  // Shuffle the grid cells to randomize positions
  const shuffled = gridCells.sort(() => Math.random() - 0.5);

  // Take the first 'count' cells and add random variation
  for (let i = 0; i < count; i++) {
    const cell = shuffled[i];
    positions.push({
      top: cell.top + Math.random() * 10 - 5, // Add small random offset
      left: cell.left + Math.random() * 10 - 5,
      rotation: Math.random() * 6 - 3,
    });
  }

  return positions;
}

function displayArtworks(artworks) {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  artworks.forEach((art, idx) => {
    const img = document.createElement("img");
    img.src = art.imageUrl;
    img.alt = art.title;
    img.style.top = `${art.style.top}%`;
    img.style.left = `${art.style.left}%`;
    img.style.transform = `rotate(${art.style.rotation}deg)`;

    img.addEventListener("click", () => showModal(art));

    gallery.appendChild(img);
  });
}

function showModal(artwork) {
  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = `
        <img src="${artwork.largeImageUrl}" alt="${artwork.title}">
        <h2>${artwork.title}</h2>
        <p><strong>Artist:</strong> ${artwork.artist_title || "Unknown"}</p>
        <p><strong>Date:</strong> ${artwork.date_display || "n.d."}</p>
    `;
  document.getElementById("modal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("modal").classList.add("hidden");
}
