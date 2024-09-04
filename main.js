// Crear el cliente de Supabase utilizando la versión 2 del SDK
import supabase from "./libs/supabase.js";

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
      console.error("Error during login:", error.message);
      alert("Error al iniciar sesión: " + error.message);
      $("#loading-spinner").hide();
      $("#login-form-card").show();
      return;
    }

    // Redirigir al usuario a la página de pets
    window.location.href = "pets/index.html";
  });
});
