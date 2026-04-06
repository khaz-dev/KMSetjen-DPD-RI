import React from "react";
import { Navbar, Nav, Container, Dropdown, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../hooks/useLanguage";
import { useTheme } from "../hooks/useTheme";
import { getAbsoluteMediaUrl } from "../services/api";
import {
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaGlobe,
} from "react-icons/fa";
import "./Header.css";

/**
 * Header Component
 * Navigation header with user menu
 */
const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { language, changeLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <Navbar bg="light" expand="lg" sticky="top" className="navbar-custom">
      <Container>
        <Navbar.Brand as={Link} to="/" className="brand-logo">
          <img
            src="/logo.png"
            alt="KMS Logo"
            style={{ height: '2.5rem', width: '2.5rem', objectFit: 'contain' }}
          />
          <strong>KMSetjen</strong> DPD RI
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">
              {t("nav.home")}
            </Nav.Link>

            <Nav.Link as={Link} to="/knowledges">
              {t("nav.articles")}
            </Nav.Link>

            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/dashboard">
                  {t("nav.dashboard")}
                </Nav.Link>

                {(user?.is_admin || user?.is_editor) && (
                  <Nav.Link as={Link} to="/admin">
                    {t("nav.admin")}
                  </Nav.Link>
                )}
              </>
            )}

            {/* Theme Toggle Button */}
            <Button
              variant="none"
              className="nav-button theme-toggle"
              onClick={toggleTheme}
              title={
                theme === "light" ? t("header.darkMode") : t("header.lightMode")
              }
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </Button>

            {/* Language Dropdown */}
            <Dropdown className="ms-2">
              <Dropdown.Toggle
                variant="none"
                className="nav-button language-toggle"
              >
                <FaGlobe className="me-1" />
                {t(`nav.lang_${language.split("-")[0]}_short`)}
              </Dropdown.Toggle>

              <Dropdown.Menu align="end">
                <Dropdown.Item onClick={() => changeLanguage("id")}>
                  🇮🇩 {t("nav.lang_id")}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => changeLanguage("en")}>
                  🇺🇸 {t("nav.lang_en")}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {!isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/login" className="ms-2">
                  {t("nav.login")}
                </Nav.Link>
              </>
            ) : (
              <Dropdown className="ms-3" align="end">
                <Dropdown.Toggle variant="none" className="user-menu-toggle">
                  {user?.avatar ? (
                    <img
                      src={getAbsoluteMediaUrl(user.avatar)}
                      alt={user?.username || "User"}
                      className="navbar-avatar"
                      title={user?.username || "User"}
                    />
                  ) : (
                    <FaUser className="navbar-avatar-icon" />
                  )}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    <FaUser className="me-2" />
                    {t("nav.profile")}
                  </Dropdown.Item>

                  <Dropdown.Item as={Link} to="/settings">
                    <FaCog className="me-2" />
                    {t("nav.settings")}
                  </Dropdown.Item>

                  <Dropdown.Divider />

                  <Dropdown.Item
                    onClick={() => {
                      logout();
                      navigate("/login");
                    }}
                  >
                    <FaSignOutAlt className="me-2" />
                    {t("nav.logout")}
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
