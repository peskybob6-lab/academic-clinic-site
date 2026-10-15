  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co",
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
      );

      let currentSender = "Guest";
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
          console.error("Error sending message:", error.message);
        } else {
          document.getElementById("chatInput").value = "";
        }
      };

      // ✅ Load chat messages (only current user + admin)
      async function loadChat() {
        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .in("sender", [currentSender, "Admin"])
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error loading chat:", error.message);
          return;
        }
        renderMessages(data);
      }

      // ✅ Subscribe realtime (filter inside callback)
      supabase
        .channel("chat-room")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chats" },
          (payload) => {
            const newMessage = payload.new;
            if (
              newMessage.sender === currentSender ||
              newMessage.sender === "Admin"
            ) {
              appendMessage(newMessage);
            }
          },
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "chats" },
          () => loadChat(),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "chats" },
          () => loadChat(),
        )
        .subscribe();

      // ✅ Render messages
      function renderMessages(messages) {
        const chatBox = document.getElementById("chatMessages");
        chatBox.innerHTML = "";
        messages.forEach((msg) => appendMessage(msg));
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      function appendMessage(msg) {
        const chatBox = document.getElementById("chatMessages");
        const div = document.createElement("div");
        div.className =
          "chat-message " +
          (msg.sender === "Admin" ? "chat-admin" : "chat-user");

        const timestamp = new Date(msg.created_at).toLocaleString();

        div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.message}
      <div class="timestamp">${timestamp}</div>`;

        // User can reply to admin messages
        if (msg.sender === "Admin") {
          div.innerHTML += `<button onclick="replyTo('${msg.id}', '${msg.sender}')">Reply</button>`;
        }

        // User can delete their own messages
        if (msg.sender === currentSender) {
          div.innerHTML += `<button onclick="deleteMessage('${msg.id}')">Delete</button>`;
        }

        chatBox.appendChild(div);
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      // ✅ Reply (prefill input)
      window.replyTo = function (messageId, sender) {
        document.getElementById("chatInput").value = `@${sender} `;
        document.getElementById("chatInput").focus();
      };

      // ✅ Delete user message
      window.deleteMessage = async function (id) {
        if (!confirm("Delete this message?")) return;
        const { error } = await supabase.from("chats").delete().eq("id", id);
        if (error) console.error("Error deleting:", error.message);
        else loadChat();
      };

      // ✅ Close chat
      window.goHome = function () {
        window.location.href = "index.html";
      };
