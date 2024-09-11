// Crear el cliente de Supabase utilizando la versión 2 del SDK
import { supabase } from "./libs/supabase.js";

toastr.options = {
  closeButton: true,
  debug: false,
  newestOnTop: false,
  progressBar: true,
  positionClass: "toast-bottom-right",
  preventDuplicates: true,
  onclick: null,
  showDuration: "300",
  hideDuration: "1000",
  timeOut: "5000",
  extendedTimeOut: "1000",
  showEasing: "swing",
  hideEasing: "linear",
  showMethod: "fadeIn",
  hideMethod: "fadeOut",
};

function showErrorToast(errorMessage) {
  toastr.error(
    errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1),
    "Error"
  );
}

$(document).ready(async function () {
  // Capturar el evento submit del formulario
  $("#login-form").on("submit", async function (event) {
    event.preventDefault();

    // Mostrar spinner y deshabilitar el formulario
    $("#loading-spinner").show();
    $("#login-form-card").hide();

    const email = $("#email").val();
    const password = $("#password").val();

    // Intentar login con Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showErrorToast(error.message);
      $("#loading-spinner").hide();
      $("#login-form-card").show();
      return;
    }

    // Redirigir al usuario a la página de pets
    window.location.href = "pets/index.html";
  });
});
