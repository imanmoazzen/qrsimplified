export const removeInitialLoadingIndicator = () => {
  const loader = document.getElementById("initial-loader");
  console.log(loader);
  if (loader && !loader.classList.contains("hidden-loader")) {
    console.log("omadam too");
    loader.classList.add("hidden-loader");
  }
};
