import { APP_PAGES, AUTHENTICATION_PAGES, UNIQUE_APP_ROUTER_KEY } from "castofly-common/appPages.js";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";

import Feedback from "../commonComponents/Feedback/Feedback.js";
import Authentication from "../commonModules/auth/components/Authentication/Authentication.js";
import Campaign from "../commonModules/campaign/components/Campaign.js";
import LeadPage from "../commonModules/campaign/components/LeadPage.js";
import UpgradePage from "../commonModules/campaign/components/UpgradePage.js";
import { brandingChanged } from "../commonModules/campaign/store/uiReducer.js";
import Cart from "../commonModules/project-root/components/Cart/Cart.js";
import FAQPage from "../commonModules/project-root/components/Cart/FAQPage.js";
import Navbar from "../commonModules/project-root/components/Navbar/Navbar.js";
import Redirect from "../commonModules/project-root/components/Redirect/Redirect.js";
import Referral from "../commonModules/project-root/components/Referral/Referral.js";
import StripeReturnPage from "../commonModules/project-root/components/Stripe/StripeReturnPage.js";
import { removeInitialLoadingIndicator } from "../commonUtil/initialLoadingIndicator.js";
import { auth } from "../index.js";

const AppRouter = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const user = useSelector(auth.userSelector);
  const isAnonymous = useSelector(auth.isAnonymousSelector);
  const [isGoogleFontLoaded, setIsGoogleFontLoaded] = useState(false);

  useEffect(() => {
    removeInitialLoadingIndicator();
  }, []);

  useEffect(() => {
    document.fonts.load('24px "Material Symbols Outlined"').then(() => setIsGoogleFontLoaded(true));
    const fallbackTimer = setTimeout(() => setIsGoogleFontLoaded(true), 500);
    return () => clearTimeout(fallbackTimer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referral_id = params.get("ref");

    if (referral_id && referral_id !== user?.referral_id) {
      localStorage.setItem("referral_id", referral_id);
    }
  }, [user]);

  useEffect(() => {
    if (pathname === "/" && isAnonymous) {
      navigate(APP_PAGES.SIGNUP);
      return;
    }

    if (!pathname.startsWith(UNIQUE_APP_ROUTER_KEY)) return;

    const anonymousAllowed = [APP_PAGES.UPGRADE, APP_PAGES.LEAD, APP_PAGES.LOGIN];
    if (!anonymousAllowed.some((path) => pathname.includes(path)) && isAnonymous) navigate(APP_PAGES.SIGNUP);
  }, [pathname, isAnonymous]);

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

  if (!isGoogleFontLoaded) return null;

  return (
    <Routes>
      <Route path="/:campaign_id" element={<Redirect />} />
      <Route path={APP_PAGES.LEAD} element={<LeadPage />} />
      <Route path={APP_PAGES.UPGRADE} element={<UpgradePage />} />
      {Object.values(AUTHENTICATION_PAGES).map((path, index) => (
        <Route key={index} path={path} element={<Authentication />} />
      ))}

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
        <Route path={APP_PAGES.CART} element={<Cart />} />
        <Route path={APP_PAGES.FAQ} element={<FAQPage />} />
        <Route path={APP_PAGES.SUCCESS_PAYMENT} element={<StripeReturnPage />} />
        <Route path={APP_PAGES.FEEDBACK} element={<Feedback />} />
        <Route path={APP_PAGES.REFERRAL} element={<Referral />} />
      </Route>
      <Route path="*" element={<span>Invalid URL!</span>} />
    </Routes>
  );
};

export default AppRouter;
