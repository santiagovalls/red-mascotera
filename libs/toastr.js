export const toastrOptions = {
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

export function showErrorToast(message) {
  toastr.error(message.charAt(0).toUpperCase() + message.slice(1), "Error");
}

export function showSuccessToast(message) {
  toastr.success(message.charAt(0).toUpperCase() + message.slice(1), "Success");
}

export function initializeToastr() {
  toastr.options = toastrOptions;
}

initializeToastr();
