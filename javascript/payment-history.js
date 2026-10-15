
      async function loadPayments() {
        const paymentsList = document.getElementById("paymentsList");
        paymentsList.innerHTML = "<p>Loading payments...</p>";

        try {
          // ✅ Fetch from your Supabase Edge Function
          const response = await fetch(
            "https://fomowfqnswrsvuwzxmix.supabase.co/functions/v1/payments",
          );
          const result = await response.json();

          paymentsList.innerHTML = "";

          if (result.data && result.data.length > 0) {
            result.data.forEach((tx) => {
              // Format amount with commas
              const formattedAmount = (tx.amount / 100).toLocaleString("en-NG");

              const txDiv = document.createElement("div");
              txDiv.className = "payment-card";
              txDiv.innerHTML = `
              <p><strong>Customer:</strong> ${tx.customer?.email || "N/A"}</p>
              <p><strong>Amount:</strong> ₦${formattedAmount}</p>
              <p><strong>Status:</strong> ${tx.status}</p>
              <p><strong>Date:</strong> ${new Date(tx.created_at).toLocaleString()}</p>
            `;
              paymentsList.appendChild(txDiv);
            });
          } else {
            paymentsList.innerHTML = "<p>No payments found.</p>";
          }
        } catch (err) {
          paymentsList.innerHTML =
            "<p>Error loading payments: " + err.message + "</p>";
        }
      }

      loadPayments();
    
