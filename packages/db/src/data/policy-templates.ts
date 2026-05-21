/**
 * ComplianceOS — DPDP Policy Templates Seed Data
 * Sprint 2 Tasks 2.1 & 2.2: Rule-3 Privacy Notice + Cookie Policy templates
 * 
 * Templates use Handlebars-style {{variable}} merge fields.
 * Variables are filled from tenant profile data during generation.
 */

export interface PolicyTemplateSeed {
  type: "privacy_notice" | "cookie_policy" | "dsr_procedure" | "breach_response" | "retention_schedule";
  name: string;
  description: string;
  version: string;
  language: string;
  ruleRefs: string[];
  industries: string[];
  isDefault: boolean;
  templateBody: string;
  variableSchema: Record<string, { type: string; label: string; required?: boolean }>;
}

// ─── RULE 3 PRIVACY NOTICE (ENGLISH) ────────────────────────────────────────

const privacyNoticeEN: PolicyTemplateSeed = {
  type: "privacy_notice",
  name: "DPDP Rule 3 — Privacy Notice (English)",
  description: "Standard privacy notice compliant with Section 5 and Rule 3 of the DPDP Act 2023. Covers data collection, purposes, rights, and grievance redressal.",
  version: "1.0",
  language: "en",
  ruleRefs: ["Rule 3", "Section 5", "Section 6", "Section 8", "Section 11", "Section 12", "Section 13", "Section 14"],
  industries: ["all"],
  isDefault: true,
  variableSchema: {
    companyName: { type: "string", label: "Company Legal Name", required: true },
    companyAddress: { type: "string", label: "Registered Office Address", required: true },
    entityType: { type: "string", label: "Entity Type (e.g., Pvt Ltd, LLP)" },
    cin: { type: "string", label: "CIN / LLPIN" },
    industry: { type: "string", label: "Industry" },
    websiteUrl: { type: "string", label: "Website URL", required: true },
    dpoName: { type: "string", label: "Data Protection Officer Name", required: true },
    dpoEmail: { type: "string", label: "DPO Email Address", required: true },
    dpoPhone: { type: "string", label: "DPO Phone Number" },
    grievanceUrl: { type: "string", label: "Grievance Portal URL" },
    dataCategories: { type: "string", label: "Categories of Personal Data Collected" },
    purposes: { type: "string", label: "Purposes of Data Processing" },
    thirdPartyProcessors: { type: "string", label: "Third-Party Processors List" },
    retentionPeriod: { type: "string", label: "Default Data Retention Period" },
    crossBorderCountries: { type: "string", label: "Countries for Cross-Border Transfer" },
    effectiveDate: { type: "string", label: "Effective Date", required: true },
    lastUpdated: { type: "string", label: "Last Updated Date", required: true },
  },
  templateBody: `# Privacy Notice

**{{companyName}}** ("we", "us", "our"), a {{entityType}} registered under the laws of India (CIN: {{cin}}), is committed to protecting the personal data of its users ("Data Principals") in compliance with the **Digital Personal Data Protection Act, 2023** and the **DPDP Rules, 2025**.

**Effective Date:** {{effectiveDate}}  
**Last Updated:** {{lastUpdated}}

---

## 1. Data Fiduciary Information

| Detail | Information |
|--------|-------------|
| **Legal Entity** | {{companyName}} |
| **Registered Office** | {{companyAddress}} |
| **Industry** | {{industry}} |
| **Website** | {{websiteUrl}} |
| **Data Protection Officer** | {{dpoName}} |
| **DPO Contact** | {{dpoEmail}} · {{dpoPhone}} |

---

## 2. Personal Data We Collect (Rule 3(a))

We collect the following categories of personal data:

{{dataCategories}}

We collect this data through:
- Our website and mobile applications
- Customer registration and onboarding forms
- Transaction and payment processing
- Customer support interactions
- Cookies and similar tracking technologies (with your consent)

---

## 3. Purpose of Processing (Rule 3(b))

We process your personal data for the following purposes:

{{purposes}}

We process personal data only for the specific purpose for which consent was obtained, or as permitted under Section 7 of the DPDP Act (Certain Legitimate Uses).

---

## 4. Lawful Basis for Processing

Under the DPDP Act 2023, we process personal data based on:

1. **Consent (Section 6):** Your freely given, specific, informed, and unambiguous consent
2. **Certain Legitimate Uses (Section 7):** Including:
   - Performance of a contract to which you are a party
   - Compliance with any law in force in India
   - Response to a medical emergency
   - Employment-related purposes
   - Public interest (as notified by the Central Government)

---

## 5. Your Rights as a Data Principal (Sections 11-14)

Under the DPDP Act 2023, you have the following rights:

### 5.1 Right to Access (Section 11)
You have the right to obtain a summary of your personal data being processed and the processing activities undertaken.

### 5.2 Right to Correction and Erasure (Section 12)
You have the right to:
- Correct inaccurate or misleading personal data
- Complete incomplete personal data
- Update your personal data
- Erase personal data that is no longer necessary for the purpose it was collected

### 5.3 Right to Grievance Redressal (Section 13)
You can raise grievances regarding our processing of your data. We will respond within **90 days** as mandated by Rule 14(3).

### 5.4 Right to Nominate (Section 14)
You may nominate any individual who shall exercise your rights in the event of your death or incapacity.

**To exercise any of these rights, please contact:**
- **DPO Email:** {{dpoEmail}}
- **Grievance Portal:** {{grievanceUrl}}

---

## 6. Consent Management (Section 6)

### 6.1 Giving Consent
Consent is obtained at or before the time of data collection through clear affirmative action. Our consent mechanism:
- Is presented in clear, plain language (available in English and scheduled Indian languages)
- Specifies each purpose separately
- Allows granular, per-purpose consent

### 6.2 Withdrawing Consent (Section 6(4))
You can withdraw consent at any time through:
- Our Preference Centre at {{websiteUrl}}/privacy
- Contacting our DPO at {{dpoEmail}}

**Note:** Withdrawal of consent shall not affect the lawfulness of processing based on consent before its withdrawal.

---

## 7. Data Sharing and Third-Party Processors (Section 8(2))

We may share your data with the following categories of processors:

{{thirdPartyProcessors}}

All third-party processors are bound by Data Processing Agreements (DPAs) that include:
- DPDP Act compliance obligations
- Data security requirements
- Breach notification procedures
- Sub-processor restrictions

---

## 8. Cross-Border Data Transfer (Section 16)

We may transfer personal data to the following countries/territories:

{{crossBorderCountries}}

We do **not** transfer personal data to any country or territory restricted by the Central Government under Section 16(1) of the DPDP Act.

---

## 9. Data Retention and Erasure (Section 8(7), Rule 8)

We retain personal data only for as long as necessary for the purpose for which it was collected:

**Default Retention Period:** {{retentionPeriod}}

Upon cessation of purpose or withdrawal of consent:
1. Data is marked for deletion within 48 hours
2. Permanent erasure is completed within 30 days
3. Erasure confirmation is sent to the Data Principal

---

## 10. Data Security (Section 8(5), Rule 6)

We implement reasonable security safeguards including:
- Encryption at rest (AES-256) and in transit (TLS 1.3)
- Role-based access controls with least-privilege principle
- Regular security audits and vulnerability assessments
- Employee security awareness training
- Incident response procedures

---

## 11. Breach Notification (Section 8(6), Rule 7)

In the event of a personal data breach:
1. **CERT-In** will be notified within **6 hours** of detection
2. **Data Protection Board** will be notified within **72 hours**
3. **Affected Data Principals** will be informed as required by the Board

---

## 12. Children's Data (Section 9, Rule 10)

We do not knowingly collect personal data from children (under 18 years) without verifiable parental consent. If we become aware of unauthorized collection of a child's data, we will delete it promptly.

---

## 13. Grievance Redressal

| Channel | Detail |
|---------|--------|
| **DPO** | {{dpoName}} |
| **Email** | {{dpoEmail}} |
| **Phone** | {{dpoPhone}} |
| **Online Portal** | {{grievanceUrl}} |
| **Response Time** | Within 90 days (Rule 14(3)) |

If you are not satisfied with our response, you may approach the **Data Protection Board of India** for adjudication.

---

## 14. Updates to This Notice

We may update this privacy notice from time to time. Material changes will be communicated through:
- Email notification to registered Data Principals
- Prominent notice on our website
- In-app notification

---

*This privacy notice is generated by ComplianceOS in compliance with the Digital Personal Data Protection Act, 2023 and DPDP Rules, 2025.*

© {{companyName}} · All rights reserved`,
};

// ─── RULE 3 PRIVACY NOTICE (HINDI) ─────────────────────────────────────────

const privacyNoticeHI: PolicyTemplateSeed = {
  type: "privacy_notice",
  name: "DPDP नियम 3 — गोपनीयता सूचना (हिंदी)",
  description: "धारा 5 और DPDP अधिनियम 2023 के नियम 3 के अनुपालन में मानक गोपनीयता सूचना।",
  version: "1.0",
  language: "hi",
  ruleRefs: ["Rule 3", "Section 5", "Section 6", "Section 8"],
  industries: ["all"],
  isDefault: false,
  variableSchema: {
    companyName: { type: "string", label: "कंपनी का कानूनी नाम", required: true },
    companyAddress: { type: "string", label: "पंजीकृत कार्यालय पता", required: true },
    dpoName: { type: "string", label: "डेटा सुरक्षा अधिकारी का नाम", required: true },
    dpoEmail: { type: "string", label: "DPO ईमेल पता", required: true },
    effectiveDate: { type: "string", label: "प्रभावी तिथि", required: true },
  },
  templateBody: `# गोपनीयता सूचना

**{{companyName}}** ("हम", "हमारा"), भारत के कानूनों के तहत पंजीकृत, **डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023** और **DPDP नियम, 2025** के अनुपालन में अपने उपयोगकर्ताओं ("डेटा प्रमुख") के व्यक्तिगत डेटा की सुरक्षा के लिए प्रतिबद्ध है।

**प्रभावी तिथि:** {{effectiveDate}}

---

## 1. डेटा न्यासी की जानकारी

| विवरण | जानकारी |
|--------|----------|
| **कानूनी इकाई** | {{companyName}} |
| **पंजीकृत कार्यालय** | {{companyAddress}} |
| **डेटा सुरक्षा अधिकारी** | {{dpoName}} |
| **DPO संपर्क** | {{dpoEmail}} |

---

## 2. डेटा प्रमुख के रूप में आपके अधिकार (धारा 11-14)

DPDP अधिनियम 2023 के तहत, आपके पास निम्नलिखित अधिकार हैं:

- **पहुंच का अधिकार (धारा 11):** आप अपने व्यक्तिगत डेटा का सारांश प्राप्त कर सकते हैं
- **सुधार और मिटाने का अधिकार (धारा 12):** आप गलत डेटा को सही कर सकते हैं या मिटा सकते हैं
- **शिकायत निवारण का अधिकार (धारा 13):** हम 90 दिनों के भीतर जवाब देंगे
- **नामांकन का अधिकार (धारा 14):** आप किसी व्यक्ति को नामांकित कर सकते हैं

---

## 3. सहमति प्रबंधन (धारा 6)

- सहमति देना: डेटा संग्रह के समय या उससे पहले स्पष्ट सहमति ली जाती है
- **सहमति वापस लेना (धारा 6(4)):** आप किसी भी समय अपनी सहमति वापस ले सकते हैं

---

## 4. शिकायत निवारण

| चैनल | विवरण |
|-------|--------|
| **DPO** | {{dpoName}} |
| **ईमेल** | {{dpoEmail}} |
| **प्रतिक्रिया समय** | 90 दिनों के भीतर (नियम 14(3)) |

---

*यह गोपनीयता सूचना ComplianceOS द्वारा DPDP अधिनियम 2023 के अनुपालन में तैयार की गई है।*`,
};

// ─── COOKIE POLICY ──────────────────────────────────────────────────────────

const cookiePolicyEN: PolicyTemplateSeed = {
  type: "cookie_policy",
  name: "DPDP Cookie & Tracking Policy",
  description: "Cookie policy template compliant with Rule 3 and Rule 6. Covers cookie categories, tracking technologies, and user controls.",
  version: "1.0",
  language: "en",
  ruleRefs: ["Rule 3", "Rule 6", "Section 5", "Section 6"],
  industries: ["all"],
  isDefault: true,
  variableSchema: {
    companyName: { type: "string", label: "Company Name", required: true },
    websiteUrl: { type: "string", label: "Website URL", required: true },
    dpoEmail: { type: "string", label: "DPO Email", required: true },
    consentBannerUrl: { type: "string", label: "Consent Banner SDK URL" },
    effectiveDate: { type: "string", label: "Effective Date", required: true },
  },
  templateBody: `# Cookie & Tracking Policy

**{{companyName}}** · Effective: {{effectiveDate}}

This policy explains how we use cookies and similar tracking technologies on **{{websiteUrl}}** in compliance with the **Digital Personal Data Protection Act, 2023**.

---

## 1. What Are Cookies?

Cookies are small text files stored on your device when you visit a website. They help websites function properly and provide information to site owners.

---

## 2. Cookie Categories

We use cookies that fall into the following categories:

### 2.1 Strictly Necessary Cookies
These cookies are essential for the website to function. They enable core features like security, session management, and accessibility. **These cannot be disabled.**

| Cookie | Purpose | Duration |
|--------|---------|----------|
| \`cos_session\` | Session management | Session |
| \`cos_csrf\` | CSRF protection | Session |
| \`cos_consent\` | Consent preferences | 1 year |

### 2.2 Analytics Cookies (Requires Consent)
These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.

| Cookie | Purpose | Duration |
|--------|---------|----------|
| \`_ga\` | Google Analytics visitor tracking | 2 years |
| \`_gid\` | Google Analytics session tracking | 24 hours |

### 2.3 Marketing Cookies (Requires Consent)
These cookies are used to deliver advertisements relevant to you and your interests.

| Cookie | Purpose | Duration |
|--------|---------|----------|
| \`_fbp\` | Facebook Pixel | 3 months |
| \`_gcl_au\` | Google Ads conversion | 3 months |

### 2.4 Personalization Cookies (Requires Consent)
These cookies allow the website to remember choices you make and provide enhanced features.

| Cookie | Purpose | Duration |
|--------|---------|----------|
| \`cos_lang\` | Language preference | 1 year |
| \`cos_theme\` | UI theme preference | 1 year |

---

## 3. Consent Management

### 3.1 Our Consent Banner
When you first visit our website, our DPDP-compliant consent banner will appear, allowing you to:
- **Accept All** cookies
- **Reject All** non-essential cookies
- **Manage** cookie preferences by category

### 3.2 Withdrawal of Consent (Section 6(4))
You can change or withdraw your consent at any time by:
- Clicking the "🛡️ Privacy" button on our website
- Visiting {{websiteUrl}}/privacy
- Contacting {{dpoEmail}}

**Withdrawing consent is as easy as giving it**, in compliance with Section 6(4) of the DPDP Act.

---

## 4. Script Suppression (ComplianceOS Tracker Blocker)

Our ComplianceOS Consent SDK uses a MutationObserver to automatically block tracking scripts from executing until appropriate consent is given. Scripts from the following domains are suppressed when consent is denied:

- Google Analytics / Google Tag Manager
- Facebook/Meta Pixel
- Amplitude
- Mixpanel

---

## 5. Google Consent Mode v2

We implement Google Consent Mode v2 to ensure our advertising and analytics tools respect your consent choices:

| Signal | Default | When Consented |
|--------|---------|----------------|
| \`analytics_storage\` | Denied | Granted |
| \`ad_storage\` | Denied | Granted |
| \`ad_user_data\` | Denied | Granted |
| \`ad_personalization\` | Denied | Granted |

---

## 6. Global Privacy Control (GPC)

We honor the **Global Privacy Control** signal. If your browser sends a GPC signal (\`Sec-GPC: 1\`), we will automatically reject all non-essential cookies.

---

## 7. Contact

For questions about our cookie practices, contact:
- **DPO Email:** {{dpoEmail}}
- **Website:** {{websiteUrl}}/privacy

---

*Generated by ComplianceOS · DPDP Act 2023 Compliant*`,
};

// ─── EXPORT ALL TEMPLATES ───────────────────────────────────────────────────

export const POLICY_TEMPLATES: PolicyTemplateSeed[] = [
  privacyNoticeEN,
  privacyNoticeHI,
  cookiePolicyEN,
];
