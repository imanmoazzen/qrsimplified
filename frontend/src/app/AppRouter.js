import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import Feedback from "../commonComponents/Feedback/Feedback.js";
import Authentication from "../commonModules/auth/components/Authentication/Authentication.js";
import Campaign from "../commonModules/campaign/components/Campaign.js";
import UpgradePage from "../commonModules/campaign/components/UpgradePage.js";
import { brandingChanged } from "../commonModules/campaign/store/uiReducer.js";
import Cart from "../commonModules/project-root/components/Cart/Cart.js";
import FAQPage from "../commonModules/project-root/components/Cart/FAQPage.js";
import Navbar from "../commonModules/project-root/components/Navbar/Navbar.js";
import StripeReturnPage from "../commonModules/project-root/components/Stripe/StripeReturnPage.js";
import { removeInitialLoadingIndicator } from "../commonUtil/initialLoadingIndicator.js";
import { AUTHENTICATION_PAGES } from "../frontEndConstants.js";
import { auth } from "../index.js";

const AppRouter = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const user = useSelector(auth.userSelector);
  const [isGoogleFontLoaded, setIsGoogleFontLoaded] = useState(false);

  useEffect(() => {
    removeInitialLoadingIndicator();
  }, []);

  useEffect(() => {
    if (pathname.includes("welcome")) navigate("/folder/root?onboarding=true");
  }, []);

  useEffect(() => {
    document.fonts.load('24px "Material Symbols Outlined"').then(() => setIsGoogleFontLoaded(true));
    const fallbackTimer = setTimeout(() => setIsGoogleFontLoaded(true), 500);
    return () => clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    dispatch(
      brandingChanged(
        user?.branding ?? {
          logo: null,
          logo_scale: 4,
          color: "#000000",
          background: "#0000",
          isTransparent: true,
        }
      )
    );
  }, [user]);

  useEffect(() => {
    document.body.style.visibility = isGoogleFontLoaded ? "visible" : "hidden";
  }, [isGoogleFontLoaded]);

  if (!isGoogleFontLoaded) return;

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <Navbar />
            <Outlet />
          </>
        }
      >
        <Route index element={<Campaign />} />
        <Route path="upgrade" element={<UpgradePage />} />
        <Route path="cart" element={<Cart />} />
        <Route path="faq" element={<FAQPage />} />
        <Route path="success" element={<StripeReturnPage />} />
        <Route path="cancel" element={<StripeReturnPage isUpgrade={false} />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>
      <Route path="*" element={<span>Invalid URL!</span>} />
      {[
        AUTHENTICATION_PAGES.CONFIRM_SIGNUP,
        AUTHENTICATION_PAGES.FORGOT_PASSWORD,
        AUTHENTICATION_PAGES.LOGIN,
        AUTHENTICATION_PAGES.RESET_PASSWORD,
        AUTHENTICATION_PAGES.RESET_PASSWORD_BY_USERNAME,
        AUTHENTICATION_PAGES.SIGNUP,
      ].map((path, index) => (
        <Route key={index} path={path} element={<Authentication path={path} />} />
      ))}
    </Routes>
  );
};

export default AppRouter;
