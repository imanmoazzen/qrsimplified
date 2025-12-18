export const removeInitialLoadingIndicator = () => {
  const loader = document.getElementById("initial-loader");
  if (loader && !loader.classList.contains("hidden-loader")) {
    loader.classList.add("hidden-loader");
  }
};
