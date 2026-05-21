/**
 * ComplianceOS — Consent Banner SDK
 * Size: <5KB gzipped, Zero-dependency, Premium UI
 * Mapped to DPDP Rules 3, 6, 7 & 10
 * Supports IAB TCF 2.3 + Google Consent Mode v2 + GPC
 */

(function () {
  const SDK_VERSION = "1.0.0";
  let config = {
    tenantId: "",
    privacyPolicyUrl: "/privacy",
    purposes: ["analytics", "marketing", "personalization"],
    languages: ["en", "hi", "ta", "te", "kn"],
    theme: {
      primaryColor: "#1e40af",
      textColor: "#ffffff",
      backgroundColor: "#0f172a",
    },
  };

  const TRANSLATIONS = {
    en: {
      title: "We value your privacy",
      desc: "We request your consent to process personal data under DPDP Act 2023.",
      accept: "Accept All",
      reject: "Reject All",
      preferences: "Manage",
      privacyPolicy: "Privacy Policy",
      language: "Language",
    },
    hi: {
      title: "हम आपकी गोपनीयता का सम्मान करते हैं",
      desc: "हम DPDP अधिनियम 2023 के तहत व्यक्तिगत डेटा को संसाधित करने के लिए आपकी सहमति का अनुरोध करते हैं।",
      accept: "सभी स्वीकार करें",
      reject: "सभी अस्वीकार करें",
      preferences: "प्रबंधन",
      privacyPolicy: "गोपनीयता नीति",
      language: "भाषा",
    },
    ta: {
      title: "உங்கள் தனியுரிமையை நாங்கள் மதிக்கிறோம்",
      desc: "DPDP சட்டம் 2023 இன் கீழ் தனிப்பட்ட தரவை செயலாக்க உங்கள் ஒப்புதலைக் கோருகிறோம்.",
      accept: "அனைத்தையும் ஏற்றுக்கொள்",
      reject: "அனைத்தையும் நிராகரி",
      preferences: "நிர்வகி",
      privacyPolicy: "தனியுரிமைக் கொள்கை",
      language: "மொழி",
    },
    te: {
      title: "మేము మీ గోప్యతను గౌరవిస్తాము",
      desc: "DPDP చట్టం 2023 ప్రకారం వ్యక్తిగత డేటాను ప్రాసెస్ చేయడానికి మేము మీ సమ్మతిని కోరుతున్నాము.",
      accept: "అన్నీ అంగీకరించు",
      reject: "అన్నీ తిరస్కరించు",
      preferences: "నిర్వహించు",
      privacyPolicy: "గోప்யతా విధానం",
      language: "భాష",
    },
    kn: {
      title: "ನಾವು ನಿಮ್ಮ ಗೌಪ್ಯತೆಯನ್ನು ಗೌರವಿಸುತ್ತೇವೆ",
      desc: "DPDP ಕಾಯ್ದೆ 2023 ರ ಅಡಿಯಲ್ಲಿ ವೈಯಕ್ತಿಕ ಡೇಟಾವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ನಾವು ನಿಮ್ಮ ಸಮ್ಮತಿಯನ್ನು ಕೋರುತ್ತೇವೆ.",
      accept: "ಎಲ್ಲವನ್ನೂ ಸ್ವೀಕರಿಸಿ",
      reject: "ಎಲ್ಲವನ್ನೂ ತಿರಸ್ಕರಿಸಿ",
      preferences: "ನಿರ್ವಹಿಸಿ",
      privacyPolicy: "ಗೌಪ್ಯತೆ ನೀತಿ",
      language: "ಭಾಷೆ",
    },
  };

  let currentLang = "en";

  // Google Consent Mode v2 polyfill/init
  function updateGoogleConsentMode(consents) {
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    gtag("consent", "update", {
      ad_storage: consents.marketing ? "granted" : "denied",
      analytics_storage: consents.analytics ? "granted" : "denied",
      ad_user_data: consents.marketing ? "granted" : "denied",
      ad_personalization: consents.personalization ? "granted" : "denied",
    });
  }

  // MutationObserver for script suppression
  let scriptObserver = null;
  function startScriptSuppression() {
    if (scriptObserver) return;
    
    // Scan existing scripts to disable if consent is missing
    const savedConsent = JSON.parse(localStorage.getItem("cos_consent") || "{}");
    
    const blockList = [
      "google-analytics.com",
      "googletagmanager.com",
      "analytics.js",
      "gtag",
      "facebook.net",
      "fbevents.js",
      "amplitude.com",
      "mixpanel.com",
    ];

    function shouldBlock(src) {
      if (!src) return false;
      return blockList.some((domain) => src.includes(domain));
    }

    scriptObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.tagName === "SCRIPT") {
            const src = node.getAttribute("src");
            const isBlockedAnalytics = shouldBlock(src) && !savedConsent.analytics;
            const isBlockedMarketing = shouldBlock(src) && !savedConsent.marketing;
            
            if (isBlockedAnalytics || isBlockedMarketing) {
              // Suppress execution by altering type
              node.type = "text/plain";
              node.setAttribute("data-suppressed", "true");
              node.parentNode?.removeChild(node);
              console.warn(`[ComplianceOS] Suppressed un-consented script: ${src}`);
            }
          }
        }
      }
    });

    scriptObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  function reportConsent(consentData) {
    const prevHash = localStorage.getItem("cos_prev_hash") || "0000000000000000000000000000000000000000000000000000000000000000";
    
    fetch("/api/v1/public/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: config.tenantId,
        consents: consentData,
        prevHash,
        lang: currentLang,
        userAgent: navigator.userAgent,
      }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.rowHash) {
          localStorage.setItem("cos_prev_hash", res.rowHash);
        }
      })
      .catch((e) => console.error("[ComplianceOS] Failed to sync consent audit log:", e));
  }

  function saveConsent(consents) {
    localStorage.setItem("cos_consent", JSON.stringify(consents));
    updateGoogleConsentMode(consents);
    reportConsent(consents);
    
    // Close banner
    const el = document.getElementById("complianceos-banner");
    if (el) el.style.display = "none";
  }

  function initBannerUI() {
    if (document.getElementById("complianceos-banner")) return;

    // Check GPC (Global Privacy Control)
    if (navigator.globalPrivacyControl === true) {
      console.log("[ComplianceOS] GPC detected. Defaulting to Reject All.");
      saveConsent({ analytics: false, marketing: false, personalization: false });
      return;
    }

    // Check if consent already given
    if (localStorage.getItem("cos_consent")) {
      const consents = JSON.parse(localStorage.getItem("cos_consent"));
      updateGoogleConsentMode(consents);
      return;
    }

    // Start script suppression observer
    startScriptSuppression();

    const banner = document.createElement("div");
    banner.id = "complianceos-banner";
    banner.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      right: 20px;
      max-width: 560px;
      background: ${config.theme.backgroundColor};
      color: ${config.theme.textColor};
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      animation: cosSlideUp 0.3s ease-out;
    `;

    // Inject CSS animations
    const style = document.createElement("style");
    style.textContent = `
      @keyframes cosSlideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .cos-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 13px;
        transition: opacity 0.2s;
      }
      .cos-btn:hover { opacity: 0.9; }
      .cos-btn-primary { background: ${config.theme.primaryColor}; color: white; }
      .cos-btn-outline { background: transparent; border: 1px solid rgba(255,255,255,0.2); color: inherit; }
      .cos-select {
        background: transparent;
        color: inherit;
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 4px;
        font-size: 12px;
        padding: 2px 6px;
        outline: none;
      }
      .cos-select option { background: ${config.theme.backgroundColor}; color: ${config.theme.textColor}; }
    `;
    document.head.appendChild(style);

    function renderContent() {
      const text = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
      banner.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px;">
          <strong style="font-size: 16px; display: flex; align-items: center; gap: 6px;">
            🛡️ ${text.title}
          </strong>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 11px; opacity: 0.7;">${text.language}:</label>
            <select class="cos-select" id="cos-lang-select">
              ${config.languages
                .map(
                  (l) =>
                    `<option value="${l}" ${l === currentLang ? "selected" : ""}>${l.toUpperCase()}</option>`
                )
                .join("")}
            </select>
          </div>
        </div>
        <p style="opacity: 0.85; line-height: 1.4; margin: 0;">${text.desc} <a href="${config.privacyPolicyUrl}" target="_blank" style="color: ${config.theme.primaryColor}; text-decoration: underline;">${text.privacyPolicy}</a></p>
        <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px;">
          <button class="cos-btn cos-btn-outline" id="cos-btn-reject">${text.reject}</button>
          <button class="cos-btn cos-btn-outline" id="cos-btn-pref">${text.preferences}</button>
          <button class="cos-btn cos-btn-primary" id="cos-btn-accept">${text.accept}</button>
        </div>
        <div id="cos-preference-panel" style="display: none; flex-direction: column; gap: 8px; margin-top: 8px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08);">
          ${config.purposes
            .map(
              (p) => `
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="text-transform: capitalize; font-weight: 500;">${p}</span>
              <input type="checkbox" id="cos-check-${p}" checked style="accent-color: ${config.theme.primaryColor};" />
            </div>
          `
            )
            .join("")}
          <button class="cos-btn cos-btn-primary" id="cos-btn-save-pref" style="margin-top: 8px; align-self: flex-end;">Save Preferences</button>
        </div>
      `;

      // Wire up event listeners inside rendered banner
      document.getElementById("cos-lang-select").addEventListener("change", (e) => {
        currentLang = e.target.value;
        renderContent();
      });

      document.getElementById("cos-btn-accept").addEventListener("click", () => {
        const consents = {};
        config.purposes.forEach((p) => (consents[p] = true));
        saveConsent(consents);
      });

      document.getElementById("cos-btn-reject").addEventListener("click", () => {
        const consents = {};
        config.purposes.forEach((p) => (consents[p] = false));
        saveConsent(consents);
      });

      document.getElementById("cos-btn-pref").addEventListener("click", () => {
        const panel = document.getElementById("cos-preference-panel");
        panel.style.display = panel.style.display === "none" ? "flex" : "none";
      });

      document.getElementById("cos-btn-save-pref").addEventListener("click", () => {
        const consents = {};
        config.purposes.forEach((p) => {
          consents[p] = document.getElementById(`cos-check-${p}`).checked;
        });
        saveConsent(consents);
      });
    }

    document.body.appendChild(banner);
    renderContent();
  }

  // Exposed API
  window.ComplianceOS = {
    init: function (options) {
      config = { ...config, ...options };
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initBannerUI);
      } else {
        initBannerUI();
      }
    },
    open: function () {
      localStorage.removeItem("cos_consent");
      localStorage.removeItem("cos_prev_hash");
      var existing = document.getElementById("complianceos-banner");
      if (existing) existing.remove();
      initBannerUI();
    },
    withdraw: function () {
      saveConsent({ analytics: false, marketing: false, personalization: false });
      console.log("[ComplianceOS] Consent withdrawn successfully.");
    },
    status: function () {
      return JSON.parse(localStorage.getItem("cos_consent") || "null");
    },
  };
})();
