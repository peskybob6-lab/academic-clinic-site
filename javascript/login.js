import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  navigator.serviceWorker
    .register("./sw.js", { updateViaCache: "none" })
    .then((registration) => registration.update())
    .catch((error) => console.error("Service worker update failed:", error));
}

const supabase = createClient(
  "https://fomowfqnswrsvuwzxmix.supabase.co",
  "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
);

window.goHome = function () {
  window.location.href = "index.html";
};

const returnTo = (() => {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnTo");
  return value ? decodeURIComponent(value) : "index.html";
})();

window.loginAccount = async function () {
  const phone = document.getElementById("loginPhone").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!phone) {
    alert("Please enter your phone number.");
    document.getElementById("loginPhone").focus();
    return;
  }

  if (!password) {
    alert("Please enter your password.");
    document.getElementById("loginPassword").focus();
    return;
  }

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("phone_number", phone)
    .maybeSingle();

  if (error) {
    alert("Login failed: " + error.message);
    return;
  }

  if (!data) {
    alert("No account found for this phone number.");
    return;
  }

  if (String(data.password ?? "") !== String(password)) {
    alert("Incorrect phone number or password.");
    return;
  }

  const firstName = data.first_name ?? "";
  const lastName = data.last_name ?? "";
  const customerName = [firstName, lastName].filter(Boolean).join(" ") || "User";

  const previousPhone = sessionStorage.getItem("agori_customer_phone")?.trim();
  if (previousPhone && previousPhone !== phone) {
    localStorage.removeItem(`agori_customer_profile_image_${previousPhone}`);
  }

  sessionStorage.setItem("agori_customer_phone", phone);
  if (firstName || lastName) {
    localStorage.setItem("agori_customer_name", customerName);
  }

  const safePhone = phone.replace(/[^0-9]/g, "").replace(/^0+/, "") || "customer";
  const safeName = (customerName || "customer").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "customer";
  const generatedEmail = `${safePhone || safeName}@agori.com`;
  localStorage.setItem("agori_customer_email", generatedEmail);
  localStorage.removeItem("agori_customer_profile_image");

  const successBox = document.getElementById("loginSuccessMessage");
  const modalContent = document.querySelector(".modal-content");

  if (modalContent) {
    modalContent.classList.remove("is-success");
  }

  if (successBox) {
    successBox.classList.remove("show");
    successBox.textContent = `Login successful! Welcome back, ${customerName}.`;
    successBox.classList.add("show");

    if (modalContent) {
      modalContent.classList.add("is-success");
    }

    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  setTimeout(() => {
    window.location.href = returnTo;
  }, 1200);
};
