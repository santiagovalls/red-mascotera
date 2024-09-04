import { checkUserToken, supabase } from "../libs/supabase.js";

$(document).ready(async function () {
  await checkUserToken();

  // Show spinner
  $("#pets-table-card").hide();
  $("#pets-form-card").hide();
  $("#loading-spinner").show();

  // Fetch data
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

  // Fill selects options
  petTypes.forEach((type) => {
    $("#pet-type").append(`<option value="${type.id}">${type.name}</option>`);
  });
  petStates.forEach((state) => {
    $("#pet-state").append(
      `<option value="${state.id}">${state.name}</option>`
    );
  });

  // Initialize DataTable
  const table = $("#pets-table").DataTable({
    language: {
      url: "../assets/jsons/es-AR.json",
    },
    data: petsData,
    columns: [
      {
        title: "Nombre",
        data: "name",
      },
      {
        title: "Etiqueta",
        data: "tag",
        render: (data, type, row, meta) => {
          return `<span class="badge bg-primary">${data}</span>`;
        },
      },
      { title: "Tipo de Mascota", data: "pet_types.name" },
      { title: "Estado de Adopción", data: "pet_states.name" },
      {
        title: "Fecha de Registro",
        data: "created_at",
        render: (data, type, row, meta) => {
          const date = new Date(data);
          return date
            .toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
            .replace(/\//g, "/");
        },
      },
      {
        title: "Acciones",
        width: "1%",
        render: (data, type, row, meta) => {
          return `
              <button
                class="btn btn-icon btn-primary edit-btn"
                data-id="${row.id}"
                data-bs-toggle="modal"
                data-bs-target="#pet-modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="icon icon-tabler icons-tabler-outline icon-tabler-pencil"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
                  <path d="M13.5 6.5l4 4" />
                </svg>
              </button>
              <button
                class="btn btn-danger btn-icon delete-btn"
                data-id="${row.id}"
                data-bs-toggle="modal"
                data-bs-target="#confirm-delete-modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="icon icon-tabler icons-tabler-outline icon-tabler-trash"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M4 7l16 0" />
                  <path d="M10 11l0 6" />
                  <path d="M14 11l0 6" />
                  <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
                  <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
                </svg>
              </button>
            `;
        },
      },
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

  // Hide spinner
  $("#loading-spinner").hide();
  $("#pets-table-card").show();
  $("#pets-form-card").show();

  // Add pet button
  $("#add-pet-btn").on("click", function () {
    $("#pet-modal-label").text("Agregar Mascota");
    $("#new-pet-form").trigger("reset"); // Limpiar el formulario
    $("#new-pet-form").removeData("pet-id"); // Quitar el ID del formulario
  });

  // Edit pet button
  $("#pets-table tbody").on("click", ".edit-btn", function () {
    const id = $(this).data("id");
    const selectedData = petsData.find((pet) => pet.id === id);

    if (selectedData) {
      $("#pet-modal-label").text("Editar Mascota");
      $("#pet-name").val(selectedData.name);
      $("#pet-tag").val(selectedData.tag);
      $("#pet-type").val(selectedData.pet_type_id);
      $("#pet-state").val(selectedData.pet_state_id);
      $("#new-pet-form").data("pet-id", id); // Guardar el ID en el formulario para actualizar
    }
  });

  // Delete pet button
  let petIdToDelete = null;
  $("#pets-table tbody").on("click", ".delete-btn", function () {
    petIdToDelete = $(this).data("id");
  });
  // Confirm delete
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
        location.reload();
      }
    }
  });

  // Submit form
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
      response = await supabase.from("pets").update(updatedPet).eq("id", id);
    } else {
      response = await supabase.from("pets").insert([updatedPet]);
    }

    const { error } = response;
    if (error) {
      console.error("Error inserting data: ", error);
      alert("Error al agregar la mascota: " + error.message);
    } else {
      alert("Mascota agregada exitosamente.");
      location.reload();
    }
  });
});
