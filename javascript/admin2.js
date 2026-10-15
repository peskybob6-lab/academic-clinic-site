import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      // ✅ Supabase client
      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co", // Project URL
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1", // Publishable key
      );

      // Handle login form
      document.getElementById("loginBtn").addEventListener("click", async () => {
        const loginBtn = document.getElementById("loginBtn");
        loginBtn.classList.remove("is-clicked");
        void loginBtn.offsetWidth;
        loginBtn.classList.add("is-clicked");

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          alert("Login failed: " + error.message);
        } else {
          alert("Login successful!");
          window.location.href = "dashboard.html";
        }
      });

      // Check if already logged in
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        console.log("Already logged in:", session.user.email);
        window.location.href = "dashboard.html";
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("Logged in as:", user?.email);
    
