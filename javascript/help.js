  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      // ✅ Supabase client
      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co", // Project URL
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1", // Publishable key
      );

      // ✅ Track current sender globally
      let currentSender = "Guest";

      // ✅ Initialize sender and load chat
      (async () => {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        currentSender = user ? user.email : "Guest";
        loadChat();
      })();

      // ✅ Send chat message
      window.sendChat = async function () {
        const message = document.getElementById("chatInput").value;
        if (!message) return;

        const { error } = await supabase.from("chats").insert({
          sender: currentSender,
          message: message,
        });

        if (error) {
          alert("Error sending message: " + error.message);
        } else {
          document.getElementById("chatInput").value = "";
        }
      };

      // ✅ Load chat messages initially
      async function loadChat() {
        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .or(`sender.eq.${currentSender},sender.eq.admin`)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error loading chat:", error.message);
          return;
        }

        renderMessages(data);
      }

      // ✅ Subscribe to realtime chat updates
      supabase
        .channel("help-chat")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chats" },
          (payload) => {
            const newMessage = payload.new;
            if (
              newMessage.sender === currentSender ||
              newMessage.sender.toLowerCase() === "admin"
            ) {
              appendMessage(newMessage);
            }
          },
        )
        .subscribe();

      // ✅ Render messages
      function renderMessages(messages) {
        const chatBox = document.getElementById("chatMessages");
        chatBox.innerHTML = "";
        messages.forEach((data) => {
          appendMessage(data);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function appendMessage(data) {
        const chatBox = document.getElementById("chatMessages");
        const div = document.createElement("div");
        div.className =
          "chat-message " +
          (data.sender.toLowerCase() === "admin" ? "chat-admin" : "chat-user");
        const timestamp = new Date(data.created_at).toLocaleString();
        div.innerHTML = `<strong>${data.sender}:</strong> ${data.message}
  <div style="font-size:12px; color:#666;">${timestamp}</div>`;

        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      // ✅ Close chat → go back to home
      window.goHome = function () {
        window.location.href = "index.html";
      };
    