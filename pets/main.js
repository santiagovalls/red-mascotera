// Crear el cliente de Supabase utilizando la versión 2 del SDK
const supabaseUrl = "https://wrmppqblaxqynkufwtkt.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndybXBwcWJsYXhxeW5rdWZ3dGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjMxNTQzNTIsImV4cCI6MjAzODczMDM1Mn0.KDGMFdcsCFg0Babt2F1mhDaVSQruiRQUGsif0Z2Q6Uw";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

$(document).ready(async function () {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  // Verificar si el token existe
  if (userError || !userData.user) {
    alert(
      "Sesión expirada o no autenticada. Por favor, inicia sesión nuevamente."
    );
    window.location.href = "/index.html"; // Redirigir a la página de login
    return;
  }

  // Mostrar el spinner y ocultar la tabla y el formulario mientras se cargan los datos
  $("#pets-table-card").hide();
  $("#pets-form-card").hide();
  $("#loading-spinner").show();

  // Recuperar el email del usuario logueado y las demás consultas en paralelo
  const [petTypesResponse, petStatesResponse, petsDataResponse] =
    await Promise.all([
      supabase.from("pet_types").select("*"),
      supabase.from("pet_states").select("*"),
      supabase.from("pets").select(`
        name,
        tag,
        created_at,
        pet_types (name),
        pet_states (name)
      `),
    ]);

  // Actualizar el nombre de usuario o mostrar "-"
  if (userError || !userData.user) {
    $("#user-email").text("-");
  } else {
    $("#user-email").text(userData.user.email);
  }
  // Esconde el spinner y muestra la tabla cuando los datos están listos
  $("#loading-spinner").hide();
  $("#pets-table-card").show();
  $("#pets-form-card").show();

  const petTypes = petTypesResponse.data;
  const petStates = petStatesResponse.data;
  const petsData = petsDataResponse.data;

  if (
    petTypesResponse.error ||
    petStatesResponse.error ||
    petsDataResponse.error
  ) {
    console.error(
      "Error fetching data: ",
      petTypesResponse.error ||
        petStatesResponse.error ||
        petsDataResponse.error
    );
    return;
  }

  // Llenar los selects de tipo y estado de mascota
  petTypes.forEach((type) => {
    $("#pet-type").append(`<option value="${type.id}">${type.name}</option>`);
  });

  petStates.forEach((state) => {
    $("#pet-state").append(
      `<option value="${state.id}">${state.name}</option>`
    );
  });

  // Si se obtienen datos, llena la tabla
  if (petsData) {
    let tableData = petsData.map((row) => {
      return [
        row.name,
        row.tag,
        row.pet_types.name || "Desconocido", // Nombre del tipo de mascota
        row.pet_states.name || "Desconocido", // Estado de adopción
        new Date(row.created_at).toLocaleDateString(),
      ];
    });

    // Inicializa DataTables con los datos obtenidos
    $("#pets-table").DataTable({
      data: tableData,
      columns: [
        { title: "Nombre" },
        { title: "Etiqueta" },
        { title: "Tipo de Mascota" },
        { title: "Estado de Adopción" },
        { title: "Fecha de Registro" },
      ],
      paging: true,
      searching: true,
      ordering: true,
    });
  }

  // Manejar el envío del formulario para agregar una nueva mascota
  $("#new-pet-form").on("submit", async function (event) {
    event.preventDefault();

    const newPet = {
      name: $("#pet-name").val(),
      tag: $("#pet-tag").val(),
      pet_type_id: $("#pet-type").val(),
      pet_state_id: $("#pet-state").val(),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("pets").insert([newPet]);

    if (error) {
      console.error("Error inserting data: ", error);
      alert("Error al agregar la mascota: " + error.message);
    } else {
      alert("Mascota agregada exitosamente.");
      // Recargar la página o actualizar la tabla
      location.reload(); // Recargar la página para mostrar la nueva mascota
    }
  });
});
