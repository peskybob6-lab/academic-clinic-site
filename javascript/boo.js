import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fomowfqnswrsvuwzxmix.supabase.co",
  "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
);

const uploadBtn = document.getElementById("uploadBtn");
const uploadContainer = document.getElementById("uploadContainer");
const uploadSuccessMessage = document.getElementById("uploadSuccessMessage");

uploadBtn.addEventListener("click", async () => {
  uploadBtn.classList.remove("is-loading");
  void uploadBtn.offsetWidth;
  uploadBtn.classList.add("is-loading");

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      alert("You must log in first!");
      window.location.href = "login.html";
      return;
    }

    const title = document.getElementById("title").value;
    const price = document.getElementById("price").value;
    const coverFile = document.getElementById("cover").files[0];
    const pdfFile = document.getElementById("pdf").files[0];

    if (!title || !price || !coverFile || !pdfFile) {
      alert("Please fill all fields and select files.");
      return;
    }

    const coverPath = `covers/${Date.now()}_${coverFile.name}`;
    const { error: coverError } = await supabase.storage
      .from("ebooks")
      .upload(coverPath, coverFile);
    if (coverError) throw coverError;

    const pdfPath = `pdfs/${Date.now()}_${pdfFile.name}`;
    const { error: pdfError } = await supabase.storage
      .from("ebooks")
      .upload(pdfPath, pdfFile);
    if (pdfError) throw pdfError;

    const { error } = await supabase.from("books").insert({
      title,
      price,
      coverFileName: coverPath.replace("covers/", ""),
      pdfFileName: pdfPath.replace("pdfs/", ""),
    });

    if (error) throw error;

    uploadContainer.classList.add("is-success");
    uploadSuccessMessage.textContent = "Book uploaded successfully!";
    uploadSuccessMessage.classList.add("show");

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } catch (err) {
    alert("Error: " + err.message);
    console.error("Upload error:", err);
  } finally {
    uploadBtn.classList.remove("is-loading");
  }
});
