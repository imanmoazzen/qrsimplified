import { setUploadMonitorOpen } from "./upload.js";

const connectUploadObserver = (module, store) => {
  let currentValue;
  store.subscribe(() => {
    const previousValue = currentValue;
    currentValue = module.uploadsInProgressSelector(store.getState());
    if (previousValue !== currentValue) {
      if (currentValue > 0) {
        window.onbeforeunload = () => {
          store.dispatch(setUploadMonitorOpen(true));
          return true;
        };
      } else {
        window.onbeforeunload = null;
      }
    }
  });
};

export default connectUploadObserver;
