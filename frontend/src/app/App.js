import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import { AuthWrapper } from "../commonModules/auth/index.js";
import { MessageContainer } from "../commonModules/messenger/index.js";
import ContextWrapper from "../contexts/ContextWrapper/ContextWrapper.js";
import { auth, messenger, store } from "../index.js";
import AppAnalytics from "./AppAnalytics.js";
import AppRouter from "./AppRouter.js";

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AuthWrapper module={auth}>
          <AppAnalytics module={auth}>
            <ContextWrapper>
              <AppRouter />
            </ContextWrapper>
            <MessageContainer module={messenger} />
          </AppAnalytics>
        </AuthWrapper>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
