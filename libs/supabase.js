const supabaseUrl = "https://wrmppqblaxqynkufwtkt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybXBwcWJsYXhxeW5rdWZ3dGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMxNTQzNTIsImV4cCI6MjAzODczMDM1Mn0.KDGMFdcsCFg0Babt2F1mhDaVSQruiRQUGsif0Z2Q6Uw";

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function checkUserToken() {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    alert(
      "Sesión expirada o no autenticada. Por favor, inicia sesión nuevamente."
    );
    window.location.href = "/index.html";
  }
  // Actualizar el nombre de usuario o mostrar "-"
  if (userError || !userData.user) {
    $("#navbar-user-email").text("-");
  } else {
    $("#navbar-user-email").text(userData.user.email);
  }
}

export { checkUserToken, supabase };
