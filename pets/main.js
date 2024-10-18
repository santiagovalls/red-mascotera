import { checkUserToken, supabase } from "../libs/supabase.js";
import { showErrorToast, showSuccessToast } from "../libs/toastr.js";

let table;

$(document).ready(async function () {
  await initializePage();
});

async function initializePage() {
  await checkUserToken();
  showLoadingState();

  const [petTypes, petStates] = await fetchPetTypesAndStates();
  if (!petTypes || !petStates) return;
  populateSelectOptions(petTypes, petStates);

  table = initializeDataTable();
  setupEventListeners();

  hideLoadingState();
}

async function fetchPetTypesAndStates() {
  const [petTypesResponse, petStatesResponse] = await Promise.all([
    supabase.from("pet_types").select("*"),
    supabase.from("pet_states").select("*"),
  ]);

  if (petTypesResponse.error || petStatesResponse.error) {
    showErrorToast(
      "Error fetching data: " +
        (petTypesResponse.error || petStatesResponse.error).message
    );
    return [null, null];
  }

  return [petTypesResponse.data, petStatesResponse.data];
}

function populateSelectOptions(petTypes, petStates) {
  petTypes.forEach((type) => {
    $("#form-new-entity-field-type").append(
      `<option value="${type.id}">${type.name}</option>`
    );
  });
  petStates.forEach((state) => {
    $("#form-new-entity-field-state").append(
      `<option value="${state.id}">${state.name}</option>`
    );
  });
}

function initializeDataTable() {
  const table = $("#table-entity").DataTable({
    serverSide: true,
    processing: true,
    ajax: async function (data, callback) {
      const limit = data.length;
      const offset = data.start;
      let query = supabase
        .from("pets")
        .select(
          `
          id,
          created_at,
          name,
          tag,
          pet_types (id, name),
          pet_states (id, name)
        `,
          { count: "exact" }
        )
        .range(offset, offset + limit - 1);
      if (data.order[0]) {
        const orderColumn = data.order[0].column;
        const orderDirection = data.order[0].dir;
        const columns = [
          "name",
          "tag",
          "pet_types(name)",
          "pet_states(name)",
          "created_at",
        ];
        const columnToOrder = columns[orderColumn];
        query.order(columnToOrder, { ascending: orderDirection === "asc" });
      }
      const searchValue = data.search.value;
      if (searchValue) {
        query = query.ilike("name", `%${searchValue}%`);
      }
      const { data: petsData, count, error } = await query;
      if (error) {
        showErrorToast("Error fetching pets: " + error.message);
        return;
      }
      callback({
        draw: data.draw,
        recordsTotal: count,
        recordsFiltered: count,
        data: petsData,
      });
    },
    columns: [
      {
        title: "Nombre",
        data: "name",
        render: (data, type, row, meta) => {
          return `<span class="searchable">${data}</span>`;
        },
      },
      {
        title: "Etiqueta",
        data: "tag",
        width: "1%",
        className: "text-nowrap",
        render: (data, type, row, meta) => {
          return `<span class="badge bg-primary">${data}</span>`;
        },
      },
      { title: "Tipo de Mascota", data: "pet_types.name" },
      { title: "Estado de Adopción", data: "pet_states.name" },
      {
        title: "Fecha de Registro",
        data: "created_at",
        width: "1%",
        className: "text-nowrap",
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
        className: "text-nowrap",
        orderable: false,
        render: (data, type, row, meta) => {
          return `
              <button
                id="button-edit-entity"
                class="btn btn-icon btn-primary"
                data-id="${row.id}"
                data-bs-toggle="modal"
                data-bs-target="#modal-add-entity"
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
                id="button-delete-entity"
                class="btn btn-danger btn-icon"
                data-id="${row.id}"
                data-bs-toggle="modal"
                data-bs-target="#modal-delete-entity"
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
    language: {
      url: "../assets/jsons/es-AR.json",
    },
    layout: {
      topStart: function () {
        let toolbar = document.createElement("div");
        toolbar.innerHTML = `<button class="btn btn-primary" id="button-add-entity" data-bs-toggle="modal" data-bs-target="#modal-add-entity">Agregar Mascota</button>`;
        return toolbar;
      },
    },
  });
  // Escuchar el evento de búsqueda para resaltar coincidencias
  table.on("draw.dt search.dt", function () {
    const searchTerm = table.search().toLowerCase();
    if (searchTerm) {
      $("#table-entity tbody")
        .find("tr")
        .each(function () {
          $(this)
            .find("span.searchable")
            .each(function () {
              const originalText = $(this).text();
              const regex = new RegExp(`(${searchTerm})`, "gi");
              const highlightedText = originalText.replace(
                regex,
                `<span class="searchable highlight">$1</span>`
              );
              $(this).html(highlightedText);
            });
        });
    }
  });
  return table;
}

function setupEventListeners() {
  $(document).on("click", "#button-add-entity", handleAddPetClick);
  $(document).on("click", "#button-edit-entity", handleEditPetClick);
  $(document).on("click", "#button-delete-entity", handleDeletePetClick);
  $("#modal-delete-entity-button-confirm").on("click", () =>
    handleConfirmDelete()
  );
  $("#form-new-entity").on("submit", (event) => handleFormSubmit(event));
}

function handleAddPetClick() {
  $("#modal-add-entity-label").text("Agregar Mascota");
  $("#form-new-entity").trigger("reset").removeData("pet-id");
}

function handleEditPetClick() {
  const id = $(this).data("id");
  const selectedData = table.row($(this).closest("tr")).data();

  if (selectedData) {
    $("#modal-add-entity-label").text("Editar Mascota");
    $("#form-new-entity-field-name").val(selectedData.name);
    $("#form-new-entity-field-tag").val(selectedData.tag);
    $("#form-new-entity-field-type").val(selectedData.pet_types.id);
    $("#form-new-entity-field-state").val(selectedData.pet_states.id);
    $("#form-new-entity").data("pet-id", id);
  }
}

function handleDeletePetClick() {
  const petIdToDelete = $(this).data("id");
  $("#modal-delete-entity-button-confirm").data("pet-id", petIdToDelete);
}

async function handleConfirmDelete() {
  const petIdToDelete = $("#modal-delete-entity-button-confirm").data("pet-id");
  if (petIdToDelete) {
    const { error } = await supabase
      .from("pets")
      .delete()
      .eq("id", petIdToDelete);

    if (error) {
      showErrorToast("Error al eliminar la mascota: " + error.message);
    } else {
      showSuccessToast("Mascota eliminada exitosamente.");
      const closeButton = document.getElementById(
        "modal-delete-entity-button-close"
      );
      if (closeButton) {
        closeButton.click();
      }
      const currentPage = table.page();
      const currentPageRecords = table.rows({ page: "current" }).count();
      table.ajax.reload(() => {
        // Si la página actual quedó vacía después de eliminar, retrocedemos una página
        if (currentPageRecords === 1 && currentPage > 0) {
          table.page(currentPage - 1).draw(false);
        }
      }, false);
    }
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const id = $("#form-new-entity").data("pet-id");
  const updatedPet = {
    name: $("#form-new-entity-field-name").val(),
    tag: $("#form-new-entity-field-tag").val(),
    pet_type_id: $("#form-new-entity-field-type").val(),
    pet_state_id: $("#form-new-entity-field-state").val(),
  };

  let response;
  if (id) {
    response = await supabase.from("pets").update(updatedPet).eq("id", id);
  } else {
    response = await supabase.from("pets").insert([updatedPet]);
  }

  const { error } = response;
  if (error) {
    showErrorToast(
      "Error al " +
        (id ? "actualizar" : "agregar") +
        " la mascota: " +
        error.message
    );
  } else {
    showSuccessToast(
      "Mascota " + (id ? "actualizada" : "agregada") + " exitosamente."
    );
    const closeButton = document.getElementById(
      "modal-add-entity-button-close"
    );
    if (closeButton) {
      closeButton.click();
    }
    table.ajax.reload(null, false);
  }
}

function showLoadingState() {
  $("#card-table-entity, #pets-form-card").hide();
  $("#loading-spinner").show();
}

function hideLoadingState() {
  $("#loading-spinner").hide();
  $("#card-table-entity, #pets-form-card").show();
}
