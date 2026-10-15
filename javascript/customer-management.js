import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

      // ✅ Supabase client
      const supabase = createClient(
        "https://fomowfqnswrsvuwzxmix.supabase.co", // Project URL
        "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1", // Publishable key
      );

      let allCustomers = [];

      // Load customers from Supabase
      async function loadCustomers() {
        const customersList = document.getElementById("customersList");
        customersList.innerHTML = "";

        const { data, error } = await supabase.from("customers").select("*");

        if (error) {
          console.error("Error loading customers:", error.message);
          return;
        }

        allCustomers = data;
        renderCustomers(allCustomers);
      }

      // Render customers (with optional filter)
      function renderCustomers(customers) {
        const customersList = document.getElementById("customersList");
        customersList.innerHTML = "";

        customers.forEach((customer) => {
          const custDiv = document.createElement("div");
          custDiv.className = "customer-card";
          custDiv.innerHTML = `
        <p><strong>Name:</strong> ${customer.first_name} ${customer.last_name}</p>
        <p><strong>Email:</strong> ${customer.email}</p>
        <p><strong>Phone:</strong> ${customer.phone_number || "N/A"}</p>
        <p><strong>Gender:</strong> ${customer.gender || "N/A"}</p>
        <p><strong>Created At:</strong> ${customer.created_at}</p>
        <p><strong>Status:</strong> ${customer.status || "Active"}</p>
        <button onclick="toggleBlock('${customer.id}', '${customer.status || "Active"}')">
          ${customer.status === "Blocked" ? "Unblock" : "Block"}
        </button>
      `;
          customersList.appendChild(custDiv);
        });
      }

      // Block/Unblock customer
      window.toggleBlock = async function (customerId, currentStatus) {
        const newStatus = currentStatus === "Blocked" ? "Active" : "Blocked";

        const { error } = await supabase
          .from("customers")
          .update({ status: newStatus })
          .eq("id", customerId);

        if (error) {
          alert("Error updating customer: " + error.message);
        } else {
          alert("Customer status updated to " + newStatus);
          loadCustomers();
        }
      };

      // Search filter
      document
        .getElementById("searchBar")
        .addEventListener("input", function (e) {
          const query = e.target.value.toLowerCase();
          const filtered = allCustomers.filter(
            (c) =>
              (c.first_name + " " + c.last_name)
                .toLowerCase()
                .includes(query) ||
              (c.email || "").toLowerCase().includes(query),
          );
          renderCustomers(filtered);
        });

      // Load customers on page start
      loadCustomers();

      window.deleteCustomer = async function (customerId) {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", customerId);
        if (error) {
          alert("Error deleting customer: " + error.message);
        } else {
          alert("Customer deleted");
          loadCustomers();
        }
      };

      const { data } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
