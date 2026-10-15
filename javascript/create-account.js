import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fomowfqnswrsvuwzxmix.supabase.co",
  "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
);

window.nextStep = function (step) {
  for (let i = 1; i <= 7; i++) {
    const el = document.getElementById("step" + i);
    if (el) el.style.display = "none";
  }

  const target = document.getElementById("step" + step);
  if (target) target.style.display = "block";
};

window.validateAndAdvance = function (nextStep) {
  const currentStep = document.getElementById("step" + (nextStep - 1));
  const requiredFields = currentStep
    ? currentStep.querySelectorAll("[required]")
    : [];

  for (const field of requiredFields) {
    if (!field.value.trim()) {
      field.reportValidity();
      field.focus();
      return;
    }
  }

  window.nextStep(nextStep);
};

window.goHome = function () {
  window.location.href = "index.html";
};

const returnTo = (() => {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnTo");
  return value ? decodeURIComponent(value) : "index.html";
})();

window.createAccount = async function () {
  const firstName = document.getElementById("firstName").value.trim();
  const lastName = document.getElementById("lastName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const gender = document.getElementById("gender").value;

  if (!firstName || !lastName || !phone || !password || !confirmPassword || !gender) {
    alert("Please complete all required fields.");
    return;
  }

  if (password !== confirmPassword) {
    const confirmField = document.getElementById("confirmPassword");
    confirmField.setCustomValidity("Passwords do not match.");
    confirmField.reportValidity();
    confirmField.setCustomValidity("");
    confirmField.focus();
    return;
  }

  const { data, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("phone_number", phone)
    .limit(1);

  if (lookupError) {
    alert("Error checking phone number: " + lookupError.message);
    return;
  }

  if (data && data.length > 0) {
    alert("This phone number is already registered. Please use a different number.");
    return;
  }

  const { error: insertError } = await supabase.from("customers").insert({
    first_name: firstName,
    last_name: lastName,
    phone_number: phone,
    password: password,
    gender: gender,
    created_at: new Date().toISOString(),
  });

  if (insertError) {
    alert("Error creating account: " + insertError.message);
    return;
  }

  const button = document.querySelector(".create-account-btn");
  const successBox = document.getElementById("registerSuccessMessage");
  const modalContent = document.querySelector(".modal-content");

  if (button) {
    button.classList.remove("is-clicked");
    void button.offsetWidth;
    button.classList.add("is-clicked");
  }

  if (successBox) {
    successBox.textContent = `Account created successfully! Welcome, ${firstName} ${lastName}.`;
    successBox.classList.remove("show");
    successBox.classList.add("show");

    if (modalContent) {
      modalContent.classList.add("is-success");
    }
  }

  const previousPhone = sessionStorage.getItem("agori_customer_phone")?.trim();
  if (previousPhone && previousPhone !== phone) {
    localStorage.removeItem(`agori_customer_profile_image_${previousPhone}`);
  }

  sessionStorage.setItem("agori_customer_phone", phone);
  localStorage.setItem("agori_customer_name", `${firstName} ${lastName}`.trim());

  const safePhone = phone.replace(/[^0-9]/g, "").replace(/^0+/, "") || "customer";
  const safeName = `${firstName} ${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20) || "customer";
  const generatedEmail = `${safePhone || safeName}@agori.com`;
  localStorage.setItem("agori_customer_email", generatedEmail);
  localStorage.removeItem("agori_customer_profile_image");
  localStorage.removeItem(`agori_customer_profile_image_${phone}`);

  setTimeout(() => {
    window.location.href = returnTo;
  }, 1200);
};
