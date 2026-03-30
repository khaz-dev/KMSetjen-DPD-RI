import React, { useState, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { FaGoogle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { getSSOAuthorizationUrl } from "../services/ssoService";
import {
  getGoogleAuthorizationUrl,
  isGoogleConfigured,
} from "../services/googleService";
import ErrorAlert from "../components/ErrorAlert";
import "./AuthPages.css";

/**
 * LoginPage Component
 * SSO and Google OAuth login only (no email/password login)
 */
const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      console.debug(
        "[LoginPage] User already authenticated, redirecting to dashboard",
      );
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSSOLogin = () => {
    try {
      setLoading(true);
      console.debug("[LoginPage] Initiating SSO flow");
      const ssoUrl = getSSOAuthorizationUrl();
      console.debug("[LoginPage] Redirecting to SSO authorization URL");
      window.location.href = ssoUrl;
    } catch (err) {
      console.error("[LoginPage] SSO login error:", err);
      setApiError(t("sso.redirect_failed"));
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      setLoading(true);
      console.debug("[LoginPage] Initiating Google OAuth flow");
      const googleUrl = getGoogleAuthorizationUrl();
      console.debug(
        "[LoginPage] Redirecting to Google authorization URL:",
        googleUrl.substring(0, 50) + "...",
      );
      window.location.href = googleUrl;
    } catch (err) {
      console.error("[LoginPage] Google login error:", err);
      setApiError(err.message || t("google.redirect_failed"));
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Container className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img
              src="/logo.png"
              alt="KMS Logo"
              className="auth-logo"
            />
            <h1>{t("login.title")}</h1>
            <p>{t("header.welcome")}</p>
          </div>

          {apiError && (
            <ErrorAlert
              message={apiError}
              onDismiss={() => setApiError(null)}
            />
          )}

          <div className="sso-login-container">
            {isGoogleConfigured() && (
              <div className="login-option">
                <p className="login-option-label">{t("login.google_label")}</p>
                <Button
                  type="button"
                  variant="none"
                  className="google-login-btn"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <FaGoogle size={20} className="me-2" />
                  {t("login.google_login")}
                </Button>
              </div>
            )}

            <div className="login-option">
              <p className="login-option-label">{t("login.sso_label")}</p>
              <Button
                type="button"
                variant="none"
                className="sso-login-btn"
                onClick={handleSSOLogin}
                disabled={loading}
              >
                <img
                  src="/logo_nusa.png"
                  alt="Nusa Logo"
                  style={{
                    height: "1.5rem",
                    width: "1.5rem",
                    objectFit: "contain",
                    marginRight: "0.5rem",
                  }}
                />
                {t("login.sso_login")}
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default LoginPage;
