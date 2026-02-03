import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../contexts/ThemeContext";
import "./Footer.css";

/**
 * Footer Component
 * Footer with links and copyright information
 */
const Footer = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`footer mt-5 py-4 border-top ${isDarkMode ? "footer-dark" : "footer-light"}`}
    >
      <Container>
        <Row>
          <Col md={4} className="mb-3 mb-md-0">
            <h5 className="brand-name">
              <img
                src="/logo.png"
                alt="KMS Logo"
                style={{
                  height: "2.5rem",
                  width: "2.5rem",
                  objectFit: "contain",
                }}
              />
              {t("site_name")}
            </h5>
            <p>{t("footer.description")}</p>
          </Col>

          <Col md={4} className="mb-3 mb-md-0">
            <h5>{t("footer.quick_links")}</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/">{t("nav.home")}</Link>
              </li>
              <li>
                <Link to="/articles">{t("nav.articles")}</Link>
              </li>
              <li>
                <Link to="/about">{t("footer.about")}</Link>
              </li>
              <li>
                <Link to="/contact">{t("footer.contact")}</Link>
              </li>
            </ul>
          </Col>

          <Col md={4}>
            <h5>{t("footer.information")}</h5>
            <ul className="list-unstyled">
              <li>
                <Link to="/privacy">{t("footer.privacy_policy")}</Link>
              </li>
              <li>
                <Link to="/terms">{t("footer.terms_of_service")}</Link>
              </li>
              <li>
                <Link to="/contact">{t("footer.email_us")}</Link>
              </li>
              <li>
                <a
                  href="https://www.dpd.go.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("footer.dpdri_website")}
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        <hr className="my-4" />

        <Row>
          <Col md={6}>
            <p className="mb-0 text-muted">
              &copy; {currentYear} DPD RI. {t("footer.copyright")}
            </p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="mb-0 text-muted">{t("footer.kms_version")}</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
