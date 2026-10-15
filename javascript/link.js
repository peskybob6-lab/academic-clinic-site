  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co",
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
      );

      async function loadLinks() {
        const { data: books, error } = await supabase.from("books").select("*");
        if (error) {
          console.error("Error loading books:", error);
          return;
        }

        const container = document.getElementById("links");
        container.innerHTML = "";

        books.forEach((book) => {
          const coverUrl = supabase.storage
            .from("ebooks")
            .getPublicUrl("covers/" + book.coverFileName).data.publicUrl;

          const pageUrl = new URL(`book-details.html?bookId=${book.id}`, window.location.href).toString();

          const div = document.createElement("div");
          div.className = "link-item";
          div.innerHTML = `
          <strong>${book.title}</strong> - ₦${book.price}
          <br>
          <img src="${coverUrl}" alt="Cover">
          <br>
          <a href="${pageUrl}" target="_blank" rel="noopener noreferrer">Open Book Page</a>
          <button onclick="navigator.clipboard.writeText('${pageUrl}')">Copy Book Link</button>
        `;
          container.appendChild(div);
        });
      }

      loadLinks();
    