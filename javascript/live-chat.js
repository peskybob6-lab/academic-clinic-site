  import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      // ✅ Supabase client
      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co", // Project URL
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1", // Publishable key
      );

      // ✅ Load all chat messages
      async function loadChats() {
        const chatBox = document.getElementById("chatMessages");
        chatBox.innerHTML = "";

        const { data, error } = await supabase
          .from("chats")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error loading chats:", error.message);
          return;
        }

        data.forEach((msg) => renderMessage(msg));
        chatBox.scrollTop = chatBox.scrollHeight;
      }

      // ✅ Render a single message with action buttons
      function renderMessage(msg) {
        const chatBox = document.getElementById("chatMessages");
        const div = document.createElement("div");
        div.className = "chat-message";
        const timestamp = new Date(msg.created_at).toLocaleString();
        div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.message}
  <div style="font-size:12px; color:#666;">${timestamp}</div>`;

        if (msg.sender === "Admin") {
          // Admin’s own messages → edit + delete
          div.innerHTML += `
        <button onclick="editMessage('${msg.id}', '${msg.message}')">Edit</button>
        <button onclick="deleteMessage('${msg.id}')">Delete</button>
      `;
        } else {
          // User messages → reply + delete
          div.innerHTML += `
        <button onclick="replyTo('${msg.id}', '${msg.sender}')">Reply</button>
        <button onclick="deleteMessage('${msg.id}')">Delete</button>
      `;
        }

        chatBox.appendChild(div);
      }

      // ✅ Send admin reply
      async function sendReply() {
        const reply = document.getElementById("replyInput").value;
        if (!reply) return;

        const { error } = await supabase.from("chats").insert({
          sender: "Admin",
          message: reply,
        });

        if (error) {
          alert("Error sending reply: " + error.message);
        } else {
          document.getElementById("replyInput").value = "";
        }
      }

      document.getElementById("sendBtn").onclick = sendReply;

      // ✅ Reply to a specific user (prefill reply box)
      window.replyTo = function (messageId, sender) {
        document.getElementById("replyInput").value = `@${sender} `;
        document.getElementById("replyInput").focus();
      };

      // ✅ Edit admin message
      window.editMessage = async function (messageId, oldMessage) {
        const newMessage = prompt("Edit your message:", oldMessage);
        if (!newMessage) return;

        const { error } = await supabase
          .from("chats")
          .update({ message: newMessage })
          .eq("id", messageId);

        if (error) {
          alert("Error editing: " + error.message);
        } else {
          loadChats();
        }
      };

      // ✅ Delete any message (admin can delete both user + admin messages)
      window.deleteMessage = async function (messageId) {
        if (!confirm("Delete this message?")) return;

        const { error } = await supabase
          .from("chats")
          .delete()
          .eq("id", messageId);

        if (error) {
          alert("Error deleting: " + error.message);
        } else {
          loadChats();
        }
      };

      // ✅ Subscribe to realtime changes
      supabase
        .channel("live-chat")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "chats" },
          () => loadChats(),
        )
        .subscribe();

      // ✅ Load chats on page start
      loadChats();
