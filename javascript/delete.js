 import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      // ✅ Supabase client
      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co", // Project URL
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1", // Publishable key
      );

      // Load books from Supabase
      async function loadBooks() {
        const booksList = document.getElementById("booksList");
        booksList.innerHTML = "";

        const { data, error } = await supabase.from("books").select("*");

        if (error) {
          console.error("Error loading books:", error.message);
          return;
        }

        data.forEach((book) => {
          const bookDiv = document.createElement("div");
          bookDiv.className = "book-card";
          bookDiv.innerHTML = `
        <span><strong>${book.title}</strong> - ₦${book.price}</span>
        <button onclick="deleteBook('${book.id}')">Delete</button>
      `;
          booksList.appendChild(bookDiv);
        });
      }

      // Delete book
      window.deleteBook = async function (bookId) {
        if (!confirm("Are you sure you want to delete this book?")) return;

        const { error } = await supabase
          .from("books")
          .delete()
          .eq("id", bookId);

        if (error) {
          alert("Error deleting book: " + error.message);
        } else {
          alert("Book deleted successfully!");
          loadBooks();
        }
      };

      // Load books on page start
      loadBooks();
    