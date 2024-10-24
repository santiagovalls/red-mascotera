import { supabase } from "./libs/supabase.js";
import { showErrorToast } from "./libs/toastr.js";

$(document).ready(function () {
  setupLoginFormSubmission();
});

function setupLoginFormSubmission() {
  $("#form-login").on("submit", handleLoginFormSubmit);
}

async function handleLoginFormSubmit(event) {
  event.preventDefault();
  showLoadingState();

  const credentials = getLoginCredentials();
  const loginSuccessful = await attemptLogin(credentials);

  if (loginSuccessful) {
    redirectToPetsPage();
  } else {
    hideLoadingState();
  }
}

async function attemptLogin({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    showErrorToast(error.message);
    return false;
  }
  return true;
}

function redirectToPetsPage() {
  window.location.href = "pets/index.html";
}

function showLoadingState() {
  $("#loading-spinner").show();
  $("#card-form-login").hide();
}

function hideLoadingState() {
  $("#loading-spinner").hide();
  $("#card-form-login").show();
}

function getLoginCredentials() {
  return {
    email: $("#form-login-field-email").val(),
    password: $("#form-login-field-password").val(),
  };
}
