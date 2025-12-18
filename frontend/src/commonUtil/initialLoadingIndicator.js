export const removeInitialLoadingIndicator = () => {
  const loader = document.getElementById("initial-loader");
  console.log(loader);
  if (loader && !loader.classList.contains("hidden-loader")) {
    loader.classList.add("hidden-loader");
  }
};
