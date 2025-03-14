import { checkUserToken, supabase } from "../libs/supabase.js";
import { showErrorToast, showSuccessToast } from "../libs/toastr.js";

let table;

$(document).ready(async function () {
  await initializePage();
});

async function initializePage() {
  await checkUserToken();
  showLoadingState();

  table = initializeDataTable();
  setupEventListeners();

  hideLoadingState();
}

function initializeDataTable() {
  const table = $("#table-entity").DataTable({
    serverSide: true,
    processing: true,
    ajax: async function (data, callback) {
      const limit = data.length;
      const offset = data.start;
      let query = supabase
        .from("pet_types")
        .select(
          `
          id,
          created_at,
          name
        `,
          { count: "exact" }
        )
        .range(offset, offset + limit - 1);
      if (data.order[0]) {
        const orderColumn = data.order[0].column;
        const orderDirection = data.order[0].dir;
        const columns = ["name", "created_at"];
        const columnToOrder = columns[orderColumn];
        query.order(columnToOrder, { ascending: orderDirection === "asc" });
      }
      const searchValue = data.search.value;
      if (searchValue) {
        query = query.ilike("name", `%${searchValue}%`);
      }
      const { data: petTypesData, count, error } = await query;
      if (error) {
        showErrorToast("Error al obtener tipos de mascota: " + error.message);
        return;
      }
      callback({
        draw: data.draw,
        recordsTotal: count,
        recordsFiltered: count,
        data: petTypesData,
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
                <img
                  src="../assets/images/icon-pencil.svg"
                  alt="Pencil Icon"
                  width="22"
                  height="22"
                />
              </button>
              <button
                id="button-delete-entity"
                class="btn btn-danger btn-icon"
                data-id="${row.id}"
                data-bs-toggle="modal"
                data-bs-target="#modal-delete-entity"
              >
                <img
                  src="../assets/images/icon-trash.svg"
                  alt="Trash Icon"
                  width="22"
                  height="22"
                />
              </button>
            `;
        },
      },
    ],
    paging: true,
    searching: true,
    ordering: true,
    order: [[0, "asc"]],
    language: {
      url: "../assets/jsons/es-AR.json",
    },
    layout: {
      topStart: function () {
        let toolbar = document.createElement("div");
        toolbar.innerHTML = `<button class="btn btn-primary" id="button-add-entity" data-bs-toggle="modal" data-bs-target="#modal-add-entity">Agregar Tipo de Mascota</button>`;
        return toolbar;
      },
    },
  });
  // Listen for search event to highlight matches
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
  $(document).on("click", "#button-add-entity", handleAddPetTypeClick);
  $(document).on("click", "#button-edit-entity", handleEditPetTypeClick);
  $(document).on("click", "#button-delete-entity", handleDeletePetTypeClick);
  $("#modal-delete-entity-button-confirm").on("click", () =>
    handleConfirmDelete()
  );
  $("#form-new-entity").on("submit", (event) => handleFormSubmit(event));
}

function handleAddPetTypeClick() {
  $("#modal-add-entity-label").text("Agregar Tipo de Mascota");
  $("#form-new-entity").trigger("reset").removeData("pet-type-id");
}

function handleEditPetTypeClick() {
  const id = $(this).data("id");
  const selectedData = table.row($(this).closest("tr")).data();

  if (selectedData) {
    $("#modal-add-entity-label").text("Editar Tipo de Mascota");
    $("#form-new-entity-field-name").val(selectedData.name);
    $("#form-new-entity").data("pet-type-id", id);
  }
}

function handleDeletePetTypeClick() {
  const petTypeIdToDelete = $(this).data("id");
  $("#modal-delete-entity-button-confirm").data(
    "pet-type-id",
    petTypeIdToDelete
  );
}

async function handleConfirmDelete() {
  const petTypeIdToDelete = $("#modal-delete-entity-button-confirm").data(
    "pet-type-id"
  );
  if (petTypeIdToDelete) {
    const { error } = await supabase
      .from("pet_types")
      .delete()
      .eq("id", petTypeIdToDelete);

    if (error) {
      showErrorToast("Error al eliminar tipo de mascota: " + error.message);
    } else {
      showSuccessToast("Tipo de mascota eliminado exitosamente.");
      const closeButton = document.getElementById(
        "modal-delete-entity-button-close"
      );
      if (closeButton) {
        closeButton.click();
      }
      const currentPage = table.page();
      const currentPageRecords = table.rows({ page: "current" }).count();
      table.ajax.reload(() => {
        // If current page is empty after deletion, go back one page
        if (currentPageRecords === 1 && currentPage > 0) {
          table.page(currentPage - 1).draw(false);
        }
      }, false);
    }
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const id = $("#form-new-entity").data("pet-type-id");
  const updatedPetType = {
    name: $("#form-new-entity-field-name").val(),
  };

  let response;
  if (id) {
    response = await supabase
      .from("pet_types")
      .update(updatedPetType)
      .eq("id", id);
  } else {
    response = await supabase.from("pet_types").insert([updatedPetType]);
  }

  const { error } = response;
  if (error) {
    showErrorToast(
      "Error al " +
        (id ? "actualizar" : "agregar") +
        " tipo de mascota: " +
        error.message
    );
  } else {
    showSuccessToast(
      "Tipo de mascota " + (id ? "actualizado" : "agregado") + " exitosamente."
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
  $("#card-table-entity").hide();
  $("#loading-spinner").show();
}

function hideLoadingState() {
  $("#loading-spinner").hide();
  $("#card-table-entity").show();
}
