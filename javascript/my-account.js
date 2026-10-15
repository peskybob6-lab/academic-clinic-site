import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  "https://fomowfqnswrsvuwzxmix.supabase.co",
  "sb_publishable_gB87Pwod8O3jMTAqixq4TQ_fqJKGVb1",
);

const storageKeys = {
  phone: "agori_customer_phone",
  profileImage: "agori_customer_profile_image",
};

function getProfileImageKey(phone = getCurrentPhone()) {
  return phone ? `agori_customer_profile_image_${phone}` : storageKeys.profileImage;
}

function getCurrentPhone() {
  return sessionStorage.getItem(storageKeys.phone)?.trim() || "";
}

function setCurrentPhone(phone) {
  sessionStorage.setItem(storageKeys.phone, phone.trim());
}

function showStatus(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (!element) return;

  element.textContent = message;
  element.classList.remove("success", "error");
  if (type) {
    element.classList.add(type);
  }
}

function defaultAvatar() {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" fill="#edf3ff"/>
      <circle cx="60" cy="42" r="22" fill="#5a7ae6" fill-opacity="0.18"/>
      <path d="M30 94c8-17 21-25 30-25s22 8 30 25" fill="#5a7ae6" fill-opacity="0.18"/>
    </svg>
  `)}`;
}

function loadProfileImage() {
  const profileImage = document.getElementById("profileImage");
  if (!profileImage) return;

  const phone = getCurrentPhone();
  const savedImage = phone
    ? localStorage.getItem(getProfileImageKey(phone))
    : localStorage.getItem(storageKeys.profileImage);
  profileImage.src = savedImage || defaultAvatar();
}

function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || "");
    const phone = getCurrentPhone();
    const key = getProfileImageKey(phone);
    localStorage.setItem(key, result);
    localStorage.removeItem(storageKeys.profileImage);
    const profileImage = document.getElementById("profileImage");
    if (profileImage) {
      profileImage.src = result;
    }
  };

  reader.readAsDataURL(file);
}

async function loadAccount() {
  loadProfileImage();

  const phone = getCurrentPhone();
  const profileName = document.getElementById("profileName");
  const profilePhone = document.getElementById("profilePhone");
  const currentPhoneInput = document.getElementById("currentPhone");
  const fullNameValue = document.getElementById("fullNameValue");
  const phoneValue = document.getElementById("phoneValue");
  const profileLoginPrompt = document.getElementById("profileLoginPrompt");

  if (!phone) {
    profileName.textContent = "Please log in";
    profilePhone.textContent = "Your account details will appear here.";
    if (fullNameValue) fullNameValue.textContent = "-";
    if (phoneValue) phoneValue.textContent = "-";
    if (currentPhoneInput) currentPhoneInput.value = "";
    if (profileLoginPrompt) profileLoginPrompt.style.display = "flex";
    return;
  }

  if (profileLoginPrompt) profileLoginPrompt.style.display = "none";

  const { data: customer, error } = await supabase
    .from("customers")
    .select("first_name, last_name, phone_number, password")
    .eq("phone_number", phone)
    .maybeSingle();

  if (error || !customer) {
    profileName.textContent = "Profile not found";
    profilePhone.textContent = "Please log in again.";
    if (fullNameValue) fullNameValue.textContent = "-";
    if (phoneValue) phoneValue.textContent = "-";
    return;
  }

  const fullName = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Customer";
  const displayPhone = customer.phone_number || "No phone number";

  profileName.textContent = fullName;
  profilePhone.textContent = displayPhone;
  if (fullNameValue) fullNameValue.textContent = fullName;
  if (phoneValue) phoneValue.textContent = displayPhone;

  if (currentPhoneInput) {
    currentPhoneInput.value = displayPhone;
  }
}

async function updatePassword(event) {
  event.preventDefault();

  const phone = getCurrentPhone();
  const oldPassword = document.getElementById("oldPassword").value;
  const newPassword = document.getElementById("newPassword").value;
  const confirmNewPassword = document.getElementById("confirmNewPassword").value;

  if (!phone) {
    showStatus("passwordStatus", "Please log in again before changing your password.", "error");
    return;
  }

  if (!oldPassword || !newPassword || !confirmNewPassword) {
    showStatus("passwordStatus", "Please complete all password fields.", "error");
    return;
  }

  if (newPassword.length < 6) {
    showStatus("passwordStatus", "New password must be at least 6 characters long.", "error");
    return;
  }

  if (newPassword !== confirmNewPassword) {
    showStatus("passwordStatus", "New passwords do not match.", "error");
    return;
  }

  const { data: customer, error: lookupError } = await supabase
    .from("customers")
    .select("password")
    .eq("phone_number", phone)
    .maybeSingle();

  if (lookupError || !customer) {
    showStatus("passwordStatus", "We could not find your account details.", "error");
    return;
  }

  if (String(customer.password ?? "") !== String(oldPassword)) {
    showStatus("passwordStatus", "The old password you entered is incorrect.", "error");
    return;
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({ password: newPassword })
    .eq("phone_number", phone);

  if (updateError) {
    showStatus("passwordStatus", "Password update failed: " + updateError.message, "error");
    return;
  }

  document.getElementById("passwordForm").reset();
  showStatus("passwordStatus", "Password updated successfully.", "success");
}

async function updatePhoneNumber(event) {
  event.preventDefault();

  const currentPhone = getCurrentPhone();
  const newPhone = document.getElementById("newPhone").value.trim();
  const confirmPhone = document.getElementById("confirmPhone").value.trim();

  if (!currentPhone) {
    showStatus("phoneStatus", "Please log in again before updating your phone number.", "error");
    return;
  }

  if (!newPhone || !confirmPhone) {
    showStatus("phoneStatus", "Please complete all phone number fields.", "error");
    return;
  }

  if (newPhone !== confirmPhone) {
    showStatus("phoneStatus", "Phone numbers do not match.", "error");
    return;
  }

  const { data: customer, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("phone_number", currentPhone)
    .maybeSingle();

  if (lookupError || !customer) {
    showStatus("phoneStatus", "We could not find your account details.", "error");
    return;
  }

  const { data: existingPhone, error: phoneCheckError } = await supabase
    .from("customers")
    .select("id")
    .eq("phone_number", newPhone)
    .maybeSingle();

  if (phoneCheckError) {
    showStatus("phoneStatus", "Unable to verify the new phone number.", "error");
    return;
  }

  if (existingPhone && existingPhone.id !== customer.id) {
    showStatus("phoneStatus", "This phone number is already in use by another account.", "error");
    return;
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({ phone_number: newPhone })
    .eq("phone_number", currentPhone);

  if (updateError) {
    showStatus("phoneStatus", "Phone number update failed: " + updateError.message, "error");
    return;
  }

  setCurrentPhone(newPhone);
  document.getElementById("phoneForm").reset();
  document.getElementById("currentPhone").value = newPhone;
  document.getElementById("profilePhone").textContent = newPhone;
  const phoneValue = document.getElementById("phoneValue");
  if (phoneValue) phoneValue.textContent = newPhone;
  showStatus("phoneStatus", "Phone number updated successfully.", "success");
}

const imageInput = document.getElementById("profileImageInput");
if (imageInput) {
  imageInput.addEventListener("change", handleImageUpload);
}

document.getElementById("passwordForm")?.addEventListener("submit", updatePassword);
document.getElementById("phoneForm")?.addEventListener("submit", updatePhoneNumber);

loadAccount();

