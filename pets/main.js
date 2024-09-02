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
        id,
        created_at,
        name,
        tag,
        pet_type_id,
        pet_state_id,
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
        `
        <button class="btn btn-primary edit-btn" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#pet-modal">Editar</button>
        <button class="btn btn-danger delete-btn" data-id="${row.id}" data-bs-toggle="modal" data-bs-target="#confirm-delete-modal">Eliminar</button>
        `,
      ];
    });

    // Inicializa DataTables con los datos obtenidos
    const table = $("#pets-table").DataTable({
      data: tableData,
      columns: [
        { title: "Nombre" },
        { title: "Etiqueta" },
        { title: "Tipo de Mascota" },
        { title: "Estado de Adopción" },
        { title: "Fecha de Registro" },
        { title: "Acciones" }, // Columna para las acciones
      ],
      paging: true,
      searching: true,
      ordering: true,
      layout: {
        topStart: function () {
          let toolbar = document.createElement("div");
          toolbar.innerHTML = `<button class="btn btn-primary" id="add-pet-btn" data-bs-toggle="modal" data-bs-target="#pet-modal">Agregar Mascota</button>`;
          return toolbar;
        },
      },
    });

    // Mostrar modal para agregar nueva mascota
    $("#add-pet-btn").on("click", function () {
      $("#pet-modal-label").text("Agregar Mascota");
      $("#new-pet-form").trigger("reset"); // Limpiar el formulario
      $("#new-pet-form").removeData("pet-id"); // Quitar el ID del formulario
    });

    // Manejar el evento de clic en el botón de edición
    $("#pets-table tbody").on("click", ".edit-btn", function () {
      const id = $(this).data("id");
      const selectedData = petsData.find((pet) => pet.id === id);

      if (selectedData) {
        // Cargar los datos en el formulario
        $("#pet-modal-label").text("Editar Mascota");
        $("#pet-name").val(selectedData.name);
        $("#pet-tag").val(selectedData.tag);
        $("#pet-type").val(selectedData.pet_type_id);
        $("#pet-state").val(selectedData.pet_state_id);
        $("#new-pet-form").data("pet-id", id); // Guardar el ID en el formulario para actualizar
      }
    });
  }

  // Manejar el evento de clic en el botón de eliminación
  let petIdToDelete = null; // Variable para almacenar el ID de la mascota a eliminar

  $("#pets-table tbody").on("click", ".delete-btn", function () {
    petIdToDelete = $(this).data("id"); // Almacenar el ID de la mascota para eliminar
  });

  // Confirmar eliminación
  $("#confirm-delete-btn").on("click", async function () {
    if (petIdToDelete) {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petIdToDelete);

      if (error) {
        console.error("Error deleting pet: ", error);
        alert("Error al eliminar la mascota: " + error.message);
      } else {
        alert("Mascota eliminada exitosamente.");
        location.reload(); // Recargar la página para mostrar los cambios
      }
    }
  });

  // Manejar el envío del formulario para agregar o actualizar una mascota
  $("#new-pet-form").on("submit", async function (event) {
    event.preventDefault();

    const id = $(this).data("pet-id");
    const updatedPet = {
      name: $("#pet-name").val(),
      tag: $("#pet-tag").val(),
      pet_type_id: $("#pet-type").val(),
      pet_state_id: $("#pet-state").val(),
    };

    let response;
    if (id) {
      // Si hay un ID, actualizar la mascota existente
      response = await supabase.from("pets").update(updatedPet).eq("id", id);
    } else {
      // Si no hay ID, agregar una nueva mascota
      updatedPet.created_at = new Date().toISOString();
      response = await supabase.from("pets").insert([updatedPet]);
    }

    const { error } = response;

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
