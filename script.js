async function fetchRandomArt() {
      try {
        const res = await fetch("https://api.artic.edu/api/v1/artworks?page=1&limit=100");
        const json = await res.json();
        const artworks = json.data;

        const gallery = document.getElementById("gallery");
        gallery.innerHTML = "";

        const numArtworks = 5;
        const artpick = json.config.iiif_url;

        for (let i = 0; i < numArtworks; i++) {
          const random = artworks[Math.floor(Math.random() * artworks.length)];
          if (!random.image_id) { i--; continue; } 

          const imageUrl = `${artpick}/${random.image_id}/full/400,/0/default.jpg`;

          const img = document.createElement("img");
          img.src = imageUrl;
          img.alt = random.title;

          
          img.style.top = Math.floor(Math.random() * 60 + 5) + "%";
          img.style.left = Math.floor(Math.random() * 70 + 5) + "%";
          img.style.transform = `rotate(${Math.random() * 6 - 3}deg)`; 

          img.addEventListener("click", () => showModal(random, artpick));

          gallery.appendChild(img);
        }

      } catch (error) {
        console.error("Error fetching artworks:", error);
      }
    }

    function showModal(artwork, iiifBase) {
      const imageUrl = `${iiifBase}/${artwork.image_id}/full/843,/0/default.jpg`;
      const modalContent = document.getElementById("modalContent");
      modalContent.innerHTML = `
        <img src="${imageUrl}" alt="${artwork.title}">
        <h2>${artwork.title}</h2>
        <p><strong>Artist:</strong> ${artwork.artist_title || "Unknown"}</p>
        <p><strong>Date:</strong> ${artwork.date_display || "n.d."}</p>
      `;
      document.getElementById("modal").style.display = "flex";
    }

    document.getElementById("modalClose").addEventListener("click", () => {
      document.getElementById("modal").style.display = "none";
    });

    document.getElementById("genbutton").addEventListener("click", fetchRandomArt);


    fetchRandomArt();
 