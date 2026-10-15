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
        <p><strong>${book.title}</strong> - ₦${book.price}</p>
        <input type="text" id="title-${book.id}" value="${book.title}">
        <input type="number" id="price-${book.id}" value="${book.price}">
        <button class="save-btn" onclick="saveEdit('${book.id}')">Save Changes</button>
        <button class="delete-btn" onclick="deleteBook('${book.id}')">Delete</button>
      `;
          booksList.appendChild(bookDiv);
        });
      }

      // Save edited book
      window.saveEdit = async function (bookId) {
        const newTitle = document.getElementById("title-" + bookId).value;
        const newPrice = document.getElementById("price-" + bookId).value;

        const { error } = await supabase
          .from("books")
          .update({ title: newTitle, price: newPrice })
          .eq("id", bookId);

        if (error) {
          alert("Error updating book: " + error.message);
        } else {
          alert("Book updated successfully!");
          loadBooks();
        }
      };

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
   
