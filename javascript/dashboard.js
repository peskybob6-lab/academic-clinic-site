 import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co",
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
      );

      async function loadStats() {
        const { count: booksCount } = await supabase
          .from("books")
          .select("*", { count: "exact", head: true });
        document.getElementById("totalBooks").innerText = booksCount || 0;

        const { data: orders } = await supabase.from("orders").select("*");
        if (orders) {
          document.getElementById("totalOrders").innerText = orders.length;
          let revenue = 0;
          orders.forEach((order) => {
            if (order.status === "Paid") {
              revenue += Number(order.price);
            }
          });
          document.getElementById("totalRevenue").innerText = revenue;
        }

        const { count: customersCount } = await supabase
          .from("customers")
          .select("*", { count: "exact", head: true });
        document.getElementById("totalCustomers").innerText =
          customersCount || 0;
      }

      loadStats();

      document.getElementById("logoutBtn").onclick = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
          alert("Error logging out: " + error.message);
        } else {
          alert("Logged out successfully!");
          window.location.href = "admin2.html";
        }
      };
    
